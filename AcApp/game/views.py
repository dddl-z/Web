from django.http import HttpResponse

def index(request):
    line1 = '<h1 style = "text-align: center">术士之战</h1>'
    line2 = '<img src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fm.imeitou.com%2Fuploads%2Fallimg%2F210101%2F3-210101164349.jpg&refer=http%3A%2F%2Fm.imeitou.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1660277340&t=0a55342ef632b570113fd6f3da9a87ec" width=1000></img>'
    line3 = '<a href="/play/">进入游戏界面</a>'
    return HttpResponse(line1 + line2 + line3)

def play(request):
    line1 = '<h1 style="text-align: center">游戏界面</h1>'
    line2 = '<a href="/">返回主界面</a>'
    line3 = '<img src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.jj20.com%2Fup%2Fallimg%2F4k%2Fs%2F01%2F2109241204121401-0-lp.jpg&refer=http%3A%2F%2Fimg.jj20.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1660277340&t=df60f061a4266e72eed669693dbc060c" width=1000></img>'
    return HttpResponse(line1 + line2 +line3)
