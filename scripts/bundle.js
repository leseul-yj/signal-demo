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
      console.log("SignalBundle", JSON.stringify(base64Data));
      //一次性公钥
      // recordsUserPublicKey = "BeT+YWX8KiW0+PFxf/G+nUJuxMEWIlLPZ89sei7gvnpZ";

      //初始化公钥
      // identityKeyPairUserPublicKey = "BbgP+qzH44PwTJWZKPSqHvleKt/FtUxZXOwAZP7rCoA5";

      //共享公钥
      // signedPreKeyUserPublicKey = "BYnp+em8oJZepOBFN6K2NmVg3/JUZwBLhXPUAUNR4bp5";

      /// MwohBR6waCiw9uqQxt79CbrvIbBiYHJSJENSkM5ImV79SD5vEAAYACIgc3rv6Bt0XP6j8NruFE+tMXJwe3NoAseC64nSOfB/s6WLoA3LXZSZdg==
      let fakeBundle =  {
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
      return fakeBundle;
      return {
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
      };
   }

   //    toXML() {
   //       let xmlBundle = $build('bundle', {
   //          xmlns: 'eu.siacs.conversations.axolotl'
   //       });

   //       xmlBundle
   //          .c('signedPreKeyPublic', {
   //             signedPreKeyId: this.bundle.signedPreKey.keyId
   //          })
   //          .t(ArrayBufferUtils.toBase64(this.bundle.signedPreKey.keyPair.pubKey))
   //          .up();

   //       xmlBundle
   //          .c('signedPreKeySignature')
   //          .t(ArrayBufferUtils.toBase64(this.bundle.signedPreKey.signature)) //@REVIEW
   //          .up();

   //       xmlBundle
   //          .c('identityKey')
   //          .t(ArrayBufferUtils.toBase64(this.bundle.identityKey.pubKey))
   //          .up();

   //       for (let preKey of this.bundle.preKeys) {
   //          xmlBundle
   //             .c('preKeyPublic', {
   //                preKeyId: preKey.keyId
   //             })
   //             .t(ArrayBufferUtils.toBase64(preKey.keyPair.pubKey))
   //             .up();
   //       }

   //       return xmlBundle;
   //    }

   toObject() {
      // 发送自己的公钥给服务器
      let xmlBundle = {
         signedPreKeyPublic: {
            signedPreKeyId: this.bundle.signedPreKey.keyId,
            value: ArrayBufferUtils.toBase64(this.bundle.signedPreKey.keyPair.pubKey)
         },
         signedPreKeySignature: ArrayBufferUtils.toBase64(this.bundle.signedPreKey.signature),
         identityKey: ArrayBufferUtils.toBase64(this.bundle.identityKey.pubKey),
         preKeyPublic: this.bundle.preKeys.map(function (preKey) {
            return {
               preKeyId: preKey.keyId,
               value: ArrayBufferUtils.toBase64(preKey.keyPair.pubKey)
            }
         })
      }

      return xmlBundle;
   }

   //  <xs:element name="bundle">
   //     <xs:complexType>
   //       <xs:sequence>
   //         <xs:element name="signedPreKeyPublic" type="base64Binary">
   //           <xs:attribute name="signedPreKeyId" type="integer"/>
   //         </xs:element>
   //         <xs:element name="signedPreKeySignature" type="base64Binary"/>
   //         <xs:element name="identityKey" type="base64Binary"/>
   //         <xs:element name="prekeys">
   //           <xs:complexType>
   //             <xs:sequence>
   //               <xs:element name="preKeyPublic" type="base64Binary" maxOccurs="unbounded">
   //                 <xs:attribute name="preKeyId" type="integer" use="required"/>
   //               </xs:element>
   //             </xs:sequence>
   //           </xs:complexType>
   //         </xs:element>
   //       </xs:sequence>
   //     </xs:complexType>
   //   </xs:element>


   //    static fromXML(xmlElement) {
   //       let targetSelector = 'bundle[xmlns="eu.siacs.conversations.axolotl"]';
   //       let xmlBundle = $(xmlElement).is(targetSelector) ? $(xmlElement) : $(xmlElement).find(targetSelector);

   //       if (xmlBundle.length !== 1) {
   //          throw new Error('Could not find bundle element');
   //       }

   //       let xmlIdentityKey = xmlBundle.find('identityKey');
   //       let xmlSignedPreKeyPublic = xmlBundle.find('signedPreKeyPublic');
   //       let xmlSignedPreKeySignature = xmlBundle.find('signedPreKeySignature');
   //       let xmlPreKeys = xmlBundle.find('preKeyPublic');

   //       return new Bundle({
   //          identityKey: {
   //             pubKey: ArrayBufferUtils.fromBase64(xmlIdentityKey.text())
   //          },
   //          signedPreKey: {
   //             keyPair: {
   //                pubKey: ArrayBufferUtils.fromBase64(xmlSignedPreKeyPublic.text())
   //             },
   //             signature: ArrayBufferUtils.fromBase64(xmlSignedPreKeySignature.text()),
   //             keyId: parseInt(xmlSignedPreKeyPublic.attr('signedPreKeyId'))
   //          },
   //          preKeys: xmlPreKeys.get().map(function(element) {
   //             return {
   //                keyPair: {
   //                   pubKey: ArrayBufferUtils.fromBase64($(element).text())
   //                },
   //                keyId: parseInt($(element).attr('preKeyId'))
   //             }
   //          }),
   //       });
   //    }

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