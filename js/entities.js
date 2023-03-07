export class playerEntity {
    constructor(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
    }
    draw() {
        var ctx = this.ctx;
        ctx.fillRect(x, y, 20, 20);
    }
}
