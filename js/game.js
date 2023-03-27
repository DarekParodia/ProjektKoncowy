var canvas;
var ctx;
var keyPressed = [];
var textures = {
    obamna: new Image(20, 20),
    smutnyobama: new Image(20, 20),
};
var oldResX = 0;
var oldResY = 0;
var resDiffX = 0;
var resDiffY = 0;
var deltaTime = 0;
var isMouseDown = false;
var mouse = {
    x: 0,
    y: 0,
};
var objectsToDelete = [];
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
        console.log("xp spawned at: ", x, y);
    }
    update() {
        if (dystans(this.x, this.y, this.owner.x, this.owner.y) < this.minDistance) this.following = true;
        if (this.following) {
            if (checkCollision(this, this.owner)) {
                this.owner.xp += this.xpValue;
                map.ghosts.splice(map.ghosts.indexOf(this), 1);
                console.log("xp collected at: ", this.x, this.y);
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
        this.angle = 0;
        this.mass = 50;
        this.vx = 0;
        this.vy = 0;
        this.health = 100;
        this.maxHealth = 100;
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
    }
    render() {
        let x = this.x - this.width / 2;
        let y = this.y - this.height / 2;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.width, this.height);
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
    collision(collider) {
        if (collider.damage && this.health > 0 && collider instanceof bullet) this.health -= collider.damage;
        if (this.health <= 0) {
            objectsToDelete.push({array: map.entities, object: this});
            map.ghosts.push(new xp(this.x, this.y, collider.parent, this.xpValue));
        }
        console.log(this.health);
        if (collider instanceof playerClass && performance.now() - this.lastAttack > this.attackCooldown) {
            collider.health -= this.damage;
            this.lastAttack = performance.now();
            console.log("attack");
        }
    }
}
class bullet {
    constructor(parent, x, y, angle, speed = 10, mass = 1, damage = 5, color = "yellow") {
        this.x = x;
        this.y = y;
        this.vx = (Math.cos(angle) * speed) / 10;
        this.vy = (Math.sin(angle) * speed) / 10;
        this.isColliding = false;
        this.angle = angle;
        this.speed = speed / 10;
        this.mass = mass;
        this.color = color;
        this.width = 5;
        this.height = 5;
        this.parent = parent;
        this.damage = damage;
        this.lifeTime = 5000;
        this.creationTime = Date.now();
    }
    update() {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        if (this.creationTime + this.lifeTime <= Date.now()) {
            objectsToDelete.push({array: map.projectiles, object: this});
            console.log("time limit reached");
        }
    }
    render() {
        let x = this.x - this.width / 2;
        let y = this.y - this.height / 2;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 5, 5);
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
    let hitboxX = parent.width > element.width ? parent.width / 2 : element.width / 2;
    return Math.abs(parent.x + parent.width / 2 - (element.x + element.width / 2)) < hitboxX;
}
function checkCollisionY(parent, element) {
    let hitboxY = parent.height > element.height ? parent.height / 2 : element.height / 2;
    return Math.abs(parent.y + parent.height / 2 - (element.y + element.height / 2)) < hitboxY;
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
        this.lastShot = 0;
        this.damage = 5;
        this.parent = parent;
        this.projectileMass = 0.2;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.reloadingTime = 2000;
    }
    render() {
        ctx.save();
        ctx.fillStyle = "red";
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(20, -5, this.width, this.height);
        ctx.restore();
    }
    update() {
        if (keyPressed.includes("r") && !this.isReloading && this.ammo < this.maxAmmo) {
            this.isReloading = true;
            this.lastReload = performance.now();
        }
        if (performance.now() - this.lastReload > this.reloadingTime && this.isReloading) {
            this.ammo = this.maxAmmo;
            this.isReloading = false;
        }
    }
    shoot() {
        if (this.ammo > 0 && !this.isReloading) {
            this.lastShot = performance.now();
            this.ammo--;
            shootProjectile(this.x, this.y, this.angle, this.velocity, this.projectileMass, this.parent, this.damage);
            console.log(this);
        }
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
        this.speed = 30;
        this.health = 100;
        this.maxHealth = 100;
        this.xp = 0;
        this.xpToNextLevel = 10;
        this.baseTexture = baseTexture;
        this.weapons = {
            pistol: new rifle(this),
            rifle: new rifle(this),
        };
        this.weapons.pistol.damage = 10;
        this.weapons.pistol.velocity = 5;
        this.weapons.pistol.shotspeed = 600;
        this.weapons.pistol.projectileMass = 1.2;
        this.weapons.pistol.ammo = 8;
        this.weapons.pistol.maxAmmo = 8;
        this.weapons.pistol.reloadingTime = 1000;

        this.gun = this.weapons.rifle;
        this.isColliding = false;
    }
    update() {
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
        if (this.isColliding) this.baseTexture = textures.smutnyobama;
        else this.baseTexture = textures.obamna;
    }
    draw() {
        let degreeAngle = this.angle * (180 / Math.PI);
        if (degreeAngle > -90 && degreeAngle < 90) {
            // draw player
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-this.width - this.x + this.width / 2, 0 + this.y - this.height / 2);
            ctx.drawImage(this.baseTexture, 0, 0, this.width, this.height);
            ctx.restore();
        } else ctx.drawImage(this.baseTexture, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        // draw gun
        this.gun.x = this.x;
        this.gun.y = this.y;
        this.gun.angle = this.angle;
        this.gun.render();
    }
}
var player;
var camera;
var map;

document.addEventListener("DOMContentLoaded", init);

function init() {
    canvas = document.getElementById("gamecanvas");
    canvas.width = 854;
    canvas.height = 480;
    ctx = canvas.getContext("2d");

    addListeners();
    // import images
    textures.obamna.src = "../img/obamna.jpg";
    textures.smutnyobama.src = "../img/obamasmutny.jpg";
    player = new playerClass(0, 0);
    camera = new cameraClass();
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
    requestAnimationFrame(loop);
}
var lastLoop = 0;
var lastd = performance.now();
var FPS = 0;
function loop() {
    deltaTime = Date.now() - lastLoop;
    FPS = 1000 / deltaTime;
    lastLoop = Date.now();
    update();
    render();
    // console.log(map.entities[0].collidingFrom);
    requestAnimationFrame(loop);
}
function update() {
    // update map elements
    for (let element of map.ghosts) if (element.update) element.update();

    if (keyPressed.includes("1")) player.gun = player.weapons.pistol;
    else if (keyPressed.includes("2")) player.gun = player.weapons.rifle;

    // calculate player angle based on mouse position
    let canvasPosisitons = canvas.getBoundingClientRect();
    let playerPosx = canvasPosisitons.x + canvas.width / 2;
    let playerPosy = canvasPosisitons.y + canvas.height / 2;
    player.angle = Math.atan2(mouse.y - playerPosy, mouse.x - playerPosx);

    // shoot wepons
    if (isMouseDown && performance.now() - player.gun.lastShot >= player.gun.shotspeed) {
        player.gun.shoot();
    }
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
    let mapEntitiesLenght = Object.keys(map.entities).length;
    let projectilesLenght = Object.keys(map.projectiles).length;
    for (let i = 0; i < mapEntitiesLenght; i++) {
        let parent = map.entities[i];
        for (let j = i; j < projectilesLenght; j++) {
            let child = map.projectiles[j];
            if (checkCollision(parent, child)) {
                console.log("Collision");
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
        let child = player;
        if (checkCollision(parent, child)) {
            console.log("Collision To Player");
            parent.isColliding = true;
            child.isColliding = true;
            if (parent.collision) parent.collision(child);
            if (child.collision) child.collision(parent);
        }
    }
    objectsToDelete.forEach((element) => {
        try {
            element.array.splice(element.array.indexOf(element.object), 1);
        } catch (e) {}
    });
    objectsToDelete = [];
    // update player
    player.update();
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
    player.draw(); // render player
    // render all object in map
    for (let element of map.mapElements) if (element.render) element.render();
    for (let element of map.entities) if (element.render) element.render();
    for (let element of map.projectiles) if (element.render) element.render();
    for (let element of map.ghosts) if (element.render) element.render();

    renderHud(); // render hud
}
function renderHud() {
    text("FPS: " + Math.round(FPS * 100) / 100, camera.x + 10, camera.y + 25);
    text("DeltaTime: " + Math.round(deltaTime * 100) / 100 + "ms", camera.x + 10, camera.y + 45);
    text("Player HP: " + player.health, camera.x + 10, camera.y + 65);
    text("Player XP: " + player.xp, camera.x + 10, camera.y + 85);

    // player health
    ctx.fillStyle = "lightcoral";
    ctx.fillRect(camera.x, camera.y + canvas.height - 20, canvas.width * 0.3, 15);
    ctx.fillStyle = "lightgreen";
    ctx.fillRect(camera.x, camera.y + canvas.height - 20, ((canvas.width * 0.3) / player.maxHealth) * player.health, 15);
    text(player.health + " / " + player.maxHealth, camera.x, camera.y + canvas.height - 25);

    // player ammo
    ctx.fillStyle = "yellow";
    let tempxa = ((canvas.height * 0.3) / player.gun.maxAmmo) * player.gun.ammo;
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
    text(xp + " / " + xpToNextLevel, camera.x + canvas.width / 2, camera.y + 35);
}
function getTextWidth(text) {
    return text.length * 10;
}
function addListeners() {
    window.addEventListener("keydown", (e) => {
        var key = e.key.toLowerCase();
        if (!keyPressed.includes(key)) keyPressed.push(key);
        console.log(keyPressed);
        if (key == "q") spawnEnemy1(randomInt(-1000, 1000), randomInt(-1000, 1000));
        if (key == "e") spawnEnemy2(randomInt(-1000, 1000), randomInt(-1000, 1000));
    });
    window.addEventListener("keyup", (e) => {
        var key = e.key.toLowerCase();
        if (keyPressed.includes(key)) keyPressed.splice(keyPressed.indexOf(key), 1);
        console.log(keyPressed);
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
}
function text(text, x, y, size = 20, color = "white") {
    let tmp = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.font = size + "px Arial";
    ctx.fillText(text, x, y);
    ctx.fillStyle = tmp;
}
function shootProjectile(x, y, angle, velocity, mass, parent, damage) {
    let bulet = new bullet(parent, x + Math.cos(angle) * 24 - 2, y + Math.sin(angle) * 24 - 2, angle, velocity, mass, damage);
    map.projectiles.push(bulet);
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function dystans(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function spawnEnemy1(x, y) {
    map.entities.push(new enemy(x, y, 30, 30));
}
function spawnEnemy2(x, y) {
    let en = new enemy(x, y, 30, 30);
    en.maxHealth = 150;
    en.health = 150;
    en.speed = 1;
    en.color = "blue";
    en.xpValue = 5;
    map.entities.push(en);
}
