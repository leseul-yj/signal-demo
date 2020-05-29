axios.defaults.baseURL = 'http://192.168.3.25:8092';
var queryAddress = '?secret=14c2a7efcdfb8acf94e80896c9e288f3&time=1589768709&access_token=f9fa893ddd7b48b8b39cd7859f5c974a';

var ApiRequest = {};
/*
    设置注册Id 和 身份Id公钥
    {
        "userId":10000008,
        "register": 100000,
        "identityKey": "xxxxx"
    }
 */
ApiRequest.setRegIdAndIdPub = function (data) {
    var apiUrl = "/authkeys/getRegIdAndIdPub" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    获取注册Id
    {"userId":10000,}
 */
ApiRequest.getRegIdAndIdPub = function (data) {
    var apiUrl = "/authkeys/getRegIdAndIdPub" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    设置共享密钥公钥
    {
        "userId":10000,
        "publicKeyId":"共享公钥ID",
        "publicKey":"共享公钥",
        "createTime": "创建时间"
    }
 */
ApiRequest.setPublicKey = function (data) {
    var apiUrl = "/authkeys/setPublicKey" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    获取共享密钥公钥
    {"userId":10000}
 */
ApiRequest.getUserPublicKey = function (data) {
    var apiUrl = "/authkeys/getUserPublicKey" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    设置一次性共享密钥公钥
    {"oneTimePreKey":"一次性公钥"}
 */
ApiRequest.setOneTimePreKeyList = function (data) {
    var apiUrl = "/authkeys/setOneTimePreKeyList" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    获取一次性密钥公钥数量
    {"userId":"100000"}
 */
ApiRequest.getOneTimePreKeyCount = function (data) {
    var apiUrl = "/authkeys/getOneTimePreKeyCount" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    获取身份Id公钥 和 一个一次性共享密钥公钥
    {"userId":"10000"}
 */
ApiRequest.getPublicKeyAndOneTimePreKey = function (data) {
    var apiUrl = "/authkeys/getPublicKeyAndOneTimePreKey" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    发送消息
  {  
    "toUserId":"接收用户id"
    "fromUserId":"发送用户id"
    "message":"消息"
    "content":"消息体"
    "publicKeyId":"公钥id"
    "publicKey":"公钥id"
}

 */
ApiRequest.sendMessage = function (data) {
    var apiUrl = "/authkeys/sendMessage" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    接收消息
    {"touserId":"10000"}
 */
ApiRequest.receiveMsg = function (data) {
    var apiUrl = "/authkeys/receiveMsg" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}

/*
    接收消息
    {
        "touserId":"10000",
        "fromUserId":"发送用户id"
    }
 */
ApiRequest.receiveMsg = function (data) {
    var apiUrl = "/authkeys/receiveMsg" + queryAddress;
    return axios.post(apiUrl, JSON.stringify(data))
}