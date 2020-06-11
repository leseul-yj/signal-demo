## Dexie 操作
```js
var chat = new Dexie("groupchat");
chat.version(1).stores({
  keypair: "++id,keyPair"
})
````
