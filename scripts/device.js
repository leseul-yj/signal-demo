class Device {
   constructor(jid, id, store) {
      this.address = new SignalProtocolAddress(jid, id);
      this.store = store;
   }

   async decrypt(ciphertext, preKey = false) {
      let sessionCipher = new SessionCipher(this.store, this.address);
      let plaintextBuffer;
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

         let session = await this.getSession();
         let ciphertext = await session.encrypt(toBuffer(plaintext));
         //ciphertext.body = btoa(ciphertext.body)
         return {
            preKey: ciphertext.type === 3,
            ciphertext: ciphertext,
            deviceId: this.address.getDeviceId()
         }
      } catch (err) {
         console.log('Error:', err)
         console.warn('Could not encrypt data for device with id ' + this.address.getDeviceId());

         return null; // Otherwise Promise.all throws an error
      }
   }

   async processPreKeyMessage(preKeyBundle,identifyKeyPair) {

      let builder = new SessionBuilder(this.store, this.address);

      //return builder.processPreKey(preKeyBundle);
      const {identityKey,registrationId,preKey,signedPreKey}= preKeyBundle;
      let buildSession = await builder.initOutgoing(preKeyBundle);
      return buildSession;
   }

   async establishSession() {
      let signalBundle = await this.store.getPreKeyBundle(this.address);
      let identifyKeyPair = await this.store.getIdentityKeyPair();
      await this.processPreKeyMessage(signalBundle,identifyKeyPair);
   }

   async getSession() {
      if (!this.session) {
         this.session = new SessionCipher(this.store, this.address);
      }

      return this.session;
   }
}
