var list;
var listUpdates = 0;
var serverList = [];

document.addEventListener("DOMContentLoaded", init);
function init() {
    list = document.getElementById("serverlist");
    document.getElementById("nick").addEventListener("change", (e) => {
        changeNickname();
    });
    checkForSession();
    getServerList();
}
async function getServerList() {
    console.log("getting server list");
    const xhr = new XMLHttpRequest();
    const url = window.origin + "/getserverlist";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    const body = JSON.stringify({
        updates: listUpdates,
        serverList: serverList,
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const respond = JSON.parse(xhr.responseText);
            console.log(respond);
            listUpdates += 1;
            serverList = respond;
            updatelist();
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
}
function updatelist() {
    list.innerHTML = `
    <tr>
    <th>Nazwa</th>
    <th>Port</th>
    <th>Sloty</th>
    <th>Dolacz</th>
    </tr>`;
    for (let server of serverList) {
        let row = document.createElement("tr");
        let name = document.createElement("td");
        let port = document.createElement("td");
        let slots = document.createElement("td");
        let joinButt = document.createElement("button");
        joinButt.setAttribute("onclick", `joinGame(${server.port})`);
        joinButt.innerHTML = "dolacz";
        joinButt.className = "gameidbtn";
        name.innerHTML = server.name;
        port.innerHTML = server.port;
        slots.innerHTML = server.maxPlayers;
        row.appendChild(name);
        row.appendChild(port);
        row.appendChild(slots);
        row.appendChild(joinButt);
        list.appendChild(row);
    }
}
function joinGame(port) {
    checkForSession();
    let nick = document.getElementById("nick").value;
    console.log("joining game", port, "with nick", nick);

    const xhr = new XMLHttpRequest();
    const url = window.origin + "/joingame";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    const body = JSON.stringify({
        serverPort: port,
        ssid: getCookie("ssid"),
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const respond = JSON.parse(xhr.responseText);
            console.log("received", respond);
            window.location.href = window.origin + "/html/gameClient.html";
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
}
function createSession() {
    let nick = document.getElementById("nick").value;
    if (!nick) nick = "guest" + Math.floor(Math.random() * 10000);
    console.log("creating session with nick", nick);
    const xhr = new XMLHttpRequest();
    const url = window.origin + "/login";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    const body = JSON.stringify({
        nickname: nick,
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log("therespond", xhr.responseText);
            const respond = JSON.parse(xhr.responseText);

            if (respond.status == "failed") {
                console.log("feljed");
                throw respond.reason;
            } else {
                console.log("setting ssid to", respond.ssid);
                document.cookie = `ssid=${respond.ssid}`;
                document.getElementById("nick").value = nick;
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
}
function checkForSession() {
    let ssid = getCookie("ssid");
    console.log("ssid:", ssid);
    if (!ssid) return createSession();
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
                createSession();
            } else {
                document.getElementById("nick").value = respond.nickname;
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
}
function changeNickname() {
    checkForSession();
    const xhr = new XMLHttpRequest();
    const url = window.origin + "/nickchange";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    const body = JSON.stringify({
        nickname: document.getElementById("nick").value,
        ssid: getCookie("ssid"),
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const respond = JSON.parse(xhr.responseText);
            console.log(respond);
            if (respond.status == "OK") {
                console.log("nick changed succesfully");
                document.getElementById("nick").value = respond.nickname;
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
}
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}
