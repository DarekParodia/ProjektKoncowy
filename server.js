const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
const port = 80;
const gamePort = 25565;
const textures = {
    player: "obamna.jpg",
};
class game {
    bullet = class {
        constructor(x, y, width, height, angle, color, texture, owner) {
            this.x = x;
            this.y = y;
            this.speed = 30;
            this.vx = (Math.cos(angle) * this.speed) / 10;
            this.vy = (Math.sin(angle) * this.speed) / 10;
            this.isColliding = false;
            this.width = width;
            this.height = height;
            this.mass = 1;
            this.angle = angle;
            this.color = color;
            this.texture = texture;
            this.owner = owner;
            this.lifespan = 5000;
            this.creationTime = Date.now();
            this.damage = 10;
        }
        update(deltaTime, game) {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            if (Date.now() > this.creationTime + this.lifespan) this.destroy(game);
            for (let player of game.gamePlayers) {
                if (player.id != this.owner.id) {
                    if (rectIntersect(player.x + player.width / 2, player.y + player.height / 2, player.width, player.height, this.x, this.y, this.width, this.height)) {
                        player.health -= this.damage;
                        this.destroy(game);
                    }
                }
            }
        }
        destroy(game) {
            game.destroyObject(game.gameEntities, this);
        }
    };
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
        constructor(ssid, x, y, width, height, color, texture, id) {
            this.ssid = ssid;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height - height;
            this.color = color;
            this.angle = 0;
            this.speed = 5;
            this.texture = texture;
            this.keyPressed = [];
            this.id = id;
            this.lastUpdate = Date.now();
            this.rifle = new this.rifle(this.x, this.y, 10, 10, 0, "white", textures.player);
            this.nickname = getNickname(ssid);
            this.health = 100;
            this.maxHealth = 100;
        }
        update(deltaTime) {
            let diagnal = false;
            if ((this.keyPressed.includes("w") && this.keyPressed.includes("a")) || (this.keyPressed.includes("w") && this.keyPressed.includes("d")) || (this.keyPressed.includes("s") && this.keyPressed.includes("a")) || (this.keyPressed.includes("s") && this.keyPressed.includes("d"))) diagnal = true;
            if (this.keyPressed.includes("w")) {
                this.y -= diagnal ? (this.speed * 0.75 * deltaTime) / 20 : (this.speed * deltaTime) / 20;
            }
            if (this.keyPressed.includes("a")) {
                this.x -= diagnal ? (this.speed * 0.75 * deltaTime) / 20 : (this.speed * deltaTime) / 20;
            }
            if (this.keyPressed.includes("s")) {
                this.y += diagnal ? (this.speed * 0.75 * deltaTime) / 20 : (this.speed * deltaTime) / 20;
            }
            if (this.keyPressed.includes("d")) {
                this.x += diagnal ? (this.speed * 0.75 * deltaTime) / 20 : (this.speed * deltaTime) / 20;
            }
            this.rifle.x = this.x;
            this.rifle.y = this.y;
            this.rifle.angle = this.angle;
        }
        rifle = class {
            constructor(x, y, width, height, angle, color, texture) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height - height;
                this.angle = angle;
                this.color = color;
                this.texture = texture;
                this.lastShot = Date.now();
                this.shootDelay = 400;
            }
            update() {}
        };
    };
    constructor(maxPlayers) {
        this.gameEntities = [];
        this.gamePlayers = [];
        this.objectsToDelete = [];
        this.updateDelay = 0;
        this.lastUpdate = Date.now();
        this.deltaTime = 0;
        this.timeoutTime = 3000;
        this.maxPlayers = 10;
        this.objectsToDo = [];
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
        // update players
        this.deltaTime = Date.now() - this.lastUpdate;
        this.lastUpdate = Date.now();
        for (let player of this.gamePlayers) {
            if (!player) continue;
            if (player.health <= 0) {
                this.destroyObject(this.gamePlayers, player);
                continue;
            }
            if (Date.now() - player.lastUpdate > this.timeoutTime) {
                this.destroyObject(this.gamePlayers, player);
                this.doAfterUpdate(() => {
                    this.join(player.ssid);
                });
                continue;
            }
            player.update(this.deltaTime);
            if (player.isMouseDown) {
                if (Date.now() - player.rifle.lastShot > player.rifle.shootDelay) {
                    this.shoot(player.rifle, player);
                    player.rifle.lastShot = Date.now();
                }
            }
        }
        for (let element of this.gameEntities) {
            if (element.update) element.update(this.deltaTime, this);
        }
        this.objectsToDelete.forEach((element) => {
            try {
                element.array.splice(element.array.indexOf(element.element), 1);
            } catch (e) {}
        });
        this.objectsToDelete = [];
        this.objectsToDo.forEach((element) => {
            try {
                element.action();
            } catch (e) {
                console.error(e);
            }
        });
        this.objectsToDo = [];
    }
    playerUpdate(data) {
        for (let player of this.gamePlayers) {
            if (player.ssid == data.ssid) {
                player.keyPressed = data.keyPressed;
                player.isMouseDown = data.isMouseDown;
                player.angle = data.angle;
                player.lastUpdate = Date.now();
            }
        }
    }
    join(ssid) {
        if (this.gamePlayers.length >= this.maxPlayers) return false;
        let player = this.getPlayer(ssid);
        if (!player) this.gamePlayers.push(new this.player(ssid, randomInt(-100, 100), randomInt(-100, 100), 10, 10, "white", textures.player, this.generateID()));
        else {
            player.nickname = getNickname(ssid);
        }
        return true;
    }
    getPlayer(ssid) {
        for (let player of this.gamePlayers) {
            if (player.ssid == ssid) return player;
        }
        return false;
    }
    generateID() {
        for (let player of this.gamePlayers) {
            let id = 0;
            if (player.id == id) {
                id++;
            } else return id;
        }
    }
    shoot(rifle, owner) {
        let bullet = new this.bullet(rifle.x, rifle.y, 10, 10, rifle.angle, "white", null, owner);
        this.gameEntities.push(bullet);
    }
    destroyObject(array, element) {
        this.objectsToDelete.push({array: array, element: element});
    }
    doAfterUpdate(callback) {
        this.objectsToDo.push({
            action: callback,
        });
    }
}
class entity {
    constructor(x, y, width, height, angle, color, texture) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle;
        this.color = color;
        this.texture = texture;
    }
    render() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.drawImage(this.texture, 0, 0, this.width, this.height);
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
        this.game = new game(maxPlayers);
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
            let gameEntities = [];
            for (let element of this.game.gameEntities) {
                gameEntities.push(new entity(element.x, element.y, element.width, element.height, element.angle ? element.angle : 0, element.color, element.texture));
            }
            res.send({status: "ok", entities: gameEntities, players: this.game.gamePlayers, player: this.game.getPlayer(data.ssid), pingNumber: data.pingNumber});
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
function getNickname(ssid) {
    for (let session of sessions) {
        if (session.ssid == ssid) return session.nickname;
    }
    return null;
}
function checkCollision(parent, element) {
    let hitboxX = parent.width > element.width ? parent.width : element.width;
    let hitboxY = parent.height > element.height ? parent.height : element.height;
    return Math.abs(parent.x - element.x) < hitboxX && Math.abs(parent.y - element.y) < hitboxY;
}
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2) {
        return false;
    }
    return true;
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
