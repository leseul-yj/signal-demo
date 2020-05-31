class Bootstrap {
   constructor(store,connection) {
      this.store = store;
      this.connection = connection;
   }

   async prepare() {
      if(!this.store.isReady()) {
         await this.setup();
      }

      if(!this.store.isPublished()) {
         let bundle = await this.generateBundle();

         await this.connection.publishBundle(this.store.getDeviceId(),bundle.toObject());
         this.store.put('published',true);

         await this.addDeviceIdToDeviceList();
      }

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
      if(deviceId == undefined) {
         deviceId = Random.number(Math.pow(2,31) - 1,1);
      }
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
      let ownDeviceId = this.store.getDeviceId();

      return this.connection.publishDevices(deviceIds);
   }
}