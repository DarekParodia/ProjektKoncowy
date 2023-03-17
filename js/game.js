var canvas;
var ctx;
var keyPressed = [];
var textures = {
    obamna: new Image(20, 20),
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
class xp {
    constructor(x, y, owner, value = 1) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 5;
        this.color = "green";
        this.acceleration = 0.15;
        this.velocity = 1;
        this.owner = owner;
        this.bornTime = performance.now();
        this.xpValue = value;
        this.minDistance = 100;
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
    constructor(x, y, width, height, speed = 5, damage = 5, color = "red") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.angle = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.xpValue = 1;
    }
    update() {
        this.angle = Math.atan2(player.y - this.y, player.x - this.x);
        for (let ap = 0; ap < deltaTime * 100; ap++) {
            let isCollidingX = false;
            let isCollidingY = false;
            for (const element of map.entities) {
                if (element != this) {
                    if (checkCollision(this, element)) {
                        if (checkCollisionX(this, element)) {
                            isCollidingX = true;
                        }
                        if (checkCollisionY(this, element)) {
                            isCollidingY = true;
                        }
                    }
                }
            }
            if (!isCollidingX) this.x += (Math.cos(this.angle) * this.speed) / 100;
            if (!isCollidingY) this.y += (Math.sin(this.angle) * this.speed) / 100;
        }
    }
    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "lightcoral";
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(this.x, this.y - 10, (this.width / this.maxHealth) * this.health, 5);
    }
    collision(collider) {
        if (collider.damage && this.health > 0) this.health -= collider.damage;
        if (this.health <= 0) {
            map.entities.splice(map.entities.indexOf(this), 1);
            map.ghosts.push(new xp(this.x, this.y, collider.parent, this.xpValue));
        }
        console.log(this.health);
    }
}
class bullet {
    constructor(parent, x, y, angle, speed = 10, damage = 5, color = "yellow") {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.color = color;
        this.width = 5;
        this.height = 5;
        this.parent = parent;
        this.damage = damage;
    }
    update() {
        for (let ap = 0; ap < deltaTime * 100; ap++) {
            this.x += (Math.cos(this.angle) * this.speed) / 100;
            this.y += (Math.sin(this.angle) * this.speed) / 100;
            for (let element of map.entities) {
                if (checkCollision(this, element)) {
                    if (element.collision) element.collision(this);
                    map.projectiles.splice(map.projectiles.indexOf(this), 1);
                    return;
                }
            }
        }
    }
    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 5, 5);
    }
}
function checkCollision(parent, element) {
    let hitboxX = parent.width > element.width ? parent.width / 2 : element.width / 2;
    let hitboxY = parent.height > element.height ? parent.height / 2 : element.height / 2;
    return Math.abs(parent.x + parent.width / 2 - (element.x + element.width / 2)) < hitboxX && Math.abs(parent.y + parent.height / 2 - (element.y + element.height / 2)) < hitboxY;
}
function checkCollisionX(parent, element) {
    let hitboxX = parent.width > element.width ? parent.width / 2 : element.width / 2;
    return Math.abs(parent.x + parent.width / 2 - (element.x + element.width / 2)) < hitboxX;
}
function checkCollisionY(parent, element) {
    let hitboxY = parent.height > element.height ? parent.height / 2 : element.height / 2;
    return Math.abs(parent.y + parent.height / 2 - (element.y + element.height / 2)) < hitboxY;
}
class pistol {
    constructor(parent) {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 10;
        this.angle = 0;
        this.velocity = 50;
        this.shotspeed = 500;
        this.lastShot = 0;
        this.damage = 15;
        this.parent = parent;
        this.range = 300;
    }
    render() {
        ctx.save();
        ctx.fillStyle = "magenta";
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(20, -5, 10, 10);
        ctx.restore();
    }
    update() {}
    shoot() {
        this.lastShot = performance.now();
        shootProjectile(this.x, this.y, this.angle, this.velocity, this.parent, this.damage);
    }
}
class rifle {
    constructor(parent) {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 10;
        this.angle = 0;
        this.velocity = 130;
        this.shotspeed = 190;
        this.lastShot = 0;
        this.damage = 5;
        this.parent = parent;
    }
    render() {
        ctx.save();
        ctx.fillStyle = "red";
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(20, -5, 20, 10);
        ctx.restore();
    }
    update() {}
    shoot() {
        this.lastShot = performance.now();
        shootProjectile(this.x, this.y, this.angle, this.velocity, this.parent, this.damage);
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
        this.baseTexture = baseTexture;
        this.weapons = {
            pistol: new pistol(this),
            rifle: new rifle(this),
        };
        this.gun = this.weapons.rifle;
    }
    update() {
        let diagnal = false;
        if ((keyPressed.includes("w") && keyPressed.includes("a")) || (keyPressed.includes("w") && keyPressed.includes("d")) || (keyPressed.includes("s") && keyPressed.includes("a")) || (keyPressed.includes("s") && keyPressed.includes("d"))) diagnal = true;
        if (keyPressed.includes("w")) {
            this.y -= diagnal ? this.speed * 0.75 * deltaTime : this.speed * deltaTime;
        }
        if (keyPressed.includes("a")) {
            this.x -= diagnal ? this.speed * 0.75 * deltaTime : this.speed * deltaTime;
        }
        if (keyPressed.includes("s")) {
            this.y += diagnal ? this.speed * 0.75 * deltaTime : this.speed * deltaTime;
        }
        if (keyPressed.includes("d")) {
            this.x += diagnal ? this.speed * 0.75 * deltaTime : this.speed * deltaTime;
        }
        camera.x = this.x - camera.offsetX + resDiffX;
        camera.y = this.y - camera.offsetY + resDiffY;
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
    oldResX = canvas.width;
    oldResY = canvas.height;
    requestAnimationFrame(loop);
}
var lastLoop = 0;
var lastd = performance.now();
var FPS = 0;
function loop() {
    deltaTime = performance.now() - lastLoop;
    FPS = 1000 / deltaTime;
    deltaTime = deltaTime / 100;
    // if (performance.now() - lastd > 100) {
    update();
    lastd = performance.now();
    // }
    render();

    lastLoop = performance.now();
    requestAnimationFrame(loop);
}
function update() {
    // update player
    player.update();
    // update map elements
    for (let element of map.entities) if (element.update) element.update();
    for (let element of map.projectiles) if (element.update) element.update();
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
}
function render() {
    ctx.clearRect(camera.x, camera.y, canvas.width, canvas.height); // clear screen
    if (camera.x != camera.lastX || camera.y != camera.lastY) {
        // move camera
        let cameraDeltaX = camera.x - camera.lastX;
        let cameraDeltaY = camera.y - camera.lastY;
        ctx.translate(-cameraDeltaX, -cameraDeltaY);
        camera.lastX = camera.x;
        camera.lastY = camera.y;
    }
    // render all object in map
    for (let element of map.mapElements) if (element.render) element.render();
    for (let element of map.entities) if (element.render) element.render();
    for (let element of map.projectiles) if (element.render) element.render();
    for (let element of map.ghosts) if (element.render) element.render();
    player.draw(); // render player
    renderHud(); // render hud
}
function renderHud() {
    text("FPS: " + Math.round(FPS * 100) / 100, camera.x + 10, camera.y + 25);
    text("DeltaTime: " + Math.round(deltaTime * 10000) / 100 + "ms", camera.x + 10, camera.y + 45);
    text("Player HP: " + player.health, camera.x + 10, camera.y + 65);
    text("Player XP: " + player.xp, camera.x + 10, camera.y + 85);
}
function addListeners() {
    var select = document.getElementById("resolution");
    select.addEventListener("change", (e) => {
        var value = e.target.value;
        var width = value.split("x")[0];
        var height = value.split("x")[1];
        canvas.width = width;
        canvas.height = height;
        onCanvasChange();
    });
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
}
function onCanvasChange() {
    ctx.translate(-camera.x, -camera.y);
    resDiffX = (864 - canvas.width) / 2;
    resDiffY = (480 - canvas.height) / 2;
    oldResX = canvas.width;
    oldResY = canvas.height;
}
function text(text, x, y, color = "white", size = 20) {
    let tmp = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.font = size + "px Arial";
    ctx.fillText(text, x, y);
    ctx.fillStyle = tmp;
}
function shootProjectile(x, y, angle, velocity, parent, damage) {
    let bulet = new bullet(parent, x + Math.cos(angle) * 24 - 2, y + Math.sin(angle) * 24 - 2, angle, velocity, damage);
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
