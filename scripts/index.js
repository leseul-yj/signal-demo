// let FingerprintGenerator = libsignal.FingerprintGenerator;

var connection;

function sendMessage() {
    if (connection === undefined) {
        return;
    }

    let to = document.getElementById('to').getAttribute("userid");
    let message = document.getElementById('message').value;

    connection.sendMessage(to, message);
}

function estConnection() {
    let to = document.getElementById('to').getAttribute("userid");
    let toName = document.getElementById('to').value;
    connection.EncryptUtil.initSession(toName, parseInt(to));
}

function register() {
    if (connection !== undefined) {
        return;
    }

    let username = document.getElementById('username').value;
    connection = new Connection(username);
}

register();

const roomId = 'roomId' + 18612392477;

class indexedDBStorage {
    constructor() {
        this.dataBase = undefined;
        this.version = 1;
    }
    createDB(dbName) {
        dbName = dbName;
        //調用創建数据库的方法，如果dbName名的不存在则会创建，若已有了，则会将现有的数据库赋值上
        this.dataBase = new Dexie(dbName);
        window.db = this.dataBase;
        //无数据时，默认version为1，须是db.close();的时候设置
        //this.dataBase.version(this.version).stores();
    }
    // 添加表
    addTables(tableOption, name) {
        //设置表名
        this.tableName = name;
        this.dataBase.version(this.version).stores(tableOption);
    }
    // 向表里面添加数据
    addTablesData(addData) {
        var pId, Pair;
        for (var i = 0; i < 1000; i++) {
            pId = i;
            Pair = nodesignal.curve.generateKeyPair();
            this.dataBase[this.tableName].add({
                id: pId,
                "keyPair": Pair
            })
        }
    }
    // 更新表中数据
    async updateTablesData(upData) {
        await this.dataBase[this.tableName].update(upData)
    }
    // 删除数据 delData->array
    async deleteTablesData(delData = []) {
        if (delData.length > 1) {
            await this.dataBase[this.tableName].delete(delData[0])
        } else {
            await this.dataBase[this.tableName].bulkDelete(delData)
        }
    }
    // 数据查询
    async queryTableData(query = []) {
        try {
            if (query.length > 1) {
                await this.dataBase[this.tableName].get(query[0]);
            } else {
                await this.dataBase[this.tableName].bulkGet(query);
            }
        } catch (err) {
            console.log(err)
        }

    }
    //删除数据库表
    deleteTables(tableName) {
        Dexie.delete(tableName);
    }

    //获得表数据
    getData() {
         this.queryTableData([1]).then(dataList=>{
            console.log(dataList);
         });
        
    }
}

let groupDB = new indexedDBStorage();
groupDB.createDB("roomChat");

let addTable = {};
addTable[roomId] = "++id,keyPair";
groupDB.addTables(addTable, roomId);
groupDB.addTablesData();
groupDB.getData();