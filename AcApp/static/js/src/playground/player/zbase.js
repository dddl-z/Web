class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, character, username, photo) {
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
        this.character = character; // 区分己方，Bot，敌人
        this.username = username;
        this.photo = photo;

        this.eps = 0.01; // 移动误差
        this.friction = 0.9; // 摩擦力，在 player 被击中后推移的过程中速度由快变慢，即有摩擦力在作用

        this.cur_skill = null; // 当前选择的技能是什么
        this.spent_time = 0; // 倒计时无敌时间

        this.fireballs = []; // 因为未来子弹是会消失的，所以先将发射的子弹都存下来

        if (this.character !== "robot") {
            this.img = new Image();
            this.img.src = this.photo;
        }

        if (this.character === "me") { // 只能看到自己的cd
            this.fireball_coldtime = 3; // 冷却时间，单位秒
            this.fireball_img = new Image(); // 图片显示技能cd是否转好
            this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";

            this.blink_coldtime = 5; // 闪现技能冷却时间
            this.blink_img = new Image(); // 闪现图片
            this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }

    start() {
        this.playground.player_count ++; // 每次创建一名玩家就更新playground里的人数
        this.playground.notice_board.write("已就绪：" + this.playground.player_count + "人"); // 更新提示板

        if (this.playground.player_count >= 3) { // 如果房间人数满了，开始战斗
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting");
        }

        if (this.character === "me") {
            this.add_listening_events();
        }
        else if (this.character === "robot") { // 只有机器人才会初始动一下
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
            this.move_to(tx, ty);
        }
    }

    add_listening_events() { // 加一个监听函数，只能加给自己
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function() { // 使 playground 鼠标右键之后不出现菜单（return false）
            return false;
        });
        this.playground.game_map.$canvas.mousedown(function(e) { // 读取鼠标右键点击的坐标，并将 player 移动过去
            if (outer.playground.state !== "fighting")
                return false;

            const rect = outer.ctx.canvas.getBoundingClientRect(); // 获取画布在整个屏幕的位置

            if (e.which === 3) { // e.which === 3 表示右键，e.which === 1 表示左键，e.which === 2 表示滚轮
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                outer.move_to(tx, ty); // e.clientX 表示鼠标点击的横坐标，e.clientY 表示鼠标点击的纵坐标

                if (outer.playground.mode === "multi mode") { // 如果是多人模式，则移动的同时，需要将信息发送给后端，然后后端再广播给其他玩家
                    outer.playground.mps.send_move_to(tx, ty);
                }
            }
            else if (e.which === 1) {
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                if (outer.cur_skill === "fireball") { // 发射火球技能
                    if (outer.fireball_coldtime > outer.eps) // 技能尚未冷却完成
                        return false;

                    let fireball = outer.shoot_fireball(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_shoot_fireball(tx, ty, fireball.uuid);
                    }
                } else if (outer.cur_skill === "blink") { // 闪现技能
                    if (outer.blink_coldtime > outer.eps) // 闪现技能尚未冷却
                        return false;

                    outer.blink(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_blink(tx, ty);
                    }
                }

                outer.cur_skill = null;
            }
        });

        $(window).keydown(function(e) {
            if (outer.playground.state !== "fighting")
                return true; // 不让按键失效

            if (e.which === 81) { // Q 按键的 keycode
                if (outer.fireball_coldtime > outer.eps) // 技能尚未冷却好，不能放技能
                    return true;

                outer.cur_skill = "fireball";
                return false; // 表示后续不处理
            } else if (e.which === 70) { // F 按键的keycode
                if (outer.blink_coldtime > outer.eps)
                    return true;

                outer.cur_skill = "blink";
                return false;
            }
        });
    }

    shoot_fireball(tx, ty) { // 施放火球，参数为火球发射的方向
        let x = this.x, y = this.y;
        let radius = 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = 1 * Math.cos(angle);
        let vy = 1 * Math.sin(angle);
        let color = "orange";
        let speed = 0.5;
        let move_length = 1;
        let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, 0.01);
        this.fireballs.push(fireball); // 将自己发射的子弹存下来

        this.fireball_coldtime = 3; // 释放完技能之后重置cd

        return fireball; // 由于要获取子弹的uuid，所以将其返回
    }

    destroy_fireball(uuid) { // 通过uuid删除火球
        for (let i = 0; i < this.fireballs.length; i ++) {
            let fireball = this.fireballs[i];
            if (fireball.uuid === uuid) {
                fireball.destroy();
                break;
            }
        }
    }

    blink(tx, ty) { // 闪现
        let d = this.get_dist(this.x, this.y, tx, ty); // 求距离
        d = Math.min(d, 0.8); // 闪现的最大距离
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(angle);
        this.y += d * Math.sin(angle);

        this.blink_coldtime = 5;

        this.move_length = 0; // 闪现之后停下来
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
        if (this.radius < this.eps) {
            this.destroy();
            return false;
        }

        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;
    }

    receive_attack(x, y, angle, damage, ball_uuid, attacker) { // 接收到被攻击的信息
        attacker.destroy_fireball(ball_uuid);
        this.x = x;
        this.y = y;
        this.is_attacked(angle, damage);
    }

    update() {
        this.spent_time += this.timedelta / 1000;

        if (this.character === "me" && this.playground.state === "fighting") { // 如果是自己且对局没有结束，才会有冷却时间
            this.update_coldtime();
        }

        this.update_move();

        this.render();
    }

    update_coldtime() { // 更新冷却时间
        this.fireball_coldtime -= this.timedelta / 1000;
        this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);

        this.blink_coldtime -= this.timedelta / 1000;
        this.blink_coldtime = Math.max(this.blink_coldtime, 0);
    }

    update_move() { // 更新移动
        if (this.character === "robot" && this.spent_time > 4 && Math.random() < 1 / 300.0) {
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            this.shoot_fireball(player.x, player.y);
        }

        if (this.damage_speed > this.eps) { // 当被碰撞了
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

                if (this.character === "robot") {
                    let tx = Math.random() * this.playground.width / this.playground.scale;
                    let ty = Math.random() * this.playground.height / this.playground.scale;
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
    }

    render() {
        let scale = this.playground.scale; // 染色需要绝对值
        if (this.character !== "robot") {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if (this.character === "me" && this.playground.state === "fighting") { // 只会在对局未结束的时候，渲染自己的技能cd
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime() { // 渲染冷却时间
        let scale = this.playground.scale; // 染色需要绝对值
        let x = 1.5, y = 0.9, r = 0.04; // 渲染的位置和半径

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        // cd显示圈
        if (this.fireball_coldtime > this.eps) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale); // 从圆心开始画
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 3) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale); // 画完之后移到圆心
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }

        // 渲染闪现指示圈
        x = 1.62, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        // cd显示圈
        if (this.blink_coldtime > this.eps) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale); // 从圆心开始画
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 5) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale); // 画完之后移到圆心
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }
    }

    on_destroy() {
        if (this.character == "me")
            this.playground.state = "over"; // 去世之后当前玩家的游戏结束，不能进行操作

        for (let i = 0; i < this.playground.players.length; i ++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
                break;
            }
        }
    }
}
