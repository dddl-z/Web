class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, is_me) {
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0; // x 方向上的速度，既有方向也有长度
        this.vy = 0; // y 方向上的速度，既有方向也有长度
        this.move_length = 0; // 要移动的距离
        this.radius = radius;
        this.color = color;
        this.speed = speed; // 每秒钟移动 speed
        this.is_me = is_me;
        this.eps = 0.1; // 移动误差
    }

    start() {
        if (this.is_me) {
            this.add_listening_events();
        }
    }

    add_listening_events() { // 加一个监听函数，只能加给自己
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function() { // 使 playground 鼠标右键之后不出现菜单（return false）
            return false;
        });
        this.playground.game_map.$canvas.mousedown(function(e) { // 读取鼠标右键点击的坐标，并将 player 移动过去
            if (e.which === 3) { // e.which === 3 表示右键，e.which === 1 表示左键，e.which === 2 表示滚轮
                outer.move_to(e.clientX, e.clientY); // e.clientX 表示鼠标点击的横坐标，e.clientY 表示鼠标点击的纵坐标
            }
        });
    }

    get_dist(x1, y1, x2, y2) { // 获取当前坐标到目标坐标的欧几里德距离
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty) { // 移动 player，参数为目的坐标的横坐标和纵坐标
        this.move_length = this.get_dist(this.x, this.y, tx, ty); // 求出当前坐标到目标坐标的距离
        let angle = Math.atan2(ty - this.y, tx - this.x); // 求出当前坐标到目标坐标的角度，参数依次为：y 方向的偏移量，x 方向的偏移量
        this.vx = 1 * Math.cos(angle); // x 方向上的速度
        this.vy = 1 * Math.sin(angle); // y 方向上的速度
    }
z
    update() {
        if (this.move_length < this.eps) { // 小于误差时，不需要移动了
            this.move_length = 0;
            this.vx = this.vy = 0;
        }
        else {
            let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000); // 每两帧之间移动多少
            this.x += this.vx * moved; // x 方向上每两帧之间移动的距离
            this.y += this.vy * moved; // y 方向上每两帧之间移动的距离
            this.move_length -= moved; // 减去已经移动的距离
        }
        this.render();
    }

    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
