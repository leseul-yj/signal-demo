const STORE_PREFIX = 'store';
const STORE_PREFIX_SESSION = 'session:';
const STORE_PREFIX_IDENTITYKEY = 'identityKey:';
const STORE_PREFIX_PREKEY = '25519KeypreKey:';
const STORE_PREFIX_SIGNEDPREKEY = '25519KeysignedKey:';

//@TODO create SignalStore interface in order to know which functions are required by Signal

D_SENDING = 1;
D_RECEIVING = 2;

class Store {

    constructor(storage,connection) { //@TODO add ts type
        this.storage = storage;
        this.connection = connection;
        this.Direction = {
            SENDING: 1,
            RECEIVING: 2
        }
    }

    getOwnDeviceList() {
        return this.get('deviceList',[]);
    }

    setOwnDeviceList(deviceList) {
        this.put('deviceList',deviceList);
    }

    getDeviceList(identifier) {
        return this.get('deviceList:' + identifier,[]);
    }

    setDeviceList(identifier,deviceList) {
        this.put('deviceList:' + identifier,deviceList);
    }

    isReady() {
        return this.get('deviceId') && this.get('identityKey') && this.get('registrationId');
    }

    isPublished() {
        return this.get('published') === 'true' || this.get('published') === true;
    }

    getIdentityKeyPair() {
        return Promise.resolve(this.get('identityKey'));
    }

    getLocalRegistrationId() {
        return Promise.resolve(this.get('registrationId'));
    }

    getDeviceId() {
        return parseInt(this.get('deviceId'));
    }

    put(key,value) {
        if(key === undefined || value === undefined || key === null || value === null)
            throw new Error('Tried to store undefined/null');

        //@REVIEW serialization is done in storage.setItem
        let stringified = JSON.stringify(value,function(key,value) {
            if(value instanceof ArrayBuffer) {
                return ArrayBufferUtils.toArray(value)
            }

            return value;
        });

        if(key.includes('identityKey')) {
            console.log('put %s: %s \n %s \n\n',key,value,stringified);
        }


        this.storage.setItem(STORE_PREFIX,key,{
            v: stringified
        });
    }

    get(key,defaultValue) {
        if(key === null || key === undefined)
            throw new Error('Tried to get value for undefined/null key');

        const data = this.storage.getItem(STORE_PREFIX,key);

        if(data) {
            let r = JSON.parse(data.v,function(key1,value) {
                if(/Key$/.test(key1)) {
                    // if (key.includes('Key')) {
                    console.log('get %s has Key %s',key,key1);
                    //return ArrayBufferUtils.fromArray(value);
                    return value;
                }

                return value;
            });

            if(key === 'identityKey') {
                console.log('get %s: %s \n %s\n\n',key,data,r);
            }

            return r;
        }

        return defaultValue;
    }

    remove(key) {
        if(key === null || key === undefined)
            throw new Error('Tried to remove value for undefined/null key');

        this.storage.removeItem(STORE_PREFIX,key);
    }

    isTrustedIdentity(identifier,identityKey) {
        if(identifier === null || identifier === undefined) {
            throw new Error('tried to check identity key for undefined/null key');
        }

        // if(!(identityKey instanceof ArrayBuffer)) {
        //     throw new Error('Expected identityKey to be an ArrayBuffer');
        // }

        let trusted = this.get(STORE_PREFIX_IDENTITYKEY + identifier);
        console.log('trusted %s \t %s \t %s',trusted === undefined,trusted,STORE_PREFIX_IDENTITYKEY + identifier);
        if(trusted === undefined) {
            return Promise.resolve(true);
        }

        return Promise.resolve(ArrayBufferUtils.isEqual(identityKey,trusted));
    }

    saveIdentity(identifier,identityKey) {
        if(identifier === null || identifier === undefined)
            throw new Error('Tried to put identity key for undefined/null key');

        let address = new SignalProtocolAddress.fromString(identifier);

        let existing = this.get(STORE_PREFIX_IDENTITYKEY + address.toString());
        this.put(STORE_PREFIX_IDENTITYKEY + address.toString(),identityKey); //@REVIEW stupid?

        return Promise.resolve(existing && ArrayBufferUtils.isEqual(identityKey,existing));
    }

    loadPreKey(keyId) {
        let res = this.get(STORE_PREFIX_PREKEY + keyId);
        if(res !== undefined) {
            res = {
                pubKey: res.pubKey,
                privKey: res.privKey
            };
        }

        return Promise.resolve(res);
    }

    storePreKey(keyId,keyPair) {
        return Promise.resolve(this.put(STORE_PREFIX_PREKEY + keyId,keyPair));
    }

    removePreKey(keyId) {
        //@TODO publish new bundle

        return Promise.resolve(this.remove(STORE_PREFIX_PREKEY + keyId));
    }

    loadSignedPreKey(keyId) {
        let res = this.get(STORE_PREFIX_SIGNEDPREKEY + keyId);
        if(res !== undefined) {
            res = {
                pubKey: res.pubKey,
                privKey: res.privKey
            };
        }

        return Promise.resolve(res);
    }

    storeSignedPreKey(keyId,keyPair) {
        return Promise.resolve(this.put(STORE_PREFIX_SIGNEDPREKEY + keyId,keyPair));
    }

    removeSignedPreKey(keyId) {
        return Promise.resolve(this.remove(STORE_PREFIX_SIGNEDPREKEY + keyId));
    }

    loadSession(identifier) {
        return Promise.resolve(this.get(STORE_PREFIX_SESSION + identifier));
    }

    storeSession(identifier,record) {
        return Promise.resolve(this.put(STORE_PREFIX_SESSION + identifier,record));
    }

    removeSession(identifier) {
        return Promise.resolve(this.remove(STORE_PREFIX_SESSION + identifier));
    }

    hasSession(identifier) {
        return !!this.get(STORE_PREFIX_SESSION + identifier)
    }

    removeAllSessions(identifier) {
        //@TODO implement removeAllSessions
        // for (var id in this.store) {
        //    if (id.startsWith(this.STORE_prefix + ':' + 'session' + identifier)) {
        //       localStorage.removeItem(this.STORE_prefix + ':' + id);
        //    }
        // }
        return Promise.resolve();
    }

    async getPreKeyBundle(address) {
        const node = NS_BUNDLES + address.getDeviceId();

        // TODO: get bundle form localstorage
        var bundleElement = await this.connection.getBundle(address.getDeviceId());
        // var bundleElement = await ApiRequest.getPublicKeyAndOneTimePreKey()

        if(bundleElement === undefined) {
            return Promise.reject('Found no bundle');
        }

        const bundle = Bundle.fromJSON(bundleElement);

        //@REVIEW registrationId??? Gajim uses probably own registration id.
        return bundle.toSignalBundle(address.getDeviceId())
    }
}

const PREFIX = 'jsxc2';

const SEP = ':';

const IGNORE_KEY = ['rid'];

const BACKEND = localStorage;

class Storage {
    static clear(name) {
        let prefix = PREFIX + SEP;

        if(prefix) {
            prefix = prefix + name + SEP;
        }

        for(let key in BACKEND) {
            if(!BACKEND.hasOwnProperty(key)) {
                continue;
            }

            if(key.startsWith(prefix)) {
                BACKEND.removeItem(key);
            }
        }
    }

    constructor(name) {
        this.hooks = {};

        if(Storage.tested === undefined) {
            Storage.tested = false;
            Storage.storageNotConform = false;
            Storage.toSNC = undefined;
        }

        if(!Storage.tested) {
            Storage.tested = true;

            this.testStorage();
        }

        window.addEventListener('storage',this.onStorageEvent,false);

    }

    getName() {
        return this.name;
    }

    generateKey(...args) {
        let key = '';

        args.forEach(function(arg) {
            if(key !== '') {
                key += SEP;
            }

            key += arg;
        })

        return key;
    }

    testStorage() {
        let randomNumber = Math.round(Math.random() * 1000000000) + '';
        let key = this.getPrefix() + randomNumber;
        let timeout;

        let listenerFunction = function(ev) {
            if(ev.newValue === randomNumber) {
                clearTimeout(timeout);
                cleanup();
                Storage.storageNotConform = true;
            }
        };

        let cleanup = function() {
            window.removeEventListener('storage',listenerFunction,false);
            BACKEND.removeItem(key)
        }

        window.addEventListener('storage',listenerFunction,false);

        timeout = setTimeout(function() {
            cleanup();
        },20);

        BACKEND.setItem(key,randomNumber);
    }

    getPrefix() {
        let prefix = PREFIX + SEP;

        if(this.name) {
            prefix += this.name + SEP;
        }

        return prefix;
    }

    getBackend() {
        return BACKEND;
    }

    setItem() {
        let key,value;

        if(arguments.length === 2) {
            key = arguments[0];
            value = arguments[1];
        } else if(arguments.length === 3) {
            key = arguments[0] + SEP + arguments[1];
            value = arguments[2];
        }

        //@REVIEW why do we just stringify objects?
        if(typeof (value) === 'object') {
            // exclude jquery objects, because otherwise safari will fail
            try {
                value = JSON.stringify(value,function(key,val) {
                    if(!(val instanceof jQuery)) {
                        return val;
                    }
                });
            } catch(err) {
                console.warn('Could not stringify value',err);
            }
        }

        let oldValue = BACKEND.getItem(this.getPrefix() + key);

        BACKEND.setItem(this.getPrefix() + key,value);

        if(!Storage.storageNotConform && oldValue !== value) {
            this.onStorageEvent({
                key: this.getPrefix() + key,
                oldValue: oldValue,
                newValue: value
            });
        }
    }

    getItem() {
        let key;

        if(arguments.length === 1) {
            key = arguments[0];
        } else if(arguments.length === 2) {
            key = arguments[0] + SEP + arguments[1];
        }

        key = this.getPrefix() + key;

        var value = BACKEND.getItem(key);

        return this.parseValue(value);
    }

    removeItem() {
        let key;

        if(arguments.length === 1) {
            key = arguments[0];
        } else if(arguments.length === 2) {
            key = arguments[0] + SEP + arguments[1];
        }

        BACKEND.removeItem(this.getPrefix() + key);
    }

    updateItem() {
        let key,variable,value;

        if(arguments.length === 4 || (arguments.length === 3 && typeof variable === 'object')) {
            key = arguments[0] + SEP + arguments[1];
            variable = arguments[2];
            value = arguments[3];
        } else {
            key = arguments[0];
            variable = arguments[1];
            value = arguments[2];
        }

        var data = this.getItem(key) || {};

        if(typeof (variable) === 'object') {

            $.each(variable,function(key,val) {
                if(typeof (data[key]) === 'undefined') {
                    Log.debug('Variable ' + key + ' doesn\'t exist in ' + variable + '. It was created.');
                }

                data[key] = val;
            });
        } else {
            if(typeof data[variable] === 'undefined') {
                Log.debug('Variable ' + variable + ' doesn\'t exist. It was created.');
            }

            data[variable] = value;
        }

        this.setItem(key,data);
    }

    increment(key) {
        let value = Number(this.getItem(key));

        this.setItem(key,value + 1);
    }

    removeElement() {
        let key,name;

        if(arguments.length === 2) {
            key = arguments[0];
            name = arguments[1];
        } else if(arguments.length === 3) {
            key = arguments[0] + SEP + arguments[1];
            name = arguments[2];
        }

        var item = this.getItem(key);

        if($.isArray(item)) {
            item = $.grep(item,function(e) {
                return e !== name;
            });
        } else if(typeof (item) === 'object' && item !== null) {
            delete item[name];
        }

        this.setItem(key,item);
    }

    registerHook(eventName,func) {
        if(!this.hooks[eventName]) {
            this.hooks[eventName] = [];
        }

        this.hooks[eventName].push(func);
    }

    removeHook(eventName,func) {
        let eventNameList = this.hooks[eventName] || [];

        if(typeof func === 'undefined') {
            eventNameList = [];
        } else if(eventNameList.indexOf(func) > -1) {
            eventNameList = $.grep(eventNameList,function(i) {
                return func !== i;
            });
        }

        this.hooks[eventName] = eventNameList;
    }

    onStorageEvent(ev) {
        let hooks = this.hooks;
        let key = ev.key.replace(new RegExp('^' + this.getPrefix()),'');
        let oldValue = this.parseValue(ev.oldValue);
        let newValue = this.parseValue(ev.newValue);

        if(IGNORE_KEY.indexOf(key) > -1) {
            return;
        }

        let eventNames = Object.keys(hooks);
        eventNames.forEach(function(eventName) {
            if(key.match(new RegExp('^' + eventName + '(:.+)?$'))) {
                let eventNameHooks = hooks[eventName] || [];
                eventNameHooks.forEach(function(hook) {
                    hook(newValue,oldValue,key);
                });
            }
        });
    }

    parseValue(value) {
        try {
            return JSON.parse(value);
        } catch(e) {
            return value;
        }
    }
}
