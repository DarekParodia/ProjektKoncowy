var list;
var listUpdates = 0;
var serverList = [];

document.addEventListener("DOMContentLoaded", init);
function init() {
    list = document.getElementById("serverlist");
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
    let nick = document.getElementById("nick").value;
    if (!nick) nick = "guest" + Math.floor(Math.random() * 10000);
    console.log("joining game", port, "with nick", nick);
    window.location.href = window.origin + `/joingame?port=${port}&nickname=${nick}`;
}
