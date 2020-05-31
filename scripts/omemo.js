var UserConfig = {};
class Omemo {
  constructor(storage,connection,deviceNumber) {
    this.connection = connection;
    this.store = new Store(storage,connection,deviceNumber);
    this.devices = {};
  }

  storeOwnDeviceList(deviceList) {
    this.store.setOwnDeviceList(deviceList);
  }

  storeDeviceList(identifier,deviceList) {
    this.store.setDeviceList(identifier,deviceList);
  }

  prepare() {
    if(!this.bootstrap) {
      this.bootstrap = new Bootstrap(this.store,this.connection);
    }

    return this.bootstrap.prepare();
  }

  async encrypt(contact,message,xmlElement) {
    let promises = [];
    let device = this.getDevice(this.connection.username,contact);
    let plaintext = ArrayBufferUtils.encode(message)
    promises.push(device.encrypt(plaintext));

    let keys = await Promise.all(promises);

    keys = keys.filter(key => key !== null);

    if(keys.length === 0) {
      throw 'Could not encrypt data with any Signal session';
    }

    return keys;

  }
  getDevice(name,id) {
    if(!this.devices[id]) {
      this.devices[id] = new Device(name,Number(id),this.store);
    }

    return this.devices[id];
  }
  async decrypt(stanza) {
    if(stanza.type !== 'message') {
      throw 'Root element is no message element';
    }

    const encryptedElement = stanza.encrypted[0];

    if(encryptedElement === undefined) {
      throw 'No encrypted stanza found';
    }

    const from = stanza.from;

    var exportedKey;
    let device = this.getDevice(stanza.fromUserName,from);
    try {
      exportedKey = await device.decrypt(encryptedElement.ciphertext.body,encryptedElement.preKey);
    } catch(err) {
      throw 'Error during decryption: ' + err;
    }
    return ArrayBufferUtils.decode(exportedKey);
  }

}
class Bootstrap {
  constructor(store,connection) {
    this.store = store;
    this.connection = connection;
  }

  async prepare() {
    if(!this.store.isReady()) {
      await this.setup();
    }

    let bundle = await this.generateBundle();

    await this.connection.publishBundle(UserConfig.deviceId,bundle.toObject());
    this.store.put('published',true);

    await this.addDeviceIdToDeviceList();


    console.debug('OMEMO prepared');
  }

  setup() {
    return Promise.all([
      this.generateDeviceId(),
      this.generateIdentityKeyPair(),
      this.generateRegistrationId(),
    ]).then(([deviceId,identityKey,registrationId]) => {
      this.store.put('deviceId',deviceId);
      this.store.put('identityKey',identityKey);
      this.store.put('registrationId',registrationId);
    });
  }

  generateIdentityKeyPair() {
    // return Promise.resolve(KeyHelper.generateIdentityKeyPair());
    let identityKey;
    let {
      identifyKeyPair
    } = this.store.getIdentityKeyPair();
    if(identifyKeyPair && identifyKeyPair.pubKey && identifyKeyPair.privKey) {
      identityKey = {
        "pubKey": ArrayBufferUtils.fromBase64(identifyKeyPair.pubKey),
        "privKey": ArrayBufferUtils.fromBase64(identifyKeyPair.privKey)
      };
    } else {
      identityKey = KeyHelper.generateIdentityKeyPair();
    }
    return Promise.resolve(identityKey);
  }

  async generateRegistrationId() {
    let registrationId = await this.store.getLocalRegistrationId();
    if(registrationId == undefined) {
      registrationId = KeyHelper.generateRegistrationId();
    }
    return Promise.resolve(registrationId);
  }

  generateDeviceId() {
    let deviceId = this.store.getDeviceId();
    if(deviceId == undefined || isNaN(deviceId)) {
      deviceId = Random.number(Math.pow(2,31) - 1,1);
    }
    UserConfig.deviceId = Config.deviceId;
    return Promise.resolve(deviceId);
    // return Promise.resolve(Random.number(Math.pow(2, 31) - 1, 1));
  }

  async generateBundle() {
    console.debug('Generate OMEMO bundle');

    let preKeyPromises = [];

    for(let i = 0; i < NUM_PRE_KEYS; i++) {
      preKeyPromises.push(this.generatePreKey(i));
    }

    preKeyPromises.push(this.generateSignedPreKey(1));

    let preKeys = await Promise.all(preKeyPromises);
    let identityKey = await this.store.getIdentityKeyPair();

    return new Bundle({
      identityKey: identityKey,
      signedPreKey: preKeys.pop(),
      preKeys: preKeys
    });
  }

  async generatePreKey(id) {
    let preKey = await KeyHelper.generatePreKey(id);

    this.store.storePreKey(id,preKey.keyPair);

    return preKey;
  }

  async generateSignedPreKey(id) {
    let identity = await this.store.getIdentityKeyPair();
    let signedPreKey = await KeyHelper.generateSignedPreKey(identity,id);

    this.store.storeSignedPreKey(id,signedPreKey.keyPair);

    return signedPreKey;
  }

  addDeviceIdToDeviceList() {
    let jid = this.connection.username;
    let deviceIds = this.store.getOwnDeviceList();

    return this.connection.publishDevices(deviceIds);
  }
}

class Bundle {
  constructor(bundle) {
    this.bundle = bundle;
  }

  getIdentityKey() {
    return this.bundle.identityKey;
  }

  getSignedPreKey() {
    return this.bundle.signedPreKey;
  }

  getRandomPreKey() {
    let numberOfPreKeys = this.bundle.preKeys.length;
    let candidateNumber = Random.number(numberOfPreKeys - 1);
    candidateNumber = 0;
    return this.bundle.preKeys[candidateNumber];
  }

  toSignalBundle(registrationId) {
    let preKey = this.getRandomPreKey();
    let signedPreKey = this.getSignedPreKey();
    let base64Data = {
      identityKey: ArrayBufferUtils.toBase64(this.getIdentityKey().pubKey),
      registrationId: registrationId,
      preKey: {
        keyId: preKey.keyId,
        publicKey: ArrayBufferUtils.toBase64(preKey.keyPair.pubKey)
      },
      signedPreKey: {
        keyId: signedPreKey.keyId,
        publicKey: ArrayBufferUtils.toBase64(signedPreKey.keyPair.pubKey),
        signature: ArrayBufferUtils.toBase64(signedPreKey.signature)
      }
    }


    //一次性公钥
    // recordsUserPublicKey = "BeT+YWX8KiW0+PFxf/G+nUJuxMEWIlLPZ89sei7gvnpZ";

    //初始化公钥
    // identityKeyPairUserPublicKey = "BbgP+qzH44PwTJWZKPSqHvleKt/FtUxZXOwAZP7rCoA5";

    //共享公钥
    // signedPreKeyUserPublicKey = "BYnp+em8oJZepOBFN6K2NmVg3/JUZwBLhXPUAUNR4bp5";

    /// MwohBR6waCiw9uqQxt79CbrvIbBiYHJSJENSkM5ImV79SD5vEAAYACIgc3rv6Bt0XP6j8NruFE+tMXJwe3NoAseC64nSOfB/s6WLoA3LXZSZdg==
    let otherBundle = {
      identityKey: this.getIdentityKey().pubKey,
      registrationId: registrationId,
      preKey: {
        keyId: preKey.keyId,
        publicKey: preKey.keyPair.pubKey
      },
      signedPreKey: {
        keyId: signedPreKey.keyId,
        publicKey: signedPreKey.keyPair.pubKey,
        signature: signedPreKey.signature
      }
    }
    return otherBundle;
    // return {
    //    identityKey: ArrayBufferUtils.fromBase64("BbgP+qzH44PwTJWZKPSqHvleKt/FtUxZXOwAZP7rCoA5"),
    //    registrationId: registrationId,
    //    preKey: {
    //       keyId: preKey.keyId,
    //       publicKey: ArrayBufferUtils.fromBase64("BeT+YWX8KiW0+PFxf/G+nUJuxMEWIlLPZ89sei7gvnpZ")
    //    },
    //    signedPreKey: {
    //       keyId: signedPreKey.keyId,
    //       publicKey: ArrayBufferUtils.fromBase64("BYnp+em8oJZepOBFN6K2NmVg3/JUZwBLhXPUAUNR4bp5"),
    //       signature: ArrayBufferUtils.fromBase64("SCyn+OZDfhAepEYcezX4bBj/tCperWH7HAAnXDPJ74ica83rqFRRqWCZ6uh6oDy/6XD06LzyL3K8EIpjcOXmhQ==")
    //    }
    // }
  }

  toObject() {
    // 发送自己的公钥给服务器
    let xmlBundle = {
      signedPreKeyPublic: {
        signedPreKeyId: this.bundle.signedPreKey.keyId,
        value: ArrayBufferUtils.toBase64(this.bundle.signedPreKey.keyPair.pubKey)
      },
      signedPreKeySignature: ArrayBufferUtils.toBase64(this.bundle.signedPreKey.signature),
      identityKey: ArrayBufferUtils.toBase64(this.bundle.identityKey.pubKey),
      preKeyPublic: this.bundle.preKeys.map(function(preKey) {
        return {
          preKeyId: preKey.keyId,
          value: ArrayBufferUtils.toBase64(preKey.keyPair.pubKey)
        }
      })
    }
    console.log('identityKeyPubkey',ArrayBufferUtils.toBase64(this.bundle.identityKey.pubKey));
    console.log('identityKeyPrivkey',ArrayBufferUtils.toBase64(this.bundle.identityKey.privKey));
    console.log('preKeyPubkey',ArrayBufferUtils.toBase64(this.bundle.preKeys[0].keyPair.pubKey));
    console.log('preKeyPrivkey',ArrayBufferUtils.toBase64(this.bundle.preKeys[0].keyPair.privKey));
    console.log('signedPreKey.keyId',this.bundle.signedPreKey.keyId);
    console.log('signedPubKey',ArrayBufferUtils.toBase64(this.bundle.signedPreKey.keyPair.pubKey));
    console.log('signedPrivKey',ArrayBufferUtils.toBase64(this.bundle.signedPreKey.keyPair.privKey));
    console.log('signature',ArrayBufferUtils.toBase64(this.bundle.signedPreKey.signature));
    return xmlBundle;
  }

  static fromJSON(json) {
    let xmlIdentityKey = json['identityKey'];
    let xmlSignedPreKeyPublic = json['signedPreKeyPublic'];
    let xmlSignedPreKeySignature = json['signedPreKeySignature'];
    let xmlPreKeys = json['preKeyPublic'];

    let b = new Bundle({
      identityKey: {
        pubKey: ArrayBufferUtils.fromBase64(xmlIdentityKey)
      },
      signedPreKey: {
        keyPair: {
          pubKey: ArrayBufferUtils.fromBase64(xmlSignedPreKeyPublic.value)
        },
        signature: ArrayBufferUtils.fromBase64(xmlSignedPreKeySignature),
        keyId: xmlSignedPreKeyPublic.signedPreKeyId
      },
      preKeys: xmlPreKeys.map(function(element) {
        return {
          keyPair: {
            pubKey: ArrayBufferUtils.fromBase64(element.value)
          },
          keyId: element.preKeyId
        }
      }),
    });

    return b;
  }
}