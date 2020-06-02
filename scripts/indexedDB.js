/* 
 * @Author: alisa  
 * @Date: 2020-06-02 14:50:56  
 * @Last Modified by: alisa
 * @Last Modified time: 2020-06-02 19:01:39
 */

class IndexedDBStorage {
    constructor(dbName) {
        this.dataBase = undefined;
        this.dbName = dbName;
        this.version = 1;
        this.init();
    }
    init() {
        //調用創建数据库的方法，如果dbName名的不存在则会创建，若已有了，则会将现有的数据库赋值上
        this.dataBase = new Dexie(this.dbName);
    }
    // 获取表
    getTable(tableName) {
        this.dataBase.tables && this.dataBase.tables.filter(item => tableName == item.name)
    }
    // 添加表
    addTables(tableName, tableOption) {
        //设置表名
        this.tableName = tableName;
        this.dataBase.version(this.version).stores(tableOption);
    }
    // 向表里面添加数据
    async addTablesData(tableName, addData) {
        if(addData.length>0){
            await this.dataBase[tableName].add(addData);
        }else{
            await this.dataBase[tableName].bulkAdd(addData);
        }
    }
    // 更新表中数据
    async updateTablesData(tableName, upData) {
        await this.dataBase[tableName].update(upData)
    }
    // 删除数据 delData->array
    async deleteTablesData(tableName, delData = []) {
        if (delData.length > 1) {
            await this.dataBase[tableName].delete(delData[0]);
        } else {
            await this.dataBase[tableName].bulkDelete(delData);
        }
    }
    // 数据查询
    async queryTableData(tableName, query = []) {
        try {
            if (query.length > 1) {
                await this.dataBase[tableName].get(query[0]);
            } else {
                await this.dataBase[tableName].bulkGet(query);
            }
        } catch (err) {
            console.log(err)
        }

    }
    //删除数据库表
    deleteTables(tableName) {
        Dexie.delete(tableName);
    }

}