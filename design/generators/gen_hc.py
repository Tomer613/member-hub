# High-contrast palette board. Computes real contrast ratios. Writes D-HighContrast.dc.html
def lum(h):
    n=int(h[1:],16); f=lambda c:(lambda x: x/12.92 if x<=.03928 else ((x+.055)/1.055)**2.4)(c/255)
    r,g,b=[f((n>>s)&255) for s in (16,8,0)]; return .2126*r+.7152*g+.0722*b
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+.05)/(lo+.05)
def mix(a,b,t):
    A=int(a[1:],16);B=int(b[1:],16)
    return '#%02X%02X%02X'%tuple(round(((A>>s)&255)*(1-t)+((B>>s)&255)*t) for s in (16,8,0))
INK='#1E1633'; SOFT='#5A4E70'; Y='#FFD84A'
# (name, default fg, default bg, HC fg, HC bg, usage)
ROWS=[('טקסט ראשי','#1E1633','#FFFFFF','#000000','#FFFFFF','כותרות וגוף'),
('טקסט משני','#5A4E70','#FFFFFF','#3A3050','#FFFFFF','תוויות, הערות'),
('טקסט על צהוב','#1E1633','#FFD84A','#000000','#FFD84A','כפתורים ותגיות'),
('שגיאה / חוב','#C4223B','#FFFFFF','#9B1028','#FFFFFF','הודעות שגיאה וסכומי חוב'),
('הצלחה (טקסט)','#007A52','#FFFFFF','#00573A','#FFFFFF','"שולם", "פעיל"'),
('קישור','#5B3DF5','#FFFFFF','#3A1FC4','#FFFFFF','קישורים בטקסט'),
('כפתור ראשי','#FFFFFF','#1E1633','#FFFFFF','#000000','לתשלום, שליחה')]
def row(r):
    n,f,b,hf,hb,u=r; c1,c2=cr(f,b),cr(hf,hb)
    def sw(f,b,t,c): ok='AAA' if c>=7 else ('AA' if c>=4.5 else 'נכשל')
    cell=lambda f,b,c: f'<td style="padding:6px 10px;"><span style="display:inline-block;min-width:92px;text-align:center;padding:4px 8px;border-radius:8px;border:2px solid {INK};background:{b};color:{f};font-weight:800;">דוגמה</span> <bdi style="font-weight:800;">{c:.1f}:1</bdi> <span style="font-size:12.5px;font-weight:800;color:#007A52;">{"AAA" if c>=7 else ("AA" if c>=4.5 else "לא עובר")}</span></td>'
    return f'<tr style="border-bottom:1.5px solid #E3DDFF;"><td style="padding:6px 10px;font-weight:800;">{n}<div style="font-size:12.5px;font-weight:600;color:{SOFT};">{u}</div></td>{cell(f,b,c1)}{cell(hf,hb,c2)}</tr>'
table='<table style="width:100%;border-collapse:collapse;font-size:14.5px;"><thead><tr style="text-align:start;"><th style="padding:6px 10px;text-align:start;">אלמנט</th><th style="padding:6px 10px;text-align:start;">רגיל</th><th style="padding:6px 10px;text-align:start;">ניגודיות גבוהה</th></tr></thead><tbody>'+''.join(row(r) for r in ROWS)+'</tbody></table>'
# header text on org colours: auto-adjust to 7:1
ORGS=[('#5B3DF5','בית הכנסת'),('#FF5A36','FitZone'),('#00B67A','ועד בית'),('#FF5C9E','חתולי השכונה'),('#18B8F0','עזרה לקשיש')]
def best(bg):
    a,b=cr('#000000',bg),cr('#FFFFFF',bg)
    return ('#000000',a) if a>=b else ('#FFFFFF',b)
def hcbg(bg):
    fg,c=best(bg)
    if c>=7: return bg,fg,c
    t=0
    tgt='#FFFFFF' if fg=='#FFFFFF' else '#FFFFFF'
    # move background away from the chosen text colour until 7:1 holds
    step=0
    cur=bg
    while step<40:
        cur=mix(bg,'#000000' if fg=='#FFFFFF' else '#FFFFFF',step/40)
        if cr(fg,cur)>=7: break
        step+=1
    return cur,fg,cr(fg,cur)
def sample(bg,fg,hc):
    return f'<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:{3 if hc else 2}px solid {"#000" if hc else INK};border-radius:16px;background:{bg};color:{fg};"><span style="width:38px;height:38px;border-radius:50%;background:#fff;border:{3 if hc else 2}px solid {"#000" if hc else INK};color:#000;display:flex;align-items:center;justify-content:center;font-family:\'Secular One\',sans-serif;font-size:20px;">א</span><span class="h" style="font-size:18px;">שם הארגון</span></div>'
def orgblock(hc):
    out=''
    for c,n in ORGS:
        if hc:
            bg,fg,r=hcbg(c)
        else:
            fg=INK if cr(INK,c)>=cr('#FFFFFF',c) else '#FFFFFF'; bg=c; r=cr(fg,bg)
        out+=f'<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;">{sample(bg,fg,hc)}</div><bdi style="width:70px;font-weight:800;font-size:13.5px;">{r:.1f}:1</bdi></div>'
    return out
def panel(title,sub,body,hcmode=False):
    bgc='#FFFFFF' if hcmode else Y
    bd='3px solid #000' if hcmode else f'2.5px solid {INK}'
    return f'<section style="flex:1;min-width:0;background:{bgc};border:{bd};border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:10px;"><div><div class="h" style="font-size:21px;">{title}</div><div style="font-size:13.5px;font-weight:600;color:{"#3A3050" if hcmode else SOFT};line-height:1.4;">{sub}</div></div>{body}</section>'
def chips(hc):
    bd='3px solid #000' if hc else f'2px solid {INK}'
    ink='#000' if hc else INK
    def chip(t,bg,fg,icon): return f'<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 12px;border-radius:99px;border:{bd};background:{bg};color:{fg};font-weight:800;font-size:13.5px;">{icon}{t}</span>'
    ok='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'
    bad='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M12 6v8M12 18v.5"/></svg>'
    if hc: g=chip('שולם','#FFFFFF','#00573A',ok); r=chip('חוב ₪275','#FFFFFF','#9B1028',bad)
    else: g=chip('שולם','#D5F5E8',INK,ok); r=chip('חוב ₪275','#FFDCD3',INK,bad)
    btn=f'<span style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border-radius:26px;border:{bd};background:{"#000" if hc else INK};color:#fff;font-weight:800;font-size:17px;">לתשלום ₪120</span>'
    foc=f'<span style="display:inline-flex;align-items:center;min-height:48px;padding:0 18px;border-radius:14px;border:{bd};background:#fff;color:{ink};font-weight:700;{"outline:3px solid #1A4DFF;outline-offset:2px;" if hc else ""}">שדה עם מיקוד</span>'
    return f'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">{g}{r}</div><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">{btn}{foc}</div>'
left=panel('כך זה נראה היום','רקע צהוב, קווי מתאר 2px, צבע הארגון בכותרת.',orgblock(False)+chips(False))
right=panel('במצב ניגודיות גבוהה','רקע לבן, קווי מתאר 3px, כל טקסט לפחות 7:1, וצבע הארגון מתכהה רק כשצריך. מצב וצבע תמיד מלווים באייקון ובמילה.',orgblock(True)+chips(True),True)
rules=f'''<section style="background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:14px 18px;display:flex;gap:24px;">
<div style="flex:1.3;">{table}</div>
<div style="flex:1;font-size:14.5px;font-weight:600;line-height:1.55;"><div class="h" style="font-size:20px;margin-bottom:4px;">כללי המצב</div>
<ul style="margin:0;padding-inline-start:20px;">
<li>מופעל מהגדרות הנגישות באפליקציה, או אוטומטית לפי הגדרת המכשיר.</li>
<li>רקע לבן במקום צהוב. הצהוב נשאר רק כמילוי של כפתורים ותגיות, עם טקסט שחור.</li>
<li>טקסט רגיל ומשני: לפחות 7:1 (AAA). רכיבים גרפיים: לפחות 3:1.</li>
<li>צבע הארגון בכותרת הכרטיס מתכהה לפי הצורך כדי להגיע ל-7:1, ובתווית הארגון נשמר הצבע המקורי בעיגול הקטן.</li>
<li>קווי מתאר 3px, ללא ערבוב של צל קשיח כדי להפריד, וטבעת מיקוד כחולה 3px עם רווח.</li>
<li>סטטוס אף פעם לא רק בצבע: אייקון ומילה (שולם, חוב, ממתין).</li>
</ul></div></section>'''
page=f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>ד · נגישות · ניגודיות גבוהה</title>
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
<div dir="rtl" style="width:1440px;height:1090px;box-sizing:border-box;padding:24px;background:{Y};color:{INK};font-family:'Assistant',system-ui,sans-serif;font-size:15px;overflow:hidden;display:flex;flex-direction:column;gap:14px;">
<header style="display:flex;align-items:baseline;gap:12px;flex-shrink:0;"><h1 class="h" style="margin:0;font-size:30px;">מצב ניגודיות גבוהה</h1><span style="font-weight:700;color:{SOFT};">היחסים מחושבים, לא משוערים. מקורי מול מצב נגיש, זה לצד זה.</span></header>
<section style="display:flex;gap:14px;">{left}{right}</section>
{rules}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":1090}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
open('/home/claude/project/D-HighContrast.dc.html','w',encoding='utf-8').write(page)
print('ok')
