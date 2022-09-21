class ChatField {
    constructor(playground) {
        this.playground = playground;

        this.$history = $(`<div class="ac-game-chat-field-history"></div>`);
        this.$input = $(`<input type="text" class="ac-game-chat-field-input">`);

        this.$history.hide();
        this.$input.hide();

        this.func_id = null; // 记下定时函数的id，方便删除

        this.playground.$playground.append(this.$history);
        this.playground.$playground.append(this.$input);

        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;

        this.$input.keydown(function(e) {
            if (e.which === 27) { // 退出键
                outer.hide_input();
                return false;
            } else if (e.which === 13) { // 回车发送消息到历史记录
                let username = outer.playground.root.settings.username;
                let text = outer.$input.val();
                if (text) {
                    outer.$input.val("");
                    outer.add_message(username, text);
                    outer.playground.mps.send_message(username, text);
                }
                return false;
            }
        });
    }

    render_message(message) { // 渲染，封装成html的对象
        return $(`<div>${message}</div>`);
    }

    add_message(username, text) { // 在历史记录里添加新的信息
        this.show_history();

        let message = `[${username}]${text}`; // 消息格式
        this.$history.append(this.render_message(message));

        this.$history.scrollTop(this.$history[0].scrollHeight); // 展示最新内容，滚动条移到最下面
    }

    show_history() { // 展示历史记录
        let outer = this;

        this.$history.fadeIn(); // fadein慢慢显示出来

        if (this.func_id) clearTimeout(this.func_id); // 每次打开历史记录时，重新设置一个定时函数

        this.func_id = setTimeout(function() {
            outer.$history.fadeOut();
            outer.func_id = null; // 关闭之后将函数id删掉
        }, 3000);
    }

    show_input() { // 展示输入框
        this.show_history();

        this.$input.show();
        this.$input.focus();
    }

    hide_input() { // 隐藏输入框
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
    }
}
