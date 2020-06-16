## nodejs aes加密的坑
1. nodejs使用crypto模块中的aes-128-ecb模式 传入的key的位数要是16位的 里面会有位数判断，使用aes-256-ecb key是32位
2. 如果使用createCipher会经过一个md5加密，这个加密是对key加密，会导致加密结果和java那边不一样，应该使用createCipheriv，这个会绕过evp_bytestokey库的md5加密
3. 进入cyptojs文件夹 执行node test.js


参考网址：http://www.liangcuntu.com/aes_for_nodejs_php_java_python
## 其他版本的加密
1. php版本
```php
class Aes
{
    /**
     * AES加密
     * @param string $decrypted_data
     * @param string $secret_key
     * @param string $iv
     * @return string|null
     */
    public static function encrypt($decrypted_data, $secret_key, $iv)
    {
        if (empty($secret_key) || strlen($iv) < 16)
        {
            return null;
        }
        $blocksize      = mcrypt_get_block_size(MCRYPT_RIJNDAEL_128, MCRYPT_MODE_CBC);
        $padded_data    = Aes::pkcs5_pad($decrypted_data, $blocksize);
        $encrypted      = mcrypt_encrypt(MCRYPT_RIJNDAEL_128, $secret_key, $padded_data, MCRYPT_MODE_CBC, $iv);
        $encrypted_data = base64_encode($encrypted);
        return $encrypted_data;
    }
    /**
     * AES解密
     * @param string $encrypted_data
     * @param string $secret_key
     * @param string $iv
     * @return string|null
     */
    public static function decrypt($encrypted_data, $secret_key, $iv)
    {
        if (empty($secret_key) || strlen($iv) < 16)
        {
            return null;
        }
        $encrypted_data = base64_decode($encrypted_data);
        $decrypted      = mcrypt_decrypt(MCRYPT_RIJNDAEL_128, $secret_key, $encrypted_data, MCRYPT_MODE_CBC, $iv);
        $decrypted_data = Aes::pkcs5_unpad($decrypted, "\0");
        return $decrypted_data;
    }
    /**
     * 采用pkcs5pad方式填充数据
     * @param type $text
     * @param type $blocksize
     * @return type
     */
    public static function pkcs5_pad($text, $blocksize)
    {
        $pad = $blocksize - (strlen($text) % $blocksize);
        return $text . str_repeat(chr($pad), $pad);
    }
    /**
     * 删除多余的填充数据
     * @param type $text
     * @return boolean
     */
    public static function pkcs5_unpad($text)
    {
        $pad = ord($text{strlen($text) - 1});
        if ($pad > strlen($text))
        {
            return false;
        }
        if (strspn($text, chr($pad), strlen($text) - $pad) != $pad)
        {
            return false;
        }
        return substr($text, 0, -1 * $pad);
    }
}
```
2. java版本
``` java
import sun.misc.BASE64Decoder;
import sun.misc.BASE64Encoder;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
public class AESPlus {
    /**
     * 加密
     *
     * @param strKey 密匙
     * @param strIn  待加密串
     * @return
     * @throws Exception
     */
    public static String encrypt(String strKey, String strIn) {
        try {
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(strKey.getBytes(), "AES"),
                    new IvParameterSpec(new byte[16])//初始化16空字节
            );
            byte[] encrypted = cipher.doFinal(strIn.getBytes());
            return new BASE64Encoder().encode(encrypted);
        } catch (Exception e) {
            System.out.println(e);
            return "";
        }
    }
    /**
     * 解密
     * @param strKey 密匙
     * @param strIn 待解密密串
     * @return
     */
    public static String decrypt(String strKey, String strIn){
        try
        {
            byte[] encrypted1 = new BASE64Decoder().decodeBuffer(strIn);
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            SecretKeySpec keyspec = new SecretKeySpec(strKey.getBytes(), "AES");
            IvParameterSpec ivspec = new IvParameterSpec(new byte[16]);
            cipher.init(Cipher.DECRYPT_MODE, keyspec, ivspec);
            byte[] original = cipher.doFinal(encrypted1);
            String originalString = new String(original);
            return originalString;
        }
        catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
```
3. python版本
```python

from Crypto.Cipher import AES
import base64
def _pad(s): return s + (AES.block_size - len(s) % AES.block_size) * chr(AES.block_size - len(s) % AES.block_size)
def _cipher():
    key = '7854156156611111'
    iv = '0000000000000000'
    return AES.new(key=key, mode=AES.MODE_CBC, IV=iv)
def encrypt_token(data):
    return _cipher().encrypt(_pad(data))
def decrypt_token(data):
    return _cipher().decrypt(data)
if __name__ == '__main__':
    print('Python encrypt: ' + base64.b64encode(encrypt_token('test')))
    # print('Python decrypt: ' + decrypt_token(base64.b64decode('FSfhJ/gk3iEJOPVLyFVc2Q==')))
```