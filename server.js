const express = require("express");
const app = express();
const port = 80;
const gamePort = 8080;
class host {
    constructor(port, name, maxPlayers) {
        this.app = express();
        this.port = port;
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.app.get("*", (req, res) => {
            res.redirect("http://" + req.headers.host.split(":")[0] + req.url);
        });
        this.app.post("/ping", (req, res) => {
            let data = req.body;
            res.send("pong");
        });
        this.app.post("/gamepocket", (req, res) => {
            let data = req.body;
            res.send("gamepocket");
        });
        this.app.listen(this.port, () => {
            console.log(`Game host running at: ${this.port}`);
        });
    }
}
var serverList = [];

app.use("/js", express.static(__dirname + "/js"));
app.use("/css", express.static(__dirname + "/css"));
app.use("/img", express.static(__dirname + "/img"));
app.use("/html", express.static(__dirname + "/html"));

app.get("/", (req, res) => {
    res.redirect("./main.html");
});
app.get("/main.html", (req, res) => {
    res.sendFile(__dirname + "/main.html");
});
app.get("/joingame", (req, res) => {
    res.send(req.query);
});
app.post("/getserverlist", (req, res) => {
    let data = req.body;
    console.log("ServerList request reveived");
    res.send(serverList);
});

app.listen(port, () => {
    console.log(`Strona aktywna pod portem: ${port}`);
    createLobby("Main Server", 100);
    for (let i = 0; i < 100; i++) createLobby("Test Server" + i, 0);
});
function createLobby(name, maxPlayers = 10) {
    let server = new host(gamePort + serverList.length, name, maxPlayers);
    serverList.push(server);
    return server;
}
