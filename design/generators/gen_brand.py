# Brand board: logo directions built on the membership badge. Writes D-Brand.dc.html
INK='#1E1633'; SOFT='#5A4E70'; Y='#FFD84A'; ORG='#5B3DF5'; CREAM='#FFF9EC'
COLS=[('#5B3DF5','#fff'),('#FF5A36',INK),('#00B67A',INK),('#FF5C9E',INK),('#18B8F0',INK)]
def badge(fill,on,kind='plain',face=None,w=100,rot=0,x=0,y=0,inner_only=False):
    # viewBox unit 100x130 ; returns <g>
    g=f'<g transform="translate({x} {y}) rotate({rot} 50 65)">'
    g+=f'<rect x="10" y="19" width="80" height="106" rx="16" fill="{INK}"/>'
    g+=f'<rect x="10" y="14" width="80" height="106" rx="16" fill="{fill}" stroke="{INK}" stroke-width="4"/>'
    g+=f'<rect x="36" y="23" width="28" height="9" rx="4.5" fill="{Y}" stroke="{INK}" stroke-width="3"/>'
    if kind=='plain':
        g+=f'<circle cx="50" cy="62" r="11" fill="none" stroke="{on}" stroke-width="4.5"/><rect x="30" y="88" width="40" height="6" rx="3" fill="{on}"/><rect x="38" y="100" width="24" height="6" rx="3" fill="{on}" opacity=".7"/>'
    elif kind=='check':
        g+=f'<circle cx="50" cy="74" r="22" fill="{on}"/><path d="M39 74.5l8 8 15-17" fill="none" stroke="{fill}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
    elif kind=='face':
        if face=='happy':
            g+=f'<circle cx="38" cy="68" r="5" fill="{on}"/><circle cx="62" cy="68" r="5" fill="{on}"/><path d="M36 84q14 14 28 0" fill="none" stroke="{on}" stroke-width="5" stroke-linecap="round"/>'
        elif face=='sleepy':
            g+=f'<path d="M32 68h12M56 68h12" stroke="{on}" stroke-width="5" stroke-linecap="round"/><path d="M42 90h16" stroke="{on}" stroke-width="5" stroke-linecap="round"/>'
        elif face=='party':
            g+=f'<circle cx="38" cy="66" r="5" fill="{on}"/><circle cx="62" cy="66" r="5" fill="{on}"/><path d="M36 82q14 22 28 0z" fill="{on}"/>'
    return g+'</g>'
def svg(inner,w,h,vb): return f'<svg width="{w}" height="{h}" viewBox="{vb}" aria-hidden="true" style="display:block;overflow:visible">{inner}</svg>'
def single(fill,on,kind,size=100,face=None):
    return svg(badge(fill,on,kind,face),size*100/130*1.0 if False else size*0.8,size,'0 0 100 130')
def stack(size=100):
    inner=badge('#FF5A36',INK,'plain',x=-30,y=6,rot=-12)+badge('#00B67A',INK,'plain',x=30,y=6,rot=12)+badge(ORG,'#fff','plain',x=0,y=-4)
    return svg(inner,size*1.5,size,'-30 0 160 130')
def appicon(inner_svg,size):
    r=size*0.24
    return f'<div style="width:{size}px;height:{size}px;border-radius:{r}px;background:{Y};border:{max(2,size/32):.1f}px solid {INK};box-shadow:0 {max(2,size/24):.1f}px 0 {INK};display:flex;align-items:center;justify-content:center;box-sizing:border-box;flex-shrink:0;">{inner_svg}</div>'
def panel(title,sub,body,extra=''):
    return f'<section style="flex:1;min-width:0;background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:18px;display:flex;flex-direction:column;gap:14px;{extra}"><div><div class="h" style="font-size:22px;">{title}</div><div style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.4;margin-top:2px;">{sub}</div></div>{body}</section>'
def lockup(mark,name='שם המותג'):
    return f'<div style="display:flex;align-items:center;gap:10px;">{mark}<span class="h" style="font-size:30px;">{name}</span></div>'
def stage(inner,h=250):
    return f'<div style="height:{h}px;border-radius:16px;background:{Y};border:2px solid {INK};display:flex;align-items:center;justify-content:center;">{inner}</div>'
def icons(mk_big,mk_mid,mk_small):
    return f'<div style="display:flex;align-items:flex-end;justify-content:center;gap:16px;">{appicon(mk_big,96)}{appicon(mk_mid,56)}{appicon(mk_small,32)}</div>'
def colrow(kind,size=80):
    return '<div style="display:flex;gap:10px;justify-content:center;">'+''.join(single(f,o,kind,size) for f,o in COLS)+'</div>'
A=panel('א · התג','צורה אחת, חריץ אחד. הכי נקי, וקל לזיהוי בכל גודל.',
 stage(single(ORG,'#fff','plain',150))+lockup(single(ORG,'#fff','plain',46))+icons(single(ORG,'#fff','plain',64),single(ORG,'#fff','plain',38),single(ORG,'#fff','plain',22))+f'<div style="font-weight:800;font-size:14px;">בצבעי ארגונים</div>'+colrow('plain'))
B=panel('ב · התג עם וי','מוסיף את רגש ה"התקבלת". חם יותר, אבל פחות נקי בקטן.',
 stage(single(ORG,'#fff','check',150))+lockup(single(ORG,'#fff','check',46))+icons(single(ORG,'#fff','check',64),single(ORG,'#fff','check',38),single(ORG,'#fff','check',22))+f'<div style="font-weight:800;font-size:14px;">בצבעי ארגונים</div>'+colrow('check'))
C=panel('ג · הערימה','כמו הארנק: כמה חברויות במקום אחד. מצוין בגדול, נבלע באייקון קטן.',
 stage(stack(150))+lockup(stack(40))+icons(single(ORG,'#fff','plain',64),single(ORG,'#fff','plain',38),single(ORG,'#fff','plain',22))+f'<div style="font-weight:800;font-size:14px;">אייקון האפליקציה: תג בודד. הערימה לשיווק ולמסך הפתיחה.</div>'+f'<div style="display:flex;justify-content:center;">{stack(70)}</div>')
def mood(face,txt,fill,on):
    return f'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">{single(fill,on,"face",110,face)}<span style="font-weight:800;font-size:14px;">{txt}</span></div>'
D=f'<section style="background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:16px 20px;display:flex;align-items:center;gap:20px;"><div style="width:300px;flex-shrink:0;"><div class="h" style="font-size:21px;">הדמות המשנית: אותו תג, עם פנים</div><div style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.45;margin-top:2px;">מופיעה רק במצבי ריק וחגיגה. בשגיאה, בחוב ובביטול היא לא מופיעה בכלל.</div></div>{mood("sleepy","ארנק ריק",ORG,"#fff")}{mood("happy","הצטרפת!","#FF5A36",INK)}{mood("party","הארגון הוקם","#00B67A",INK)}</section>'
page=f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>ד · מותג · לוגו ודמות</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
body{{margin:0}}
.h{{font-family:'Secular One',sans-serif;font-weight:400}}
</style>
</helmet>
<div dir="rtl" style="width:1440px;height:1000px;box-sizing:border-box;padding:24px;background:{Y};color:{INK};font-family:'Assistant',system-ui,sans-serif;font-size:15px;overflow:hidden;display:flex;flex-direction:column;gap:14px;">
<header style="display:flex;align-items:baseline;gap:12px;flex-shrink:0;"><h1 class="h" style="margin:0;font-size:30px;">לוגו ודמות: שלושה כיוונים סביב התג</h1><span style="font-weight:700;color:{SOFT};">שם המותג הוא מחזיק מקום. התג מקבל את צבע הארגון, והלוגו הרשמי סגול על צהוב.</span></header>
<section style="flex:1;min-height:0;display:flex;gap:14px;">{A}{B}{C}</section>
{D}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":1000}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
open('/home/claude/project/D-Brand.dc.html','w',encoding='utf-8').write(page)
print('ok')
