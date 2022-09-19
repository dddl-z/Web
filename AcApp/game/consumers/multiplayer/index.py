from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = None

        for i in range(1000): # 找一个合法的房间
            name = "room-%d" % (i)
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:
                self.room_name = name
                break

        if not self.room_name: # 没有找到合法的房间，说明服务器不够了
            return

        await self.accept()

        if not cache.has_key(self.room_name): # 将对战信息存到redis里
            cache.set(self.room_name, [], 3600) # 对战的有效期设置成1小时

        for player in cache.get(self.room_name):
            await self.send(text_data=json.dumps({ # dumps将字典变成字符串, 发送给前端
                'event': "create_player",
                'uuid': player['uuid'],
                'username': player['username'],
                'photo': player['photo'],
            }))

        await self.channel_layer.group_add(self.room_name, self.channel_name) # 广播消息

    async def disconnect(self, close_code):
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def create_player(self, data):
        players = cache.get(self.room_name)
        players.append({
            'uuid': data['uuid'],
            'username': data['username'],
            'photo': data['photo'],
        })
        cache.set(self.room_name, players, 3600)
        await self.channel_layer.group_send( # 参数：room_name（分组），广播的信息
            self.room_name,
            {
                'type': "group_create_player", # 接收server向组内广播消息的函数名要与这个参数一致
                'event': "create_player",
                'uuid': data['uuid'],
                'username': data['username'],
                'photo': data['photo'],
            }
        )

    async def group_create_player(self, data): # 接收server向组内广播消息的函数, 并发送给前端
        await self.send(text_data=json.dumps(data))

    async def receive(self, text_data): # 接收前端向后端发送的请求
        data = json.loads(text_data)
        event = data['event'] # 根据event做路由
        if event == "create_player":
            await self.create_player(data)
