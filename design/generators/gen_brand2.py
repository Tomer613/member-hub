# Brand board B: three non-event marks (pin / ring of us / clean card) + wallet as pin collection. Writes D-BrandB.dc.html
import math
INK='#1E1633'; SOFT='#5A4E70'; Y='#FFD84A'; ORG='#5B3DF5'
COLS=[('#5B3DF5','#fff'),('#FF5A36',INK),('#00B67A',INK),('#FF5C9E',INK),('#18B8F0',INK)]
def svg(inner,w,h,vb='0 0 100 100'): return f'<svg width="{w}" height="{h}" viewBox="{vb}" aria-hidden="true" style="display:block;overflow:visible">{inner}</svg>'
def person(on,cx=50,cy=50,s=1):
    return f'<circle cx="{cx}" cy="{cy-8*s}" r="{9*s}" fill="{on}"/><path d="M{cx-17*s} {cy+20*s}q0-{18*s} {17*s}-{18*s}t{17*s} {18*s}z" fill="{on}"/>'
def pin(fill,on,size=100,mono=False,rot=0,x=0,y=0):
    f=INK if mono else fill; o=Y if mono else on
    g=f'<g transform="translate({x} {y}) rotate({rot} 50 50)">'
    g+=f'<circle cx="50" cy="56" r="40" fill="{INK}"/>'
    g+=f'<circle cx="50" cy="50" r="40" fill="{f}" stroke="{INK}" stroke-width="4.5"/>'
    g+=f'<circle cx="50" cy="50" r="32" fill="none" stroke="{o}" stroke-width="2.6" opacity=".55"/>'
    g+=person(o,50,52,1.0)
    g+=f'<path d="M24 30q8-14 24-16" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".6"/>'
    return svg(g+'</g>',size,size) if False else g+'</g>'
def pin_svg(fill,on,size=100,mono=False): return svg(pin(fill,on,mono=mono),size,size)
def ring(fill,on,size=100,mono=False,n=7):
    f=INK if mono else fill; g=''
    for i in range(n):
        a=-math.pi/2+i*2*math.pi/n; cx=50+33*math.cos(a); cy=50+33*math.sin(a)
        me=(i==0)
        r=13 if me else 10.5
        fl=(f if me else ('#fff' if not mono else Y))
        if mono: fl=INK if me else Y
        g+=f'<circle cx="{cx:.1f}" cy="{cy+2.5:.1f}" r="{r}" fill="{INK}"/><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="{fl}" stroke="{INK}" stroke-width="3.6"/>'
    return svg(g,size,size)
def card(fill,on,size=100,mono=False):
    f=INK if mono else fill; o=Y if mono else on
    g=f'<rect x="20" y="13" width="60" height="80" rx="13" fill="{INK}"/><rect x="20" y="8" width="60" height="80" rx="13" fill="{f}" stroke="{INK}" stroke-width="4.5"/>'
    g+=f'<circle cx="50" cy="38" r="12" fill="{o}"/><rect x="31" y="58" width="38" height="6" rx="3" fill="{o}"/><rect x="38" y="69" width="24" height="6" rx="3" fill="{o}" opacity=".7"/>'
    return svg(g,size*0.9,size,'8 2 84 100')
def appicon(inner,size):
    r=size*0.24
    return f'<div style="width:{size}px;height:{size}px;border-radius:{r}px;background:{Y};border:{max(2,size/32):.1f}px solid {INK};box-shadow:0 {max(2,size/24):.1f}px 0 {INK};display:flex;align-items:center;justify-content:center;box-sizing:border-box;flex-shrink:0;">{inner}</div>'
def panel(title,sub,body):
    return f'<section style="flex:1;min-width:0;background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:18px;display:flex;flex-direction:column;gap:14px;"><div><div class="h" style="font-size:22px;">{title}</div><div style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.4;margin-top:2px;">{sub}</div></div>{body}</section>'
def stage(inner,h=210): return f'<div style="height:{h}px;border-radius:16px;background:{Y};border:2px solid {INK};display:flex;align-items:center;justify-content:center;">{inner}</div>'
def lab(t): return f'<div style="font-weight:800;font-size:14px;">{t}</div>'
def build(mk,title,sub):
    big=stage(mk(ORG,'#fff',150))
    icons=f'<div style="display:flex;align-items:flex-end;justify-content:center;gap:16px;">{appicon(mk(ORG,"#fff",64),96)}{appicon(mk(ORG,"#fff",38),56)}{appicon(mk(ORG,"#fff",22),32)}</div>'
    cols='<div style="display:flex;gap:10px;justify-content:center;">'+''.join(mk(f,o,64) for f,o in COLS)+'</div>'
    mono=f'<div style="display:flex;gap:18px;justify-content:center;align-items:center;">{mk(ORG,"#fff",52,True)}<div style="background:{INK};border-radius:12px;padding:8px;">{mk("#fff",INK,52)}</div></div>'
    return panel(title,sub,big+lab('אייקון אפליקציה: 96 / 56 / 32')+icons+lab('בצבעי ארגונים')+cols+lab('צבע אחד')+mono)
A=build(pin_svg,'א · סיכה','חפץ שנולד סביב "אני שייך", ואפשר לאסוף כמה.')
B=build(ring,'ב · טבעת של כולנו','חבורה של אנשים, ואחד מהם הוא אני (בצבע הארגון). בלי חפץ בכלל.')
C=build(card,'ג · כרטיס נקי (N1)','מה שיש היום בלוח הניסוי. נקי, אבל עדיין חפץ של "כרטיס".')
# wallet as pin collection
def pbit(f,o,name,rot,w=84):
    return f'<div style="display:flex;flex-direction:column;align-items:center;gap:2px;transform:rotate({rot}deg);">{pin_svg(f,o,w)}<span style="font-weight:800;font-size:13px;background:#fff;border:2px solid {INK};border-radius:99px;padding:1px 9px;">{name}</span></div>'
ghost=f'<div style="width:78px;height:78px;border-radius:50%;border:3px dashed {INK};display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800;opacity:.55;">+</div>'
strip=f'''<section style="background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:14px 20px;display:flex;align-items:center;gap:22px;">
<div style="width:300px;flex-shrink:0;"><div class="h" style="font-size:21px;">הארנק כאוסף סיכות</div><div style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.45;margin-top:2px;">כל ארגון שאני חבר בו הוא סיכה בצבע שלו. להצטרף למקום חדש זה "להצמיד" סיכה. הפלוס הוא הזמנה להצטרף.</div></div>
<div style="flex:1;border-radius:16px;background:#FFF3C4;border:2px solid {INK};padding:12px 20px;display:flex;align-items:center;justify-content:space-around;">
{pbit('#5B3DF5','#fff','בית הכנסת',-6)}{pbit('#FF5A36',INK,'ועד הבית',5)}{pbit('#00B67A',INK,'חדר הכושר',-3)}{pbit('#FF5C9E',INK,'המועדון',7)}{ghost}</div></section>'''
page=f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>ד · מותג · סיכה, טבעת, כרטיס</title>
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
<div dir="rtl" style="width:1440px;height:1010px;box-sizing:border-box;padding:24px;background:{Y};color:{INK};font-family:'Assistant',system-ui,sans-serif;font-size:15px;overflow:hidden;display:flex;flex-direction:column;gap:14px;">
<header style="display:flex;align-items:baseline;gap:12px;flex-shrink:0;"><h1 class="h" style="margin:0;font-size:30px;">שייכות בלי כסף ובלי כניסה: סיכה, טבעת, כרטיס</h1><span style="font-weight:700;color:{SOFT};">שלושה כיוונים להשוואה, באותם גדלים ובאותם צבעים. כל אחד מהם הוא הצעה ראשונית, לא סופית.</span></header>
<section style="flex:1;min-height:0;display:flex;gap:14px;">{A}{B}{C}</section>
{strip}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":1010}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
open('/home/claude/project/D-BrandB.dc.html','w',encoding='utf-8').write(page)
print('ok')
