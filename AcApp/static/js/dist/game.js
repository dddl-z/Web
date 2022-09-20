class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            单人模式
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人模式
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
            退出
        </div>
    </div>
</div>
`);
        this.$menu.hide();
        this.root.$ac_game.append(this.$menu);
        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');
        
        this.start();
    }

    start() { // 初始化，对整个 menu 界面进行监听
        this.add_listening_events();
    }

    add_listening_events() { // 为按钮绑定事件
        let outer = this;
        this.$single_mode.click(function() {
            outer.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.click(function() {
            outer.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.click(function() {
            outer.root.settings.logout_on_remote();
        });
    }

    show() { // 显示 menu 界面
        this.$menu.show();
    }

    hide() { // 关闭 menu 界面
        this.$menu.hide();
    }
}
let AC_GAME_OBJECTS = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);

        this.has_called_start = false; // 是否执行过 start 函数
        this.timedelta = 0; // 当前帧距离上一帧的事件间隔，单位是毫秒

        this.uuid = this.create_uuid();
    }

    create_uuid() { // 创建唯一编号
        let res = "";
        for (let i = 0; i < 8; i ++) {
            let x = parseInt(Math.floor(Math.random() * 10)); // random返回[0, 1)之间的数, floor下取整, 则x的取值范围是[0, 9]
            res += x;
        }
        return res;
    }

    start() { // 只会在第一帧执行一次
    }

    update() { // 每一帧均会执行一次
    }

    on_destroy() { // 在被删除之前，会执行一次
    }

    destroy() { // 删掉该物体
        this.on_destroy();

        for (let i = 0; i < AC_GAME_OBJECTS.length; i ++) {
            if (AC_GAME_OBJECTS[i] === this) {
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }
}

let last_timestamp;
let AC_GAME_ANIMATION = function(timestamp) { // timestamp 表示在哪个时刻执行这个函数
    
    for (let i = 0; i < AC_GAME_OBJECTS.length; i ++) {
        let obj = AC_GAME_OBJECTS[i];
        if (!obj.has_called_start) {
            obj.start();
            obj.has_called_start = true;
        }
        else {
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }
    last_timestamp = timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION);
}



requestAnimationFrame(AC_GAME_ANIMATION);
class GameMap extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $(`<canvas></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start() {

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
class NoticeBoard extends AcGameObject {
    constructor(playground) {
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;

        this.text = "已就绪：0人";
    }

    start() {
    }

    write(text) {
        this.text = text;
    }

    update() {
        this.render();
    }

    render() {
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width / 2, 20);
    }
}
class Particle extends AcGameObject {
    constructor(playground, x, y, radius, vx, vy, color, speed, move_length) {
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;

        this.eps = 0.01;
        this.friction = 0.9; // 摩擦力
    }

    start() {

    }

    update() {
        if (this.move_length < this.eps || this.speed < this.eps) {
            this.destroy();
            return false;
        }

        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.speed *= this.friction;
        this.move_length -= moved;
        this.render();
    }

    render() {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
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
class FireBall extends AcGameObject {
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage) {
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.damage = damage;

        this.eps = 0.01;
    }

    start() {

    }

    update() {
        if (this.move_length < this.eps) {
            this.destroy();
            return false;
        }

        this.update_move();

        if (this.player.character !== "enemy") { // 本窗口的敌人发射的子弹只是一个动画，不具有碰撞检测
            this.update_attack();
        }

        this.render();
    }

    update_move() {
        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved; // 方向乘以距离
        this.y += this.vy * moved;
        this.move_length -= moved;
    }

    update_attack() { // 只攻击一名玩家
        for (let i = 0; i < this.playground.players.length; i ++) { // 每一帧枚举每个敌人，判断是否击中了敌人
            let player = this.playground.players[i];
            if (this.player !== player && this.is_collision(player)) {
                this.attack(player);
                break;
            }
        }
    }

    get_dist(x1, y1, x2, y2) { // 两点间的距离
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    is_collision(obj) { // 判断是否击中了敌人
        let distance = this.get_dist(this.x, this.y, obj.x, obj.y);
        if (distance < this.radius + obj.radius) {
            return true;
        }
        return false;
    }

    attack(player) { // 击中敌人后的攻击效果
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(angle, this.damage);

        if (this.playground.mode === "multi mode") {
            this.playground.mps.send_attack(player.uuid, player.x, player.y, angle, this.damage, this.uuid);
        }

        this.destroy();
    }

    render() {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    on_destroy() { // 由于子弹在player里存了一份，所以将子弹删除之前，需要将该子弹从player的fireballs里删除
        let fireballs = this.player.fireballs;
        for (let i = 0; i < fireballs.length; i ++) {
            if (fireballs[i] === this) {
                fireballs.splice(i, 1);
                break;
            }
        }
    }
}
class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;

        this.ws = new WebSocket("wss://app3322.acapp.acwing.com.cn:8443/wss/multiplayer/"); // 建立一个websocket连接

        this.start();
    }

    start() {
        this.receive();
    }

    receive() { // 从后端接收信息
        let outer = this;

        this.ws.onmessage = function(e) {
            let data = JSON.parse(e.data);
            let uuid = data.uuid;
            if (uuid === outer.uuid) { // 对自己发送的消息不予理会
                return false;
            }

            let event = data.event; // 路由到对应的事件
            if (event === "create_player") {
                outer.receive_create_player(uuid, data.username, data.photo);
            } else if (event === "move_to") {
                outer.receive_move_to(uuid, data.tx, data.ty);
            } else if (event === "shoot_fireball") {
                outer.receive_shoot_fireball(uuid, data.tx, data.ty, data.ball_uuid);
            } else if (event === "attack") {
                outer.receive_attack(uuid, data.attackee_uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
            } else if (event === "blink") {
                outer.receive_blink(uuid, data.tx, data.ty);
            }
        };
    }

    send_create_player(username, photo) { // 向后端发送创建玩家的事件
        let outer = this;

        this.ws.send(JSON.stringify({
            'event': "create_player",
            'uuid': outer.uuid,
            'username': username,
            'photo': photo,
        }));
    }

    get_player(uuid) { // 通过uuid找到对应的player
        let players = this.playground.players;
        for (let i = 0; i < players.length; i ++) {
            let player = players[i];
            if (player.uuid === uuid) {
                return player;
            }
        }
        return null;
    }

    receive_create_player(uuid, username, photo) { // 创建玩家的事件
        let player = new Player(
            this.playground,
            this.playground.width / 2 / this.playground.scale,
            0.5,
            0.05,
            "white",
            0.15,
            "enemy",
            username,
            photo,
        );

        player.uuid = uuid; // 元素的uuid要等于创建者的uuid

        this.playground.players.push(player);
    }

    send_move_to(tx, ty) { // 向后端发送玩家移动的信息
        let outer = this;

        this.ws.send(JSON.stringify({
            'event': "move_to",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_move_to(uuid, tx, ty) { // 从后端接收别的玩家的移动信息
        let player = this.get_player(uuid);

        if (player) { // 如果没有掉线或阵亡
            player.move_to(tx, ty);
        }
    }

    send_shoot_fireball(tx, ty, ball_uuid) { // 向后端发送发射火球的信息
        let outer = this;

        this.ws.send(JSON.stringify({
            'event': "shoot_fireball",
            'uuid': outer.uuid, // 谁发射的子弹
            'tx': tx,
            'ty': ty,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_shoot_fireball(uuid, tx, ty, ball_uuid) { // 从后端玩家接收发射火球的信息
        let player = this.get_player(uuid);

        if (player) {
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid; // 所有窗口的同一个元素的uuid需要统一
        }
    }

    send_attack(attackee_uuid, x, y, angle, damage, ball_uuid) { // 向后端发送是否击中的信息
        let outer = this;

        this.ws.send(JSON.stringify({
            'event': "attack",
            'uuid': outer.uuid,
            'attackee_uuid': attackee_uuid,
            'x': x,
            'y': y,
            'angle': angle,
            'damage': damage,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_attack(uuid, attackee_uuid, x, y, angle, damage, ball_uuid) { // 从后端接收是否击中的信息
        let attacker = this.get_player(uuid);
        let attackee = this.get_player(attackee_uuid);
        if (attacker && attackee) {
            attackee.receive_attack(x, y, angle, damage, ball_uuid, attacker);
        }
    }

    send_blink(tx, ty) { // 向后端发送闪现的信息
        let outer = this;

        this.ws.send(JSON.stringify({
            'event': "blink",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_blink(uuid, tx, ty) { // 从后端接收玩家闪现的信息
        let player = this.get_player(uuid);
        if (player) {
            player.blink(tx, ty);
        }
    }
}
class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground"></div>`);

        this.hide();
        this.root.$ac_game.append(this.$playground);

        this.start();
    }

    get_random_color() {
        let colors = ["blue", "red", "pink", "grey", "green"];
        return colors[Math.floor(Math.random() * 5)];
    }

    start() {
        let outer = this;

        $(window).resize(function() {
            outer.resize();
        });
    }

    resize() { // 调整窗口大小
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        let unit = Math.min(this.width / 16, this.height / 9);
        this.width = unit * 16;
        this.height = unit * 9;
        this.scale = this.height; // 基准

        if (this.game_map) this.game_map.resize();
    }

    show(mode) { // 打开 playground 界面
        let outer = this;

        this.$playground.show();

        // 初始化
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.game_map = new GameMap(this);

        this.mode = mode;
        this.state = "waiting"; // waiting -> fighting -> over

        this.notice_board = new NoticeBoard(this);
        this.player_count = 0;

        this.resize();

        this.players = [];
        this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, "white", 0.15, "me", this.root.settings.username, this.root.settings.photo));

        if (mode === "single mode") {
            for (let i = 0; i < 5; i ++) {
                this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot"));
            }
        } else if (mode === "multi mode") {
            this.mps = new MultiPlayerSocket(this); // 建立ws连接
            this.mps.uuid = this.players[0].uuid;

            this.mps.ws.onopen = function() { // 当ws连接创建成功之后的回调函数，向后端发送消息
                outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
            };
        }
    }

    hide() { // 关闭 playground 界面
        this.$playground.hide();
    }

}
class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.AcWingOS) this.platform = "ACAPP";
        this.username = "";
        this.photo = "";

        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app3322.acapp.acwing.com.cn:8443/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app3322.acapp.acwing.com.cn:8443/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
    </div>
</div>
`);
        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");

        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");

        this.$register.hide();

        this.$acwing_login = this.$settings.find('.ac-game-settings-acwing img');

        this.root.$ac_game.append(this.$settings);

        this.start();
    }

    start() {
        if (this.platform === "ACAPP") {
            this.getinfo_acapp();
        } else {
            this.getinfo_web();
            this.add_listening_events();
        }
    }

    add_listening_events() { // 绑定监听函数
        this.add_listening_events_login();
        this.add_listening_events_register();

        let outer = this;
        this.$acwing_login.click(function() {
            outer.acwing_login();
        });
    }

    add_listening_events_login() { // 登录界面的监听函数
        let outer = this;

        this.$login_register.click(function() { // 登录界面跳转到注册界面
            outer.register();
        });

        this.$login_submit.click(function() { // 登录
            outer.login_on_remote();
        });
    }

    add_listening_events_register() { // 注册界面的监听函数
        let outer = this;

        this.$register_login.click(function() { // 注册界面跳转到登录界面
            outer.login();
        });

        this.$register_submit.click(function() { // 注册
            outer.register_on_remote();
        });
    }

    acwing_login() {
        $.ajax({
            url: "https://app3322.acapp.acwing.com.cn:8443/settings/acwing/web/apply_code/",
            type: "GET",
            success: function(resp) {
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                }
            },
        });
    }

    login_on_remote() { // 在远程服务器上登录
        let outer = this;
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();

        $.ajax({
            url: "https://app3322.acapp.acwing.com.cn:8443/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$login_error_message.html(resp.result);
                }
            }
        });
    }

    register_on_remote() { // 在远程服务器上注册
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url: "https://app3322.acapp.acwing.com.cn:8443/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }
        });
    }

    logout_on_remote() { // 在远程服务器上退出登录
        if (this.platform === "ACAPP") {
            this.root.AcWingOS.api.window.close();
        } else {
            $.ajax({
                url: "https://app3322.acapp.acwing.com.cn:8443/settings/logout/",
                type: "GET",
                success: function(resp) {
                    if (resp.result === "success") {
                        location.reload();
                    }
                }
            });
        }
    }

    register() { // 打开注册界面
        this.$login.hide();
        this.$register.show();
    }

    login() { // 打开登陆界面
        this.$register.hide();
        this.$login.show();
    }

    acapp_login(appid, redirect_uri, scope, state) { // acapp一键登录发起授权
        let outer = this;

        this.root.AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp) {
            if (resp.result === "success") {
                outer.username = resp.username;
                outer.photo = resp.photo;
                outer.hide();
                outer.root.menu.show();
            }
        });
    }

    getinfo_acapp() { // acapp一键登录，获取参数
        let outer = this;

        $.ajax({
            url: "https://app3322.acapp.acwing.com.cn:8443/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function(resp) {
                if (resp.result === "success") {
                    outer.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }
            }
        });
    }

    getinfo_web() { // web端登录，获取用户名和头像
        let outer = this;

        $.ajax({
            url: "https://app3322.acapp.acwing.com.cn:8443/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                } else {
                    outer.login();
                }
            }
        });
    }

    hide() {
        this.$settings.hide();
    }

    show() {
        this.$settings.show();
    }
}
export class AcGame {
    constructor(id, AcWingOS){
        this.id = id;
        this.$ac_game = $('#' + id);
        this.AcWingOS = AcWingOS;

        this.settings = new Settings(this);
        this.menu = new AcGameMenu(this);
        this.playground = new AcGamePlayground(this);

        this.start();
    }

    start() {
    }
}
