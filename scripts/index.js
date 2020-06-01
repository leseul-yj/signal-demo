// let FingerprintGenerator = libsignal.FingerprintGenerator;

var connection;

function sendMessage() {
    if(connection === undefined) {
        return;
    }

    let to = document.getElementById('to').getAttribute("userid");
    let message = document.getElementById('message').value;

    connection.sendMessage(to,message);
}

function estConnection() {
    let to = document.getElementById('to').getAttribute("userid");
    let toName = document.getElementById('to').value;
    connection.EncryptUtil.initSession(toName,parseInt(to));
}

function register() {
    if(connection !== undefined) {
        return;
    }

    let username = document.getElementById('username').value;
    connection = new Connection(username);
}

register();

const group_id_db = 'group_table' + 18612392477;
var db = new Dexie(group_id_db);

db.open().then(result => {

});

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
    addTables() {
        //设置表名
        this.dataBase.version(this.version).stores({
            group_id_db: "++id,keyPair",
        });


    }
    addTablesData() {
        var pId,Pair;
        for(var i = 0; i < 1000; i++) {
            pId = i + 100000;
            Pair = nodesignal.curve.generateKeyPair();
            this.dataBase.group_id_db.put({id: pId,"keyPair": Pair})
        }

    }
    //删除数据库表
    deleteTables(tableName) {
        Dexie.delete(tableName);
    }

    //获得表数据
    getData() {
        var list = document.getElementById("list");
        var dataList = this.dataBase.tables;
        var ulnode = document.createElement("ul");
        console.log(dataList,"----------");
        for(var i = 0; i < dataList.length; i++) {
            var li = document.createElement("li");
            li.innerHTML = dataList[i].name;
            ulnode.appendChild(li);
        }
        list.appendChild(ulnode);
    }

}

let groupDB = new indexedDBStorage();
groupDB.createDB("groupchat");
groupDB.addTables();
groupDB.addTablesData();