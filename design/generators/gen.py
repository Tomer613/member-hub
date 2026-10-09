import json
INK='#1E1633'; SOFT='#5A4E70'; CREAM='#FFF9EC'; Y='#FFD84A'; RED='#FF5A36'
BELL='M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0'
WAL='M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2'
SRC='M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3'
CHECK='M5 12.5l4.5 4.5L19 7.5'
PIN='M9 3h6l-1 6 3 3v2H7v-2l3-3zM12 14v7'
HANDLE='M5 8h14M5 12h14M5 16h14'
def ico(d,s=28,sw=2): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg>'
def page(title,h,body,nav,extra=''):
    return f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:inherit;text-decoration:none}}
</style>
</helmet>
<div dir="rtl" style="position:relative;width:390px;height:{h}px;box-sizing:border-box;display:flex;flex-direction:column;background:{Y};color:{INK};font-family:'Assistant',system-ui,sans-serif;font-size:16px;overflow:hidden;">
<div style="flex:1;min-height:0;box-sizing:border-box;padding:18px 16px 0;display:flex;flex-direction:column;gap:12px;overflow:hidden;">
{body}
</div>
{nav}
{extra}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
def nav(active):
    def tab(key,label,d,badge=False):
        on=key==active
        st=f"border:2px solid {INK};background:{Y};" if on else "border:2px solid transparent;"
        cur=' aria-current="page"' if on else ''
        lab=f'<span style="font-weight:800;font-size:14px;margin-inline-start:6px;">{label}</span>' if on else ''
        b=f'<span style="position:absolute;top:-6px;inset-inline-end:6px;min-width:18px;height:18px;box-sizing:border-box;padding:0 4px;border-radius:9px;background:{RED};color:{INK};border:2px solid {INK};font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;">2</span>' if badge else ''
        return f'<a href="#" aria-label="{label}"{cur} style="display:flex;align-items:center;justify-content:center;position:relative;min-height:48px;box-sizing:border-box;border-radius:24px;{st}color:{INK};">{ico(d)}{lab}{b}</a>'
    return f'<nav aria-label="ניווט ראשי" style="flex-shrink:0;height:64px;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;background:#FFFFFF;border-top:2px solid {INK};padding:7px 14px;">{tab("bell","הודעות",BELL,True)}{tab("wallet","ארנק",WAL)}{tab("search","חיפוש",SRC)}</nav>'
def chip(label,sel,count=None):
    bg,fg=(INK,'#FFFFFF') if sel else ('#FFFFFF',INK)
    c=f'<span style="min-width:20px;height:20px;box-sizing:border-box;padding:0 5px;border-radius:10px;background:{RED};color:{INK};border:2px solid {INK};font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-inline-start:5px;">{count}</span>' if count else ''
    return f'<span role="radio" aria-checked="{str(sel).lower()}" style="min-height:40px;box-sizing:border-box;padding:0 10px;border-radius:20px;border:2px solid {INK};background:{bg};color:{fg};font-weight:800;font-size:14.5px;display:inline-flex;align-items:center;white-space:nowrap;">{label}{c}</span>'
def logo(txt,size=40,bg='#FFFFFF',icon=None):
    inner=ico(icon,22) if icon else f"<span style=\"font-family:'Secular One',sans-serif;font-size:{size*0.42:.0f}px;line-height:1;\">{txt}</span>"
    return f'<span style="width:{size}px;height:{size}px;flex-shrink:0;box-sizing:border-box;border-radius:50%;border:2px solid {INK};background:{bg};color:{INK};display:inline-flex;align-items:center;justify-content:center;" aria-hidden="true">{inner}</span>'
def card(org,color,lg,time,text,btn=None,read=False,done=None,app=False):
    band=f'<div style="width:60px;flex-shrink:0;background:{color};border-inline-end:2px solid {INK};display:flex;justify-content:center;padding-top:12px;box-sizing:border-box;">{lg}</div>'
    tag=''
    if btn: tag=f'<span style="margin-inline-start:auto;padding:3px 10px;border-radius:12px;background:{INK};color:#FFFFFF;font-size:12px;font-weight:800;white-space:nowrap;">דורש טיפול</span>'
    if done: tag=f'<span style="margin-inline-start:auto;padding:3px 10px;border-radius:12px;border:2px solid {INK};background:#FFFFFF;font-size:12px;font-weight:800;white-space:nowrap;">{done}</span>'
    act=''
    if btn: act=f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 22px;border-radius:22px;border:2px solid {INK};background:{Y};color:{INK};box-shadow:0 3px 0 {INK};font-weight:800;font-size:16px;display:inline-flex;align-items:center;margin-bottom:3px;">{btn}</a>'
    elif read: act=f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 16px;border-radius:22px;border:2px solid {INK};background:#FFFFFF;color:{INK};font-weight:800;font-size:15px;display:inline-flex;align-items:center;gap:6px;">{ico(CHECK,18,2.6)}סימון כנקרא</a>'
    row=f'<div style="display:flex;align-items:center;gap:8px;">{act}{tag}</div>' if (act or tag) else ''
    bg=CREAM if done else '#FFFFFF'
    return f'''<article style="flex-shrink:0;display:flex;background:{bg};border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};overflow:hidden;">{band}<div style="flex:1;min-width:0;padding:10px 14px 12px;display:flex;flex-direction:column;gap:8px;">
<div style="display:flex;align-items:baseline;gap:8px;"><span style="font-weight:800;font-size:14px;color:{SOFT};flex:1;">{org}</span><span style="font-size:13px;font-weight:700;color:{SOFT};white-space:nowrap;"><bdi>{time}</bdi></span></div>
<p style="margin:0;font-size:16px;font-weight:700;line-height:1.35;">{text}</p>{row}</div></article>'''
def day(t): return f'<h2 style="margin:4px 4px 0;font-family:\'Secular One\',sans-serif;font-size:18px;font-weight:400;">{t}</h2>'
def header(title,right):
    return f'<header style="display:flex;align-items:center;gap:12px;"><h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:30px;line-height:1.05;font-weight:400;flex:1;">{title}</h1>{right}</header>'
VAAD=('ועד בית · שדרות האמורים 62','#FF9B6B',logo('ו'))
FIT=('פיט סיטי','#5EE0C0',logo('פ'))
SYN=('בית הכנסת המרכזי','#B9A4FF',logo('ב'))
APP=('ארנק',INK,logo('',bg='#FFFFFF',icon=WAL))
def chips(sel):
    items=[('all','הכל',None),('act','דורש טיפול',2),('upd','עדכונים',None),('done','הושלמו',None)]
    return '<div role="radiogroup" aria-label="סינון הודעות" style="display:flex;flex-wrap:wrap;gap:6px;">'+''.join(chip(l,k==sel,c) for k,l,c in items)+'</div>'
markall=f'<a href="#" style="min-height:34px;box-sizing:border-box;padding:0 12px;border-radius:17px;border:2px solid {INK};background:#FFFFFF;font-weight:800;font-size:13px;display:inline-flex;align-items:center;">סימון הכול כנקרא</a>'
def lst(items): return '<div style="display:flex;flex-direction:column;gap:12px;overflow:hidden;padding-bottom:6px;">'+''.join(items)+'</div>'
out={}
out['D-Notifications']=page('ד · הודעות',844,header('הודעות',markall)+chips('all')+lst([day('היום'),
 card(*VAAD[:1],VAAD[1],VAAD[2],'09:10','דמי ועד לאוקטובר: <bdi>₪120</bdi>. לתשלום עד 15.10.','לתשלום'),
 card(FIT[0],FIT[1],FIT[2],'08:30','המנוי שלך מתחדש בעוד 3 ימים. לאשר את החידוש?','אישור חידוש'),
 card(SYN[0],SYN[1],SYN[2],'07:45','מזל טוב ליוסי ולמשפחה להולדת הבת!',read=True),
 day('אתמול'),
 card(APP[0],APP[1],APP[2],'18:20','נוסף מסך נגישות חדש. אפשר להפעיל אותו בהגדרות.',read=True),
 day('לפני שבוע'),
 card('חוג ציור למבוגרים','#FF8FB8',logo('ח'),'01.10 · 10:00','ההרשמה לסמסטר הבא נפתחה. להרשמה עד 20.10.','להרשמה')]),nav('bell'))
out['D-NotificationsDone']=page('ד · הודעות · הושלמו',844,header('הודעות','')+chips('done')+lst([day('אתמול'),
 card(VAAD[0],VAAD[1],VAAD[2],'16:05','התשלום על סך <bdi>₪120</bdi> התקבל. תודה!',done='טופל ✓ · 07.10 · 16:20'),
 card(SYN[0],SYN[1],SYN[2],'12:00','קידוש לכבוד חג שמח, ביום חמישי אחרי התפילה.',done='נקרא ✓ · 08.10 · 09:14'),
 day('לפני שבוע'),
 card(FIT[0],FIT[1],FIT[2],'01.10 · 10:00','המנוי חודש עד 05.11. תודה שאתם איתנו!',done='טופל ✓ · 01.10 · 14:32')]),nav('bell'))

# ---- wallet edit
def numbtn(n):
    return f'<a href="#" aria-label="מקום {n}, לשינוי מקום" style="min-width:48px;height:44px;box-sizing:border-box;border-radius:14px;border:2px solid {INK};background:#FFFFFF;color:{INK};font-weight:800;font-size:17px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"><bdi>{n}</bdi></a>'
def pinbtn(on):
    bg,fg=(INK,'#FFFFFF') if on else ('#FFFFFF',INK)
    lab='ביטול נעיצה' if on else 'נעיצה'
    return f'<a href="#" role="button" aria-pressed="{str(on).lower()}" aria-label="{lab}" style="width:44px;height:44px;box-sizing:border-box;border-radius:50%;border:2px solid {INK};background:{bg};color:{fg};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">{ico(PIN,22)}</a>'
def row(n,name,sub,color,txt,pinned=False):
    hdl=f'<span role="img" aria-label="גרירה להזזה" style="width:30px;height:44px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;color:{SOFT};">{ico(HANDLE,24,2.4)}</span>'
    return f'''<div style="flex-shrink:0;display:flex;align-items:center;gap:6px;min-height:64px;box-sizing:border-box;padding:6px 6px 6px 8px;background:#FFFFFF;border:2px solid {INK};border-radius:16px;box-shadow:0 3px 0 {INK};">{hdl}{logo(txt,40,color)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;line-height:1.2;">{name}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{pinbtn(pinned)}{numbtn(n)}</div>'''
def sh(t): return f'<h2 style="margin:4px 4px 0;font-family:\'Secular One\',sans-serif;font-size:18px;font-weight:400;">{t}</h2>'
sortcard=f'''<section aria-label="סדר הצגה" style="background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:10px 14px 12px;display:flex;flex-direction:column;gap:8px;"><span style="font-weight:800;font-size:16px;">סדר הצגה</span><div role="radiogroup" aria-label="סדר הצגה" style="display:flex;flex-wrap:wrap;gap:8px;">{chip('ידני',True)}{chip('פעילות אחרונה',False)}{chip('לפי שם',False)}{chip('דורש טיפול קודם',False)}</div></section>'''
arch=f'''<a href="#" style="min-height:56px;box-sizing:border-box;padding:8px 14px;background:{CREAM};border:2px dashed {INK};border-radius:16px;display:flex;align-items:center;gap:12px;"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">ארכיון (2)</span><span style="font-size:13px;font-weight:600;color:{SOFT};">חברויות שפג תוקפן או שהוסתרו</span></div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg></a>'''
def editbody():
    return (header('סידור הארנק',f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 20px;border-radius:22px;border:2px solid {INK};background:{INK};color:#FFFFFF;font-weight:800;font-size:16px;display:inline-flex;align-items:center;">סיום</a>')
    +f'<p style="margin:0;font-size:14px;font-weight:700;line-height:1.35;">12 חברויות. גררו בידית, או לחצו על המספר כדי להעביר למקום מסוים.</p>'
    +sortcard+sh('נעוצות')
    +'<div style="display:flex;flex-direction:column;gap:10px;">'+row(1,'ועד בית · האמורים 62','חבר ועד','#FF9B6B','ו',True)+row(2,'פיט סיטי','מנוי חודשי','#5EE0C0','פ',True)+'</div>'
    +sh('שאר החברויות')
    +'<div style="display:flex;flex-direction:column;gap:10px;">'+row(3,'בית הכנסת המרכזי','חבר','#B9A4FF','ב')+row(4,'מועדון הכדורגל השכונתי','שחקן','#7CC4FF','מ')+row(5,'חוג ציור למבוגרים','מנוי סמסטר','#FF8FB8','ח')+row(6,'קבוצת הריצה של יום שישי','חבר','#FF9B6B','ק')+'</div>'+arch)
out['D-WalletEdit']=page('ד · ארנק · עריכת סדר',1000,editbody(),nav('wallet'))
sheetrows=[('הזזה למעלה','M12 19V5M6 11l6-6 6 6'),('הזזה למטה','M12 5v14M6 13l6 6 6-6'),('לראש הרשימה','M5 4h14M12 20V8M6 14l6-6 6 6'),('לסוף הרשימה','M5 20h14M12 4v12M6 10l6 6 6-6')]
def srow(l,d,last=False):
    return f'<a href="#" style="min-height:52px;box-sizing:border-box;padding:0 16px;display:flex;align-items:center;gap:12px;font-weight:800;font-size:17px;border-bottom:{"none" if last else "1.5px solid #EDE6D6"};">{ico(d,22,2.4)}{l}</a>'
sheet=f'''<div style="position:absolute;inset:0;background:rgba(30,22,51,0.6);"></div>
<div role="dialog" aria-modal="true" aria-label="העברת בית הכנסת המרכזי" style="position:absolute;inset-inline:0;bottom:0;background:#FFFFFF;border-top:2px solid {INK};border-radius:24px 24px 0 0;padding:14px 0 18px;display:flex;flex-direction:column;">
<div style="display:flex;align-items:center;gap:12px;padding:0 16px 10px;border-bottom:2px solid {INK};">{logo('ב',40,'#B9A4FF')}<div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:17px;">בית הכנסת המרכזי</span><span style="font-size:13px;font-weight:600;color:{SOFT};">מקום 3 מתוך 12</span></div><a href="#" aria-label="סגירה" style="width:44px;height:44px;border-radius:50%;border:2px solid {INK};display:inline-flex;align-items:center;justify-content:center;">{ico('M6 6l12 12M18 6L6 18',22,2.4)}</a></div>
{''.join(srow(l,d) for l,d in sheetrows)}
<div style="padding:10px 16px;display:flex;align-items:center;gap:10px;border-top:1.5px solid #EDE6D6;border-bottom:1.5px solid #EDE6D6;"><label for="pos" style="font-weight:800;font-size:17px;flex:1;">העברה למקום מספר</label><input id="pos" inputmode="numeric" value="8" style="width:64px;height:48px;box-sizing:border-box;border-radius:14px;border:2px solid {INK};text-align:center;font:800 18px 'Assistant',sans-serif;"><a href="#" style="min-height:48px;box-sizing:border-box;padding:0 18px;border-radius:24px;border:2px solid {INK};background:{Y};box-shadow:0 3px 0 {INK};font-weight:800;font-size:16px;display:inline-flex;align-items:center;">העברה</a></div>
{srow('נעיצה בראש הארנק',PIN)}{srow('העברה לארכיון','M3 7h18v4H3zM5 11v9h14v-9M10 15h4',True)}
</div>'''
out['D-WalletMove']=page('ד · ארנק · העברת כרטיס',844,editbody(),nav('wallet'),sheet)

DANGER='#C4223B'
def stamp(t): return f'<span style="position:absolute;top:8px;inset-inline-end:10px;transform:rotate(-6deg);padding:2px 10px;border:2px solid {DANGER};border-radius:8px;color:{DANGER};background:#FFFFFF;font-weight:800;font-size:13px;white-space:nowrap;">{t}</span>'
def acard(name,sub,color,txt,st,date,note=None,restore=False,debt=False):
    band=f'<div style="width:60px;flex-shrink:0;background:{color};border-inline-end:2px solid {INK};display:flex;justify-content:center;padding-top:12px;box-sizing:border-box;">{logo(txt)}</div>'
    n=f'<p style="margin:0;font-size:14px;font-weight:700;line-height:1.3;">{note}</p>' if note else ''
    rs=f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 16px;border-radius:22px;border:2px solid {INK};background:#FFFFFF;color:{INK};font-weight:800;font-size:15px;display:inline-flex;align-items:center;">החזרה לארנק</a>' if restore else ''
    dl=f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 16px;border-radius:22px;border:2px solid {DANGER};background:#FFFFFF;color:{DANGER};font-weight:800;font-size:15px;display:inline-flex;align-items:center;gap:6px;">{ico("M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",18,2.2)}מחיקה</a>'
    if debt: dl=f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 18px;border-radius:22px;border:2px solid {INK};background:{Y};color:{INK};box-shadow:0 3px 0 {INK};font-weight:800;font-size:15px;display:inline-flex;align-items:center;margin-bottom:3px;">לתשלום החוב</a>'
    return f'''<article style="flex-shrink:0;position:relative;display:flex;background:{CREAM};border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};overflow:hidden;">{band}<div style="flex:1;min-width:0;padding:12px 14px 12px;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:17px;padding-inline-end:96px;">{name}</span><span style="font-size:13px;font-weight:700;color:{SOFT};">{sub} · <bdi>{date}</bdi></span>{n}<div style="display:flex;gap:8px;margin-top:2px;">{rs}{dl}</div></div>{stamp(st)}</article>'''
def mon(t): return f'<h2 style="margin:4px 4px 0;font-family:\'Secular One\',sans-serif;font-size:18px;font-weight:400;">{t}</h2>'
back=f'<a href="#" aria-label="חזרה" style="width:48px;height:48px;flex-shrink:0;border-radius:50%;border:2px solid {INK};background:#FFFFFF;box-shadow:0 3px 0 {INK};display:flex;align-items:center;justify-content:center;">{ico("M9 6l6 6-6 6",22,2.4)}</a>'
def archbody():
    return (f'<header style="display:flex;align-items:center;gap:12px;">{back}<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:30px;line-height:1.05;font-weight:400;">ארכיון</h1></header>'
    +f'<p style="margin:0;font-size:14px;font-weight:700;line-height:1.35;">חברויות שהסתיימו, שעזבתם, שהוסרתם מהן או שהסתרתם. הכרטיס נשאר כאן עד שתמחקו אותו. מהחדש לישן, לפי תאריך הארכוב.</p>'
    +lst([mon('אוקטובר 2026'),
    acard('מועדון הכדורגל השכונתי','שחקן','#7CC4FF','מ','הוסרת','03.10.2026','יתרת חוב: <bdi>₪80</bdi>. אפשר למחוק את הכרטיס אחרי סילוק החוב.',debt=True),
    mon('יוני 2026'),
    acard('חוג ציור למבוגרים','מנוי סמסטר','#FF8FB8','ח','פג תוקף','30.06.2026'),
    mon('מאי 2026'),
    acard('קבוצת הריצה של יום שישי','חבר','#FF9B6B','ק','עזבת','14.05.2026'),
    mon('פברואר 2026'),
    acard('מועדון השחמט','חבר','#5EE0C0','ש','הוסתר','02.02.2026',restore=True)]))
out['D-WalletArchive']=page('ד · ארנק · ארכיון',1100,archbody(),nav('wallet'))
def opt(t,sub,sel):
    dot=f'<span style="width:22px;height:22px;flex-shrink:0;box-sizing:border-box;border-radius:50%;border:2px solid {INK};background:{INK if sel else "#FFFFFF"};box-shadow:inset 0 0 0 4px #FFFFFF;margin-top:2px;"></span>'
    return f'<div role="radio" aria-checked="{str(sel).lower()}" style="display:flex;gap:10px;padding:10px 12px;border:2px solid {INK};border-radius:16px;background:{Y if sel else "#FFFFFF"};">{dot}<div style="display:flex;flex-direction:column;gap:2px;"><span style="font-weight:800;font-size:16px;">{t}</span><span style="font-size:14px;font-weight:600;line-height:1.35;">{sub}</span></div></div>'
dlg=f'''<div style="position:absolute;inset:0;background:rgba(30,22,51,0.6);"></div>
<div role="alertdialog" aria-modal="true" aria-labelledby="dt" style="position:absolute;inset-inline:16px;top:150px;background:#FFFFFF;border:2.5px solid {INK};border-radius:24px;box-shadow:0 4px 0 {INK};padding:18px 16px 16px;display:flex;flex-direction:column;gap:12px;">
<h2 id="dt" style="margin:0;font-family:'Secular One',sans-serif;font-size:22px;font-weight:400;">למחוק את חוג ציור למבוגרים?</h2>
<div role="radiogroup" aria-label="מה למחוק" style="display:flex;flex-direction:column;gap:8px;">{opt("מחיקת הכרטיס בלבד","הכרטיס יוסר מהארנק שלכם. הארגון ממשיך להחזיק את הפרטים שלכם, ואפשר להצטרף שוב.",True)}{opt("מחיקת הכרטיס והסרת המידע שלי","הארגון יסיר את הפרטים האישיים שלכם. נתונים שהחוק מחייב לשמור, כמו קבלות ותשלומים, יישמרו לתקופה הנדרשת וימחקו בסופה.",False)}</div>
<div style="display:flex;gap:10px;"><a href="#" style="flex:1;min-height:48px;box-sizing:border-box;border-radius:24px;border:2px solid {DANGER};background:{DANGER};color:#FFFFFF;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;">מחיקה</a><a href="#" style="flex:1;min-height:48px;box-sizing:border-box;border-radius:24px;border:2px solid {INK};background:#FFFFFF;color:{INK};font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;">ביטול</a></div></div>'''
out['D-WalletDelete']=page('ד · ארנק · אישור מחיקה',844,archbody(),nav('wallet'),dlg)

def srch_field(q,focus=True):
    clear=f'<a href="#" aria-label="ניקוי החיפוש" style="width:44px;height:44px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;">{ico("M6 6l12 12M18 6L6 18",20,2.4)}</a>' if q else ''
    ph=f'<span style="flex:1;font-size:17px;font-weight:800;">{q}</span>' if q else f'<span style="flex:1;font-size:17px;font-weight:600;color:{SOFT};">חיפוש בכל מקום</span>'
    return f'<form role="search" aria-label="חיפוש" style="flex-shrink:0;display:flex;align-items:center;gap:8px;min-height:52px;box-sizing:border-box;padding:0 4px 0 14px;background:#FFFFFF;border:2.5px solid {INK};border-radius:26px;box-shadow:0 3px 0 {INK};"><span style="color:{INK};display:inline-flex;">{ico(SRC,24,2.2)}</span>{ph}{clear}</form>'
def schips(sel):
    items=[('all','הכל'),('mine','החברויות שלי'),('pay','תשלומים'),('disc','ארגונים')]
    return '<div role="radiogroup" aria-label="היקף החיפוש" style="flex-shrink:0;display:flex;flex-wrap:wrap;gap:6px;">'+''.join(chip(l,k==sel) for k,l in items)+'</div>'
def sgroup(title,count,rows,more=True):
    m=f'<a href="#" style="min-height:34px;padding:0 12px;border-radius:17px;border:2px solid {INK};background:#FFFFFF;font-weight:800;font-size:13px;display:inline-flex;align-items:center;">הצגת הכול</a>' if more else ''
    return f'<section style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;"><div style="display:flex;align-items:center;gap:8px;"><h2 style="margin:0 4px;font-family:\'Secular One\',sans-serif;font-size:18px;font-weight:400;flex:1;">{title} <span style="font-family:Assistant,sans-serif;font-size:14px;font-weight:800;">({count})</span></h2>{m}</div><div style="background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};overflow:hidden;">{rows}</div></section>'
def hit(lg,title,sub,end,last=False):
    return f'<a href="#" style="min-height:60px;box-sizing:border-box;padding:8px 12px;display:flex;align-items:center;gap:10px;border-bottom:{"none" if last else "1.5px solid #EDE6D6"};">{lg}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;line-height:1.25;">{title}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{end}</a>'
def mk(t): return f'<mark style="background:{Y};color:{INK};border-bottom:2px solid {INK};padding:0 2px;border-radius:3px;">{t}</mark>'
chev=f'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg>'
def amt(v): return f'<bdi style="font-weight:800;font-size:16px;">{v}</bdi>'
def recent(t): return f'<div style="display:flex;align-items:center;min-height:48px;border-bottom:1.5px solid #EDE6D6;"><a href="#" style="flex:1;min-height:48px;display:flex;align-items:center;gap:10px;padding:0 12px;font-weight:700;font-size:16px;"><span style="color:{SOFT};display:inline-flex;">{ico("M12 7v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v4h-4",20,2.2)}</span>{t}</a><a href="#" aria-label="הסרה מהחיפושים האחרונים: {t}" style="width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;color:{SOFT};">{ico("M6 6l12 12M18 6L6 18",18,2.4)}</a></div>'
def quick(t,sub,d): return f'<a href="#" style="min-height:56px;box-sizing:border-box;padding:8px 12px;display:flex;align-items:center;gap:12px;background:#FFFFFF;border:2px solid {INK};border-radius:16px;box-shadow:0 3px 0 {INK};"><span style="width:40px;height:40px;border-radius:50%;background:{Y};border:2px solid {INK};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">{ico(d,22,2.2)}</span><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{t}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{chev}</a>'
hint=f'<p style="margin:0 4px;font-size:14px;font-weight:700;line-height:1.35;flex-shrink:0;">אפשר לחפש לפי שם, מילה, סכום (120) או תאריך.</p>'
out['D-Search']=page('ד · חיפוש',844,srch_field('')+schips('all')+hint
 +f'<section style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;"><div style="display:flex;align-items:center;"><h2 style="margin:0 4px;font-family:\'Secular One\',sans-serif;font-size:18px;font-weight:400;flex:1;">חיפושים אחרונים</h2><a href="#" style="min-height:44px;padding:0 8px;display:inline-flex;align-items:center;font-weight:800;font-size:14px;text-decoration:underline;">ניקוי הכול</a></div><div style="background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};overflow:hidden;">{recent("דמי ועד")}{recent("120")}{recent("שחמט")}</div></section>'
 +f'<section style="flex-shrink:0;display:flex;flex-direction:column;gap:8px;"><h2 style="margin:0 4px;font-family:\'Secular One\',sans-serif;font-size:18px;font-weight:400;">קיצורים</h2>{quick("חובות פתוחים","תשלומים שמחכים לכם","M12 8v5M12 16.5v.5M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0")}{quick("אירועים קרובים","מכל החברויות","M4 6h16v14H4zM4 10h16M8 3v4M16 3v4")}</section>',nav('search'))
L1=logo('ו',36,'#FF9B6B'); L2=logo('פ',36,'#5EE0C0'); L3=logo('ב',36,'#B9A4FF')
out['D-SearchResults']=page('ד · חיפוש · תוצאות',1000,srch_field('120')+schips('all')
 +sgroup('תשלומים',3,hit(L1,'דמי ועד לאוקטובר','ועד בית · 08.10.2026 · לתשלום',amt(mk('₪120')))+hit(L1,'דמי ועד לספטמבר','ועד בית · 07.09.2026 · שולם',amt(mk('₪120')))+hit(L2,'מנוי חודשי','פיט סיטי · 01.09.2026 · שולם',amt(mk('₪120')),True))
 +sgroup('הודעות',1,hit(L1,'דמי ועד לאוקטובר: '+mk('₪120')+'. לתשלום עד 15.10.','ועד בית · היום 09:10',chev,True),False)
 +sgroup('מידע מהארגון',1,hit(L1,'תעריף דמי ועד: '+mk('₪120')+' לחודש','ועד בית · תקנון',chev,True),False),nav('search'))
def orgc(name,color,txt,sub,price,tag,btn='לפרטים'):
    return f'<article style="flex-shrink:0;display:flex;background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};overflow:hidden;"><div style="width:60px;flex-shrink:0;background:{color};border-inline-end:2px solid {INK};display:flex;justify-content:center;padding-top:12px;box-sizing:border-box;">{logo(txt)}</div><div style="flex:1;min-width:0;padding:10px 14px 12px;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:17px;">{name}</span><span style="font-size:13px;font-weight:700;color:{SOFT};">{sub} · {price}</span><p style="margin:0;font-size:15px;font-weight:600;line-height:1.35;">{tag}</p><a href="#" style="align-self:flex-start;min-height:44px;box-sizing:border-box;padding:0 22px;border-radius:22px;border:2px solid {INK};background:{Y};color:{INK};box-shadow:0 3px 0 {INK};font-weight:800;font-size:16px;display:inline-flex;align-items:center;margin-bottom:3px;">{btn}</a></div></article>'
out['D-SearchDiscover']=page('ד · חיפוש · גילוי ארגונים',844,srch_field('שחמט')+schips('disc')
 +f'<p style="margin:0 4px;font-size:14px;font-weight:700;line-height:1.35;flex-shrink:0;">מוצגים רק ארגונים שבחרו להיות ציבוריים.</p>'
 +lst([orgc('מועדון השחמט העירוני','#5EE0C0','ש','בית שמש · 84 חברים','חינם','מפגש שבועי לכל הגילאים. מדריכים סבלניים, טורנירים חודשיים, ותמיד קפה חם.'),
 orgc('אקדמיית השחמט לנוער','#7CC4FF','א','בית שמש · 41 חברים','₪60 לחודש','מסלול מסודר לילדים ולנוער, מהצעד הראשון ועד תחרויות ארציות.'),
 orgc('חוג שחמט לגיל הזהב','#FF8FB8','ח','ירושלים · 22 חברים','₪30 לחודש','פגישות בוקר רגועות, משחקים וצחוקים. אין צורך בניסיון.')]),nav('search'))
# org page
def sec(t,body): return f'<section style="flex-shrink:0;background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:12px 14px 14px;display:flex;flex-direction:column;gap:8px;"><h2 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:19px;font-weight:400;">{t}</h2>{body}</section>'
def plan(n,sub,price): return f'<div style="display:flex;align-items:center;gap:10px;min-height:52px;padding:6px 0;border-top:1.5px solid #EDE6D6;"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{n}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div><span style="font-weight:800;font-size:16px;">{price}</span></div>'
def fact(t,d): return f'<span style="display:inline-flex;align-items:center;gap:6px;min-height:34px;box-sizing:border-box;padding:0 12px;border-radius:17px;border:2px solid {INK};background:{CREAM};font-weight:800;font-size:14px;">{ico(d,16,2.4)}{t}</span>'
hero=f'<section style="flex-shrink:0;background:#FFFFFF;border:2.5px solid {INK};border-radius:24px;box-shadow:0 4px 0 {INK};overflow:hidden;"><div style="height:64px;background:#5EE0C0;border-bottom:2px solid {INK};"></div><div style="padding:0 16px 16px;display:flex;flex-direction:column;gap:6px;"><div style="margin-top:-34px;">{logo("ש",68)}</div><h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:26px;line-height:1.1;font-weight:400;">מועדון השחמט העירוני</h1><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;">{fact("בית שמש","M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z")}{fact("84 חברים","M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0")}{fact("מאז 2018","M4 6h16v14H4zM4 10h16")}</div></div></section>'
body=header('',back).replace('<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:30px;line-height:1.05;font-weight:400;flex:1;"></h1>','<span style="flex:1;font-weight:800;font-size:16px;">פרטי הארגון</span>')+hero
body+=sec('למה כיף אצלנו',f'<p style="margin:0;font-size:16px;font-weight:600;line-height:1.5;">אנחנו מתכנסים כל יום שלישי בערב, ילדים, מבוגרים ומי שרק התחיל ללמוד איך זזים הכלים. תמיד יהיה מי שישחק איתכם ברמה שלכם, ותמיד יהיה קפה. פעם בחודש עושים טורניר קטן ואוכלים יחד אחרי.</p>')
body+=sec('מה עושים אצלנו',f'<div style="display:flex;flex-wrap:wrap;gap:6px;">{fact("מפגש שבועי, יום ג׳ 19:00","M4 6h16v14H4zM4 10h16M8 3v4M16 3v4")}{fact("טורניר חודשי","M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3")}{fact("הדרכה למתחילים","M3 12l9-5 9 5-9 5zM7 14v4c0 1 2.5 2 5 2s5-1 5-2v-4")}</div>')
body+=sec('מסלולי חברות',plan('חבר','כניסה למפגשים ולטורנירים','חינם').replace('border-top:1.5px solid #EDE6D6;','')+plan('חבר תומך','בנוסף: תרומה קבועה לציוד ולכיבוד','₪30 לחודש'))
body+=f'<a href="#" style="flex-shrink:0;min-height:52px;box-sizing:border-box;border-radius:26px;border:2.5px solid {INK};background:{Y};color:{INK};box-shadow:0 3px 0 {INK};font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;margin-bottom:3px;">בקשת הצטרפות</a><p style="margin:0 4px 12px;font-size:13px;font-weight:700;text-align:center;flex-shrink:0;">ההצטרפות כפופה לאישור הארגון.</p>'
out['D-OrgPage']=page('ד · עמוד ארגון ציבורי',1180,body,nav('search'))
# empty search
emp=f'<section style="flex-shrink:0;background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:14px;display:flex;flex-direction:column;gap:4px;"><span style="font-weight:800;font-size:17px;">לא מצאנו ארגון בשם הזה</span><span style="font-size:14px;font-weight:600;color:{SOFT};line-height:1.35;">בדקו את האיות, או נסו מילה אחרת.</span></section>'
mk2=f'<section style="flex-shrink:0;background:{CREAM};border:2px dashed {INK};border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:8px;"><span style="font-family:\'Secular One\',sans-serif;font-size:19px;">אין ארגון כזה? הקימו אחד</span><span style="font-size:14px;font-weight:600;line-height:1.35;">גבייה, הודעות וניהול חברים במקום אחד, גם לקבוצה קטנה.</span><a href="#" style="align-self:flex-start;min-height:44px;box-sizing:border-box;padding:0 20px;border-radius:22px;border:2px solid {INK};background:{INK};color:#FFFFFF;font-weight:800;font-size:16px;display:inline-flex;align-items:center;">להקמת ארגון</a></section>'
out['D-SearchEmpty']=page('ד · חיפוש · אין תוצאות',844,srch_field('בריכה')+schips('disc')+emp+mk2,nav('search'))

# ---------- auth
def lab(t,opt=False):
    o=f' <span style="font-weight:700;font-size:13px;color:{SOFT};">(לא חובה)</span>' if opt else ''
    return f'<span style="font-weight:800;font-size:15px;">{t}{o}</span>'
def fld(label,val='',ltr=False,ph='',opt=False,err=False,hint=''):
    v=f'<span style="flex:1;font-size:18px;font-weight:700;{"direction:ltr;text-align:start;" if ltr else ""}">{val}</span>' if val else f'<span style="flex:1;font-size:17px;font-weight:600;color:{SOFT};{"direction:ltr;text-align:start;" if ltr else ""}">{ph}</span>'
    h=f'<span style="font-size:13px;font-weight:600;color:{SOFT};line-height:1.3;">{hint}</span>' if hint else ''
    return f'<div style="display:flex;flex-direction:column;gap:6px;">{lab(label,opt)}<div style="min-height:52px;box-sizing:border-box;padding:0 14px;display:flex;align-items:center;background:#FFFFFF;border:2px solid {INK};border-radius:14px;">{v}</div>{h}</div>'
def pbtn(t,dis=False):
    if dis: return f'<a href="#" role="button" aria-disabled="true" style="min-height:52px;box-sizing:border-box;border-radius:26px;border:2px solid {INK};background:#DDD6EA;color:{INK};font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;">{t}</a>'
    return f'<a href="#" style="min-height:52px;box-sizing:border-box;border-radius:26px;border:2.5px solid {INK};background:{Y};color:{INK};box-shadow:0 3px 0 {INK};font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;margin-bottom:3px;">{t}</a>'
def sbtn(t): return f'<a href="#" style="min-height:52px;box-sizing:border-box;border-radius:26px;border:2px solid {INK};background:#FFFFFF;color:{INK};font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;">{t}</a>'
def sheetc(inner): return f'<section style="flex-shrink:0;background:#FFFFFF;border:2.5px solid {INK};border-radius:24px;box-shadow:0 4px 0 {INK};padding:16px;display:flex;flex-direction:column;gap:14px;">{inner}</section>'
def minicard(top,color,txt,rot):
    return f'<div style="position:absolute;inset-inline-start:50%;margin-inline-start:-140px;top:{top}px;width:280px;height:84px;box-sizing:border-box;background:{CREAM};border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};transform:rotate({rot}deg);"><div style="height:100%;border-radius:18px;overflow:hidden;"><div style="height:52px;background:{color};border-bottom:2px solid {INK};display:flex;align-items:center;gap:10px;padding:0 12px;">{logo(txt,34)}<span style="flex:1;height:10px;border-radius:5px;background:{INK};opacity:.85;max-width:120px;"></span></div></div></div>'
lang=f'<a href="#" style="align-self:flex-end;min-height:34px;box-sizing:border-box;padding:0 12px;border-radius:17px;border:2px solid {INK};background:#FFFFFF;font-weight:800;font-size:13px;display:inline-flex;align-items:center;gap:6px;">{ico("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",16,2.2)}עברית</a>'
hero=f'<div style="flex-shrink:0;position:relative;height:196px;">{minicard(8,"#B9A4FF","ב",-3)}{minicard(52,"#5EE0C0","פ",2)}{minicard(96,"#FF9B6B","ו",-1)}</div>'
wm=f'<div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;"><bdi style="align-self:flex-start;font-family:\'Secular One\',sans-serif;font-size:20px;">MemberHub</bdi><h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:32px;line-height:1.1;font-weight:400;text-wrap:balance;">כל החברויות שלך, בארנק אחד</h1></div>'
cc=f'<div style="min-width:92px;min-height:52px;box-sizing:border-box;padding:0 12px;display:flex;align-items:center;gap:6px;background:#FFFFFF;border:2px solid {INK};border-radius:14px;direction:ltr;font-weight:800;font-size:17px;">+972{ico("M6 9l6 6 6-6",18,2.4)}</div>'
phone=f'<div style="display:flex;flex-direction:column;gap:6px;">{lab("מספר טלפון")}<div style="display:flex;gap:8px;direction:ltr;">{cc}<div style="flex:1;min-height:52px;box-sizing:border-box;padding:0 14px;display:flex;align-items:center;background:#FFFFFF;border:2px solid {INK};border-radius:14px;font-size:18px;font-weight:600;color:{SOFT};">050-123-4567</div></div><span style="font-size:13px;font-weight:600;color:{SOFT};">אין צורך בסיסמה. נשלח לכם קוד ב-SMS, ובעזרתו תיכנסו.</span></div>'
legal=f'<p style="margin:0;font-size:13px;font-weight:700;text-align:center;display:flex;justify-content:center;gap:16px;"><a href="#" style="min-height:44px;display:inline-flex;align-items:center;text-decoration:underline;">תנאי שימוש</a><a href="#" style="min-height:44px;display:inline-flex;align-items:center;text-decoration:underline;">מדיניות פרטיות</a></p>'
out['D-Welcome']=page('ד · כניסה והרשמה',844,lang+wm+hero+sheetc(phone+pbtn('המשך')+'<div style="display:flex;align-items:center;gap:10px;"><span style="flex:1;height:2px;background:#EDE6D6;"></span><span style="font-weight:800;font-size:14px;color:'+SOFT+';">או</span><span style="flex:1;height:2px;background:#EDE6D6;"></span></div>'+sbtn('המשך עם מייל'))+legal,'')
def cells(digits,err=False,active=None):
    out_=''
    for i in range(6):
        d=digits[i] if i<len(digits) else ''
        act=(i==len(digits)) and not err and active
        bc=DANGER if err else INK
        bw=3 if act else 2
        bg='#FFF9EC' if act else '#FFFFFF'
        caret=f'<span style="width:2px;height:26px;background:{INK};"></span>' if act else ''
        out_+=f'<span style="flex:1;height:60px;box-sizing:border-box;border:{bw}px solid {bc};border-radius:14px;background:{bg};display:flex;align-items:center;justify-content:center;font-family:\'Secular One\',sans-serif;font-size:28px;">{d}{caret}</span>'
    return f'<div style="display:flex;gap:8px;direction:ltr;" role="group" aria-label="קוד אימות בן 6 ספרות">{out_}</div>'
def vbody(digits,err=False):
    msg=f'<div role="alert" style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:2px solid {DANGER};border-radius:12px;background:#FFFFFF;color:{DANGER};font-weight:800;font-size:15px;line-height:1.35;"><span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:{DANGER};color:#FFFFFF;display:inline-flex;align-items:center;justify-content:center;font-size:14px;">!</span>הקוד לא נכון. נסו שוב או בקשו קוד חדש.</div>' if err else ''
    full=len(digits)==6
    timer=f'<span style="font-size:15px;font-weight:700;color:{SOFT};text-align:center;">שליחה חוזרת בעוד <bdi>0:42</bdi></span>' if not err else f'<a href="#" style="min-height:44px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;text-decoration:underline;">שליחת קוד חדש</a>'
    return (f'<header style="display:flex;align-items:center;gap:12px;flex-shrink:0;">{back}<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:30px;line-height:1.05;font-weight:400;">הקוד בדרך</h1></header>'
      +sheetc(f'<p style="margin:0;font-size:16px;font-weight:600;line-height:1.4;">שלחנו קוד בן 6 ספרות אל <bdi dir="ltr" style="font-weight:800;white-space:nowrap;">+972 50-123-4567</bdi>. <a href="#" style="font-weight:800;text-decoration:underline;">החלפת מספר</a></p>'+cells(digits,err,True)+msg+pbtn('אימות',dis=not full)+timer))
out['D-Verify']=page('ד · אימות קוד',844,vbody('483'),'')
out['D-VerifyError']=page('ד · אימות קוד · שגיאה',844,vbody('483920',True),'')
chips3=lambda: '<div role="radiogroup" aria-label="לשון הפנייה" style="display:flex;flex-wrap:wrap;gap:6px;">'+chip('זכר',True)+chip('נקבה',False)+chip('מעדיף לא לשתף',False)+'</div>'
chk=f'<div style="display:flex;align-items:flex-start;gap:10px;"><span role="checkbox" aria-checked="true" style="width:28px;height:28px;flex-shrink:0;box-sizing:border-box;border:2px solid {INK};border-radius:8px;background:{INK};color:{Y};display:inline-flex;align-items:center;justify-content:center;">{ico(CHECK,18,3)}</span><span style="font-size:15px;font-weight:600;line-height:1.4;">אני מסכים/ה ל<a href="#" style="text-decoration:underline;font-weight:800;">תנאי השימוש</a> ול<a href="#" style="text-decoration:underline;font-weight:800;">מדיניות הפרטיות</a>.</span></div>'
prof=(f'<header style="flex-shrink:0;"><h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:30px;line-height:1.05;font-weight:400;">כמעט סיימנו</h1><p style="margin:6px 0 0;font-size:15px;font-weight:700;">איך נקרא לכם?</p></header>'
  +sheetc(fld('שם פרטי','דנה')+fld('שם משפחה','כהן')+f'<div style="display:flex;flex-direction:column;gap:6px;">{lab("מין")}{chips3()}<span style="font-size:13px;font-weight:600;color:{SOFT};line-height:1.3;">משמש לפנייה אליכם בלשון הנכונה. ארגון שצריך את המידע יבקש אותו בהצטרפות, ותוכלו לאשר או לסרב.</span></div>'+f'<div style="display:flex;flex-direction:column;gap:6px;">{lab("שפה להודעות")}<div role="radiogroup" aria-label="שפה להודעות" style="display:flex;gap:6px;">{chip("עברית",True)}{chip("English",False)}{chip("עוד שפות",False)}</div></div>'+fld('מייל','dana@example.com',ltr=True,opt=True,hint='לקבלות ולשחזור גישה.')+chk+pbtn('סיום והמשך')))
out['D-Profile']=page('ד · פרטים ראשונים',844,prof,'')

# ---------- labels exploration
def pagew(title,w,h,body):
    return f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:inherit;text-decoration:none}}
</style>
</helmet>
<div dir="rtl" style="width:{w}px;height:{h}px;box-sizing:border-box;padding:28px;background:{Y};color:{INK};font-family:'Assistant',system-ui,sans-serif;font-size:16px;overflow:hidden;display:flex;flex-direction:column;gap:22px;">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
HEART='M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z'
SPROUT='M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 16c0-3-2-5-6-5 0 3 2 5 6 5z'
HAND='M8 12V6a1.5 1.5 0 0 1 3 0v5M11 10V4.5a1.5 1.5 0 0 1 3 0V10M14 10V6a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 14'
CAL='M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4'
HOUR='M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2'
STAR='M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'
ROS='M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 13.2L7 21l5-3 5 3-1.5-7.8'
LABELS=[('תומך',HEART,'#FF8FB8'),('מייסד',SPROUT,'#5EE0C0'),('מתנדב',HAND,'#FF9B6B'),('מארגן אירועים',CAL,'#B9A4FF'),('חבר ותיק',HOUR,'#7CC4FF')]
def la(n,d,c,rot=0): return f'<span style="display:inline-flex;align-items:center;gap:6px;min-height:40px;box-sizing:border-box;padding:0 14px 0 12px;border:2.5px solid {INK};border-radius:10px;background:{c};box-shadow:0 3px 0 {INK};transform:rotate({rot}deg);font-weight:800;font-size:16px;">{ico(d,20,2.2)}{n}</span>'
def lb(n,d,c): return f'<span style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;width:92px;"><span style="width:62px;height:62px;box-sizing:border-box;border-radius:50%;border:2.5px solid {INK};background:{c};box-shadow:0 3px 0 {INK};display:flex;align-items:center;justify-content:center;"><span style="width:48px;height:48px;box-sizing:border-box;border-radius:50%;border:2px dashed {INK};display:flex;align-items:center;justify-content:center;">{ico(d,26,2.2)}</span></span><span style="font-weight:800;font-size:14px;text-align:center;line-height:1.15;">{n}</span></span>'
def lc(n,d,c): return f'<span style="display:inline-flex;align-items:center;gap:8px;min-height:40px;box-sizing:border-box;padding:0 14px 0 4px;border:2px solid {INK};border-radius:20px;background:#FFFFFF;font-weight:800;font-size:15px;"><span style="width:30px;height:30px;border-radius:50%;background:{c};border:2px solid {INK};box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;">{ico(d,16,2.4)}</span>{n}</span>'
def lrow(title,sub,items):
    return f'<section style="background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:14px 16px;display:flex;flex-direction:column;gap:10px;"><div><span style="font-family:\'Secular One\',sans-serif;font-size:19px;">{title}</span> <span style="font-size:14px;font-weight:700;color:{SOFT};">{sub}</span></div><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;">{items}</div></section>'
rots=[-3,2,-2,3,-1]
rowA=''.join(la(n,d,c,rots[i]) for i,(n,d,c) in enumerate(LABELS))
rowB=''.join(lb(n,d,c) for n,d,c in LABELS)
rowC=''.join(lc(n,d,c) for n,d,c in LABELS)
def wcard(ind,cap):
    return f'<div style="display:flex;flex-direction:column;gap:8px;width:300px;"><div style="position:relative;height:96px;box-sizing:border-box;background:{CREAM};border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};overflow:hidden;"><div style="height:60px;background:#5EE0C0;border-bottom:2px solid {INK};display:flex;align-items:center;gap:10px;padding:0 12px;">{logo("פ",40)}<div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:17px;">פיט סיטי</span><span style="font-size:13px;font-weight:700;">מנוי שנתי</span></div>{ind}</div><div style="padding:6px 12px;font-size:13px;font-weight:700;color:{SOFT};">מס׳ חבר 2207 · מאז 2022</div></div><span style="font-weight:800;font-size:14px;">{cap}</span></div>'
indA=f'<span role="img" aria-label="יש לך תוויות בארגון הזה" style="width:34px;height:34px;box-sizing:border-box;border-radius:50%;background:{INK};color:{Y};display:inline-flex;align-items:center;justify-content:center;border:2px solid {INK};">{ico(STAR,20,2)}</span>'
indB=f'<span role="img" aria-label="יש לך 3 תוויות בארגון הזה" style="position:relative;width:34px;height:34px;box-sizing:border-box;border-radius:50%;background:{Y};border:2px solid {INK};display:inline-flex;align-items:center;justify-content:center;">{ico(ROS,20,2)}<span style="position:absolute;top:-8px;inset-inline-end:-8px;min-width:18px;height:18px;border-radius:9px;background:{INK};color:#FFFFFF;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-sizing:border-box;">3</span></span>'
indC=f'<span role="img" aria-label="תוויות: תומך, מתנדב ועוד 1" style="display:inline-flex;align-items:center;"><span style="width:30px;height:30px;box-sizing:border-box;border-radius:50%;background:#FF8FB8;border:2px solid {INK};display:inline-flex;align-items:center;justify-content:center;">{ico(HEART,16,2.4)}</span><span style="margin-inline-start:-8px;width:30px;height:30px;box-sizing:border-box;border-radius:50%;background:#FF9B6B;border:2px solid {INK};display:inline-flex;align-items:center;justify-content:center;">{ico(HAND,16,2.4)}</span><span style="margin-inline-start:-8px;min-width:30px;height:30px;box-sizing:border-box;border-radius:15px;background:#FFFFFF;border:2px solid {INK};display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;padding:0 4px;">+1</span></span>'
wrow=f'<section style="background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:14px 16px;display:flex;flex-direction:column;gap:12px;"><div><span style="font-family:\'Secular One\',sans-serif;font-size:19px;">בארנק</span> <span style="font-size:14px;font-weight:700;color:{SOFT};">איך הכרטיס מרמז שיש תוויות, בלי להעמיס</span></div><div style="display:flex;gap:18px;flex-wrap:wrap;">{wcard(indA,"א · כוכב: יש תוויות (בלי ספירה)")}{wcard(indB,"ב · עיטור עם מספר")}{wcard(indC,"ג · התוויות הראשונות ועוד כמה")}</div></section>'
det=f'<section style="width:390px;flex-shrink:0;background:#FFFFFF;border:2.5px solid {INK};border-radius:24px;box-shadow:0 4px 0 {INK};padding:14px 16px;display:flex;flex-direction:column;gap:10px;"><span style="font-family:\'Secular One\',sans-serif;font-size:19px;">התוויות שלי בפיט סיטי</span><div style="display:flex;flex-wrap:wrap;gap:12px;">{la("תומך",HEART,"#FF8FB8",-2)}{la("מתנדב",HAND,"#FF9B6B",2)}{la("חבר ותיק",HOUR,"#7CC4FF",-1)}</div><div style="border-top:1.5px solid #EDE6D6;padding-top:8px;display:flex;flex-direction:column;gap:2px;"><span style="font-weight:800;font-size:16px;">תומך</span><span style="font-size:14px;font-weight:600;color:{SOFT};line-height:1.35;">הוענקה ב-03.2025, אוטומטית, בזכות מסלול "חבר תומך".</span></div></section>'
open_=f'<section style="background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:14px 16px;display:flex;gap:18px;align-items:flex-start;"><div style="display:flex;flex-direction:column;gap:6px;flex:1;"><span style="font-family:\'Secular One\',sans-serif;font-size:19px;">בכרטיס הפתוח</span><span style="font-size:14px;font-weight:700;color:{SOFT};line-height:1.4;">כל התוויות מוצגות. לחיצה על תווית פותחת הסבר: מה היא, מתי הוענקה, ואם היא אוטומטית או ידנית. אין סדר או דירוג בין התוויות.</span></div>{det}</section>'
body=f'<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:32px;font-weight:400;">תוויות: אפשרויות עיצוב</h1>'+lrow('א · חותמת','מסובבת קלות, בשפה של הכרטיסים',rowA)+lrow('ב · מדליה','עגולה, עם טבעת מקווקווה',rowB)+lrow('ג · שבב','קטן ושקט, מתאים לרשימות',rowC)+wrow+open_
out['D-Labels']=pagew('ד · תוויות · אפשרויות',1180,1000,body)

# ---------- join request, sent, empty wallet
GEAR=open('/home/claude/gen/gear.svg').read()
def tg(on):
    bg='#00B67A' if on else '#B8AFC7'; pos='inset-inline-end:2px;' if on else 'inset-inline-start:2px;'
    return f'<span role="switch" aria-checked="{str(on).lower()}" style="width:52px;height:30px;flex-shrink:0;box-sizing:border-box;border-radius:15px;border:2px solid {INK};background:{bg};position:relative;"><span style="position:absolute;top:2px;{pos}width:22px;height:22px;border-radius:50%;background:#FFFFFF;border:2px solid {INK};box-sizing:border-box;"></span></span>'
def frow(l,sub,right,last=False): return f'<div style="display:flex;align-items:center;gap:12px;min-height:56px;box-sizing:border-box;padding:8px 14px;border-bottom:{"none" if last else "1.5px solid #EDE6D6"};"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{l}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{right}</div>'
req=f'<span style="padding:3px 10px;border-radius:999px;background:#E3DDFF;border:2px solid {INK};font-size:12px;font-weight:800;">חובה</span>'
orgrow=f'<div style="flex-shrink:0;display:flex;align-items:center;gap:12px;">{logo("ש",48,"#5EE0C0")}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:18px;">מועדון השחמט העירוני</span><span style="font-size:13px;font-weight:700;color:{SOFT};">בית שמש · 84 חברים</span></div></div>'
fields=f'<section style="flex-shrink:0;background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};overflow:hidden;">{frow("שם","דנה כהן",req)}{frow("טלפון","הארגון ביקש את זה",req)}{frow("מייל","dana@example.com",tg(False))}{frow("תמונת פרופיל","לא הועלתה",tg(False),True)}</section>'
note=f'<section style="flex-shrink:0;background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:12px 14px;display:flex;flex-direction:column;gap:8px;"><div><span style="font-family:\'Secular One\',sans-serif;font-size:19px;">כמה מילים עליכם</span> <span style="font-weight:700;font-size:14px;color:{SOFT};">(לא חובה)</span></div><div style="min-height:104px;box-sizing:border-box;padding:10px 12px;background:#FFFFFF;border:2px solid {INK};border-radius:14px;font-size:16px;font-weight:600;color:{SOFT};line-height:1.4;">למה מתאים לכם להצטרף? מה אתם מחפשים אצלנו? אפשר גם להשאיר ריק.</div><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;color:{SOFT};"><span>המנהל יראה את זה בבקשה שלכם.</span><bdi>0/300</bdi></div></section>'
out['D-JoinRequest']=page('ד · בקשת הצטרפות',844,f'<header style="display:flex;align-items:center;gap:12px;flex-shrink:0;">{back}<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:28px;line-height:1.05;font-weight:400;">בקשת הצטרפות</h1></header>'+orgrow+f'<h2 style="margin:0 4px;font-family:\'Secular One\',sans-serif;font-size:19px;font-weight:400;flex-shrink:0;">מה יראו עליכם כאן</h2>'+fields+note+pbtn('שליחת בקשה')+f'<p style="margin:0 4px;font-size:13px;font-weight:700;text-align:center;flex-shrink:0;">ההצטרפות כפופה לאישור הארגון. תקבלו הודעה כשתהיה תשובה.</p>','')
stampbig=f'<div style="align-self:center;transform:rotate(-6deg);padding:6px 22px;border:3px solid {INK};border-radius:14px;background:{Y if False else "#FFFFFF"};box-shadow:0 4px 0 {INK};font-family:\'Secular One\',sans-serif;font-size:34px;">נשלח</div>'
sent=f'<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;">{stampbig}<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:28px;line-height:1.15;font-weight:400;text-align:center;">הבקשה שלכם נשלחה למועדון השחמט העירוני</h1><p style="margin:0;font-size:16px;font-weight:700;line-height:1.4;text-align:center;">תקבלו הודעה כשהמנהל יענה. בינתיים אפשר להמשיך לגלות ארגונים.</p><div style="display:flex;flex-direction:column;gap:10px;">{pbtn("חזרה לחיפוש")}{sbtn("לארנק")}</div></div>'
out['D-JoinSent']=page('ד · בקשה נשלחה',844,sent,nav('search'))
greet=f'<section style="flex-shrink:0;background:#FFFFFF;border:2.5px solid {INK};border-radius:24px;box-shadow:0 4px 0 {INK};padding:14px 14px 14px 16px;display:flex;align-items:flex-start;gap:12px;margin-inline:4px;"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;"><span style="font-family:\'Secular One\',sans-serif;font-size:22px;line-height:1.1;">שלום דנה</span><span style="font-size:15px;font-weight:700;line-height:1.3;">שמחים שהצטרפתם! בואו נמלא את הארנק.</span></div><a href="#" aria-label="הגדרות" style="width:34px;height:34px;flex-shrink:0;box-sizing:border-box;border-radius:50%;border:2px solid {INK};background:{CREAM};color:{INK};display:flex;align-items:center;justify-content:center;">{GEAR}</a></section>'
slot=f'<div style="flex-shrink:0;position:relative;height:150px;box-sizing:border-box;border:2.5px dashed {INK};border-radius:22px;background:rgba(255,255,255,0.45);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;"><span aria-hidden="true" style="position:absolute;inset-inline-start:-2px;top:64px;width:12px;height:22px;background:{Y};border:2px solid {INK};border-inline-start:none;border-radius:0 11px 11px 0;"></span><span aria-hidden="true" style="position:absolute;inset-inline-end:-2px;top:64px;width:12px;height:22px;background:{Y};border:2px solid {INK};border-inline-end:none;border-radius:11px 0 0 11px;"></span><span style="font-family:\'Secular One\',sans-serif;font-size:22px;">עוד אין כאן חברויות</span><span style="font-size:15px;font-weight:700;">הכרטיס הראשון שלכם יופיע כאן</span></div>'
cat=lambda t,d: f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 14px 0 10px;border-radius:22px;border:2px solid {INK};background:#FFFFFF;box-shadow:0 3px 0 {INK};display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:15px;margin-bottom:3px;">{ico(d,20,2.2)}{t}</a>'
stack=f'<div style="flex-shrink:0;position:relative;height:158px;">{minicard(0,"#B9A4FF","+",-3)}{minicard(34,"#5EE0C0","+",2)}{minicard(68,"#FF9B6B","+",-1)}</div>'
emp=('<div style="flex:1.1;min-height:16px;"></div>'+f'<div style="flex-shrink:0;"><h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:30px;line-height:1.05;font-weight:400;">החברויות שלי</h1><p style="margin:6px 0 0;font-size:16px;font-weight:700;line-height:1.35;">הכרטיס הראשון שלכם עוד מחכה בחוץ. בואו נמצא אותו.</p></div>'
  +'<div style="flex:1;min-height:16px;"></div>'+stack+'<div style="flex:1;min-height:16px;"></div>'+f'<div style="display:flex;flex-direction:column;gap:10px;flex-shrink:0;">{pbtn("הצטרפות לארגון קיים")}{sbtn("הקמת ארגון חדש")}</div>'
  +'<div style="flex:1.3;min-height:16px;"></div>'+f'<div style="flex-shrink:0;display:flex;flex-direction:column;gap:8px;"><span style="font-family:\'Secular One\',sans-serif;font-size:18px;margin:0 4px;">מה מחפשים?</span><div style="display:flex;flex-wrap:wrap;gap:8px;">{cat("ועד בית","M3 21V8l9-5 9 5v13zM9 21v-6h6v6")}{cat("בית כנסת","M12 3l3 4v14H9V7zM5 21V11l4-2M19 21V11l-4-2")}{cat("חדר כושר","M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12")}{cat("חוגים","M12 3l9 5-9 5-9-5zM7 11v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5")}{cat("מועדונים","M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0")}</div></div>'
  +'<div style="flex:.8;min-height:12px;"></div>'
  +f'<p style="margin:0 4px 16px;font-size:14px;font-weight:700;line-height:1.4;text-align:center;flex-shrink:0;">קיבלתם קישור הזמנה? פתחו אותו, והחברות תופיע כאן.</p>')
out['D-WalletEmpty']=page('ד · ארנק ריק',844,greet+emp,nav('wallet'))
for k,v in out.items(): open(f'/home/claude/project/{k}.dc.html','w',encoding='utf-8').write(v)
c=json.load(open('/home/claude/project/canvas.json',encoding='utf-8'))
pos={'D-Notifications':(7560,844,'ד · הודעות'),'D-NotificationsDone':(8030,844,'ד · הודעות · הושלמו'),'D-WalletEdit':(8500,1000,'ד · ארנק · עריכת סדר'),'D-WalletMove':(8970,844,'ד · ארנק · העברת כרטיס'),'D-WalletArchive':(9440,1100,'ד · ארנק · ארכיון'),'D-WalletDelete':(9910,844,'ד · ארנק · אישור מחיקה'),'D-Search':(10380,844,'ד · חיפוש'),'D-SearchResults':(10850,1000,'ד · חיפוש · תוצאות'),'D-SearchDiscover':(11320,844,'ד · חיפוש · גילוי ארגונים'),'D-OrgPage':(11790,1180,'ד · עמוד ארגון ציבורי'),'D-SearchEmpty':(12260,844,'ד · חיפוש · אין תוצאות'),'D-Welcome':(12730,844,'ד · כניסה והרשמה'),'D-Verify':(13200,844,'ד · אימות קוד'),'D-VerifyError':(13670,844,'ד · אימות קוד · שגיאה'),'D-Profile':(14140,844,'ד · פרטים ראשונים'),'D-Labels':(14610,1000,'ד · תוויות · אפשרויות'),'D-JoinRequest':(15900,844,'ד · בקשת הצטרפות'),'D-JoinSent':(16370,844,'ד · בקשה נשלחה'),'D-WalletEmpty':(16840,844,'ד · ארנק ריק')}
for k,(x,h,t) in pos.items(): c['boards'][k+'.dc.html']={'x':x,'y':340,'w':390,'h':h,'title':t}
json.dump(c,open('/home/claude/project/canvas.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
# NOTE: D-WalletEmpty is now hand-maintained in the viewer; do NOT regenerate it from here (gap:0 column differs from page()).
