var canvas;
var ctx;

document.addEventListener("DOMContentLoaded", init);
function init() {
    addListeners();
    canvas = document.getElementById("gamecanvas");
    canvas.width = 640;
    canvas.height = 480;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
}
