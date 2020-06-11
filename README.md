## Dexie 操作
```js 
var chat = new Dexie("groupchat");
// 添加表
chat.version(1).stores({
  keypair: "++id,keyPair"
})

// 添加数据 返回是插入的主键
await chat.keypair.add({id:1,keyPair:11111}) //1
await chat.keypair.add({id:2,keyPair:22222,isUse: false}) //2

// 修改数据
await chat.keypair.put({id:2,isUse: trute}) //此时数据库里面不会有keyPair这个字段

// 删除数据
await chat.keypair.delete(2) // 返回undefined

// 查询数据
await chat.keypair.get(1) // {id: 1, keyPair: 11111}

// 复杂查询
await chat.keypair.where("keyPair").above(30).toArray();
await chat.keypair.where("id").equals(1).toArray();
// 查询所有 转化成数组
await chat.keypair.toCollection().toArray();

````
