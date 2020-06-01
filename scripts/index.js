
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
    connection.EncryptUtil.initSession(toName, parseInt(to));
}
function register() {
    if(connection !== undefined) {
        return;
    }

    let username = document.getElementById('username').value;
    connection = new Connection(username);
}


register()