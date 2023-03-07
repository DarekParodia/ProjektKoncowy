var canvas;
var ctx;
var keyPressed = [];
class bush {}
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
        this.z = 0;
        this.localX = 0;
        this.localY = 0;
        this.localZ = 0;
    }
}
class playerClass {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 5;
    }
    draw() {
        ctx.fillStyle = "aqua";
        ctx.fillRect(this.x, this.y, 20, 20);
    }
}
var player;
var camera;
var map;

document.addEventListener("DOMContentLoaded", init);
function init() {
    addListeners();
    canvas = document.getElementById("gamecanvas");
    canvas.width = 640;
    canvas.height = 480;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player = new playerClass(canvas.width / 2, canvas.height / 2);
    camera = new cameraClass();
    map = new mapClass();
    map.mapElements.push();
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
    if (keyPressed.includes("w")) player.y -= player.speed;
    if (keyPressed.includes("a")) player.x -= player.speed;
    if (keyPressed.includes("s")) player.y += player.speed;
    if (keyPressed.includes("d")) player.x += player.speed;
    camera.x = player.x;
    camera.y = player.y;
    camera.z = player.z;

    for (let element of map.entities) if (element.update) element.render();
}
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        var key = e.key;
        if (!keyPressed.includes(key)) keyPressed.push(key);
        console.log(keyPressed);
    });
    window.addEventListener("keyup", (e) => {
        var key = e.key;
        if (keyPressed.includes(key)) keyPressed.splice(keyPressed.indexOf(key), 1);
        console.log(keyPressed);
    });
}
