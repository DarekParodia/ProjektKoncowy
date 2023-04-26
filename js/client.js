var serverUrl = null;
var connected = false;
var ssid = null;
document.addEventListener("DOMContentLoaded", function () {
    checkForSession(() => {
        getServer(() => {
            connect(() => {
                console.log("connected");
            });
        });
    });
});
function pakcetRequest(callback = () => {}) {
    const xhr = new XMLHttpRequest();
    const url = serverUrl + "/packet";
}
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}
function connect(callback = () => {}) {
    console.log("connecting to server", serverUrl);
    const xhr = new XMLHttpRequest();
    const url = serverUrl + "/connect";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    const body = JSON.stringify({
        ssid: ssid,
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const respond = JSON.parse(xhr.responseText);
            if (respond.status == "already connected") {
                alert("You are already connected to the server");
            } else {
                connected = true;
                callback();
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
}
function checkForSession(callback = () => {}) {
    ssid = getCookie("ssid");
    console.log("ssid:", ssid);
    if (!ssid) return noSession();
    console.log("ssid exists in cookies");
    const xhr = new XMLHttpRequest();
    const url = window.origin + "/checkforsession";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    const body = JSON.stringify({
        ssid: ssid,
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const respond = JSON.parse(xhr.responseText);
            if (respond.status == "no session found") {
                noSession();
            } else {
                console.log("session found");
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
        callback();
    };
    xhr.send(body);
}
function getServer(callback = () => {}) {
    const xhr = new XMLHttpRequest();
    const url = window.origin + "/getserver";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    const body = JSON.stringify({
        ssid: ssid,
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const respond = JSON.parse(xhr.responseText);
            if (respond.status == "no session found") {
                noSession();
            } else {
                serverUrl = window.origin + respond.serverPort;
                callback();
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
}

function noSession() {
    console.error("no session found");
}
