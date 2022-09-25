from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from game.models.player.player import Player

class RankListView(APIView):
    permission_classes = ([IsAuthenticated]) # 需要身份验证就加上这句话

    def get(self, request):
        players = Player.objects.all().order_by('-score')[:10] # 按照分数大小返回前十个
        resp = []
        for player in players:
            resp.append({
                'username': player.user.username,
                'photo': player.photo,
                'score': player.score,
            })
        return Response(resp)
