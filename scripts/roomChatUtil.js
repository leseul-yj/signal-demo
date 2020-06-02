/* 
 * @Author: alisa  
 * @Date: 2020-06-02 14:54:39  
 * @Last Modified by: alisa
 * @Last Modified time: 2020-06-02 19:07:07
 */

class RoomChatUtil {
    constructor() {
        this.roomIdStorage = undefined;
        this.roomIdTable = {};
        this.roomId = 1000;
        this.init();
    }
    init() {
        this.roomIdStorage = new IndexedDBStorage("RoomChat");
        //this.initChainKeyTable();
        this.initRoomIdTable(this.roomId);
        this.generateRoomIdChainKey();
    }

    // 判断chainKey表是否存在 没有就生成
    initChainKeyTable() {
        let table = this.roomIdStorage.getTable("ChainKey");
        if (!(table && table.length > 0)) {
            this.roomIdStorage.addTables("ChainKey", {
                "ChainKey": "++userId,keyPair"
            });
        }
    }

    // 判断roomId表是否存在 没有就生成
    initRoomIdTable(roomId) {
        let roomName = "roomId_" + roomId;
        let table = this.roomIdStorage.getTable(roomName);
        if (!(table && table.length > 0)) {
            let tableHeader = {};
            tableHeader[roomName] = "++userId,pubKey,chainKey";
            this.roomIdStorage.addTables(roomName, tableHeader);
        }
    }

    //  创建群生成chainKey
    generateRoomIdChainKey(roomId) {
        //let identifyKey = KeyHelper.generateIdentityKeyPair();
        let identifyKey = {
            "pubKey": "Be3PSWNUU30+QAITyzgW+JMvMSpNp/bkgl760TTQ/40S",
            "priv": "MPwS7ZFmhp1lnO096vMTiWMIE/TraFvfLC+RGUOUN2U="
        };
        let userInfo = [...this.getRoomUserPubKey()];
        let chainKeyData = userInfo.map(item => {
            let pubKey = ArrayBufferUtils.fromBase64(item.pubKey);
            return {
                ...item,
                "chainKey": libsignal.curve.generateRoomChainKey(pubKey, identifyKey.privKey)
            };
        });
        let roomName = "roomId_" + this.roomId;
        this.storeRoomIdChainKey(roomName, chainKeyData).then(() => {
            console.log("添加成功！！！");
        })
    }

    getRoomUserPubKey() {
        const userInfo = [{
            "userId": 1,
            "pubKey": "BWDzLeNG9KmWMiUj6dlcIkEY/cnBVfjw3UOjXhPI0W9u"
        }, {
            "userId": 2,
            "pubKey": "BYo8L8oBRLHxUrmlLtEJF8URmnp8z2g6TzRgzkD17RsO"
        }, {
            "userId": 3,
            "pubKey": "BcuPWb3mpHD9VEA4zT7A2anuas1GPeta4m2VVG083Wla"
        }, {
            "userId": 4,
            "pubKey": "BTNy/azNVR7ntoofbDuV+QD/4ot04vHKa4W6YggGmhRX"
        }, {
            "userId": 5,
            "pubKey": "Bc55z0AOESafSa8ZxY/8T97ul2R171liHKL6cf627qkV"
        }, {
            "userId": 6,
            "pubKey": "BZXdGldaGcBuoPcad5j8cgQacLWpRB/ZXO8ii1Rp21BI"
        }, {
            "userId": 7,
            "pubKey": "BUp2FLahWUm3WcEekA52RTHC/Ez1Cs7zjJbjWrkdEzBK"
        }, {
            "userId": 8,
            "pubKey": "BWjzqNEwqIAa+9UgvyxEDleYJKo5PsEgeI6mtY1VDSxh"
        }, {
            "userId": 9,
            "pubKey": "BV7NN0nmg6P42nx7AQt059PR4b9oTbKKyYv53hTJ5Ghq"
        }, {
            "userId": 10,
            "pubKey": "BeH6oh4LpPtZj0wYwFJZucS9HHuasMYoqGnecFYqp1dE"
        }];
        return userInfo;
    }
    // 将chainKey存储在本地数据库
    storeRoomIdChainKey(tableName, chainKey) {
        return this.roomIdStorage.addTablesData(tableName, chainKey);
    }

    // 将生成的chainKey上传到服务器
    uploadRoomIdChainKey() {

    }

    // 取数据库中的chainKey
    getRoomIdChainKey(roomId) {
        roomId = 1000;
        this.roomIdStorage.queryTableData([roomId]);
    }

    // 获取群聊表
    getRoomIdStorage(roomId) {
        if (!this.roomIdStorage[roomId]) {
            this.roomIdTable[roomId] = this.roomIdStorage;
        };

        return this.roomIdStorage[roomId];
    }

    encryptMessage() {

    }
}