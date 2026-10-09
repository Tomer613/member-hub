# Logo board: member card + check + lanyard. Writes D-BrandLogo.dc.html
INK='#1E1633'; SOFT='#5A4E70'; Y='#FFD84A'; ORG='#5B3DF5'
COLS=[('#5B3DF5','#fff'),('#FF5A36',INK),('#00B67A',INK),('#FF5C9E',INK),('#18B8F0',INK)]
def mark(fill,on,size=100,strap=True,mono=False):
    f=INK if mono else fill; o=Y if mono else on; sf=INK if mono else fill
    g=''
    if strap:
        g+=f'<polygon points="22,-6 38,-6 56,40 44,44" fill="{sf}" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>'
        g+=f'<polygon points="78,-6 62,-6 44,40 56,44" fill="{sf}" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>'
        g+=f'<rect x="39" y="32" width="22" height="14" rx="5" fill="#fff" stroke="{INK}" stroke-width="3.5"/>'
    top=44 if strap else 8
    g+=f'<rect x="14" y="{top+5}" width="72" height="{84}" rx="15" fill="{INK}"/>'
    g+=f'<rect x="14" y="{top}" width="72" height="84" rx="15" fill="{f}" stroke="{INK}" stroke-width="4"/>'
    cy=top+36
    g+=f'<circle cx="50" cy="{cy}" r="21" fill="{o}"/><path d="M39.5 {cy+0.5}l8 8 14-16" fill="none" stroke="{f}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>'
    g+=f'<rect x="31" y="{top+66}" width="38" height="6" rx="3" fill="{o}"/>'
    vb='0 -8 100 138' if strap else '4 2 92 98'
    w=size*(100/138 if strap else 92/98)
    return f'<svg width="{w:.1f}" height="{size}" viewBox="{vb}" aria-hidden="true" style="display:block;overflow:visible">{g}</svg>'
def appicon(inner,size):
    r=size*0.24
    return f'<div style="width:{size}px;height:{size}px;border-radius:{r}px;background:{Y};border:{max(2,size/32):.1f}px solid {INK};box-shadow:0 {max(2,size/24):.1f}px 0 {INK};display:flex;align-items:center;justify-content:center;box-sizing:border-box;flex-shrink:0;">{inner}</div>'
def card(title,sub,body,flex='1'):
    return f'<section style="flex:{flex};min-width:0;background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:18px;display:flex;flex-direction:column;gap:14px;"><div><div class="h" style="font-size:22px;">{title}</div><div style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.4;margin-top:2px;">{sub}</div></div>{body}</section>'
def lab(t): return f'<div style="font-weight:800;font-size:14px;">{t}</div>'
def stage(inner,h=300,bg=Y): return f'<div style="height:{h}px;border-radius:16px;background:{bg};border:2px solid {INK};display:flex;align-items:center;justify-content:center;">{inner}</div>'
main=card('הסימן המלא','כרטיס חבר אנכי עם וי, תלוי על רצועה. הרצועה בצבע הארגון, והכרטיס עצמו עם צל קשיח.',
 stage(mark(ORG,'#fff',250))+lab('עם שם (שם המותג הוא מחזיק מקום)')+
 f'<div style="display:flex;align-items:center;gap:12px;">{mark(ORG,"#fff",64)}<span class="h" style="font-size:34px;">שם המותג</span></div>',flex='1.1')
sm=f'<div style="display:flex;align-items:flex-end;justify-content:center;gap:16px;">{appicon(mark(ORG,"#fff",70,False),96)}{appicon(mark(ORG,"#fff",40,False),56)}{appicon(mark(ORG,"#fff",22,False),32)}</div>'
cols='<div style="display:flex;gap:14px;justify-content:center;align-items:flex-end;">'+''.join(mark(f,o,92) for f,o in COLS)+'</div>'
mono=f'<div style="display:flex;gap:16px;justify-content:center;align-items:center;">{mark(ORG,"#fff",84,True,True)}<div style="background:{INK};border-radius:14px;padding:10px 14px;">{mark("#fff",INK,84)}</div></div>'
right=card('אייקון, צבעים וצבע אחד','באייקון האפליקציה ובגדלים קטנים (עד 40 פיקסלים) הרצועה יורדת, ונשאר הכרטיס עם הוי.',
 lab('אייקון אפליקציה: 96 / 56 / 32')+sm+lab('בצבעי ארגונים (עם רצועה)')+cols+lab('צבע אחד, ועל רקע כהה')+mono,flex='1.4')
page=f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>ד · מותג · לוגו מוצע</title>
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
<div dir="rtl" style="width:1440px;height:700px;box-sizing:border-box;padding:24px;background:{Y};color:{INK};font-family:'Assistant',system-ui,sans-serif;font-size:15px;overflow:hidden;display:flex;flex-direction:column;gap:14px;">
<header style="display:flex;align-items:baseline;gap:12px;flex-shrink:0;"><h1 class="h" style="margin:0;font-size:30px;">לוגו מוצע: כרטיס חבר עם וי</h1><span style="font-weight:700;color:{SOFT};">הכיוון שנבחר. שם המותג ייכנס בהמשך, והסימן לא תלוי בו.</span></header>
<section style="flex:1;min-height:0;display:flex;gap:14px;">{right}{main}</section>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":700}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
open('/home/claude/project/D-BrandLogo.dc.html','w',encoding='utf-8').write(page)
print('ok')
