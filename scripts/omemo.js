class Omemo {
  constructor(storage, connection, deviceNumber) {
    this.connection = connection;
    this.store = new Store(storage, connection, deviceNumber);
    this.devices = {};
  }

  storeOwnDeviceList(deviceList) {
    this.store.setOwnDeviceList(deviceList);
  }

  storeDeviceList(identifier, deviceList) {
    this.store.setDeviceList(identifier, deviceList);
  }

  prepare() {
    if (!this.bootstrap) {
      this.bootstrap = new Bootstrap(this.store, this.connection);
    }

    return this.bootstrap.prepare();
  }

  async encrypt(contact, message, xmlElement) {
    let promises = [];
    let device = this.getDevice(this.connection.username,contact);
    let plaintext = ArrayBufferUtils.encode(message)
    promises.push(device.encrypt(plaintext));

    let keys = await Promise.all(promises);

    keys = keys.filter(key => key !== null);

    if (keys.length === 0) {
      throw 'Could not encrypt data with any Signal session';
    }

    return keys;

  }
  getDevice(name,id) {
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
    let device = this.getDevice(stanza.fromUserName, from);
    try {
      exportedKey = await device.decrypt(encryptedElement.ciphertext.body, encryptedElement.preKey);
    } catch (err) {
      throw 'Error during decryption: ' + err;
    }
    return ArrayBufferUtils.decode(exportedKey);
  }



}

class Stanza {
  static buildEncryptedStanza(message, ownDeviceId) {

    var encryptedElement = {
      header: {
        sid: ownDeviceId,
        keys: [],
        iv: ArrayBufferUtils.toBase64(message.iv)
      },
      payload: ArrayBufferUtils.toBase64(message.payload)
    };

    // let keys = message.keys.map(function (key) {
    //     return {
    //         rid: key.deviceId,
    //         prekey: key.preKey ? true : undefined,
    //         value: btoa(key.ciphertext.body)
    //     };
    // });

    // encryptedElement.header.keys = keys;
    encryptedElement = message[0];
    return encryptedElement;
  }

  static parseEncryptedStanza(encryptedElement) {
    let headerElement = encryptedElement.header;
    let payloadElement = encryptedElement.payload;

    if (headerElement === undefined) {
      return false;
    }

    let sourceDeviceId = headerElement.sid;
    let iv = ArrayBufferUtils.fromBase64(headerElement.iv);
    let payload = ArrayBufferUtils.fromBase64(payloadElement);

    let keys = headerElement.keys.map(function (keyElement) {
      return {
        preKey: keyElement.prekey,
        ciphertext: atob(keyElement.value),
        deviceId: keyElement.rid
      };
    });

    return {
      sourceDeviceId: sourceDeviceId,
      keys: keys,
      iv: iv,
      payload: payload
    };
  }
}