var canvas;
var ctx;
var keyPressed = [];
var gamePaused = false;
var mapSize = 120; // in tiles
var tileSize = 16;
var mapScale = 5;
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
    map: {
        tile1: new Image(20, 20),
    },
    enemies: {
        enemy0: new Image(20, 20),
        enemy1: new Image(20, 20),
        enemy2: new Image(20, 20),
    },
    k4: new Image(20, 20),
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

class item {
    constructor(x, y, width, height, collected = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.texture = textures.baseItem;
        this.collected = false;
        this.tickFunction = (itm) => {};
        this.supremeUpdate = (itm) => {
            return "pedal";
        };
        this.supremeRender = (itm) => {};
        this.sup = {};
        this.parent = null;
    }
    update() {
        if (!this.collected) {
            if (checkCollision(this, player)) {
                this.collected = true;
                console.log("item collected");
                gamePaused = true;

                let itemsGenerated = 0;
                let possibleItems = [];
                for (const item of itemList) {
                    if (!checkIfItemIsInInventory(item)) possibleItems.push(item);
                }
                console.log(possibleItems);
                let count = 0;
                let possibleCount = possibleItems.length > 3 ? 3 : possibleItems.length;
                if (possibleCount <= 0) {
                    gamePaused = false;
                    return;
                }
                while (itemsGenerated < possibleCount) {
                    if (Math.random() < 1 / possibleItems.length && !player.itemsToPick.includes(possibleItems[count])) {
                        itemsGenerated++;
                        player.itemsToPick.push(possibleItems[count]);
                    }
                    count++;
                    if (count > possibleItems.length - 1) count = 0;
                    if (Math.random() < possibleItems[count].rarity) count++;
                    if (count > possibleItems.length - 1) count = 0;
                }
                objectsToDelete.push({array: map.ghosts, object: this});
                console.log(player.itemsToPick);
                player.pickingItem = true;
            }
        } else this.supremeUpdate(this);
    }
    render() {
        ctx.fillStyle = this.color;
        ctx.drawImage(this.texture, this.x, this.y, this.width, this.height);
    }
}
class xp {
    constructor(x, y, owner, value = 1) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 5;
        this.color = "green";
        this.acceleration = 0.01;
        this.velocity = 0.0001;
        this.owner = owner;
        this.bornTime = performance.now();
        this.xpValue = value;
        this.minDistance = 200;
        this.following = false;
    }
    update() {
        if (!this.owner) this.owner = player;
        if (dystans(this.x, this.y, this.owner.x, this.owner.y) < this.minDistance) this.following = true;

        if (this.following) {
            if (checkCollision(this, this.owner)) {
                this.owner.xp += this.xpValue;
                map.ghosts.splice(map.ghosts.indexOf(this), 1);
            } else {
                this.y += Math.sin(Math.atan2(player.y - this.y, player.x - this.x)) * this.velocity * deltaTime;
                this.x += Math.cos(Math.atan2(player.y - this.y, player.x - this.x)) * this.velocity * deltaTime;
                this.velocity += this.acceleration * deltaTime * this.velocity;
            }
        }
    }
    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
class enemy {
    constructor(x, y, width, height, damage = 5, color = "red") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.drag = 1.01;
        this.damage = damage;
        this.color = color;
        this.texture = textures.enemies["enemy0"];
        this.angle = 0;
        this.mass = 50;
        this.vx = 0;
        this.vy = 0;
        this.health = 10;
        this.maxHealth = 10;
        this.xpValue = 1;
        this.lastAttack = performance.now();
        this.attackCooldown = 1000;
    }
    update() {
        this.angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.vx = this.vx / this.drag;
        this.vy = this.vy / this.drag;
        this.x += this.vx * deltaTime + Math.cos(this.angle);
        this.y += this.vy * deltaTime + Math.sin(this.angle);
        if (checkCollision(player, this)) {
            player.isColliding = true;
            this.isColliding = true;
            if (player.collision) player.collision(this);
            if (this.collision) this.collision(player);
        }
    }
    render() {
        let x = this.x - this.width / 2;
        let y = this.y - this.height / 2;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.width, this.height);
        ctx.drawImage(this.texture, x, y, this.width, this.height);
        ctx.fillStyle = "lightcoral";
        ctx.fillRect(x, y - 10, this.width, 5);
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(x, y - 10, (this.width / this.maxHealth) * this.health, 5);
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.vx * 100, this.y + this.vy * 100);
        ctx.stroke();
    }
    collision(collider, damaging = false) {
        if (collider.damage && this.health > 0 && (collider instanceof bullet || damaging)) {
            this.health -= collider.damage;
        }
        if (this.health <= 0) {
            objectsToDelete.push({array: map.entities, object: this});
            map.ghosts.push(new xp(this.x, this.y, collider.parent, this.xpValue));
            if (player.lvl / player.itemSpawnRate >= player.inventory.length + numberOfSpawnedItems()) {
                //if (Math.random() < 1 / map.entities.length + 1.2) {
                spawnRandomItem(this.x, this.y);
                // }
            }
        }
        if (collider instanceof playerClass && performance.now() - this.lastAttack > this.attackCooldown) {
            collider.health -= this.damage;
            this.lastAttack = performance.now();
        }
    }
}
class bullet {
    constructor(parent, x, y, angle, speed = 10, mass = 1, damage = 5, color = "yellow", bulletSizeRatio = 1) {
        this.x = x;
        this.y = y;
        this.vx = (Math.cos(angle) * speed) / 10;
        this.vy = (Math.sin(angle) * speed) / 10;
        this.isColliding = false;
        this.angle = angle;
        this.speed = speed / 10;
        this.mass = mass;
        this.color = color;
        this.width = 15;
        this.height = 5;
        this.parent = parent;
        this.damage = damage;
        this.lifeTime = 5000;
        this.creationTime = Date.now();
        this.bulletSizeRatio = bulletSizeRatio;
        this.piercing = true;
    }
    update() {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        if (this.creationTime + this.lifeTime <= Date.now()) {
            objectsToDelete.push({array: map.projectiles, object: this});
        }
        let parent = this;
        for (let child of map.entities) {
            if (checkCollision(parent, child)) {
                parent.isColliding = true;
                child.isColliding = true;
                if (!parent.ignorePhysics && !child.ignorePhysics) {
                    let obj1 = parent;
                    let obj2 = child;
                    let vCollision = {x: obj2.x - obj1.x, y: obj2.y - obj1.y};
                    let distance = Math.sqrt((obj2.x - obj1.x) * (obj2.x - obj1.x) + (obj2.y - obj1.y) * (obj2.y - obj1.y));
                    let vCollisionNorm = {x: vCollision.x / distance, y: vCollision.y / distance};
                    let vRelativeVelocity = {x: obj1.vx - obj2.vx, y: obj1.vy - obj2.vy};
                    let speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;
                    if (speed < 0) {
                        break;
                    }
                    let impulse = (2 * speed) / (obj1.mass + obj2.mass);
                    obj1.vx -= impulse * obj2.mass * vCollisionNorm.x;
                    obj1.vy -= impulse * obj2.mass * vCollisionNorm.y;
                    obj2.vx += impulse * obj1.mass * vCollisionNorm.x;
                    obj2.vy += impulse * obj1.mass * vCollisionNorm.y;
                    if (parent.collision) parent.collision(child);
                    if (child.collision) child.collision(parent);
                }
            }
        }
    }
    render() {
        let x = this.x - this.width / 2;
        let y = this.y - this.height / 2;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 5 * this.bulletSizeRatio, 5 * this.bulletSizeRatio);
        ctx.beginPath();
        // ctx.strokeStyle = "white";
        // ctx.moveTo(this.x, this.y);
        // ctx.lineTo(this.x + this.vx * 150, this.y + this.vy * 150);
        // ctx.stroke();
    }
    collision() {
        objectsToDelete.push({array: map.projectiles, object: this});
    }
}
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

class bush {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
    }
    render() {
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x + 15, this.y + 10, this.width, this.height);
    }
}
class square {
    constructor(x, y, sx, sy, color = "green") {
        this.x = x;
        this.y = y;
        this.width = sx;
        this.height = sy;
        this.color = color;
    }
    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
class mapClass {
    constructor() {
        this.projectiles = [];
        this.entities = [];
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
        this.speed = 25;
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
            gamePaused = true;
            return;
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
        console.log("You died");
        this.dead = true;
    }
}
var player;
var camera;
var map;
var itemList = [];
function initItems() {
    itemList.push({
        name: "Force Field",
        description: "Creates Force field around the player",
        texture: textures.items.forcefield,
        rarity: 0.9,
        tickFunction: (itm) => {
            for (let element of map.entities) if (rectIntersect(itm.sup.x, itm.sup.y, itm.sup.width, itm.sup.height, element.x, element.y, element.width, element.height)) element.collision(itm.sup, true);
        },
        supremeInit: (itm) => {
            itm.sup.x = 0;
            itm.sup.y = 0;
            itm.sup.width = 75;
            itm.sup.height = 75;
            itm.sup.rotationAngle = 0;
            itm.sup.damage = 0.25;
            itm.sup.parent = itm.parent;
            itm.sup.maxUpgredes = 5;
        },
        supremeUpdate: (itm) => {
            itm.sup.x = itm.parent.x - itm.sup.width / 2;
            itm.sup.y = itm.parent.y - itm.sup.height / 2;
            itm.sup.rotationAngle += deltaTime / 100;
        },
        supremeRender: (itm) => {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.drawImage(itm.texture, itm.sup.x, itm.sup.y, itm.sup.width, itm.sup.height);
            ctx.restore();
        },
    });
    itemList.push({
        name: "Item OBAMY",
        description: "Creates OBAMA field dwa around the <b>BLACKEST</b> player",
        texture: textures.obamna,
        rarity: 0.2,
        tickFunction: (itm) => {
            console.log("OBAMAfield tick");
        },
        supremeInit: (itm) => {
            itm.sup.maxUpgredes = 3;
        },
        supremeUpdate: (itm) => {},
        supremeRender: (itm) => {},
    });
    itemList.push({
        name: "Neco Arc",
        description: `<b style="color: red;">Burenya</b>`,
        texture: textures.items.necoarc,
        rarity: 0.2,
        tickFunction: (itm) => {
            console.log(`%cBurenya`, `background: #222; color: #bada55`);
            if (player.gun.bulletSizeRatio != itm.sup.bulletSizeRatio) player.gun.bulletSizeRatio = itm.sup.bulletSizeRatio;
        },
        supremeInit: (itm) => {
            itm.parent.texture = textures.necoarc;
            itm.parent.speed = 30;
            itm.sup.bulletSizeRatio = 2;
            itm.sup.maxUpgredes = 1;
        },
        supremeUpdate: (itm) => {},
        supremeRender: (itm) => {},
    });
    itemList.push({
        name: "Turret",
        description: "Shoots at nearest enemy",
        texture: textures.lol,
        rarity: 0.9,
        tickFunction: (itm) => {
            console.log("SPERMAfield tick");
        },
        supremeInit: (itm) => {
            itm.sup.maxUpgredes = 5;
        },
        supremeUpdate: (itm) => {},
        supremeRender: (itm) => {},
    });
}
document.addEventListener("DOMContentLoaded", init);

function init() {
    canvas = document.getElementById("gamecanvas");
    canvas.width = 854;
    canvas.height = 480;
    ctx = canvas.getContext("2d");
    text("LOADING...", 200, 200, 50);

    addListeners();
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
    textures.map.tile1.src = "../img/map/tile1.png";
    for (let i = 0; i < Object.keys(textures.enemies).length; i++) textures.enemies["enemy" + i].src = `../img/enemies/enemy${i}.png`;
    console.log(textures);
    initItems();

    camera = new cameraClass();
    player = new playerClass(0, 0);
    camera.offsetX = canvas.width / 2;
    camera.offsetY = canvas.height / 2;
    map = new mapClass();
    // map.mapElements.push(new bush(100, 233));
    map.mapElements.push(new square(200, 200, 60, 60));
    map.entities.push(new enemy(100, 100, 30, 30));
    camera.x = player.x;
    camera.y = player.y;
    camera.lastX = camera.x;
    camera.lastY = camera.y;

    windowResize();
    text("LOADING...", 200, 200, 50);
    let numberOfXp = randomInt(11, 125);
    for (let indx = 0; indx < numberOfXp; indx++) map.ghosts.push(new xp(randomInt(-250, 250), randomInt(-250, 250), player, 1));
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
    for (let element of map.entities) {
        if (element.update) element.update();
        element.isColliding = false;
    }
    for (let element of map.projectiles) {
        if (element.update) element.update();
        element.isColliding = false;
    }
    player.isColliding = false;
    // update map elements
    for (let element of map.ghosts) if (element.update) element.update();

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

    // tick items
    let timenow = performance.now();
    if (lastTick + tickDelay < timenow) {
        for (let element of player.inventory) element.tickFunction(element);

        lastTick = performance.now();
    }

    // update items
    for (let element of player.inventory) element.update();

    // spawn enemies
    var enemies = Object.keys(map.entities).length;
    if (enemies < 25) {
        let random = Math.random();
        if (random < 0.3) spawnEnemy1(randomInt(-2000, 2000), randomInt(-2000, 2000));
        else if (random < 0.6) spawnEnemy2(randomInt(-2000, 2000), randomInt(-2000, 2000));
        else spawnEnemy3(randomInt(-2000, 2000), randomInt(-2000, 2000));
    }

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
    rednerMap();
    ctx.drawImage(textures.lol, -300, -300); // render background

    // render all object in map
    for (let element of map.mapElements) if (element.render) element.render();
    for (let element of map.ghosts) if (element.render && !element.collected) element.render();

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

    // death screen
    if (player.dead) {
        text("Zginąłeś", camera.x + canvas.width / 2, camera.y + canvas.height / 2 - 100, "red");
        text("Naciśnij F5 aby zacząć od nowa", camera.x + canvas.width / 2, camera.y + canvas.height / 2 - 80, "red");
    }
}
function rednerMap() {
    ctx.fillStyle = "black";
    for (let i = 0; i < mapSize; i++) {
        for (let j = 0; j < mapSize; j++) {
            let tilex = i * 0.9 * tileSize - tileSize / 2 - (mapSize * 0.9 * tileSize) / 2;
            let tiley = j * 0.9 * tileSize - tileSize / 2 - (mapSize * 0.9 * tileSize) / 2;
            // check if tile is on screen
            screenHitboxX = camera.x;
            screenHitboxY = -camera.y - canvas.height;
            tileWidth = tileSize * mapScale;
            tileHeigh = tileSize * mapScale;
            screenHitboxWidth = canvas.width + tileWidth;
            screenHitboxHeight = canvas.height + tileHeigh;

            if (!rectIntersect(tilex * mapScale, tiley * mapScale, tileWidth, tileHeigh, screenHitboxX, screenHitboxY, screenHitboxWidth, screenHitboxHeight)) continue;

            ctx.save();
            ctx.scale(mapScale, -mapScale);
            ctx.translate(tilex, tiley);
            ctx.rotate(degreesToRadians(getRandomFromSeed(0, 4, i * j) * 90));
            ctx.drawImage(textures.map.tile1, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
            ctx.restore();
        }
    }
}
function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}
function getRandomFromSeed(min, max, seed) {
    let x = Math.sin(seed) * 10000;
    return Math.round((x - Math.floor(x)) * (max - min) + min);
}
document.addEventListener(onkeydown, () => {}); // linijka dodana przez tomasza (ave maria) (działa)

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
    en.texture = textures.enemies["enemy1"];
    en.xpValue = 5;
    map.entities.push(en);
}
function spawnEnemy3(x, y) {
    let en = new enemy(x, y, 30, 30);
    en.maxHealth = 30;
    en.health = 30;
    en.speed = 0.15;
    en.color = "brown";
    en.texture = textures.enemies["enemy2"];
    en.xpValue = 10;
    map.entities.push(en);
}
