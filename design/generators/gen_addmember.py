# Add member: 3 ways (invitation / scan user profile code / share org profile code) + invite accept + bulk import (desktop).
src=open('/home/claude/gen/gen_madmin.py',encoding='utf-8').read().split("for k,v in mo.items()")[0]
exec(src)
P_='/home/claude/project/'
ORGC='#5B3DF5'
SEND='M22 2L11 13M22 2l-7 20-4-9-9-4z'; SCAN='M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10'
QRI='M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v7h-3M14 20h3'; XL='M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13l4 5M12 13l-4 5'
CHEV_L='M15 6l-6 6 6 6'
out5={}
def way(ic,t,sub,bg):
    return (f'<a href="#" style="flex-shrink:0;display:flex;align-items:center;gap:12px;background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 4px 0 {INK};padding:14px;">'
     f'<span style="width:52px;height:52px;flex-shrink:0;border-radius:16px;border:2px solid {INK};background:{bg};display:flex;align-items:center;justify-content:center;">{ico(ic,26,2.2)}</span>'
     f'<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;"><span style="font-family:\'Secular One\',sans-serif;font-size:19px;line-height:1.15;">{t}</span><span style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.35;">{sub}</span></span>{ico(CHEV_L,22,2.4)}</a>')
out5['D-MAdmAddMember']=page('ד · ניהול במובייל · הוספת חבר',844,
 abar('הוספת חבר','איך רוצים להוסיף?')
 +way(SEND,'שליחת הזמנה','אדם מסוים. הוא מאשר בלחיצה ונכנס מיד.','#D7F5E8')
 +way(SCAN,'סריקת קוד פרופיל משתמש','האדם יושב מולכם. הוא מאשר בטלפון שלו.','#FFD9E8')
 +way(QRI,'שיתוף קוד פרופיל ארגון','כל מי שמעוניין שולח בקשה, ואתם מאשרים.','#E3DDFF')
 +'<div style="flex:1;min-height:6px;"></div>'
 +f'<div style="flex-shrink:0;display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:2px solid {INK};border-radius:14px;background:#FFF6D1;font-weight:600;font-size:13.5px;line-height:1.45;">{ico(XL,22,2.2)}<span>הרבה חברים בבת אחת? ייבוא מקובץ אקסל זמין במערכת בדסקטופ.</span></div><div style="height:8px;flex-shrink:0;"></div>'
 ,anav('mem'))
# invitation form
def segm(items,sel):
    return '<div role="tablist" style="flex-shrink:0;display:flex;gap:4px;padding:4px;border-radius:30px;background:#fff;border:2px solid '+INK+';">'+''.join(f'<span role="tab" aria-selected="{str(i==sel).lower()}" style="flex:1;min-height:44px;box-sizing:border-box;border-radius:22px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;{"background:"+Y+";border:2px solid "+INK+";box-shadow:0 2px 0 "+INK+";" if i==sel else "border:2px solid transparent;"}">{t}</span>' for i,t in enumerate(items))+'</div>'
msg=f'<div style="flex-shrink:0;background:#fff;border:2px dashed {INK};border-radius:16px;padding:10px 12px;font-size:14px;font-weight:600;line-height:1.5;">היי דנה, יוסף מבית הכנסת אור חדש מזמין אותך להצטרף כחברת קהילה. לחצו כדי לאשר: <bdi dir="ltr" style="font-weight:800;">app.example/i/K7Q2-4M</bdi></div>'
out5['D-MAdmInvite']=page('ד · ניהול במובייל · שליחת הזמנה',844,
 abar('שליחת הזמנה','לאדם מסוים')
 +fld('שם',"דנה לוי",opt=True)
 +fld('טלפון','050-123-4567',ltr=True)
 +f'<div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">{lab("מסלול")}<div style="display:flex;flex-wrap:wrap;gap:8px;">{chip("חבר/ת קהילה",True)}{chip("משפחה",False)}{chip("תומך/ת",False)}</div></div>'
 +f'<div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">{lab("תוויות",True)}<div style="display:flex;flex-wrap:wrap;gap:8px;">{chip("גבאי",False)}{chip("מתנדב/ת",True)}</div></div>'
 +f'<div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">{lab("איך לשלוח")}{segm(["WhatsApp","SMS","קישור"],0)}</div>'
 +msg
 +'<div style="flex:1;min-height:4px;"></div>'+pbtn('שליחת הזמנה')+P('ההזמנה מיועדת למספר הזה בלבד ותקפה 14 ימים. אחרי שהאדם מאשר, הוא נכנס מיד.',13,SOFT)
 ,anav('mem'))
# invitee side
out5['D-InviteAccept']=page('ד · הזמנה להצטרף',844,
 f'<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding-top:14px;">{logo("א",84,ORGC)}<span style="font-family:\'Secular One\',sans-serif;font-size:28px;line-height:1.1;">בית הכנסת אור חדש</span><span style="font-size:16px;font-weight:700;line-height:1.4;">יוסף, הגבאי, מזמין אתכם להצטרף<br>כחברת קהילה</span></div>'
 +sheetc(f'<span style="font-weight:800;font-size:16px;">הארגון יראה את הפרטים האלה, ורק אותם:</span><div style="border:2px solid {INK};border-radius:14px;padding:4px 14px;background:{CREAM};"><div style="display:flex;min-height:44px;align-items:center;"><span style="color:{SOFT};font-weight:700;width:70px;">שם</span><b>דנה לוי</b></div><div style="height:1.5px;background:#EDE6D6;"></div><div style="display:flex;min-height:44px;align-items:center;"><span style="color:{SOFT};font-weight:700;width:70px;">טלפון</span><b dir="ltr">050-123-4567</b></div></div><span style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.4;">אין צורך באישור נוסף מהארגון. אפשר לשנות מה מוצג בכל רגע, בהגדרות החברות.</span>')
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('להצטרף')+sbtn('לא עכשיו')
 ,'',)
# --------------------------- write mobile
for k,v in out5.items(): open(P_+k+'.dc.html','w',encoding='utf-8').write(v)
# --------------------------- desktop
asrc=open('/home/claude/gen/gen_admin.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(asrc)
XLS='M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6'
def card(ic,t,sub,cta,bg,primary=False):
    return (f'<section style="flex:1;min-width:0;background:#fff;border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};padding:18px;display:flex;flex-direction:column;gap:12px;">'
     f'<span style="width:52px;height:52px;border-radius:16px;border:2px solid {INK};background:{bg};display:flex;align-items:center;justify-content:center;">{ico(ic,26,2.2)}</span>'
     f'<span class="h" style="font-size:21px;line-height:1.15;">{t}</span><span style="font-size:14px;font-weight:600;color:{SOFT};line-height:1.45;flex:1;">{sub}</span>{btn(cta,primary)}</section>')
cards=(f'<div style="display:flex;gap:14px;">'
 +card(SEND,'שליחת הזמנה','אדם מסוים. הוא מאשר בלחיצה ונכנס מיד, בלי שתצטרכו לאשר שוב.','שליחת הזמנה','#D7F5E8',True)
 +card(SCAN,'סריקת קוד פרופיל משתמש','האדם יושב מולכם. סורקים מהאפליקציה בטלפון, והוא מאשר אצלו.','איך סורקים','#FFD9E8')
 +card(QRI,'שיתוף קוד פרופיל ארגון','כל מי שמעוניין שולח בקשה, ואתם מאשרים. כרזה, תמונה או קישור.','לקוד הארגון','#E3DDFF')+'</div>')
imp=panel(f'<div style="display:flex;align-items:center;gap:16px;"><span style="width:60px;height:60px;border-radius:18px;border:2px solid {INK};background:#D7F5E8;display:flex;align-items:center;justify-content:center;">{ico(XLS,30,2.2)}</span><div style="flex:1;display:flex;flex-direction:column;gap:3px;"><span class="h" style="font-size:22px;">ייבוא חברים מקובץ</span><span style="font-size:14.5px;font-weight:600;color:{SOFT};line-height:1.45;">ארגון שכבר פעיל? טוענים אקסל או CSV עם כל החברים, בודקים, ושולחים הזמנה לכולם בבת אחת. בלי להזין אחד אחד.</span></div>{btn("הורדת תבנית",False)}{btn("טעינת קובץ",True)}</div>',pad=18)
last=panel(h2('ייבואים אחרונים')+tr([('<bdi dir="ltr">tenants-2026.xlsx</bdi>','width:260px;'),('142 שורות · 128 הזמנות נשלחו','flex:1;'),('הושלם · 96 אישרו','width:160px;'),('לפני יומיים','width:100px;')],True),pad=16,gap=4)
main=head('הוספת חברים','שלוש דרכים לצרף אחד, וייבוא לצירוף של הרבה')+f'<section style="flex:1;min-height:0;display:flex;flex-direction:column;gap:14px;">{cards}{imp}{last}</section>'
open(P_+'D-AdmAddMember.dc.html','w',encoding='utf-8').write(shell('ד · הוספת חברים','חברים',main))
# import step: column mapping
def steps(n):
    items=['קובץ','התאמת עמודות','בדיקה','שליחה']
    return '<div style="display:flex;gap:8px;align-items:center;">'+''.join((f'<span style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;border:2px solid {INK};background:{Y if i+1==n else ("#D7F5E8" if i+1<n else "#fff")};font-weight:800;font-size:14px;"><span style="width:22px;height:22px;border-radius:50%;background:{INK};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;">{i+1}</span>{t}</span>') for i,t in enumerate(items))+'</div>'
def maprow(col,sample,field,ok=True,last=False):
    f=f'<span style="display:inline-flex;align-items:center;gap:6px;min-height:38px;min-width:150px;box-sizing:border-box;white-space:nowrap;padding:0 12px;border:2px solid {INK};border-radius:12px;background:#fff;font-weight:800;">{field}{ico(CHEV,14,2.6)}</span>'
    return f'<div style="display:flex;gap:12px;align-items:center;padding:9px 12px;border-bottom:{"none" if last else "1.5px solid "+LINE};"><span style="width:200px;font-weight:800;">{col}</span><span style="width:240px;color:{SOFT};font-weight:600;">{sample}</span><span style="width:24px;">{ico("M5 12h14M13 6l6 6-6 6",18,2.4) if False else ""}</span>{f}<span style="flex:1;"></span>{pill("זוהה אוטומטית","#D7F5E8") if ok else pill("לבחור","#FFF6D1")}</div>'
CHEV='M6 9l6 6 6-6'
mp=(th([('עמודה בקובץ','width:200px;'),('דוגמה','width:240px;'),('','width:24px;'),('שדה במערכת','width:200px;')])
 +maprow('שם פרטי','דנה','שם פרטי')+maprow('שם משפחה','לוי','שם משפחה')+maprow('נייד','050-1234567','טלפון (חובה)')+maprow('דוא״ל','dana@mail.com','דוא״ל')+maprow('דירה','4','מספר דירה')+maprow('סוג','בעל דירה','מסלול')+maprow('הערות','—','לא לייבא',False,True))
left=panel(f'<div style="display:flex;align-items:center;gap:12px;"><span style="width:48px;height:48px;border-radius:14px;border:2px solid {INK};background:#D7F5E8;display:flex;align-items:center;justify-content:center;">{ico(XLS,26,2.2)}</span><div style="flex:1;display:flex;flex-direction:column;"><b style="font-size:17px;"><bdi dir="ltr">tenants-2026.xlsx</bdi></b><span style="color:{SOFT};font-weight:600;">גיליון 1 · 142 שורות · 7 עמודות</span></div>{btn("החלפת קובץ")}</div>'+h2('התאמת עמודות','בדקנו את שמות העמודות והתאמנו אותן. אפשר לשנות.')+mp,pad=18,extra='flex:1;min-width:0;')
side=panel(h2('מה חובה בקובץ')+tr([('טלפון או דוא״ל לכל שורה, כדי לשלוח הזמנה',''),('','')])+tr([('שם. בלי שם נשלח "שלום" כללי',''),('','')],True)+note('אפשר לייבא בלי מסלול ותוויות. נבחר אחד לכולם בשלב הבא.'),pad=16,gap=4,extra='width:300px;flex-shrink:0;align-self:flex-start;')
open(P_+'D-AdmImport1.dc.html','w',encoding='utf-8').write(shell('ד · ייבוא חברים · התאמת עמודות','חברים',head('ייבוא חברים מקובץ','שלב 2 מתוך 4',btn('חזרה')+btn('להמשך',True))+steps(2)+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{left}{side}</section>'))
# import step 3: who gets invited (tiles, X to remove, two zones)
CLOSE='M6 6l12 12M18 6L6 18'
def tile(n,ph,sub,bad=None,off=False,focus=False,col='#E3DDFF'):
    bd=DANGER if False else INK
    bg='#F1EDF8' if off else ('#FFF6D1' if bad else '#fff')
    op='opacity:.75;' if off else ''
    x=('' if off else
       f'<a href="#" aria-label="להסיר מהרשימה" style="position:absolute;top:8px;inset-inline-end:8px;width:26px;height:26px;box-sizing:border-box;border-radius:50%;border:2px solid {INK};background:#fff;display:flex;align-items:center;justify-content:center;">{ico(CLOSE,13,2.8)}</a>')
    badge=f'<span style="display:inline-flex;align-items:center;min-height:22px;padding:0 8px;border-radius:11px;border:1.5px solid {INK};background:#FFE9E6;font-size:12px;font-weight:800;">{bad}</span>' if bad else ''
    ex=(f'<div style="display:flex;gap:6px;margin-top:6px;">{btn("שליחה עכשיו",True)}</div>' if focus else '')
    if off: ex=f'<div style="margin-top:6px;"><a href="#" aria-label="החזרה לרשימת המוזמנים" style="min-height:26px;padding:0 12px;box-sizing:border-box;border-radius:13px;border:2px solid {INK};background:#fff;font-weight:800;font-size:12.5px;display:inline-flex;align-items:center;">החזרה</a></div>'
    sh=f'box-shadow:0 4px 0 {INK};' if focus else f'box-shadow:0 2px 0 {INK};'
    return (f'<div style="position:relative;box-sizing:border-box;background:{bg};border:2px solid {INK};border-radius:16px;{sh}{op}padding:12px 12px 10px;display:flex;flex-direction:column;gap:3px;min-width:0;{"transform:translateY(-2px);" if focus else ""}">{x}'
      f'<div style="display:flex;align-items:center;gap:10px;margin-inline-end:0;"><span class="h" style="width:38px;height:38px;flex-shrink:0;border-radius:50%;border:2px solid {INK};background:{col};display:inline-flex;align-items:center;justify-content:center;font-size:17px;">{n[0]}</span><div style="display:flex;flex-direction:column;min-width:0;"><b style="font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{n}</b><bdi dir="ltr" style="color:{SOFT};font-size:12.5px;font-weight:700;text-align:start;">{ph}</bdi></div></div>'
      f'<span style="font-size:12.5px;font-weight:700;color:{SOFT};">{sub}</span>{badge}{ex}</div>')
inv_t=[('דנה לוי','050-123-4567','דירה 4 · בעל דירה',None,False),('אבי שמעוני','050-234-5678','דירה 7 · בעל דירה',None,True),('רועי אזולאי','054-112-2334','דירה 9 · שוכר',None,False),('מיכל פרידמן','052-889-9001','דירה 12 · בעל דירה',None,False),('יוסי כהן','050-778-1122','דירה 14 · בעל דירה',None,False),
 ('שרה גולד','05012345','דירה 15 · שוכר','טלפון לא תקין',False),('אורי מזרחי','052-300-1234','דירה 18 · בעל דירה',None,False),('נועה פרץ','054-909-8877','דירה 21 · שוכר',None,False),('אמיר חדד','050-444-5566','דירה 22 · בעל דירה','כפול, שורה 31',False),('ליאת דהן','053-221-3344','דירה 25 · בעל דירה',None,False)]
cols_=['#FFD9E8','#CFF0FC','#D7F5E8','#E3DDFF','#FFD9E8']
grid=''.join(tile(n,p,sb,b,False,f,cols_[i%5]) for i,(n,p,sb,b,f) in enumerate(inv_t))
off_t=[('בנימין רוזן','050-999-0001','דירה 3 · לא עדכני'),('חנה ברק','052-111-2233','דירה 6 · עזבה'),('גדעון נחום','054-555-6677','דירה 11 · לא עדכני'),('פנינה לב','050-333-4488','דירה 19 · נפטרה')]
off_g=''.join(tile(n,p,sb,None,True,False,'#E9E4F2') for n,p,sb in off_t)
toolbar=(f'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span style="flex:1;min-width:220px;min-height:40px;box-sizing:border-box;padding:0 14px;border:2px solid {INK};border-radius:20px;background:#fff;color:{SOFT};font-weight:600;display:flex;align-items:center;gap:8px;">{ico("M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",18,2.2)}חיפוש לפי שם, טלפון או דירה</span>'
 f'{chip("הכול",True)}{chip("לתיקון",False,9)}{chip("כבר חברים",False)}<span style="min-height:40px;box-sizing:border-box;padding:0 14px;border-radius:20px;border:2px solid {INK};background:#fff;font-weight:800;display:inline-flex;align-items:center;gap:6px;">מיון: דירה{ico(CHEV,14,2.6)}</span></div>')
zone1=(f'<div style="display:flex;align-items:center;gap:10px;"><span class="h" style="font-size:20px;">יוזמנו</span>{pill("128","#D7F5E8")}<span style="color:{SOFT};font-weight:600;font-size:13.5px;">X מעביר ל"לא יוזמנו". אפשר גם לגרור.</span><span style="flex:1;"></span>{btn("שליחת הזמנה לדוגמה אליי")}</div>'
 f'<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;">{grid}</div><span style="color:{SOFT};font-weight:700;font-size:13px;">מוצגים 10 מתוך 128 · <a href="#" style="text-decoration:underline;">הצגת הכול</a></span>')
zone2=(f'<div style="border:2px dashed {INK};border-radius:18px;padding:12px;display:flex;flex-direction:column;gap:10px;background:rgba(255,255,255,.55);"><div style="display:flex;align-items:center;gap:10px;"><span class="h" style="font-size:20px;">לא יוזמנו</span>{pill("12","#E9E4F2")}<span style="color:{SOFT};font-weight:600;font-size:13.5px;">לא יישלח להם כלום. אפשר להחזיר בכל רגע.</span></div><div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;">{off_g}</div></div>')
bar=(f'<div style="flex-shrink:0;display:flex;align-items:center;gap:14px;background:#fff;border:2.5px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:10px 16px;"><div style="flex:1;display:flex;flex-direction:column;"><b style="font-size:16px;">128 יוזמנו · 12 לא יוזמנו · 9 לתיקון</b><span style="font-size:13px;font-weight:600;color:{SOFT};">מי שבתיקון לא נספר עד שיתוקן.</span></div>{btn("להמשך: הגדרות שליחה",True)}</div>')
step3=shell('ד · ייבוא חברים · מי יוזמן','חברים',head('ייבוא חברים מקובץ','שלב 3 מתוך 4: מי יוזמן',btn('חזרה'))+steps(3)+toolbar+f'<section style="flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;overflow:hidden;">{zone1}{zone2}</section>'+bar)
open(P_+'D-AdmImport2.dc.html','w',encoding='utf-8').write(step3)
# step 4: send settings
right=(panel(h2('מה לעשות עם 128 המוזמנים','בוחרים אחד')
  +opt('לשלוח הזמנה לכולם','כל אחד מקבל הודעה, מאשר בלחיצה ונכנס מיד. מומלץ.',True,'מומלץ')
  +opt('לייבא כרשימה בלבד','לא נשלח כלום. כל אחד יתחבר לפרופיל שלו כשיצטרף עם אותו טלפון.',False),pad=16))
left=(panel(h2('הודעה','אותה הודעה לכולם')+fld('נוסח','היי {שם}, {שולח} מבית הכנסת אור חדש מזמין אותך להצטרף. לחצו כדי לאשר.',h=64)+f'<div style="display:flex;gap:10px;">{chip("WhatsApp",True)}{chip("SMS",False)}{chip("דוא״ל",False)}</div>'+swrow('תזכורת אחרי 3 ימים למי שלא אישר','פעם אחת בלבד.',True,True),pad=16,extra='flex:1;min-width:0;')
 +panel(h2('לפני שליחה')+f'<div style="display:flex;gap:10px;flex-wrap:wrap;">{pill("128 יוזמנו","#D7F5E8")}{pill("12 לא יוזמנו","#E9E4F2")}{pill("9 לתיקון","#FFF6D1")}</div>'+f'<div style="display:flex;flex-direction:column;gap:10px;">{chk(True,"אני מאשר/ת שלארגון יש הרשאה לשמור את הפרטים האלה ולפנות לאנשים")}<div style="display:flex;gap:10px;">{btn("שליחת 128 הזמנות",True)}{btn("שליחת הזמנה לדוגמה אליי")}</div></div>',pad=16))
open(P_+'D-AdmImport3.dc.html','w',encoding='utf-8').write(shell('ד · ייבוא חברים · שליחה','חברים',head('ייבוא חברים מקובץ','שלב 4 מתוך 4',btn('חזרה'))+steps(4)+f'<section style="flex:1;min-height:0;display:flex;gap:14px;"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;">{left}</div><div style="width:420px;flex-shrink:0;display:flex;flex-direction:column;gap:14px;">{right}</div></section>'))
print('ok')
