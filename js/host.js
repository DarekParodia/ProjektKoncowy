const express = require("express");
module.exports = {
    host: class {
        constructor(port) {
            this.app = express();
            this.port = port;
            this.app.get("*", (req, res) => {
                res.send("This is game host. You should not be here. Redirecting to main page... If not working try changing port to 80.");
                res.redirect("https:80//" + req.headers.host + req.url);
            });
            this.app.post("/ping", (req, res) => {
                let data = req.body;
                res.send("pong");
            });
            this.app.post("/gamepocket", (req, res) => {
                let data = req.body;
                res.send("gamepocket");
            });
            this.app.listen(this.port, () => {
                console.log(`Game host running at: ${this.port}`);
            });
        }
    },
};
