var serverUrl = null;
var connected = false;
var ssid = null;
var requestDelay = 0;
var lastPing = 0;
var ping = null;
var pingNumber = 0;
var lastPingNumber = 0;
document.addEventListener("DOMContentLoaded", function () {
    checkForSession(() => {
        getServer(() => {
            connect(() => {
                console.log("connected");
                setTimeout(pakcetRequest, requestDelay);
                init();
            });
        });
    });
});
var canvas;
var ctx;
var keyPressed = [];
var gamePaused = false;
var textures = {
    obamna: new Image(20, 20),
    smutnyobama: new Image(20, 20),
    baseItem: new Image(20, 20),
    lol: new Image(20, 20),
    necoarc: new Image(20, 20),
    items: {
        forcefield: new Image(20, 20),
        necoarc: new Image(20, 20),
    },
};
var oldResX = 0;
var oldResY = 0;
var resDiffX = 0;
var resDiffY = 0;
var deltaTime = 0;
var debugMode = false;
var isMouseDown = false;
var mouse = {
    x: 0,
    y: 0,
};
var objectsToDelete = [];
var objectsToDo = [];
var tickDelay = 150;

function numberOfSpawnedItems() {
    let count = 0;
    for (const element of map.ghosts) {
        if (element instanceof item) count++;
    }
    return count;
}
function checkCollision(parent, element) {
    let hitboxX = parent.width > element.width ? parent.width : element.width;
    let hitboxY = parent.height > element.height ? parent.height : element.height;
    return Math.abs(parent.x - element.x) < hitboxX && Math.abs(parent.y - element.y) < hitboxY;
    // let a = parent;
    // let b = element;
    // return !(a.y + a.height < b.y || a.y > b.y + b.height || a.x + a.width < b.x || a.x > b.x + b.width);
    // return rectIntersect(parent.x, parent.y, parent.width, parent.height, element.x, element.y, element.width, element.height);
}
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2) {
        return false;
    }
    return true;
}
function checkCollisionX(parent, element) {
    let hitboxX = parent.width > element.width ? parent.width : element.width;
    return Math.abs(parent.x - element.x) < hitboxX;
}
function checkCollisionY(parent, element) {
    let hitboxY = parent.height > element.height ? parent.height : element.height;
    return Math.abs(parent.y - element.y) < hitboxY;
}
function checkIfItemIsInInventory(item) {
    for (const element of player.inventory) {
        if (element.name == item.name) return true;
    }
    return false;
}
class rifle {
    constructor(parent) {
        this.x = 0;
        this.y = 0;
        this.width = 20;
        this.height = 10;
        this.angle = 0;
        this.velocity = 8;
        this.shotspeed = 190;
        this.baseShotspeed = this.shotspeed;
        this.lastShot = 0;
        this.damage = 5;
        this.baseDamage = this.damage;
        this.parent = parent;
        this.projectileMass = 0.2;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.reloadingTime = 2000;
        this.bulletSizeRatio = 1;
        this.bulletCount = 1;
        this.shootAngle = 15;
        this.color = "red";
    }
    render() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(20, -5, this.width, this.height);
        ctx.restore();
    }
    update() {
        if ((keyPressed.includes("r") || this.ammo <= 0) && !this.isReloading && this.ammo < this.maxAmmo) {
            this.isReloading = true;
            this.lastReload = performance.now();
        }
        if (performance.now() - this.lastReload > this.reloadingTime / player.atkspd && this.isReloading) {
            this.ammo = this.maxAmmo;
            this.isReloading = false;
        }
    }
    shoot() {
        if (this.ammo > 0 && !this.isReloading) {
            this.lastShot = performance.now();
            this.ammo--;
            for (let i = 0; i < this.bulletCount; i++) {
                let angle;
                if (this.bulletCount == 1) {
                    angle = 0;
                } else {
                    angle = this.angle + ((i - (this.bulletCount - 1) / 2) * this.shootAngle) / (this.bulletCount - 1);
                    angle = (angle * Math.PI) / 180;
                }
                shootProjectile(this.x, this.y, this.angle + angle, this.velocity, this.projectileMass, this.parent, this.damage, this.bulletSizeRatio);
            }
        }
    }
    pistolPrefab() {
        this.damage = 10;
        this.baseDamage = this.damage;
        this.velocity = 5;
        this.shotspeed = 600;
        this.baseShotspeed = this.shotspeed;
        this.projectileMass = 1.2;
        this.ammo = 8;
        this.maxAmmo = 8;
        this.reloadingTime = 1000;
        this.color = "green";
        this.width = 15;
        this.height = 5;
    }
    shotgunPrefab() {
        this.damage = 7;
        this.baseDamage = this.damage;
        this.velocity = 1;
        this.shotspeed = 400;
        this.baseShotspeed = this.shotspeed;
        this.projectileMass = 2.2;
        this.ammo = 2;
        this.maxAmmo = 2;
        this.reloadingTime = 2000;
        this.bulletCount = 2;
        this.color = "brown";
        this.width = 18;
        this.height = 13;
    }
}
class mapClass {
    constructor() {
        this.projectiles = [];
        this.entities = [];
        this.players = [];
        this.mapElements = [];
        this.ghosts = [];
    }
}
class cameraClass {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.localX = 0;
        this.localY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}
class playerClass {
    constructor(x, y, baseTexture = textures.obamna) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 42;
        this.angle = 0;
        this.speed = 30;
        this.health = 100;
        this.maxHealth = 100;
        this.xp = 0;
        this.xpToNextLevel = 10;
        this.lvl = 1;
        this.skillpoints = 0;
        this.atk = 1.0;
        this.maxamo = 1;
        this.spd = 1.0;
        this.atkspd = 1.0;
        this.texture = baseTexture;
        this.bulletSizeRatio = 1;
        this.weapons = {
            pistol: new rifle(this),
            rifle: new rifle(this),
            shotgun: new rifle(this),
        };
        this.weapons.pistol.pistolPrefab();
        this.weapons.shotgun.shotgunPrefab();

        this.gun = this.weapons.rifle;
        this.isColliding = false;
        this.itemCount = 0;
        this.itemSpawnRate = 5;
        this.inventory = [];
        this.pickingItem = false;
        this.itemsToPick = [];
    }
    update() {
        if (this.health <= 0) {
            this.health = 0;
            this.death();
        }
        this.gun.update();
        let diagnal = false;
        if ((keyPressed.includes("w") && keyPressed.includes("a")) || (keyPressed.includes("w") && keyPressed.includes("d")) || (keyPressed.includes("s") && keyPressed.includes("a")) || (keyPressed.includes("s") && keyPressed.includes("d"))) diagnal = true;
        if (keyPressed.includes("w")) {
            this.y -= diagnal ? (this.speed * 0.75 * deltaTime) / 100 : (this.speed * deltaTime) / 100;
        }
        if (keyPressed.includes("a")) {
            this.x -= diagnal ? (this.speed * 0.75 * deltaTime) / 100 : (this.speed * deltaTime) / 100;
        }
        if (keyPressed.includes("s")) {
            this.y += diagnal ? (this.speed * 0.75 * deltaTime) / 100 : (this.speed * deltaTime) / 100;
        }
        if (keyPressed.includes("d")) {
            this.x += diagnal ? (this.speed * 0.75 * deltaTime) / 100 : (this.speed * deltaTime) / 100;
        }
        camera.x = this.x - camera.offsetX + resDiffX;
        camera.y = this.y - camera.offsetY + resDiffY;
        if (this.xp >= this.xpToNextLevel) {
            this.xp = 0;
            this.lvl++;
            this.skillpoints++;
            this.xpToNextLevel += 3;
        }
        this.gun.damage = this.gun.baseDamage * this.atk;
        this.gun.shotspeed = this.gun.baseShotspeed * this.atkspd;
    }
    draw() {
        let degreeAngle = this.angle * (180 / Math.PI);
        if (degreeAngle > -90 && degreeAngle < 90) {
            // draw player
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-this.width - this.x + this.width / 2, 0 + this.y - this.height / 2);
            ctx.drawImage(this.texture, 0, 0, this.width, this.height);
            ctx.restore();
        } else ctx.drawImage(this.texture, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        // draw gun
        this.gun.x = this.x;
        this.gun.y = this.y;
        this.gun.angle = this.angle;
        this.gun.render();
    }
    addItem(item) {
        this.inventory.push(item);
    }
    chooseItem(index) {
        console.log(index);
        const item1 = new item(0, 0, 20, 20, true);
        item1.collected = true;
        item1.texture = this.itemsToPick[index].texture;
        item1.tickFunction = this.itemsToPick[index].tickFunction;
        item1.supremeUpdate = this.itemsToPick[index].supremeUpdate;
        item1.supremeRender = this.itemsToPick[index].supremeRender;
        item1.name = this.itemsToPick[index].name;
        item1.description = this.itemsToPick[index].description;
        item1.parent = this;
        this.itemsToPick[index].supremeInit(item1);
        this.addItem(item1);
        gamePaused = false;
        player.pickingItem = false;
        player.itemsToPick = [];
        for (let i = 0; i < 3; i++) {
            const element = document.getElementById("item" + i);
            element.style.visibility = "hidden";
            element.style.display = "none";
        }
    }
    death() {
        this.dead = true;
    }
}
var player;
var camera;
var map;
var itemList = [];
function init() {
    canvas = document.getElementById("gamecanvas");
    canvas.width = 854;
    canvas.height = 480;
    ctx = canvas.getContext("2d");
    text("LOADING...", 200, 200, 50);

    addListeners();
    // import images
    // import images
    textures.obamna.src = "../img/obamna.jpg";
    if (Math.random() > 0) {
        textures.lol.src = "../img/l.png";
    } else textures.lol.src = "../img/l.jpg";
    textures.smutnyobama.src = "../img/obamasmutny.jpg";
    textures.baseItem.src = "../img/baseitem.png";
    textures.necoarc.src = "../img/neco-arc.png";
    textures.items.forcefield.src = "../img/items/forcefield.png";
    textures.items.necoarc.src = "../img/items/neco-arc.png";
    console.log(textures);

    camera = new cameraClass();
    player = new playerClass(0, 0);
    camera.offsetX = canvas.width / 2;
    camera.offsetY = canvas.height / 2;
    map = new mapClass();
    camera.x = player.x;
    camera.y = player.y;
    camera.lastX = camera.x;
    camera.lastY = camera.y;

    windowResize();
    text("LOADING...", 200, 200, 50);
    map.entities.push(new rifle(0, 0));
    map.players.push(new rifle(0, 0));
    requestAnimationFrame(loop);
}
var lastLoop = 0;
var lastd = performance.now();
var lastTick = performance.now();
var FPS = 0;
function loop() {
    deltaTime = Date.now() - lastLoop;
    FPS = 1000 / deltaTime;

    lastLoop = Date.now();
    if (!gamePaused) update();
    render();

    requestAnimationFrame(loop);
}
function update() {
    // detect collisiosn
    console.log(map.entities);
    for (let element of map.entities) {
        if (element.update) element.update();
        element.isColliding = false;
    }
    player.isColliding = false;
    // update map elements

    if (keyPressed.includes("1")) player.gun = player.weapons.pistol;
    else if (keyPressed.includes("2")) player.gun = player.weapons.rifle;
    else if (keyPressed.includes("3")) player.gun = player.weapons.shotgun;

    // calculate player angle based on mouse position
    let canvasPosisitons = canvas.getBoundingClientRect();
    let playerPosx = canvasPosisitons.x + canvas.width / 2;
    let playerPosy = canvasPosisitons.y + canvas.height / 2;
    player.angle = Math.atan2(mouse.y - playerPosy, mouse.x - playerPosx);

    // shoot wepons
    if (isMouseDown && performance.now() - player.gun.lastShot >= player.gun.shotspeed) {
        player.gun.shoot();
    }

    objectsToDelete.forEach((element) => {
        try {
            element.array.splice(element.array.indexOf(element.object), 1);
        } catch (e) {}
    });
    objectsToDelete = [];

    // update player
    player.update();

    objectsToDo.forEach((element) => {
        try {
            element.action();
        } catch (e) {
            console.error(e);
        }
    });
    objectsToDo = [];
}
function render() {
    ctx.clearRect(camera.x - 100, camera.y - 100, canvas.width + 100, canvas.height + 100); // clear screen
    if (camera.x != camera.lastX || camera.y != camera.lastY) {
        // move camera
        let cameraDeltaX = camera.x - camera.lastX;
        let cameraDeltaY = camera.y - camera.lastY;
        ctx.translate(-cameraDeltaX, -cameraDeltaY);
        camera.lastX = camera.x;
        camera.lastY = camera.y;
    }
    ctx.drawImage(textures.lol, -300, -300); // render background

    // render all object in map
    for (let element of map.mapElements) if (element.render) element.render();
    for (let element of map.ghosts) if (element.render && !element.collected) element.render();
    for (let element of map.players) {
        ctx.drawImage(textures.obamna, element.x - 25, element.y - 25, 50, 50);
    }

    for (let element of player.inventory) element.supremeRender(element);
    player.draw(); // render playerw
    for (let element of map.entities) if (element.render) element.render();
    for (let element of map.projectiles) if (element.render) element.render();

    renderHud(); // render hud
}
function renderHud() {
    if (debugMode) {
        text("FPS: " + Math.round(FPS * 100) / 100, camera.x + 10, camera.y + 25);
        text("DeltaTime: " + Math.round(deltaTime * 100) / 100 + "ms", camera.x + 10, camera.y + 45);
        text("Player HP: " + player.health, camera.x + 10, camera.y + 65);
        text("Player XP: " + player.xp, camera.x + 10, camera.y + 85);
    }
    // player health
    ctx.fillStyle = "lightcoral";
    ctx.fillRect(camera.x, camera.y + canvas.height - 20, canvas.width * 0.3, 15);
    ctx.fillStyle = "lightgreen";
    ctx.fillRect(camera.x, camera.y + canvas.height - 20, ((canvas.width * 0.3) / player.maxHealth) * player.health, 15);
    text(player.health + " / " + player.maxHealth, camera.x, camera.y + canvas.height - 25);

    // player ammo
    ctx.fillStyle = "yellow";
    let tempxa = ((canvas.height * 0.3) / player.gun.maxAmmo) * (player.gun.isReloading ? 0 : player.gun.ammo);
    ctx.fillRect(camera.x + canvas.width - 40, camera.y + canvas.height - tempxa - 5, 25, tempxa);
    let textOffest = getTextWidth(player.gun.ammo + " / " + player.gun.maxAmmo);
    if (player.gun.isReloading) text("Reloading...", camera.x + canvas.width - 150, camera.y + canvas.height - 10);
    else text(player.gun.ammo + " / " + player.gun.maxAmmo, camera.x + canvas.width - 40 - textOffest, camera.y + canvas.height - 10);

    // player xp
    ctx.fillStyle = "rgba(173, 173, 173, 0.39)";
    let lwidth = canvas.width * 0.9;
    ctx.fillRect(camera.x + (canvas.width - lwidth) / 2, camera.y + 40, lwidth, 15);
    ctx.fillStyle = "rgba(255, 255, 255, 0.39)";
    let xp = player.xp;
    let xpToNextLevel = player.xpToNextLevel;
    let xpPercentage = xp / xpToNextLevel;
    ctx.fillRect(camera.x + (canvas.width - lwidth) / 2, camera.y + 40, lwidth * xpPercentage, 15);
    text(xp + " / " + xpToNextLevel, camera.x + canvas.width / 2 - getTextWidth(xp + " / " + xpToNextLevel) / 2, camera.y + 35);
    text("Poziom: " + player.lvl, camera.x + (canvas.width - lwidth) / 2, camera.y + 30);

    // player shoot delay
    ctx.fillStyle = "rgb(255, 165, 0)";
    let shootDelay = performance.now() - player.gun.lastShot;
    let shootDelayPercentage = shootDelay / player.gun.baseShotspeed > 1 ? 1 : shootDelay / player.gun.baseShotspeed;
    if (player.gun.isReloading) shootDelayPercentage = 0;
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2 - 10, player.width * shootDelayPercentage, 5);

    // player stats

    if (player.skillpoints > 0) {
        text("HP: " + player.maxHealth + " +", camera.x, camera.y + canvas.height / 2 - 100);
        text("ATK: " + Math.round(player.atk * 100) / 100 + " +", camera.x, camera.y + canvas.height / 2 - 80);
        text("ATKSPD: " + Math.round(player.atkspd * 100) / 100 + " +", camera.x, camera.y + canvas.height / 2 - 60);
        text("MAXAMO: " + Math.round(player.maxamo * 100) / 100 + " +", camera.x, camera.y + canvas.height / 2 - 40);
        text("WLKSPD: " + Math.round(player.spd * 100) / 100 + " +", camera.x, camera.y + canvas.height / 2 - 20);
    } else {
        text("HP: " + player.maxHealth, camera.x, camera.y + canvas.height / 2 - 100);
        text("ATK: " + Math.round(player.atk * 100) / 100, camera.x, camera.y + canvas.height / 2 - 80);
        text("ATKSPD: " + Math.round(player.atkspd * 100) / 100, camera.x, camera.y + canvas.height / 2 - 60);
        text("MAXAMO: " + Math.round(player.maxamo * 100) / 100, camera.x, camera.y + canvas.height / 2 - 40);
        text("WLKSPD: " + Math.round(player.spd * 100) / 100, camera.x, camera.y + canvas.height / 2 - 20);
    }

    // player items
    let row = 0;
    let c = 0;
    let maxItemsInRow = 10;
    let maxCols = 3;
    let maxItems = maxItemsInRow * maxCols;
    maxItems = maxItems < player.inventory.length ? maxItems : player.inventory.length;
    for (let i = 0; i < maxItems; i++) {
        if (i % maxItemsInRow == 0 && row < maxCols) {
            row++;
            c = 0;
        }
        const element = player.inventory[player.inventory.length - i - 1];
        let spacing = 10;
        let size = 20;
        let x = camera.x + +spacing * row + size * row - size;
        let y = camera.y + canvas.height / 2 + spacing * c + size * c;
        element.x = x;
        element.y = y;
        element.width = size;
        element.height = size;
        element.render();
        if (row >= maxCols && c >= maxItemsInRow - 1 && player.inventory.length > maxItems) {
            ctx.fillStyle = `rgba(0, 0, 0, 0.5)`;
            ctx.fillRect(x, y, size, size);
            text("•••", x + 1, y + size / 1.3, 17, `rgba(0, 0, 0, 0.82)`);
        }
        c++;
        if (i > maxItems) break;
    }

    // item choosing
    let r = document.querySelector(":root");
    if (player.pickingItem) {
        r.style.setProperty("--pickerDisplay", "flex");

        for (let i = 0; i < player.itemsToPick.length; i++) {
            let itemDiv = document.getElementById("item" + i);
            let itemImg = document.querySelector(`#item${i} > img`);
            let itemName = document.querySelector(`#item${i} > h2`);
            let itemDesc = document.querySelector(`#item${i} > p`);
            itemDiv.style.display = "flex";
            itemDiv.style.visibility = "visible";
            itemImg.src = player.itemsToPick[i].texture.src;
            if (itemName.innerHTML != player.itemsToPick[i].name) itemName.innerHTML = player.itemsToPick[i].name;
            if (itemDesc.innerHTML != player.itemsToPick[i].description) itemDesc.innerHTML = player.itemsToPick[i].description;
        }
    } else {
        r.style.setProperty("--pickerDisplay", "none");
    }
    text(" ");

    // death screen
    if (player.dead) {
        text("Zginąłeś", camera.x, camera.y + canvas.height / 4 - 100);
        text("Naciśnij F5 aby zacząć od nowa", camera.x, camera.y + canvas.height / 4 - 80);
    }
}

document.addEventListener(onkeydown, () => {});

function getTextWidth(text) {
    return text.length * 10;
}
function addListeners() {
    window.addEventListener("keydown", (e) => {
        var key = e.key.toLowerCase();
        if (!keyPressed.includes(key)) keyPressed.push(key);
        if (key == "q") spawnEnemy1(randomInt(-1000, 1000), randomInt(-1000, 1000));
        if (key == "e") spawnEnemy2(randomInt(-1000, 1000), randomInt(-1000, 1000));
        if (key == "t") spawnRandomItem(randomInt(-100, 100), randomInt(-100, 100));
        if (key == "f2") debugMode = !debugMode;
        if (key == "1" && player.skillpoints > 0) {
            player.maxHealth += 5;
            player.health += 5;
            player.skillpoints--;
        }
        if (key == "2" && player.skillpoints > 0) {
            player.atk += 0.05;
            player.skillpoints--;
        }
        if (key == "3" && player.skillpoints > 0) {
            player.atkspd += 0.05;
            player.skillpoints--;
        }
        if (key == "4" && player.skillpoints > 0) {
            player.maxamo += 0.05;
            player.skillpoints--;
        }
        if (key == "5" && player.skillpoints > 0) {
            player.spd += 0.05;
            player.skillpoints--;
        }
    });
    window.addEventListener("keyup", (e) => {
        var key = e.key.toLowerCase();
        if (keyPressed.includes(key)) keyPressed.splice(keyPressed.indexOf(key), 1);
    });
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    window.addEventListener("mousedown", (e) => {
        isMouseDown = true;
    });
    window.addEventListener("mouseup", (e) => {
        isMouseDown = false;
    });
    window.addEventListener("resize", windowResize);
    for (let i = 0; i < 3; i++) {
        const element = document.getElementById(`item${i}`);
        element.addEventListener(`click`, (e) => {
            if (player.pickingItem) player.chooseItem(i);
        });
    }
}
function windowResize() {
    oldResX = canvas.width;
    oldResY = canvas.height;
    let main = document.getElementById("main");
    canvas.width = main.clientWidth;
    canvas.height = window.innerHeight - 60;

    ctx.translate(-camera.x, -camera.y);
    resDiffX = (864 - canvas.width) / 2;
    resDiffY = (480 - canvas.height) / 2;
    oldResX = canvas.width;
    oldResY = canvas.height;

    let r = document.querySelector(":root");
    r.style.setProperty("--pickerHeight", canvas.height - canvas.height / 4 + "px");
    r.style.setProperty("--pickerWidth", canvas.width - canvas.width / 4 + "px");
    r.style.setProperty("--pickerX", canvas.width / 8 + "px");
    r.style.setProperty("--pickerY", canvas.height / 8 + "px");
}
function text(text, x, y, size = 20, color = "white") {
    let tmp = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.font = size + "px Arial";
    ctx.fillText(text, x, y);
    ctx.fillStyle = tmp;
}
function shootProjectile(x, y, angle, velocity, mass, parent, damage, bulletSizeRatio = 1) {
    let bulet = new bullet(parent, x + Math.cos(angle) * 24 - 2, y + Math.sin(angle) * 24 - 2, angle, velocity, mass, damage * player.atk, "yellow", bulletSizeRatio);
    map.projectiles.push(bulet);
    console.log("new bullet", bulet);
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function dystans(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function spawnRandomItem(x, y) {
    map.ghosts.push(new item(x, y, 20, 20));
    // map.ghosts.push(new item(x, y, size, size, `rgb(255, 255, 255)`));
}
function spawnEnemy1(x, y) {
    map.entities.push(new enemy(x, y, 30, 30));
}
function spawnEnemy2(x, y) {
    let en = new enemy(x, y, 30, 30);
    en.maxHealth = 20;
    en.health = 20;
    en.speed = 0.25;
    en.color = "blue";
    en.xpValue = 5;
    map.entities.push(en);
}

function pakcetRequest(callback = () => {}) {
    const xhr = new XMLHttpRequest();
    const url = serverUrl + "/packet";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    const body = JSON.stringify({
        ssid: ssid,
        pingNumber: pingNumber,
        keyPressed: keyPressed,
    });
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const respond = JSON.parse(xhr.responseText);
            if (respond.pingNumber > lastPingNumber) {
                map.entities = respond.entities;
                map.players = respond.players;
                player.x = respond.player.x;
                player.y = respond.player.y;
                ping = Date.now() - lastPing;
                lastPing = Date.now();
                lastPingNumber = respond.pingNumber;
                setTimeout(pakcetRequest, requestDelay);
                console.log("ping", ping + "ms");
            }
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
    pingNumber++;
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
        console.log("AAAAAAAAAAAAAAAAAAAAA");
        if (xhr.readyState == 4 && xhr.status == 200) {
            const respond = JSON.parse(xhr.responseText);
            console.log(respond);
            if (respond.status == "already connected") {
                alert("You are already connected to the server");
            } else if (respond.status == "ok") {
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
                serverUrl = window.origin + ":" + respond.serverPort;
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
