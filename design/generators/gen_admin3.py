src=open('/home/claude/gen/gen_admin.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(src)
out={}
PK='#E3DDFF'
def pk(t): return f'<span style="display:inline-flex;align-items:center;min-height:22px;padding:0 9px;border-radius:11px;border:2px dashed {INK};background:{PK};font-weight:800;font-size:12px;white-space:nowrap;">{t}</span>'
CORE=pill('ליבה','#FFFFFF')
def av(t,c,s=36): return f'<span class="h" style="width:{s}px;height:{s}px;flex-shrink:0;border-radius:50%;border:2px solid {INK};background:{c};display:inline-flex;align-items:center;justify-content:center;font-size:{s*0.45:.0f}px;color:{INK};">{t}</span>'
# ---- 1. types / architecture board (standalone page)
def mini(pack):
    name,mods=PACKS[pack]
    r=''.join(f'<div style="height:26px;border-radius:8px;border:2px solid {INK};background:#fff;display:flex;align-items:center;padding:0 8px;font-weight:700;font-size:12.5px;gap:6px;opacity:.85;">{l}</div>' for l,_ in CORE_NAV)
    m=''.join(f'<div style="height:26px;border-radius:8px;border:2px dashed {INK};background:{PK};display:flex;align-items:center;padding:0 8px;font-weight:800;font-size:12.5px;">{l}</div>' for l,_ in mods)
    return f'<div style="display:flex;flex-direction:column;gap:4px;padding:10px;border:2.5px solid {INK};border-radius:14px;background:{ORG};">{r}<span style="color:#fff;font-size:12px;font-weight:800;padding:3px 4px 0;">מודולי {name}</span>{m}</div>'
def terms(rows): return ''.join(f'<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1.5px solid {LINE};"><span style="color:{SOFT};font-weight:700;">{a}</span><b>{b}</b></div>' for a,b in rows)
cols_=[('synagogue','בית כנסת',[('חבר','מתפלל'),('מנהל','גבאי'),('חיוב','תרומה / נדר'),('שדה ייחודי','תאריך יארצייט')]),('hoa','ועד בית',[('חבר','דייר'),('מנהל','ועד'),('חיוב','דמי ועד'),('שדה ייחודי','מספר דירה')]),('gym','חדר כושר',[('חבר','מתאמן'),('מנהל','מאמן'),('חיוב','מנוי / כרטיסייה'),('שדה ייחודי','תאריך סיום מנוי')]),('club','מועדון',[('חבר','חבר מועדון'),('מנהל','יו״ר'),('חיוב','דמי חבר לפי רמה'),('שדה ייחודי','רמת חברות')])]
cards=''.join(panel(h2(n,'חבילה (pack)')+mini(p)+f'<span style="font-weight:800;">מונחים ושדות</span>'+terms(t),pad=14,gap=8,extra='width:262px;flex-shrink:0;') for p,n,t in cols_)
core=panel(h2('הליבה, זהה לכל ארגון','כל מי שנרשם מקבל את זה, בלי קשר לסוג')+''.join(f'<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1.5px solid {LINE};">{ico(d,18)}<b>{l}</b></div>' for l,d in CORE_NAV)+note('כלל ברזל: מודול נכנס לליבה רק אם לפחות שני סוגי ארגון צריכים אותו (product-spec).'),pad=14,gap=4,extra='width:330px;flex-shrink:0;')
page=f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>ד · ניהול · ליבה וחבילות</title>
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
.sc::-webkit-scrollbar{{height:12px}}.sc::-webkit-scrollbar-thumb{{background:#1E1633;border-radius:6px}}.sc::-webkit-scrollbar-track{{background:rgba(30,22,51,.15);border-radius:6px}}
</style>
</helmet>
<div dir="rtl" style="width:1440px;height:900px;box-sizing:border-box;padding:24px;background:{Y};color:{INK};font-family:'Assistant',system-ui,sans-serif;font-size:15px;overflow:hidden;display:flex;flex-direction:column;gap:14px;">
{head('ליבה אחת, חבילה לכל סוג ארגון','כך בנוי הניהול: כל מסך בנוי מליבה גנרית, והחבילה מוסיפה מונחים, שדות ומודולים')}
<section style="flex:1;min-height:0;display:flex;gap:14px;">{core}<div class="sc" style="flex:1;min-width:0;display:flex;gap:14px;overflow-x:auto;overflow-y:hidden;padding:0 0 12px;">{cards}</div></section>
<div style="display:flex;gap:16px;align-items:center;font-weight:700;">{pk('מסומן כך = ייעודי לחבילה')}{CORE}<span>= ליבה</span><span style="flex:1;"></span><span style="color:{INK};">אותו מבנה מסך, אותם רכיבים. רק התוכן והתפריט משתנים. סוגי ארגון נוספים יתווספו בגלילה.</span></div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":900}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
out['D-AdmTypes']=page
# ---- 2. modules settings
types=''.join(f'<div style="flex:1;padding:12px;border:2px solid {INK};border-radius:16px;background:{"#FFF6D1" if on else "#fff"};{"box-shadow:0 3px 0 "+INK+";" if on else ""}display:flex;gap:10px;align-items:center;">{radio(on)}<div style="display:flex;flex-direction:column;"><b>{n}</b><span style="font-size:12.5px;color:{SOFT};font-weight:600;">{s}</span></div></div>' for n,s,on in [('בית כנסת','תפילות, נדרים, יארצייט',True),('ועד בית','הוצאות, תקלות, אסיפות',False),('חדר כושר','כניסות, שיעורים',False),('מועדון','רמות חברות, אירועים',False),('אחר','רק הליבה',False)])
t1=panel(h2('סוג הארגון','קובע מונחים, שדות ומודולים מוצעים. אפשר לשנות בכל עת')+f'<div style="display:flex;gap:10px;">{types}</div>'+note('החלפת סוג לא מוחקת נתונים. מודולים וכרטיסים של הסוג הקודם נשארים זמינים עד שמכבים אותם.'),pad=16)
def mrow(t,sub,on,tag,lock=False,last=False):
    r=f'<span style="font-size:12.5px;font-weight:800;color:{SOFT};">תמיד פעיל</span>' if lock else tg(on)
    return f'<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:{"none" if last else "1.5px solid "+LINE};"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;display:flex;gap:8px;align-items:center;">{t}{tag}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{r}</div>'
coreL=panel(h2('ליבה')+mrow('חברים ומנויים','רשימת חברים, משקי בית, מסלולים, תוויות',True,CORE,True)+mrow('כספים וחיובים','חיובים, תשלומים, קבלות, קופה',True,CORE,True)+mrow('פעילויות ואירועים','אירועים, הרשמה, נוכחות',True,CORE,True)+mrow('פניות והודעות','בקשות מחברים, הודעות לקהל',True,CORE,True)+mrow('דוחות','גבייה, חובות, ייצוא',True,CORE,True,True),pad=16,gap=0,extra='flex:1;')
packL=panel(h2('מודולי בית כנסת','מופעלים כברירת מחדל לחבילה')+mrow('תפילות ולוח זמנים','זמני תפילה, מניין, תאריך עברי',True,pk('בית כנסת'))+mrow('תרומות ונדרים','עליות, נדרים והתחייבויות',True,pk('בית כנסת'))+mrow('יארצייט','תאריכי אזכרה ותזכורות למשפחות',True,pk('בית כנסת'))+mrow('מקומות ישיבה','ימים נוראים, שיבוץ מקומות',False,pk('בית כנסת'),False,True),pad=16,gap=0,extra='flex:1;')
more=panel(h2('מודולים מחבילות אחרות','אפשר להפעיל גם בארגון מסוג אחר')+mrow('שיעורים והזמנות','מחדר כושר. מתאים גם לשיעורי תורה',False,pk('חדר כושר'))+mrow('תקלות ותחזוקה','מוועד בית. מתאים גם לבניין בית הכנסת',False,pk('ועד בית'),False,True),pad=16,gap=0,extra='width:400px;flex-shrink:0;align-self:flex-start;')
out['D-AdmModules']=shell('ד · סוג ארגון ומודולים','הגדרות הארגון',head('סוג הארגון ומודולים','',SAVE)+t1+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{coreL}{packL}{more}</section>')
# ---- 3. overview
def k(v,l,c): return f'<div style="flex:1;padding:12px 16px;background:#fff;border:2.5px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};border-top:8px solid {c};display:flex;flex-direction:column;"><bdi class="h" style="font-size:28px;">{v}</bdi><span style="font-weight:800;">{l}</span></div>'
ks=f'<div style="display:flex;gap:14px;">{k("312","חברים פעילים",ORG)}{k("₪18,420","נגבה החודש",GREEN)}{k("₪7,900","חובות פתוחים",DANGER)}{k("4","פניות פתוחות","#18B8F0")}{k("9","בקשות הצטרפות",Y)}</div>'
def li(t,s,b,last=False): return f'<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:{"none" if last else "1.5px solid "+LINE};"><div style="flex:1;display:flex;flex-direction:column;"><b>{t}</b><span style="font-size:13px;color:{SOFT};font-weight:600;">{s}</span></div>{b}</div>'
todo=panel(h2('דורש טיפול','הליבה, זהה לכל ארגון')+li('9 בקשות הצטרפות','הוותיקה מלפני 3 ימים',btn('לבקשות'))+li('4 פניות פתוחות','שינוי פרטים, מחלוקת על חיוב',btn('לפניות'))+li('23 חברים בחוב','₪7,900 סך הכל',btn('שליחת תזכורת'),True),pad=16,gap=0,extra='flex:1;')
upc=panel(h2('בקרוב','מהליבה: פעילויות ואירועים')+li('שיעור דף יומי','מחר 06:00 · 24 נרשמו',pill('פעיל'))+li('ארוחת שבת קהילתית','שישי 19:00 · 61 נרשמו',pill('פעיל'))+li('אסיפה כללית','בעוד שבועיים · 0 נרשמו',pill('טיוטה','#FFF6D1'),True),pad=16,gap=0,extra='flex:1;')
pkw=panel(f'<div style="display:flex;align-items:center;gap:8px;">{h2("יארצייטים קרובים","מודול ייעודי")}<span style="flex:1;"></span>{pk("בית כנסת")}</div>'+li('משפחת כהן · אבי הזקן ז״ל','כ״ח תשרי · בעוד 5 ימים',btn('תזכורת למשפחה'))+li('משפחת לוי · אמא ע״ה','ב׳ חשוון · בעוד 12 ימים',btn('תזכורת למשפחה'),True),pad=16,gap=0,extra='flex:1;align-self:flex-start;')
out['D-AdmOverview']=shell('ד · סקירה','סקירה',head('סקירה','שלום יוסף. הנה מה שקורה היום')+ks+f'<section style="display:flex;gap:14px;">{todo}{upc}</section><section style="display:flex;gap:14px;">{pkw}<div style="flex:1;"></div></section>')
# ---- 4. inquiries
cols=[('מי','width:170px;'),('סוג','width:190px;'),('פירוט','flex:1;'),('מתי','width:90px;'),('סטטוס','width:110px;')]
rows=[('דוד כהן','שינוי פרטים',CORE,'עדכון כתובת: הרצל 12 רעננה','היום','חדש'),('שרה לוי','בקשת יארצייט',pk('בית כנסת'),'אזכרה לאמא ע״ה, ב׳ חשוון','היום','חדש'),('אורי פרידמן','מחלוקת על חיוב',CORE,'חויבתי פעמיים באוגוסט','אתמול','בטיפול'),('רחל מזרחי','בקשת עלייה',pk('בית כנסת'),'לשבת פרשת נח, בר מצווה','אתמול','בטיפול'),('משה דהאן','שאלה כללית',CORE,'איך מחליפים אמצעי תשלום','לפני 3 ימים','נסגר')]
sc={'חדש':Y,'בטיפול':'#CFF0FC','נסגר':'#D7F5E8'}
body=th(cols)+''.join(tr([(n,cols[0][1]),(f'<span style="display:flex;gap:6px;align-items:center;"><b>{t}</b>{tg_}</span>',cols[1][1]),(d,cols[2][1]),(w,cols[3][1]),(pill(s,sc[s]),cols[4][1])],i==len(rows)-1) for i,(n,t,tg_,d,w,s) in enumerate(rows))
lst=panel(f'<div style="display:flex;align-items:center;gap:8px;">{h2("פניות","בקשות שחברים שולחים מהאפליקציה")}<span style="flex:1;"></span>{pill("הכל",Y)}{pill("חדשות","#fff")}{pill("בטיפול","#fff")}{pill("נסגרו","#fff")}</div>'+body,pad=16,gap=6,extra='flex:1;min-width:0;align-self:flex-start;')
side=panel(h2('סוגי פניות')+tr([(f'שינוי פרטים','flex:1;'),(CORE,'')])+tr([('מחלוקת על חיוב','flex:1;'),(CORE,'')])+tr([('שאלה כללית','flex:1;'),(CORE,'')])+tr([('בקשת יארצייט','flex:1;'),(pk('בית כנסת'),'')])+tr([('בקשת עלייה','flex:1;'),(pk('בית כנסת'),'')],True)+note('טבלת הפניות אחת לכולם. החבילה רק מוסיפה סוגי פניות ושדות להם (requestKinds).'),pad=16,gap=2,extra='width:340px;flex-shrink:0;align-self:flex-start;')
out['D-AdmInquiries']=shell('ד · פניות','פניות',head('פניות')+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{lst}{side}</section>')
# ---- 5. activities
cols=[('תאריך','width:90px;'),('פעילות','flex:1;'),('סוג','width:130px;'),('נרשמו','width:80px;'),('סטטוס','width:90px;')]
rows=[('מחר','שיעור דף יומי','שיעור','24','פעיל'),('שישי','ארוחת שבת קהילתית','סעודה','61','פעיל'),('שבת','תפילת שחרית','תפילה','—','פעיל'),('22.10','אסיפה כללית','אסיפה','0','טיוטה')]
body=th(cols)+''.join(tr([(a,cols[0][1]),(f'<b>{b}</b>',cols[1][1]),(pill(c,PK),cols[2][1]),(d,cols[3][1]),(pill(e,'#D7F5E8' if e=='פעיל' else '#FFF6D1'),cols[4][1])],i==len(rows)-1) for i,(a,b,c,d,e) in enumerate(rows))
lst=panel(f'<div style="display:flex;align-items:center;gap:8px;">{h2("פעילויות ואירועים","סוגי הפעילות מגיעים מהחבילה")}<span style="flex:1;"></span>{btn("+ פעילות חדשה",True)}</div>'+body,pad=16,gap=6,extra='flex:1;min-width:0;align-self:flex-start;')
form=panel(h2('פעילות חדשה')+fld('שם','ארוחת שבת קהילתית')+f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">{fld("תאריך","שישי, 17.10",ltr=False)}{fld("שעה","19:00",ltr=True)}{fld("סוג","סעודה")}{fld("מקומות","80",ltr=True)}</div>'+swrow('הרשמה מראש','החברים נרשמים מהאפליקציה',True)+swrow('בתשלום','חיוב אוטומטי בהרשמה',True,True)+f'<div style="display:flex;align-items:center;gap:8px;padding-top:2px;"><b>שדות ייעודיים</b>{pk("בית כנסת")}</div>'+swrow('מניין נדרש','התראה אם אין מספיק נרשמים',False,True),pad=16,gap=8,extra='width:420px;flex-shrink:0;align-self:flex-start;')
out['D-AdmActivities']=shell('ד · פעילויות ואירועים','פעילויות ואירועים',head('פעילויות ואירועים')+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{lst}{form}</section>')
# ---- 6. appearance
sw=''.join(f'<span style="width:44px;height:44px;border-radius:50%;background:{c};border:2.5px solid {INK};box-shadow:{"0 0 0 3px #fff, 0 0 0 5px "+INK if i==0 else "none"};"></span>' for i,c in enumerate([ORG,'#FF5A36','#00B67A','#FF5C9E','#18B8F0','#1E1633']))
ap=panel(h2('מראה וצבע','מה שמזהה את הארגון: צבע אחד, והמערכת מתאימה ניגודיות אוטומטית')+f'<div style="display:flex;flex-direction:column;gap:8px;"><b>צבע הארגון</b><div style="display:flex;gap:12px;">{sw}</div><span style="font-size:13px;color:{SOFT};font-weight:600;">הצבע מופיע בתפריט הניהול, בכרטיס החברות ובכפתורים הראשיים. הרקע נשאר צהוב לכולם.</span></div>'+fld('לוגו','לוגו-אור-חדש.png · הועלה','מרובע, לפחות 256 פיקסלים')+f'<div style="display:flex;flex-direction:column;gap:8px;"><b>כותרת הכרטיס</b><div style="display:flex;gap:10px;">{pill("רגיל",Y)}{pill("מודגש","#fff")}{pill("מינימלי","#fff")}</div></div>',pad=20,gap=14,extra='flex:1;')
card=f'<div style="border:2.5px solid {INK};border-radius:18px;overflow:hidden;background:#FFF9EC;box-shadow:0 3px 0 {INK};"><div style="background:{ORG};color:#fff;padding:14px;display:flex;gap:10px;align-items:center;">{av("א","#fff",44)}<div style="display:flex;flex-direction:column;"><span class="h" style="font-size:20px;">אור חדש</span><span style="font-size:12.5px;font-weight:700;opacity:.9;">מנוי שנתי · פעיל</span></div></div><div style="padding:12px 14px;display:flex;flex-direction:column;gap:6px;font-weight:700;"><span>מתחדש ב-01.11.2026</span><span style="color:{SOFT};">₪2,200 לשנה</span></div></div>'
pvw=panel(h2('כך זה נראה בכרטיס החבר')+card,pad=16,extra='width:430px;flex-shrink:0;align-self:flex-start;')
out['D-AdmAppearance']=shell('ד · מראה וצבע','מראה וצבע',head('מראה וצבע','',SAVE)+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{ap}{pvw}</section>')
# ---- 7. account & agreement
plan=panel(h2('התוכנית של הארגון','דמי שימוש ב-MemberHub')+tr([('תוכנית','flex:1;'),('<b>קהילה · עד 500 חברים</b>','')])+tr([('מחיר','flex:1;'),('<bdi><b>₪149 לחודש</b></bdi>','')])+tr([('עמלת סליקה','flex:1;'),('<b>לפי הספק</b>','')],True)+btn('שינוי תוכנית')+note('VERIFY: מבנה התמחור (לפי חברים / חבילה / עמלה) טרם נקבע. ראו gaps.he.md.'),pad=16,gap=4,extra='flex:1;')
own=panel(h2('בעלי החשבון')+tr([(av('י','#E3DDFF',34),'width:44px;'),('<b>יוסף לוי</b><br><span style="color:'+SOFT+';font-size:12.5px;">בעלים · yossi@example.com</span>','flex:1;')])+tr([(av('ש','#FFD9E8',34),'width:44px;'),('<b>שרה כהן</b><br><span style="color:'+SOFT+';font-size:12.5px;">גזברית</span>','flex:1;')],True)+btn('העברת בעלות'),pad=16,gap=4,extra='flex:1;')
agr=panel(h2('הסכם ופרטיות')+tr([('תנאי שימוש','flex:1;'),('אושרו 05.10.2026','')])+tr([('הסכם עיבוד נתונים','flex:1;'),('אושר 05.10.2026','')])+tr([('מדיניות פרטיות לחברים','flex:1;'),(btn('עריכה'),'')],True),pad=16,gap=4,extra='flex:1;')
dng=panel(h2('אזור רגיש')+btn('ייצוא כל נתוני הארגון')+btn('מחיקת הארגון',danger=True)+note('מחיקה אפשרית רק בלי חובות פתוחים ובלי יתרה בקופה. הנתונים נשמרים 30 יום לשחזור.',True),pad=16,gap=10,extra='flex:1;')
out['D-AdmAccount']=shell('ד · חשבון והסכם','הגדרות הארגון',head('חשבון והסכם')+f'<section style="display:flex;gap:14px;">{plan}{own}</section><section style="display:flex;gap:14px;">{agr}{dng}</section>')
for k_,v in out.items(): open(f'/home/claude/project/{k_}.dc.html','w',encoding='utf-8').write(v)
print(list(out))
