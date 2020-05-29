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
         identityKey: ArrayBufferUtils.fromBase64(this.getIdentityKey().pubKey),
         registrationId: registrationId,
         preKey: {
            keyId: preKey.keyId,
            publicKey: ArrayBufferUtils.fromBase64(preKey.keyPair.pubKey)
         },
         signedPreKey: {
            keyId: signedPreKey.keyId,
            publicKey: ArrayBufferUtils.fromBase64(signedPreKey.keyPair.pubKey),
            signature: ArrayBufferUtils.fromBase64(signedPreKey.signature)
         }
      }
      // return otherBundle;
      return {
         identityKey: ArrayBufferUtils.fromBase64("BbgP+qzH44PwTJWZKPSqHvleKt/FtUxZXOwAZP7rCoA5"),
         registrationId: registrationId,
         preKey: {
            keyId: preKey.keyId,
            publicKey: ArrayBufferUtils.fromBase64("BeT+YWX8KiW0+PFxf/G+nUJuxMEWIlLPZ89sei7gvnpZ")
         },
         signedPreKey: {
            keyId: signedPreKey.keyId,
            publicKey: ArrayBufferUtils.fromBase64("BYnp+em8oJZepOBFN6K2NmVg3/JUZwBLhXPUAUNR4bp5"),
            signature: ArrayBufferUtils.fromBase64("SCyn+OZDfhAepEYcezX4bBj/tCperWH7HAAnXDPJ74ica83rqFRRqWCZ6uh6oDy/6XD06LzyL3K8EIpjcOXmhQ==")
         }
      }
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