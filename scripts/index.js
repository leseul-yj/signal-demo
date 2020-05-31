const NUM_PRE_KEYS = 10; // preKey的数量
const NS_BASE = 'eu.siacs.conversations.axolotl';
const NS_DEVICELIST = NS_BASE + '.devicelist';
const NS_BUNDLES = NS_BASE + '.bundles:';
const AES_KEY_LENGTH = 128;
const AES_TAG_LENGTH = 128;
const AES_EXTRACTABLE = true;

localStorage.clear();

let libsignal = (window).nodesignal;

let KeyHelper = libsignal.keyhelper;
let SignalProtocolAddress = libsignal.ProtocolAddress;
let SessionBuilder = libsignal.SessionBuilder;
let SessionCipher = libsignal.SessionCipher;
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

function estConnection(){
    let to = document.getElementById('to').getAttribute("userid");
    //connection.getBundle(to);
}
function register() {
    if(connection !== undefined) {
        return;
    }

    let username = document.getElementById('username').value;
    connection = new Connection(username);
}


register()