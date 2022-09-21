class GameMap extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $(`<canvas tabindex=0></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start() {
        this.$canvas.focus(); // 聚焦
    }

    resize() { // 动态修改地图的大小
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)"; // 每次刷新一个半透明的板子
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    }

    update() {
        this.render();
    }

    render() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; // 每次刷新一个半透明的板子
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    }
}
