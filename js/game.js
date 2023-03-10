var canvas;
var ctx;
var keyPressed = [];
var textures = {
    obamna: new Image(20, 20),
};
var mouse = {
    x: 0,
    y: 0,
};
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
    }
}
class playerClass {
    constructor(x, y, baseTexture = textures.obamna) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.angle = 0;
        this.speed = 10;
        this.baseTexture = baseTexture;
    }
    draw() {
        let degreeAngle = this.angle * (180 / Math.PI);
        if (degreeAngle > 0) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-this.width - this.x + this.width / 2, 0 + this.y - this.height / 2);
            ctx.drawImage(this.baseTexture, 0, 0, this.width, this.height);

            ctx.restore();
        } else ctx.drawImage(this.baseTexture, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}
var player;
var camera;
var map;

document.addEventListener("DOMContentLoaded", init);
function init() {
    canvas = document.getElementById("gamecanvas");
    canvas.width = 640;
    canvas.height = 480;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    addListeners();
    // import images
    textures.obamna.src = "../img/obamna.jpg";
    player = new playerClass(canvas.width / 2, canvas.height / 2);
    camera = new cameraClass();
    map = new mapClass();
    map.mapElements.push(new bush(100, 233));
    map.mapElements.push(new square(200, 200, 60, 60));
    camera.x = player.x;
    camera.y = player.y;
    camera.lastX = camera.x;
    camera.lastY = camera.y;
    requestAnimationFrame(loop);
}
var lastLoop = 0;
var FPS = 0;
function loop() {
    FPS = 1000 / Date.now() - lastLoop;
    update();
    render();
    lastLoop = Date.now();
    requestAnimationFrame(loop);
}
function update() {
    let diagnal = false;
    if ((keyPressed.includes("w") && keyPressed.includes("a")) || (keyPressed.includes("w") && keyPressed.includes("d")) || (keyPressed.includes("s") && keyPressed.includes("a")) || (keyPressed.includes("s") && keyPressed.includes("d"))) diagnal = true;
    if (keyPressed.includes("w")) {
        player.y -= diagnal ? player.speed * 0.75 : player.speed;
    }
    if (keyPressed.includes("a")) {
        player.x -= diagnal ? player.speed * 0.75 : player.speed;
    }
    if (keyPressed.includes("s")) {
        player.y += diagnal ? player.speed * 0.75 : player.speed;
    }
    if (keyPressed.includes("d")) {
        player.x += diagnal ? player.speed * 0.75 : player.speed;
    }
    camera.x = player.x;
    camera.y = player.y;

    for (let element of map.entities) if (element.update) element.update();

    // calculate player angle based on mouse position
    let canvasPosisitons = canvas.getBoundingClientRect();
    let playerPosx = canvasPosisitons.x + canvas.width / 2;
    let playerPosy = canvasPosisitons.y + canvas.height / 2;
    let dis = Math.sqrt(Math.pow(playerPosx - mouse.x, 2) + Math.pow(playerPosy - mouse.y, 2));
    let sinOfAngleX = (playerPosy - mouse.y) / dis;
    player.angle = mouse.x > playerPosx ? Math.acos(sinOfAngleX) : -Math.acos(sinOfAngleX);
}
function render() {
    ctx.clearRect(camera.x - canvas.width / 2, camera.y - canvas.height / 2, canvas.width, canvas.height);
    if (camera.x != camera.lastX || camera.y != camera.lastY) {
        let cameraDeltaX = camera.x - camera.lastX;
        let cameraDeltaY = camera.y - camera.lastY;
        ctx.translate(-cameraDeltaX, -cameraDeltaY);
        camera.lastX = camera.x;
        camera.lastY = camera.y;
    }

    for (let element of map.mapElements) if (element.render) element.render();
    for (let element of map.entities) if (element.render) element.render();
    player.draw();
}
function addListeners() {
    var select = document.getElementById("resolution");
    select.addEventListener("change", (e) => {
        var value = e.target.value;
        if (value == "fullscreen") {
            canvas.requestFullscreen();
            canvas.width = window.screen.availWidth;
            canvas.height = window.screen.availHeight;
        } else {
            var width = value.split("x")[0];
            var height = value.split("x")[1];
            canvas.width = width;
            canvas.height = height;
        }
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    document.addEventListener("fullscreenchange", function () {
        var tmpElement = document.fullscreenElement;
        if (tmpElement == null) {
            select.value = "640x480";
            canvas.width = 640;
            canvas.height = 480;
            ctx.fillStyle = "red";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
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
}
