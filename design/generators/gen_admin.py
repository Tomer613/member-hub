# Admin desktop boards (static). Run: python3 gen_admin.py  -> writes /home/claude/project/D-Adm*.dc.html
INK='#1E1633'; SOFT='#5A4E70'; CREAM='#FFF9EC'; Y='#FFD84A'; GREEN='#00B67A'; DANGER='#C4223B'; ORG='#5B3DF5'; LINE='#EDE6D6'
def ico(d,s=20,sw=2.2): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg>'
CORE_NAV=[('סקירה','M3 12l9-8 9 8v8H3z'),('חברים','M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0'),('כספים וחיובים','M3 6h18v12H3zM3 10h18'),('פעילויות ואירועים','M3 5h18v16H3zM3 10h18'),('פניות','M4 5h16v11H8l-4 4z'),('הודעות','M4 6h16v12H4zM4 7l8 6 8-6'),('דוחות','M5 20V10M12 20V4M19 20v-7')]
SETTINGS_NAV=[('הגדרות הארגון','M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'),('מראה וצבע','M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a3 3 0 0 0 3-3A9 9 0 0 0 12 3z')]
PACKS={'synagogue':('בית כנסת',[('תפילות ולוח זמנים','M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2'),('תרומות ונדרים','M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z'),('יארצייט','M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z')]),
 'hoa':('ועד בית',[('הוצאות ותקציב','M5 20V10M12 20V4M19 20v-7'),('תקלות ותחזוקה','M14 7l3 3-8 8H6v-3zM13 8l3 3'),('אסיפות והצבעות','M4 5h16v11H8l-4 4z')]),
 'club':('מועדון',[('רמות חברות','M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'),('אירועים והרשמה','M3 5h18v16H3zM3 10h18M8 3v4M16 3v4'),('הטבות','M20 12v8H4v-8M2 7h20v5H2zM12 7v13M12 7c-3 0-4-4-1-4s2 4 1 4zM12 7c3 0 4-4 1-4s-2 4-1 4z')]),
 'gym':('חדר כושר',[('כניסות ובקרת כניסה','M5 12h14M13 6l6 6-6 6'),('שיעורים והזמנות','M3 5h18v16H3zM3 10h18M8 3v4M16 3v4'),('הקפאות מנוי','M8 5v14M16 5v14')])}
def nav_html(active,pack):
    def it(l,d):
        on=l==active
        st=f'background:#FFFFFF;color:{INK};border:2px solid {INK};' if on else 'background:transparent;color:#FFFFFF;border:2px solid transparent;'
        return f'<a href="#" style="height:36px;box-sizing:border-box;padding:0 10px;border-radius:12px;display:flex;align-items:center;gap:8px;font-weight:800;{st}">{ico(d,18)}{l}</a>'
    name,mods=PACKS[pack]
    sep=lambda t:f'<span style="padding:6px 10px 2px;font-size:12px;font-weight:800;opacity:.75;">{t}</span>'
    return ''.join(it(l,d) for l,d in CORE_NAV)+sep('מודולי '+name)+''.join(it(l,d) for l,d in mods)+sep('ארגון')+''.join(it(l,d) for l,d in SETTINGS_NAV)
def shell(title,active,main,h=900,pack='synagogue'):
    items=nav_html(active,pack)
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
.h{{font-family:'Secular One',sans-serif;font-weight:400}}
</style>
</helmet>
<div dir="rtl" style="width:1440px;height:{h}px;box-sizing:border-box;display:flex;background:{Y};color:{INK};font-family:'Assistant',system-ui,sans-serif;font-size:15px;overflow:hidden;">
<aside style="width:232px;flex-shrink:0;box-sizing:border-box;background:{ORG};color:#FFFFFF;border-inline-end:2.5px solid {INK};padding:16px 12px;display:flex;flex-direction:column;gap:14px;">
<div style="display:flex;align-items:center;gap:10px;"><span class="h" style="width:40px;height:40px;border-radius:50%;background:#fff;color:{INK};border:2px solid {INK};display:flex;align-items:center;justify-content:center;font-size:20px;">א</span><div style="display:flex;flex-direction:column;line-height:1.1;"><span class="h" style="font-size:17px;">אור חדש</span><span style="font-size:12px;font-weight:700;opacity:.85;">ניהול · גבאי ראשי</span></div></div>
<nav style="display:flex;flex-direction:column;gap:2px;">{items}</nav>
</aside>
<main style="flex:1;min-width:0;box-sizing:border-box;padding:18px 24px;display:flex;flex-direction:column;gap:14px;overflow:hidden;">
{main}
</main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
def head(t,sub='',actions=''):
    s=f'<span style="font-weight:700;color:{SOFT};">{sub}</span>' if sub else ''
    return f'<header style="display:flex;align-items:center;gap:12px;flex-shrink:0;"><h1 class="h" style="margin:0;font-size:28px;">{t}</h1>{s}<span style="flex:1;"></span>{actions}</header>'
def btn(t,primary=False,danger=False,dis=False):
    bg=ORG if primary else '#FFFFFF'; col='#FFFFFF' if primary else (DANGER if danger else INK); bd=DANGER if danger else INK
    if dis: bg='#DDD5EA'; col=SOFT
    return f'<a href="#" style="height:38px;box-sizing:border-box;padding:0 18px;border-radius:19px;border:2px solid {bd};background:{bg};color:{col};font-weight:800;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 0 {bd};white-space:nowrap;">{t}</a>'
def panel(inner,pad=16,gap=12,extra=''):
    return f'<section style="background:#FFFFFF;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:{pad}px;display:flex;flex-direction:column;gap:{gap}px;{extra}">{inner}</section>'
def h2(t,sub=''):
    s=f'<span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span>' if sub else ''
    return f'<div style="display:flex;flex-direction:column;"><h2 class="h" style="margin:0;font-size:19px;">{t}</h2>{s}</div>'
def tg(on):
    bg=GREEN if on else '#B8AFC7'; pos='inset-inline-end:1px;' if on else 'inset-inline-start:1px;'
    return f'<span style="position:relative;width:46px;height:26px;border-radius:13px;background:{bg};border:2px solid {INK};box-sizing:border-box;flex-shrink:0;display:inline-block;"><span style="position:absolute;top:1px;{pos}width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid {INK};box-sizing:border-box;"></span></span>'
def swrow(t,sub,on,last=False):
    return f'<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:{"none" if last else "1.5px solid "+LINE};"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{t}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{tg(on)}</div>'
def fld(label,val,hint='',h=42,ph=False,ltr=False,opt=False):
    o=f'<span style="font-weight:600;color:{SOFT};"> (לא חובה)</span>' if opt else ''
    c=SOFT if ph else INK; d=' dir="ltr" style="text-align:start;"' if ltr else ''
    hh=f'<span style="font-size:13px;font-weight:600;color:{SOFT};">{hint}</span>' if hint else ''
    return f'<label style="display:flex;flex-direction:column;gap:5px;"><span style="font-weight:800;">{label}{o}</span><span style="min-height:{h}px;box-sizing:border-box;padding:9px 12px;border:2px solid {INK};border-radius:12px;background:#fff;color:{c};font-weight:600;display:flex;align-items:{"flex-start" if h>60 else "center"};line-height:1.35;">{val}</span>{hh}</label>'
def pill(t,bg='#D7F5E8',col=INK): return f'<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:12px;border:2px solid {INK};background:{bg};color:{col};font-weight:800;font-size:12.5px;white-space:nowrap;">{t}</span>'
def radio(on): 
    dot=f'<span style="width:10px;height:10px;border-radius:50%;background:{INK};"></span>' if on else ''
    return f'<span style="width:22px;height:22px;border-radius:50%;border:2px solid {INK};box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;background:#fff;">{dot}</span>'
def opt(t,sub,on,tag=''):
    bg='#FFF6D1' if on else '#FFFFFF'; tg_=pill(tag,Y) if tag else ''
    return f'<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:2px solid {INK};border-radius:16px;background:{bg};{"box-shadow:0 3px 0 "+INK+";" if on else ""}">{radio(on)}<div style="flex:1;display:flex;flex-direction:column;gap:2px;"><span style="font-weight:800;font-size:16px;display:flex;gap:8px;align-items:center;">{t}{tg_}</span><span style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.4;">{sub}</span></div></div>'
def chk(on,t):
    box=f'<span style="width:22px;height:22px;border-radius:6px;border:2px solid {INK};box-sizing:border-box;background:{INK if on else "#fff"};color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">{ico("M5 12.5l4.5 4.5L19 7.5",14,3.2) if on else ""}</span>'
    return f'<span style="display:inline-flex;align-items:center;gap:8px;font-weight:700;">{box}{t}</span>'
def note(t,warn=False):
    bg='#FFE9E6' if warn else '#FFF6D1'; bd=DANGER if warn else INK
    return f'<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:2px solid {bd};border-radius:14px;background:{bg};font-weight:600;font-size:13.5px;line-height:1.45;">{ico("M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",20,2.2)}<span>{t}</span></div>'
def sidemenu(items,active):
    r=''
    for i,t in enumerate(items):
        on=i==active
        r+=f'<div style="min-height:40px;box-sizing:border-box;padding:4px 12px;border-radius:12px;display:flex;align-items:center;border:2px solid {INK if on else "transparent"};background:{"#FFF6D1" if on else "#FFFFFF"};font-weight:800;">{t}</div>'
    return f'<div style="width:230px;flex-shrink:0;background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:10px;display:flex;flex-direction:column;gap:4px;align-self:flex-start;">{r}</div>'
def th(cols): return '<div style="display:flex;gap:12px;padding:8px 12px;border-bottom:2px solid '+INK+';font-weight:800;color:'+SOFT+';font-size:13px;">'+''.join(f'<span style="{w}">{c}</span>' for c,w in cols)+'</div>'
def tr(cells,last=False): return f'<div style="display:flex;gap:12px;align-items:center;padding:10px 12px;border-bottom:{"none" if last else "1.5px solid "+LINE};font-weight:600;">'+''.join(f'<span style="{w}">{c}</span>' for c,w in cells)+'</div>'
SM=['פרטי הארגון','שדות ופרטיות','מה החברים רואים בכרטיס','סוגי חברות וחיובים','תשלומים ותזכורות','פניות ובקשות','צוות והרשאות','הזמנות והצטרפות','חשבון והסכם']
out={}
SAVE=btn('ביטול')+btn('שמירה',True)

# 1. org settings: public + invitation + heading preset
pub=panel(h2('הארגון בחיפוש','האם אנשים שלא הוזמנו יכולים למצוא את הארגון')+swrow('ארגון ציבורי','מופיע בחיפוש ובגילוי ארגונים, ויש לו עמוד ציבורי. כבוי: אפשר להצטרף רק בהזמנה או בקוד.',True)+swrow('הצטרפות באישור מנהל','מי שמבקש להצטרף נכנס לרשימת בקשות, ולא מצטרף מיד.',True)+swrow('להציג את מספר החברים בעמוד הציבורי','',False,True))
inv=panel(h2('משפט ההזמנה','מופיע בראש עמוד הארגון ובהזמנות שנשלחות')+fld('המשפט שלנו','בית כנסת קהילתי בלב השכונה. מזמינים אתכם להצטרף לתפילות, לשיעורים ולאירועים.','72 מתוך 140 תווים',h=70)+fld('פירוט','יש מניין בכל יום, חדר ילדים בשבתות, ארוחות קהילתיות פעם בחודש.','',h=70,opt=True))
def pre(n,sub,on,col): 
    return f'<div style="flex:1;display:flex;flex-direction:column;gap:6px;padding:10px;border:2px solid {INK};border-radius:16px;background:{"#FFF6D1" if on else "#fff"};{"box-shadow:0 3px 0 "+INK+";" if on else ""}"><span style="height:52px;border-radius:10px;border:2px solid {INK};background:{col};display:flex;align-items:center;justify-content:center;font-family:\'Secular One\',sans-serif;font-size:20px;color:#1E1633;">{n}</span><span style="font-weight:800;display:flex;align-items:center;gap:8px;">{radio(on)}{sub}</span></div>'
hd=panel(h2('סגנון כותרת הכרטיס','איך שם הארגון נראה בראש הכרטיס של החבר')+f'<div style="display:flex;gap:10px;">{pre("אור חדש","רגיל",True,"#D7F5E8")}{pre("אור חדש","מודגש",False,ORG)}{pre("אור חדש","מינימלי",False,"#FFF9EC")}</div>')
pv=panel(h2('כך זה נראה בחיפוש')+f'<div style="display:flex;align-items:center;gap:12px;padding:12px;border:2px solid {INK};border-radius:16px;background:#FFF9EC;"><span class="h" style="width:48px;height:48px;border-radius:50%;background:{ORG};color:#fff;border:2px solid {INK};display:flex;align-items:center;justify-content:center;font-size:22px;">א</span><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:17px;">אור חדש</span><span style="font-size:13px;font-weight:600;color:{SOFT};line-height:1.35;">בית כנסת קהילתי בלב השכונה. מזמינים אתכם להצטרף…</span></div>{pill("ציבורי",Y)}</div>'+note('כשהארגון ציבורי, שם, משפט הזמנה, תוויות ציבוריות ומחירי המסלולים נראים לכל. פרטי חברים לעולם לא.'))
out['D-AdmOrgSettings']=shell('ד · הגדרות ארגון · נראות והזמנה','הגדרות הארגון',head('הגדרות הארגון','נראות והזמנה',SAVE)+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{sidemenu(SM,7)}<div style="flex:1;display:flex;flex-direction:column;gap:14px;min-width:0;">{pub}{inv}</div><div style="width:420px;flex-shrink:0;display:flex;flex-direction:column;gap:14px;">{hd}{pv}</div></section>')

# 2/3. wizard
def stepper(cur):
    names=['פרטי הארגון','סוג וחברים','אופן הגבייה','חשבון לקבלת כסף','הזמנת חברים']
    r=''
    for i,n in enumerate(names,1):
        done=i<cur; on=i==cur
        bg=GREEN if done else (Y if on else '#fff')
        c=ico("M5 12.5l4.5 4.5L19 7.5",16,3.2) if done else str(i)
        r+=f'<div style="flex:1;display:flex;align-items:center;gap:8px;"><span style="width:32px;height:32px;border-radius:50%;border:2px solid {INK};background:{bg};display:inline-flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0;">{c}</span><span style="font-weight:{800 if on else 600};color:{INK if (on or done) else SOFT};">{n}</span></div>'
    return f'<div style="display:flex;gap:10px;padding:12px 16px;background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};flex-shrink:0;">{r}</div>'
wz3=panel(h2('איך תגבו כסף מהחברים?','אפשר לשנות בכל שלב. בחירה כאן לא מחייבת להפעיל גבייה')+opt('גבייה דרך המערכת (מומלץ)','החברים משלמים בכרטיס או בהוראת קבע. הכסף נרשם בקופה הוירטואלית של הארגון ומועבר אליכם.',True,'מומלץ')+opt('דיווח ידני בלבד','החברים משלמים מחוץ למערכת (מזומן, העברה). אתם מסמנים חיובים כשולמו או שהם מדווחים ואתם מאשרים.',False)+opt('בלי כסף בכלל','ארגון שאין בו תשלומים, רק רשימת חברים והודעות.',False),pad=20,gap=12,extra='flex:1;')
wz3b=panel(h2('איך הארגון יקבל את הכסף?')+opt('יש לנו חשבון בנק על שם הארגון','נעביר אליו את הכסף ישירות. תתבקשו להזין פרטי חשבון ולעבור אימות קצר.',True)+opt('אין לנו חשבון בנק','נפתח לארגון יתרה אצל ספק התשלומים. תוכלו לשלם ממנה לספקים ולמשוך אליכם כשיהיה חשבון.',False,'בקרוב')+note('הכסף לא עובר דרך חשבון של MemberHub. אנחנו מנהלים את ההוראות, וספק התשלומים מחזיק את הכסף ומבצע את ההעברות.'),pad=20,gap=12,extra='width:430px;flex-shrink:0;')
wzf=f'<div style="display:flex;gap:12px;flex-shrink:0;align-items:center;">{btn("חזרה")}<span style="flex:1;"></span><span style="font-weight:700;color:{SOFT};">נשמר אוטומטית</span>{btn("המשך",True)}</div>'
out['D-AdmWizard3']=shell('ד · הקמת ארגון · אופן הגבייה','הגדרות הארגון',head('הקמת הארגון','שלב 3 מתוך 5')+stepper(3)+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{wz3}{wz3b}</section>'+wzf)
kyc=panel(h2('פרטי חשבון לקבלת כסף','מה שמוזן כאן מועבר ישירות לספק התשלומים, לא נשמר אצלנו')+f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">{fld("שם בעל החשבון","עמותת אור חדש")}{fld("מספר עמותה / ח.פ.","580123456",ltr=True)}{fld("בנק","פועלים (12)")}{fld("סניף","600",ltr=True)}{fld("מספר חשבון","123456",ltr=True)}{fld("שם איש קשר מורשה","יוסף לוי")}</div>'+fld('אסמכתא לבעלות על החשבון','צילום אישור ניהול חשבון.pdf · הועלה','הספק מבקש אישור, כדי למנוע העברות לחשבון לא נכון.'),pad=20,gap=14,extra='flex:1;')
sts=panel(h2('סטטוס אימות')+tr([('פרטי הארגון',''),(pill('אושר'),'')])+tr([('חשבון בנק',''),(pill('ממתין לבדיקה','#FFF6D1'),'')])+tr([('מורשה חתימה',''),(pill('נדרש','#FFE9E6'),'')],True)+note('עד שהאימות יושלם אפשר לקבל תשלומים, אך משיכות לחשבון יחכו. בדרך כלל זה לוקח עד יומיים עסקים.'),pad=20,gap=8,extra='width:430px;flex-shrink:0;align-self:flex-start;')
out['D-AdmWizard4']=shell('ד · הקמת ארגון · חשבון לקבלת כסף','הגדרות הארגון',head('הקמת הארגון','שלב 4 מתוך 5')+stepper(4)+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{kyc}{sts}</section>'+wzf)

# 4. kupa
def kpi(v,l,c,s=''): 
    ss=f'<span style="font-size:12.5px;font-weight:600;color:{SOFT};">{s}</span>' if s else ''
    return f'<div style="flex:1;padding:14px 16px;background:#fff;border:2.5px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};display:flex;flex-direction:column;gap:2px;border-top:8px solid {c};"><bdi class="h" style="font-size:30px;">{v}</bdi><span style="font-weight:800;">{l}</span>{ss}</div>'
kp=f'<div style="display:flex;gap:14px;flex-shrink:0;">{kpi("₪24,310","יתרה בקופה",ORG,"מה שהארגון צבר ועדיין לא הוצא")}{kpi("₪19,800","זמינה למשיכה",GREEN,"אחרי שהספק אישר")}{kpi("₪4,510","בדרך לקופה",Y,"תשלומים שנגבו וטרם הועברו")}{kpi("₪7,900","חובות פתוחים",DANGER,"34 חברים")}</div>'
cols=[('תאריך','width:90px;'),('תיאור','flex:1;'),('מי','width:150px;'),('סכום','width:110px;text-align:end;'),('סטטוס','width:120px;')]
rows=[('08.10','דמי חבר · מנוי שנתי','דוד כהן','+₪2,200','נקלט'),('08.10','תרומה · עלייה לתורה','שרה לוי','+₪360','נקלט'),('07.10','תשלום לספק · חשמל','יוסף לוי','−₪1,140','הועבר'),('07.10','דמי חבר · חודשי','משפחת בן דוד','+₪180','בדרך'),('05.10','משיכה לחשבון הארגון','יוסף לוי','−₪10,000','הועבר'),('04.10','החזר · ביטול הרשמה','רונית אביב','−₪120','הועבר'),('03.10','דמי חבר · חודשי','אבי ישראלי','+₪180','נקלט')]
body=th(cols)+''.join(tr([(d,cols[0][1]),(t,cols[1][1]),(w,cols[2][1]),(f'<bdi style="font-weight:800;color:{GREEN if a.startswith("+") else INK};">{a}</bdi>',cols[3][1]),(pill(s,'#D7F5E8' if s!='בדרך' else '#FFF6D1'),cols[4][1])],i==len(rows)-1) for i,(d,t,w,a,s) in enumerate(rows))
tbl=panel(f'<div style="display:flex;align-items:center;gap:10px;">{h2("תנועות בקופה")}<span style="flex:1;"></span>{pill("הכל",Y)}{pill("הכנסות","#fff")}{pill("הוצאות","#fff")}{btn("ייצוא")}</div>'+body,pad=16,gap=8,extra='flex:1;min-width:0;')
side=f'<div style="width:380px;flex-shrink:0;display:flex;flex-direction:column;gap:14px;">'+panel(h2('משיכה לחשבון הארגון')+fld('סכום','₪10,000',ltr=True)+fld('לחשבון','פועלים · ••3456')+btn('משיכה',True)+note('הספק מעביר ביום עסקים הבא. משיכה גדולה מ-₪20,000 דורשת אישור של עוד מורשה.'),pad=16,gap=10)+panel(h2('תשלום לספק','מהיתרה, בלי לפתוח חשבון')+fld('למי','חברת החשמל','חשבון בנק או IBAN של הספק')+fld('סכום','₪1,140',ltr=True)+btn('שליחה לאישור'),pad=16,gap=10)+'</div>'
out['D-AdmKupa']=shell('ד · קופה','כספים וחיובים',head('הקופה','יתרה מנוהלת אצל ספק התשלומים',btn('יצירת חיוב',True))+kp+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{tbl}{side}</section>')

# 5. create charge
form=panel(h2('חיוב חדש')+f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">{fld("כותרת החיוב","דמי ועד · אוקטובר")}{fld("סכום","₪180",ltr=True)}{fld("תאריך לתשלום","31.10.2026",ltr=True)}{fld("סוג","חיוב חד פעמי")}</div>'+f'<div style="display:flex;flex-direction:column;gap:8px;"><span style="font-weight:800;">למי</span>'+opt('כל החברים הפעילים','312 חברים',False)+opt('לפי מסלול או תווית','מנוי שנתי · 148 חברים',True)+opt('חברים נבחרים','בחירה מרשימה',False)+'</div>'+fld('הסבר לחברים','לכיסוי הוצאות תחזוקה לרבעון האחרון של השנה.','יוצג בכרטיס החיוב ובהודעה',h=64,opt=True)+f'<div style="display:flex;flex-direction:column;gap:6px;">{chk(True,"לשלוח הודעה לחברים")}{chk(True,"לתזכר אוטומטית 3 ימים לפני ובמועד")}{chk(False,"לאפשר תשלום חלקי")}</div>',pad=20,gap=14,extra='flex:1;')
def mini():
    t=f'<div style="padding:12px 14px;background:#FFF1B8;display:flex;align-items:center;"><span class="h" style="font-size:20px;flex:1;">חיוב חדש</span><bdi style="font-weight:800;font-size:20px;">₪180</bdi></div>'
    b=f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:6px;background:{CREAM};font-weight:600;"><span style="font-weight:800;font-size:16px;">דמי ועד · אוקטובר</span><span style="color:{SOFT};">עד 31.10.2026 · אור חדש</span><span style="color:{SOFT};">לכיסוי הוצאות תחזוקה לרבעון האחרון של השנה.</span></div>'
    return f'<div style="border:2.5px solid {INK};border-radius:18px;overflow:hidden;box-shadow:0 3px 0 {INK};">{t}{b}<div style="padding:12px 14px;background:#fff;"><span style="height:44px;border-radius:22px;border:2px solid {INK};background:{Y};display:flex;align-items:center;justify-content:center;font-weight:800;">לתשלום</span></div></div>'
prev=f'<div style="width:420px;flex-shrink:0;display:flex;flex-direction:column;gap:14px;">'+panel(h2('כך החבר יראה')+mini(),pad=16)+panel(h2('סיכום')+tr([('מקבלים',''),('<b>148 חברים</b>','')])+tr([('סכום כולל','') ,('<bdi><b>₪26,640</b></bdi>','')])+tr([('מהם בחיוב אוטומטי',''),('<b>96</b>','')],True)+note('חיוב שנשלח לא ניתן למחיקה, רק לביטול. חברים ששילמו יקבלו החזר לפי בקשה.'),pad=16,gap=4)+'</div>'
out['D-AdmCharge']=shell('ד · יצירת חיוב','כספים וחיובים',head('חיוב חדש','',btn('שמירה כטיוטה')+btn('שליחה לחברים',True))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{form}{prev}</section>')

# 6. labels admin
def stamp(n,c,rot=-5): return f'<span style="display:inline-flex;align-items:center;min-height:36px;padding:0 14px;border:2.5px solid {INK};border-radius:10px;background:{c};box-shadow:0 3px 0 {INK};transform:rotate({rot}deg);font-weight:800;font-size:16px;">{n}</span>'
L=[('מייסד','#5EE0C0','12','הכל'),('תומך','#FF8FB8','48','מנהלים'),('מתנדב','#FF9B6B','21','הכל'),('חבר ותיק','#7CC4FF','96','הכל'),('גבאי','#B9A4FF','3','מנהלים')]
lc=[('תווית','width:200px;'),('חברים','width:80px;'),('מי רואה','width:120px;'),('הענקה','flex:1;')]
lb=th(lc)+''.join(tr([(stamp(n,c,r),lc[0][1]),(m,lc[1][1]),(v,lc[2][1]),('ידנית' if n!='חבר ותיק' else 'אוטומטית · אחרי 3 שנים',lc[3][1])],i==len(L)-1) for i,((n,c,m,v),r) in enumerate(zip(L,[-4,3,-2,4,-3])))
llist=panel(f'<div style="display:flex;align-items:center;">{h2("תוויות הארגון","תג שמוצג בכרטיס החבר: חותמת, או אייקון אחרון ועוד +N")}<span style="flex:1;"></span>{btn("+ תווית חדשה",True)}</div>'+lb,pad=16,gap=8,extra='flex:1;min-width:0;')
lcol=''.join(f'<span style="width:34px;height:34px;border-radius:50%;background:{c};border:2.5px solid {INK if i==0 else "transparent"};box-shadow:0 0 0 2px #fff inset;"></span>' for i,c in enumerate(['#5EE0C0','#FF8FB8','#FF9B6B','#7CC4FF','#B9A4FF','#FFD84A']))
ledit=panel(h2('עריכת תווית · מייסד')+fld('שם','מייסד','עד 14 תווים')+f'<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;">צבע</span><div style="display:flex;gap:8px;">{lcol}</div></div>'+f'<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;">מי רואה</span><div style="display:flex;gap:8px;">{pill("כל החברים",Y)}{pill("מנהלים בלבד","#fff")}</div></div>'+f'<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;">דוגמה בכרטיס</span><div style="padding:18px;background:{CREAM};border:2px solid {INK};border-radius:16px;display:flex;justify-content:center;">{stamp("מייסד","#5EE0C0",-5)}</div></div>'+f'<div style="display:flex;gap:8px;">{btn("מחיקה",danger=True)}<span style="flex:1;"></span>{btn("ביטול")}{btn("שמירה",True)}</div>',pad=16,gap=12,extra='width:420px;flex-shrink:0;align-self:flex-start;')
out['D-AdmLabels']=shell('ד · ניהול תוויות','חברים',head('תוויות','')+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{llist}{ledit}</section>')

# 7. roles
roles=[('מנהל ראשי','יוסף לוי','הכל'),('גזבר','שרה כהן','כספים'),('מזכיר','דוד ישראלי','חברים והודעות'),('גבאי','אבי בן דוד','תפילות ואירועים')]
perms=['חברים','כספים וחיובים','קופה ומשיכות','הודעות','הגדרות','צוות והרשאות']
M={'מנהל ראשי':[2,2,2,2,2,2],'גזבר':[1,2,2,0,0,0],'מזכיר':[2,1,0,2,0,0],'גבאי':[1,0,0,1,0,0]}
def cell(v): 
    t=['—','צפייה','עריכה'][v]; bg=['#fff','#EAF6FF','#D7F5E8'][v]
    return pill(t,bg,SOFT if v==0 else INK)
pc=[('מנהל','width:170px;')]+[(p,'width:118px;') for p in perms]
mt=th(pc)+''.join(tr([(f'<b>{n}</b><br><span style="color:{SOFT};font-size:12.5px;">{who}</span>',pc[0][1])]+[(cell(M[n][i]),'width:118px;') for i in range(6)],i==len(roles)-1) for i,(n,who,_) in enumerate(roles))
tbl2=panel(f'<div style="display:flex;align-items:center;">{h2("מנהלים והרשאות","מי יכול לעשות מה בארגון")}<span style="flex:1;"></span>{btn("+ הזמנת מנהל",True)}</div>'+mt+note('פעולות רגישות (משיכה מהקופה, שינוי חשבון בנק, הוספת מנהל) מחייבות אישור שני של מנהל ראשי נוסף. VERIFY: האם לדרוש זאת לכל ארגון.'),pad=16,gap=10,extra='flex:1;min-width:0;')
lg=panel(h2('יומן פעולות')+tr([('08.10 · שרה כהן',''),('יצרה חיוב "דמי ועד"','')])+tr([('07.10 · יוסף לוי',''),('אישר משיכה ₪10,000','')])+tr([('05.10 · דוד ישראלי',''),('שלח הודעה לכל החברים','')],True),pad=16,gap=4,extra='width:420px;flex-shrink:0;align-self:flex-start;')
out['D-AdmRoles']=shell('ד · מנהלים והרשאות','הגדרות הארגון',head('צוות והרשאות','',SAVE)+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{tbl2}{lg}</section>')

for k,v in out.items(): open(f'/home/claude/project/{k}.dc.html','w',encoding='utf-8').write(v)
print(list(out))
