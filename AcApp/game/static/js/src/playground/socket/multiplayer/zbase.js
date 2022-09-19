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
}
