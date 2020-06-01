/*
 * @Author: alisa
 * @Date: 2020-06-01 10:03:04 
 * @Last Modified time: 2020-06-01 10:21:26
 */


var UserConfig = Config;
const NUM_PRE_KEYS = 2; // preKey的数量
const NS_BASE = 'eu.siacs.conversations.axolotl';
const NS_DEVICELIST = NS_BASE + '.devicelist';
const NS_BUNDLES = NS_BASE + '.bundles:';
const AES_KEY_LENGTH = 128;
const AES_TAG_LENGTH = 128;
const AES_EXTRACTABLE = true;

localStorage.clear();

var libsignal = (window).nodesignal;

var KeyHelper = libsignal.keyhelper;
var SignalProtocolAddress = libsignal.ProtocolAddress;
var SessionBuilder = libsignal.SessionBuilder;
var SessionCipher = libsignal.SessionCipher;

class Bootstrap {
  constructor(store) {
    this.store = store;
  }

  async prepare() {
    //if (!this.store.isReady()) {
      await this.setup();
    //}
    var bundle = await this.generateBundle();

    console.debug('bundle prepared');
    return bundle.toObject();
  }

  setup() {
    return Promise.all([
      this.generateDeviceId(),
      this.generateIdentityKeyPair(),
      this.generateRegistrationId(),
    ]).then(([deviceId, identityKey, registrationId]) => {
      this.store.put('deviceId', deviceId);
      this.store.put('identityKey', identityKey);
      this.store.put('registrationId', registrationId);
    });
  }

  generateIdentityKeyPair() {
    // return Promise.resolve(KeyHelper.generateIdentityKeyPair());
    var identityKey;
    var {
      identifyKeyPair
    } = this.store.getIdentityKeyPair();
    if (identifyKeyPair && identifyKeyPair.pubKey && identifyKeyPair.privKey) {
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
    var registrationId = await this.store.getLocalRegistrationId();
    if (registrationId == undefined) {
      registrationId = KeyHelper.generateRegistrationId();
    }
    return Promise.resolve(registrationId);
  }

  generateDeviceId() {
    var deviceId = this.store.getDeviceId();
    if (deviceId == undefined || isNaN(deviceId)) {
      deviceId = Random.number(Math.pow(2, 31) - 1, 1);
    }
    deviceId = UserConfig.deviceId;
    return Promise.resolve(deviceId);
  }

  async generateBundle() {
    console.debug('Generate EncryptUtil bundle');

    var preKeyPromises = [];

    for (var i = 0; i < NUM_PRE_KEYS; i++) {
      preKeyPromises.push(this.generatePreKey(i));
    }

    preKeyPromises.push(this.generateSignedPreKey(1));

    var preKeys = await Promise.all(preKeyPromises);
    var identityKey = await this.store.getIdentityKeyPair();

    return new Bundle({
      identityKey: identityKey,
      signedPreKey: preKeys.pop(),
      preKeys: preKeys
    });
  }

  async generatePreKey(id) {
    var preKey = await KeyHelper.generatePreKey(id);

    this.store.storePreKey(id, preKey.keyPair);

    return preKey;
  }

  async generateSignedPreKey(id) {
    var identity = await this.store.getIdentityKeyPair();
    var signedPreKey = await KeyHelper.generateSignedPreKey(identity, id);

    this.store.storeSignedPreKey(id, signedPreKey.keyPair);

    return signedPreKey;
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
    var numberOfPreKeys = this.bundle.preKeys.length;
    var candidateNumber = Random.number(numberOfPreKeys - 1);
    candidateNumber = 0;
    return this.bundle.preKeys[candidateNumber];
  }

  toSignalBundle(registrationId) {
    var preKey = this.getRandomPreKey();
    var signedPreKey = this.getSignedPreKey();
    var base64Data = {
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
    var otherBundle = {
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
    var xmlBundle = {
      signedPreKeyPublic: {
        signedPreKeyId: this.bundle.signedPreKey.keyId,
        value: ArrayBufferUtils.toBase64(this.bundle.signedPreKey.keyPair.pubKey)
      },
      identityKey: ArrayBufferUtils.toBase64(this.bundle.identityKey.pubKey),
      preKeyPublic: this.bundle.preKeys.map(function (preKey) {
        return {
          preKeyId: preKey.keyId,
          value: ArrayBufferUtils.toBase64(preKey.keyPair.pubKey)
        }
      })
    }
    console.log('identityKeyPubkey', ArrayBufferUtils.toBase64(this.bundle.identityKey.pubKey));
    console.log('identityKeyPrivkey', ArrayBufferUtils.toBase64(this.bundle.identityKey.privKey));
    console.log('preKeyPubkey', ArrayBufferUtils.toBase64(this.bundle.preKeys[0].keyPair.pubKey));
    console.log('preKeyPrivkey', ArrayBufferUtils.toBase64(this.bundle.preKeys[0].keyPair.privKey));
    console.log('signedPreKey.keyId', this.bundle.signedPreKey.keyId);
    console.log('signedPubKey', ArrayBufferUtils.toBase64(this.bundle.signedPreKey.keyPair.pubKey));
    console.log('signedPrivKey', ArrayBufferUtils.toBase64(this.bundle.signedPreKey.keyPair.privKey));
    console.log('signature', ArrayBufferUtils.toBase64(this.bundle.signedPreKey.signature));
    return xmlBundle;
  }

  static fromJSON(json) {
    var xmlIdentityKey = json['identityKey'];
    var xmlSignedPreKeyPublic = json['signedPreKeyPublic'];
    var xmlSignedPreKeySignature = json['signedPreKeySignature'];
    var xmlPreKeys = json['preKeyPublic'];

    var b = new Bundle({
      identityKey: {
        pubKey: ArrayBufferUtils.fromBase64(xmlIdentityKey)
      },
      signedPreKey: {
        keyPair: {
          pubKey: ArrayBufferUtils.fromBase64(xmlSignedPreKeyPublic.value)
        },
        keyId: xmlSignedPreKeyPublic.signedPreKeyId
      },
      preKeys: xmlPreKeys.map(function (element) {
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

class Device {
  constructor(jid, id, store) {
    this.address = new SignalProtocolAddress(jid, id);
    this.store = store;
  }

  async decrypt(ciphertext, preKey = false) {
    var sessionCipher = new SessionCipher(this.store, this.address);
    var plaintextBuffer;
    //ciphertext = atob(ciphertext);
    if (preKey)
      plaintextBuffer = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext, 'base64');
    else
      plaintextBuffer = await sessionCipher.decryptWhisperMessage(ciphertext, 'base64');

    return plaintextBuffer;
  }


  async encrypt(plaintext) {
    try {
      if (!this.store.hasSession(this.address.toString())) {
        await this.establishSession();
      }

      var session = await this.getSession();
      var ciphertext = await session.encrypt(plaintext);
      return {
        preKey: ciphertext.type === 3,
        ciphertext: ciphertext,
        deviceId: this.address.getDeviceId()
      }
    } catch (err) {
      console.log('Error:', err)
      console.warn('Could not encrypt data for device with id ' + this.address.getDeviceId());

      return null;
    }
  }

  async processPreKeyMessage(preKeyBundle, identifyKeyPair) {

    var builder = new SessionBuilder(this.store, this.address);

    var buildSession = await builder.initOutgoing(preKeyBundle);
    return buildSession;
  }

  async establishSession() {
    var signalBundle = await this.store.getPreKeyBundle(this.address);
    var identifyKeyPair = await this.store.getIdentityKeyPair();
    await this.processPreKeyMessage(signalBundle, identifyKeyPair);
  }

  async getSession() {
    if (!this.session) {
      this.session = new SessionCipher(this.store, this.address);
    }

    return this.session;
  }
}
class EncryptUtil {
  constructor(storage, connection) {
    this.connection = connection;
    this.store = new Store(storage, connection);
    this.devices = {};
  }

  storeOwnDeviceList(deviceList) {
    this.store.setOwnDeviceList(deviceList);
  }

  storeDeviceList(identifier, deviceList) {
    this.store.setDeviceList(identifier, deviceList);
  }

  async prepare() {
    if (!this.bootstrap) {
      this.bootstrap = new Bootstrap(this.store);
    }
    var bundle = await this.bootstrap.prepare();
    await this.addDeviceIdToDeviceList();
    this.store.put('published', true);
    console.log("bundle ok");
    return {
      type: 'bundle',
      deviceId: UserConfig.deviceId,
      username: this.username,
      bundle: bundle
  }
  }

  /**
   * 建立链接
   * @param {*} name  username
   * @param {*} id userId
   * @memberof EncryptUtil
   */
  async initSession(name, id) {
    try {

      var sessionDevice = this.getDevice(name, id);
      if (!this.store.hasSession(sessionDevice.toString())) {
        await sessionDevice.establishSession();
      }
    } catch (err) {
      console.log("establish error" + err)
    }
  }


  /**
   * 加密
   *
   * @param {*} contact 联系人
   * @param {*} message
   * @returns
   * @memberof EncryptUtil
   */
  async encrypt(contact, message) {
    var promises = [];
    var deviceEncrypt = this.getDevice(this.connection.username, contact);
    var plaintext = ArrayBufferUtils.encode(message)
    promises.push(deviceEncrypt.encrypt(plaintext));

    var keys = await Promise.all(promises);

    keys = keys.filter(key => key !== null);

    if (keys.length === 0) {
      throw 'Could not encrypt data with any Signal session';
    }

    return keys;

  }
  getDevice(name, id) {
    if (!this.devices[id]) {
      this.devices[id] = new Device(name, Number(id), this.store);
    }

    return this.devices[id];
  }

  async decrypt(stanza) {
    if (stanza.type !== 'message') {
      throw 'Root element is no message element';
    }

    const encryptedElement = stanza.encrypted[0];

    if (encryptedElement === undefined) {
      throw 'No encrypted stanza found';
    }

    const from = stanza.from;

    var exportedKey;
    var deviceDecrypt = this.getDevice(stanza.fromUserName, from);
    try {
      exportedKey = await deviceDecrypt.decrypt(encryptedElement.ciphertext.body, encryptedElement.preKey);
    } catch (err) {
      throw 'Error during decryption: ' + err;
    }
    return ArrayBufferUtils.decode(exportedKey);
  }
  // 上传到服务器
  addDeviceIdToDeviceList() {
    var deviceIds = this.store.getOwnDeviceList();

    return this.connection.publishDevices(deviceIds);
  }
}