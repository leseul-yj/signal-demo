var crypto = require('crypto');
// data是加密后的chainkey
var data = "+X2+FHfRnRhxiwJu/ObdvRz6s7y1oPzBQTYqUXEolOT7j5bx5LyPWARSxKDThBXr";
var key = "B9wAcsdCJioaUvIXJPgIQqctOtqhmRBGf/HlDZzzLH0=";
//data 是准备加密的字符串,key是你的密钥
function encryption(data, key) {
    var iv = Buffer.alloc(0);
    var clearEncoding = 'base64';
    var cipherEncoding = 'base64';
    var cipherChunks = [];
    var cipher = crypto.createCipheriv('aes-256-ecb', key, iv);
    cipher.setAutoPadding(true);
    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    return cipherChunks.join('');
}
//data 是你的准备解密的字符串,key是你的密钥
function decryption(data, key) {
    var iv = Buffer.alloc(0);
    var clearEncoding = 'base64';
    var cipherEncoding = 'base64';
    var cipherChunks = [];
    key = Buffer.from(key,"base64");
    var decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
    decipher.setAutoPadding(true);
    cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
    cipherChunks.push(decipher.final(clearEncoding));
    return cipherChunks.join('');
}
console.log(decryption(data, key)) ;