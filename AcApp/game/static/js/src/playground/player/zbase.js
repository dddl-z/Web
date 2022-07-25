class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, is_me) {
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0; // x 方向上的速度，既有方向也有长度
        this.vy = 0; // y 方向上的速度，既有方向也有长度
        this.damage_x = 0; // 当该 player 被击中时，向射击的方向推移一段距离的速度
        this.damage_y = 0;
        this.damage_speed = 0; // 和距离
        this.move_length = 0; // 要移动的距离
        this.radius = radius;
        this.color = color;
        this.speed = speed; // 每秒钟移动 speed
        this.is_me = is_me;

        this.eps = 0.1; // 移动误差
        this.friction = 0.9; // 摩擦力，在 player 被击中后推移的过程中速度由快变慢，即有摩擦力在作用

        this.cur_skill = null; // 当前选择的技能是什么
        this.spent_time = 0; // 倒计时无敌时间
    }

    start() {
        if (this.is_me) {
            this.add_listening_events();
        }
        else {
            let tx = Math.random() * this.playground.width;
            let ty = Math.random() * this.playground.height;
            this.move_to(tx, ty);
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
            else if (e.which === 1) {
                if (outer.cur_skill === "fireball") {
                    outer.shoot_fireball(e.clientX, e.clientY);
                }

                outer.cur_skill = null;
            }
        });

        $(window).keydown(function(e) {
            if (e.which === 81) { // Q 按键的 keycode
                outer.cur_skill = "fireball";
                return false; // 表示后续不处理
            }
        });
    }

    shoot_fireball(tx, ty) { // 施放火球，参数为火球发射的方向
        let x = this.x, y = this.y;
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = 1 * Math.cos(angle);
        let vy = 1 * Math.sin(angle);
        let color = "orange";
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height * 1;
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, this.playground.height * 0.01);
    }

    get_dist(x1, y1, x2, y2) { // 获取当前坐标到目标坐标的欧几里德距离
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty) { // 移动 player，参数为目的坐标的横坐标和纵坐标
        this.move_length = this.get_dist(this.x, this.y, tx, ty); // 求出当前坐标到目标坐标的距离
        let angle = Math.atan2(ty - this.y, tx - this.x); // 求出当前坐标到目标坐标的角度，参数依次为：y 方向的偏移量，x 方向的偏移量
        this.vx = 1 * Math.cos(angle); // x 方向上的速度, 实际上就是方向
        this.vy = 1 * Math.sin(angle); // y 方向上的速度
    }

    is_attacked(angle, damage) { // 被攻击，参数依次为：被击中的方向，伤害值
        for (let i = 0; i < 20 * Math.random() * 10; i ++) {
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random() * 0.1;
            let angle = Math.PI * 2 * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 10;
            let move_length = this.radius * Math.random() * 5;
            new Particle(this.playground, x, y, radius, vx, vy, color, speed, move_length);
        }

        this.radius -= damage; // 半径就是血量
        if (this.radius < 10) {
            this.destroy();
            return false;
        }

        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;
    }

    update() {
        this.spent_time += this.timedelta / 1000;
        if (!this.is_me && this.spent_time > 4 && Math.random() < 1 / 300.0) {
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            this.shoot_fireball(player.x, player.y);
        }

        if (this.damage_speed > 10) { // 当被碰撞了
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.friction; // 摩擦力作用
        }
        else {
            if (this.move_length < this.eps) { // 小于误差时，不需要移动了
                this.move_length = 0;
                this.vx = this.vy = 0;

                if (!this.is_me) {
                    let tx = Math.random() * this.playground.width;
                    let ty = Math.random() * this.playground.height;
                    this.move_to(tx, ty);
                }
            }
            else {
                let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000); // 每两帧之间移动多少
                this.x += this.vx * moved; // x 方向上每两帧之间移动的距离，方向乘以距离
                this.y += this.vy * moved; // y 方向上每两帧之间移动的距离
                this.move_length -= moved; // 减去已经移动的距离
            }
        }
        this.render();
    }

    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    on_destroy() {
        for (let i = 0; i < this.playground.players.length; i ++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
            }
        }
    }
}
