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
class bullet {
    constructor(x, y, angle, speed = 10, color = "red") {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.color = color;
        this.width = 5;
        this.height = 5;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
    }
    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 5, 5);
    }
}
class pistol {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 10;
        this.angle = 0;
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
        let bulet = new bullet(this.x + Math.cos(this.angle) * 24 - 2, this.y + Math.sin(this.angle) * 24 - 2, this.angle);
        map.projectiles.push(bulet);
    }
}
class rifle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 10;
        this.angle = 0;
    }
    render() {
        ctx.save();
        ctx.fillStyle = "magenta";
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(20, -5, 10, 10);
        ctx.restore();
    }
}

class bush {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    render() {
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y, 25, 25);
        ctx.fillRect(this.x + 15, this.y + 10, 20, 20);
    }
}
class square {
    constructor(x, y, sx, sy, color = "green") {
        this.x = x;
        this.y = y;
        this.sx = sx;
        this.sy = sy;
        this.color = color;
    }
    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.sx, this.sy);
    }
}
class mapClass {
    constructor() {
        this.projectiles = [];
        this.entities = [];
        this.mapElements = [];
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
        this.baseTexture = baseTexture;
        this.gun = new pistol();
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
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    addListeners();
    // import images
    textures.obamna.src = "../img/obamna.jpg";
    player = new playerClass(0, 0);
    camera = new cameraClass();
    camera.offsetX = canvas.width / 2;
    camera.offsetY = canvas.height / 2;
    map = new mapClass();
    map.mapElements.push(new bush(100, 233));
    map.mapElements.push(new square(200, 200, 60, 60));
    camera.x = player.x;
    camera.y = player.y;
    camera.lastX = camera.x;
    camera.lastY = camera.y;
    oldResX = canvas.width;
    oldResY = canvas.height;
    requestAnimationFrame(loop);
}
var lastLoop = 0;
var FPS = 0;
function loop() {
    deltaTime = performance.now() / 100 - lastLoop;
    FPS = 10 / deltaTime;
    console.log(FPS);
    update();
    render();
    lastLoop = performance.now() / 100;
    requestAnimationFrame(loop);
}
function update() {
    // update player
    player.update();
    // update map elements
    for (let element of map.entities) if (element.update) element.update();
    for (let element of map.projectiles) if (element.update) element.update();

    // calculate player angle based on mouse position
    let canvasPosisitons = canvas.getBoundingClientRect();
    let playerPosx = canvasPosisitons.x + canvas.width / 2;
    let playerPosy = canvasPosisitons.y + canvas.height / 2;
    player.angle = Math.atan2(mouse.y - playerPosy, mouse.x - playerPosx);
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
    player.draw(); // render player
    renderHud(); // render hud
}
function renderHud() {}
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
        if (e.button == 0) {
            player.gun.shoot();
        }
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
