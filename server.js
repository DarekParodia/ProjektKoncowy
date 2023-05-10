const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
const port = 80;
const gamePort = 8080;
const textures = {
    player: "obamna.jpg",
};
class game {
    enemy = class {
        constructor(x, y, width, height, color, texture) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height - height;
            this.color = color;
            this.texture = texture;
        }
        update() {}
    };
    player = class {
        constructor(ssid, x, y, width, height, color, texture) {
            this.ssid = ssid;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height - height;
            this.color = color;
            this.speed = 5;
            this.texture = texture;
            this.keyPressed = [];
        }
        update(deltaTime) {
            let diagnal = false;
            if ((this.keyPressed.includes("w") && this.keyPressed.includes("a")) || (this.keyPressed.includes("w") && this.keyPressed.includes("d")) || (this.keyPressed.includes("s") && this.keyPressed.includes("a")) || (this.keyPressed.includes("s") && this.keyPressed.includes("d"))) diagnal = true;
            if (this.keyPressed.includes("w")) {
                this.y -= diagnal ? (this.speed * 0.75 * deltaTime) / 100 : (this.speed * deltaTime) / 100;
            }
            if (this.keyPressed.includes("a")) {
                this.x -= diagnal ? (this.speed * 0.75 * deltaTime) / 100 : (this.speed * deltaTime) / 100;
            }
            if (this.keyPressed.includes("s")) {
                this.y += diagnal ? (this.speed * 0.75 * deltaTime) / 100 : (this.speed * deltaTime) / 100;
            }
            if (this.keyPressed.includes("d")) {
                this.x += diagnal ? (this.speed * 0.75 * deltaTime) / 100 : (this.speed * deltaTime) / 100;
            }
        }
    };
    constructor() {
        this.gameEntities = [];
        this.gamePlayers = [];
        this.updateDelay = 0;
        this.lastUpdate = Date.now();
    }
    init() {
        this.loop();
    }
    loop() {
        setTimeout(() => {
            this.update();
            this.loop();
        }, this.updateDelay);
    }
    update() {
        console.log("update");

        // update players
        for (let player of this.gamePlayers) {
            console.log(player);
            player.update(this.deltaTime);
        }
        this.deltaTime = Date.now() - this.lastUpdate;
        this.lastUpdate = Date.now();
    }
    playerUpdate(data) {
        for (let player of this.gamePlayers) {
            if (player.ssid == data.ssid) {
                player.keyPressed = data.keyPressed;
            }
        }
    }
    join(ssid) {
        this.gamePlayers.push(new this.player(ssid, randomInt(-100, 100), randomInt(-100, 100), 10, 10, "white", textures.player));
        return true;
    }
    checkIfPlayerExists(ssid) {
        for (let player of this.gamePlayers) {
            if (player.ssid == ssid) return true;
        }
        return false;
    }
    getPlayer(ssid) {
        for (let player of this.gamePlayers) {
            if (player.ssid == ssid) return player;
        }
        return false;
    }
}
class host {
    constructor(port, name, maxPlayers) {
        this.app = new express();
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: false}));
        this.app.use(cors());
        this.port = port;
        this.name = name;
        this.game = new game();
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.app.get("*", (req, res) => {
            this.log("get request received");
            res.redirect("http://" + req.headers.host.split(":")[0] + req.url);
        });
        // this.app.post("*", (req, res) => {
        //     this.log("post request received: " + req.originalUrl);
        // });
        this.app.post("/ping", (req, res) => {
            let data = req.body;
            res.send("pong");
        });
        this.app.post("/connect", (req, res) => {
            let data = req.body;
            this.log("connect request from ssid: " + data.ssid);
            if (getUserServer(data.ssid).port == this.port && this.game.join(data.ssid)) res.send({status: "ok"});
            else res.send({status: "error"});
        });
        this.app.post("/packet", (req, res) => {
            let data = req.body;
            this.game.playerUpdate(data);
            res.send({status: "ok", entities: this.game.gameEntities, players: this.game.gamePlayers, player: this.game.getPlayer(data.ssid), pingNumber: data.pingNumber});
        });
        this.app.listen(this.port, () => {
            this.log(`Game host running at: ${this.port}`);
            this.game.init();
        });
    }
    log(text) {
        console.log(`[ ${this.name} / ${this.port} ]`, text);
    }
}
var serverList = [];
var serverPasswords = [];
var sessions = [];

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
app.post("/joingame", (req, res) => {
    let data = req.body;
    console.log("joingame", data);
    // set user server
    for (let session of sessions) {
        if (session.ssid == data.ssid) {
            session.server = getServer(data.serverPort);
            return res.send({status: "OK"});
        }
    }
    res.send(data);
});
app.post("/getserverlist", (req, res) => {
    let data = req.body;
    console.log("ServerList request reveived");
    res.send(serverList);
});
app.post("/checkforsession", (req, res) => {
    let data = req.body;
    console.log("Session check request reveived");
    for (let session of sessions) {
        if (session.ssid == data.ssid) {
            return res.send({status: "OK", nickname: session.nickname});
        }
    }
    res.send({status: "no session found"});
});
app.post("/getserver", (req, res) => {
    let data = req.body;
    console.log("Server request reveived");
    let server = getUserServer(data.ssid);
    if (server) {
        res.send({serverPort: server.port, serverName: server.name, maxPlayers: server.maxPlayers});
    } else {
        res.send({status: "no server found"});
    }
});
app.post("/nickchange", (req, res) => {
    console.log(sessions);
    console.log(req.body);
    let ssid = req.body.ssid;
    if (checkForExistingNickname(req.body.nickname)) res.send({status: "nick exists"});
    for (let session of sessions) {
        if (session.ssid == ssid) {
            session.nickname = req.body.nickname;
            return res.send({status: "OK", nickname: req.body.nickname});
        }
    }
    res.send({status: "no ssid"});
});
app.post("/login", (req, res) => {
    let data = req.body;
    console.log("Login request reveived");
    if (checkForExistingNickname(data.nickname)) {
        res.send({status: "failed", reason: "Nickname already in use"});
        return;
    }
    let ssid = generateSSID();
    let session = {
        nickname: data.nickname,
        server: null,
        ssid: ssid,
    };
    sessions.push(session);
    res.send({ssid: ssid});
});

app.listen(port, () => {
    console.log(`Strona aktywna pod portem: ${port}`);
    createLobby("Main Server", 100);
    for (let i = 0; i < 2; i++) createLobby("Test Server" + i, 0);
});
function createLobby(name, maxPlayers = 10, password = "") {
    let server = new host(gamePort + serverList.length, name, maxPlayers);
    serverList.push(server);
    serverPasswords.push({serverIndex: serverList.indexOf(server), password: password});
    return server;
}
function getUserServer(ssid) {
    let session = sessions.find((element) => element.ssid == ssid);
    if (session) return session.server;
    return null;
}
function getServer(port) {
    return serverList.find((element) => element.port == port);
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function checkForExistingNickname(nickname) {
    for (let session of sessions) {
        if (session.nickname == nickname) return true;
    }
    return false;
}
console.log(generateSSID());
function generateSSID() {
    let exists = true;
    let ssid = "";
    while (exists) {
        ssid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        if (!sessions.find((element) => element.ssid == ssid)) exists = false;
    }
    return ssid;
}
