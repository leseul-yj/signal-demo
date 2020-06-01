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

const group_id_db = 'group' + 18612392477;
var db = new Dexie(group_id_db);

db.open().then(result => {

});

class indexedDBStorage {
    constructor() {
        this.dataBase = undefined;
        this.version = 1;
    }
    createDB(dbName) {
        dbName = dbName || 'zq-dataBase';
        //調用創建数据库的方法，如果dbName名的不存在则会创建，若已有了，则会将现有的数据库赋值上
        this.dataBase = new Dexie(dbName);
        window.db = this.dataBase;
        //无数据时，默认version为1，须是db.close();的时候设置
        this.dataBase.version(this.version).stores();
        //promise函数
        return new Promise(((resolve, reject) => {
            //打开数据库时，会判断当前version值是否大于已经存在的version值，若大于则会upgrade即升到最高版本
            this.dataBase.open().then(result => {
                //打开成功后
                version = db.verno;
                resolve(db);
            }).catch('VersionError', e => {
                //若所设version小于当前的version,则会报versionError,此时
                //关闭后
                this.dataBase.close();
                //重新创建数据库，此时不设置db.version(version).stores();,会将当前的version设置为当前的
                this.dataBase = new Dexie(dbName);
                this.dataBase.open().then(result => {
                    //打开成功后，将version存下来
                    this.version = this.dataBase.verno;
                    resolve(db);
                }).catch(e => {
                    reject("failure")
                    console.error(e);
                })
            }).catch(e => {
                reject("failure")
                console.error(e);
            });
        }));
    }
    addTables() {
        //设置表名
        this.dataBase.close();
        Dexie.delete('zq-dataBase');
        this.version = (this.version * 10 + 1) / 10;
        this.dataBase = new Dexie('zq-dataBase');
        this.dataBase.version(this.version).stores({
            friends: "++id,name,age,isCloseFriend",
            car: "++id,band,color,seats"
        });
        this. dataBase.open().then(result => {
            alert("修改版本成功，当前的version：" + this.dataBase.verno);
        });

    }
    //删除数据库表
    deleteTables(tableName) {
        Dexie.delete(tableName);
    }

    //获得表数据
    getData() {
        var list = document.getElementById("list");
        var dataList = dataBase.tables;
        var ulnode = document.createElement("ul");
        console.log(dataList, "----------");
        for (var i = 0; i < dataList.length; i++) {
            var li = document.createElement("li");
            li.innerHTML = dataList[i].name;
            ulnode.appendChild(li);
        }
        list.appendChild(ulnode);
    }

}