# Member-side hubs + notification + account boards. Reuses gen_pay helpers (no file writes from it).
src=open('/home/claude/gen/gen_pay.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(src)
out2={}
ORG='#FF5A36'
LG=logo('F',40,'#FFFFFF')
def orgbar(title,sub=''):
    s=f'<span style="font-size:13px;font-weight:700;">{sub}</span>' if sub else ''
    return f'<div style="flex-shrink:0;margin:-18px -16px 0;padding:18px 16px 14px;background:{ORG};border-bottom:2.5px solid {INK};color:#1E1633;display:flex;align-items:center;gap:12px;">{back}<div style="flex:1;display:flex;flex-direction:column;"><span style="font-family:\'Secular One\',sans-serif;font-size:24px;line-height:1.1;">{title}</span>{s}</div>{LG}</div>'
def linkrow(t,sub,right='',danger=False,last=False,icon=None):
    ic=logo('',40,CREAM,icon) if icon else ''
    col=DANGER if danger else INK
    return f'<a href="#" style="min-height:60px;box-sizing:border-box;padding:8px 14px;display:flex;align-items:center;gap:12px;border-bottom:{"none" if last else "1.5px solid #EDE6D6"};color:{col};">{ic}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{t}</span><span style="font-size:13px;font-weight:600;color:{SOFT};line-height:1.35;">{sub}</span></div>{right}{ico(CHEV,20,2.4)}</a>'
ACT=pill('פעיל')
CAL='M3 5h18v16H3zM3 10h18M8 3v4M16 3v4'; PAUSE='M8 5v14M16 5v14'; SHIELD='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'; SWAP='M7 7h13l-3-3M17 17H4l3 3'; STARI='M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'
# A. finance hub
st=f'<div style="height:100%;display:flex;align-items:center;gap:12px;padding:0 14px;"><span style="font-family:\'Secular One\',sans-serif;font-size:24px;flex:1;">אין חוב פתוח</span>{ico(CHECK,34,3)}</div>'
sb=kv('החיוב הבא','₪2,200 · 01.11.2026')+kv('אמצעי תשלום','Visa ••4242')+kv('חיוב אוטומטי','פעיל')
open_ch=f'<div style="padding:12px 14px;display:flex;align-items:center;gap:12px;"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">דמי השתתפות · ספינינג</span><span style="font-size:13px;font-weight:700;color:{SOFT};">עד 12.10.2026</span></div><bdi style="font-weight:800;font-size:17px;">₪35</bdi>{btnsm("לתשלום",True)}</div>'
out2['D-MemberFinance']=page('ד · כספים · חברות',844,orgbar('כספים','FitZone · מנוי שנתי')+ticket(st,sb,60,'#D5F5E8')+H2('חיוב פתוח')+box(open_ch)
 +H2('ניהול')+box(linkrow('חיוב אוטומטי','פעיל · Visa ••4242',pill('פעיל'),icon=CARD)+linkrow('אמצעי תשלום לארגון זה','ברירת מחדל (Visa ••4242)',icon=BANK)+linkrow('היסטוריה וקבלות','12 תשלומים השנה',icon=RCPT)+linkrow('דיווח על תשלום ידני','שילמתם בהעברה או במזומן?',icon=PLUS,last=True)),nav('wallet'))
# B. membership hub
ms=f'<div style="height:100%;display:flex;align-items:center;gap:12px;padding:0 14px;">{logo("F",44,"#FFFFFF")}<div style="display:flex;flex-direction:column;flex:1;"><span style="font-weight:800;font-size:16px;">מנוי שנתי</span><span style="font-size:13px;font-weight:700;">חבר/ה מאז 05.01.2022</span></div>{pill("פעיל")}</div>'
mb=kv('מתחדש ב','01.11.2026')+kv('מחיר','₪2,200 לשנה')+kv('תוויות','מייסד · חבר ותיק')
out2['D-MyMembership']=page('ד · המנוי שלי',900,orgbar('המנוי שלי','FitZone')+ticket(ms,mb,60,'#FFF9EC')
 +H2('המסלול')+box(linkrow('שינוי מסלול','חודשי, רבעוני או שנתי',icon=SWAP)+linkrow('הקפאת מנוי','עד חודשיים בשנה, בלי חיוב בזמן ההקפאה',icon=PAUSE,last=True))
 +H2('פרטיות והרשאות')+box(linkrow('מה FitZone רואה עליי','שם, טלפון, מגדר ושפה',icon=SHIELD)+linkrow('הודעות מ-FitZone','בחירת סוגים וערוצים',icon=BELL)+linkrow('הפניות שלי','שאלות ובקשות להנהלה',icon='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',last=True))
 +box(linkrow('ביטול חברות','החברות נשארת עד סוף התקופה ששולמה',danger=True,last=True)),nav('wallet'))
# C. notifications per org
def tgr(t,sub,on,locked=False):
    right=pill('חובה',False) if locked else tg(on)
    return f'<div style="min-height:60px;box-sizing:border-box;padding:8px 14px;display:flex;align-items:center;gap:12px;border-bottom:1.5px solid #EDE6D6;"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{t}</span><span style="font-size:13px;font-weight:600;color:{SOFT};line-height:1.35;">{sub}</span></div>{right}</div>'
def chk2(t,on): return f'<span role="checkbox" aria-checked="{str(on).lower()}" style="min-height:44px;box-sizing:border-box;padding:0 14px 0 10px;border-radius:22px;border:2px solid {INK};background:{INK if on else "#FFFFFF"};color:{"#FFFFFF" if on else INK};font-weight:800;font-size:14.5px;display:inline-flex;align-items:center;gap:6px;">{ico(CHECK,16,3) if on else ""}{t}</span>'
chs=f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;"><span style="font-weight:800;font-size:16px;">איך לקבל</span><div role="group" aria-label="ערוצים" style="display:flex;flex-wrap:wrap;gap:8px;">{chk2("דחיפה",True)}{chk2("SMS",False)}{chk2("דוא״ל",True)}</div><span style="font-size:13px;font-weight:600;color:{SOFT};line-height:1.35;">הודעות חובה (שינוי מחיר, חיוב חריג, אבטחה) יגיעו תמיד, בערוץ זמין.</span></div>'
quiet=linkrow('שעות שקט','לפי ההגדרה הכללית (22:00 עד 07:00)',last=True)
out2['D-NotifOrg']=page('ד · הודעות מארגון',900,orgbar('הודעות מ-FitZone')
 +box(tgr('קבלת הודעות מהארגון','כיבוי עוצר הכול חוץ מהודעות חובה',True)+tgr('תשלומים וחיובים','קבלות, תזכורות חוב, חיוב אוטומטי',True,True)+tgr('אימונים ושיעורים','שיבוץ, ביטולים ושינויים',True)+tgr('אירועים ומבצעים','הזמנות והטבות לחברים',False)+tgr('הודעות כלליות','עדכונים מההנהלה',True))
 +box(chs)+box(quiet)
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('שמירה')+'<div style="height:6px;flex-shrink:0;"></div>',nav('wallet'))
# D. login methods
def meth(icon,t,sub,tags,btn): return f'<article style="flex-shrink:0;background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:12px 14px;display:flex;flex-direction:column;gap:10px;"><div style="display:flex;align-items:center;gap:12px;">{logo("",44,CREAM,icon)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:17px;"><bdi dir="ltr">{t}</bdi></span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{tags}</div><div style="display:flex;gap:8px;flex-wrap:wrap;">{btn}</div></article>'
PHONE='M7 3h10v18H7zM11 18h2'; MAIL='M3 5h18v14H3zM3 6l9 7 9-7'
out2['D-LoginMethods']=page('ד · אמצעי התחברות',900,hdr('אמצעי התחברות')
 +P('קודי כניסה נשלחים לאמצעים המאומתים. חייב להישאר לפחות אחד.',14,SOFT)
 +meth(PHONE,'050-123-4567','טלפון · מאומת',pill('ראשי'),btnsm('החלפת מספר',True))
 +meth(MAIL,'dana@example.com','דוא״ל · מאומת','',btnsm('החלפת כתובת')+btnsm('הסרה',danger=True))
 +sbtn('הוספת אמצעי התחברות')
 +box(linkrow('אין לי גישה לטלפון','החלפת מספר בלי הקוד הישן',icon=WARN,last=True)),'')
# E. change phone step 1 / step 2
def step(n,tot,t): return f'<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;"><span style="padding:3px 12px;border-radius:12px;background:{INK};color:#FFFFFF;font-size:13px;font-weight:800;">שלב {n} מתוך {tot}</span><span style="font-weight:800;font-size:15px;">{t}</span></div>'
def opt2(t,sub,sel): return rad(t,sub,sel)
out2['D-ChangePhone']=page('ד · החלפת מספר · אימות',844,hdr('החלפת מספר טלפון')+step(1,2,'מאשרים שזה אתם')
 +P('לפני שמחליפים מספר, נשלח קוד לאחד האמצעים הקיימים.',14.5,SOFT)
 +rad('הקוד לטלפון הנוכחי','050-123-4567',True)+rad('הקוד לדוא״ל','dana@example.com',False)
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('שליחת קוד')+f'<a href="#" style="flex-shrink:0;min-height:44px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;text-decoration:underline;">אין לי גישה לאף אחד מהם</a>','')
out2['D-ChangePhone2']=page('ד · החלפת מספר · מספר חדש',844,hdr('החלפת מספר טלפון')+step(2,2,'המספר החדש')
 +sheetc(fld('מספר חדש','',True,'050-000-0000')+P('נשלח אליו קוד אימות ב-SMS. המספר הישן יפסיק לשמש להתחברות.',13.5,SOFT))
 +box(f'<div style="padding:12px 14px;display:flex;gap:10px;align-items:flex-start;">{ico(SHIELD,22,2.2)}<span style="font-size:14px;font-weight:600;line-height:1.45;">אחרי ההחלפה נשלחת הודעה לדוא״ל ולמספר הישן, כדי שתדעו אם זה לא אתם.</span></div>')
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('שליחת קוד למספר החדש')+'<div style="height:6px;flex-shrink:0;"></div>','')
# F. lost phone
out2['D-LostPhone']=page('ד · אין גישה לטלפון',844,hdr('אין גישה לטלפון')
 +P('נוכל לעזור לעבור למספר חדש גם בלי הקוד הישן. מטעמי אבטחה זה לוקח קצת זמן.',14.5,SOFT)
 +box(f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:16px;">הדרך המהירה: דוא״ל מאומת</span><span style="font-size:14px;font-weight:600;line-height:1.4;">אם יש לכם דוא״ל מאומת בחשבון, נשלח אליו קוד ותוכלו להחליף מיד.</span><div style="margin-top:4px;">{pbtn("שליחת קוד לדוא״ל")}</div></div>')
 +box(f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:10px;"><span style="font-weight:800;font-size:16px;">אין דוא״ל מאומת: בקשת החלפה</span>{fld("מספר חדש","",True,"050-000-0000")}{fld("שם מלא","",False,"כמו שרשום בחברויות")}{fld("ארגון שאתם חברים בו","",False,"שם ארגון אחד לפחות")}<span style="font-size:13px;font-weight:700;color:{SOFT};line-height:1.4;">נבדוק את הפרטים, נשלח התראה למספר הישן ולדוא״ל, ונאפשר את ההחלפה אחרי 48 שעות. אפשר לבטל בכל רגע בזמן ההמתנה.</span>{sbtn("שליחת בקשה")}</div>')
 ,'')
# G. data export
def ck(t,sub,on=True): return chk(t,on,sub)
out2['D-DataExport']=page('ד · הורדת הנתונים שלי',844,hdr('הורדת הנתונים שלי')
 +P('אפשר לקבל עותק של המידע שלכם בקובץ אחד.',14.5,SOFT)
 +box(f'<div style="padding:10px 14px;display:flex;flex-direction:column;gap:2px;">{ck("הפרטים שלי","שם, טלפון, דוא״ל, העדפות")}{ck("החברויות שלי","ארגונים, מסלולים ותוויות")}{ck("תשלומים וקבלות","היסטוריה וקבצי קבלה")}{ck("הודעות","מכל הארגונים")}{ck("הסכמות","מה אישרתם ומתי")}</div>')
 +box(f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:15px;">איך זה מגיע</span><span style="font-size:14px;font-weight:600;line-height:1.45;">קובץ ZIP (CSV וקבלות PDF) יישלח לדוא״ל dana@example.com תוך 24 שעות. הקישור תקף 7 ימים.</span></div>')
 +P('מידע שארגונים מחזיקים עליכם מעבר לחשבון שלכם נמסר דרך הארגון עצמו. אפשר לבקש גם ממנו.',13,SOFT)
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('בקשת עותק')+'<div style="height:6px;flex-shrink:0;"></div>','')
# H. delete account
def cons2(t,kind): 
    ic={'ok':ico(CHECK,20,2.8),'no':ico(XX,20,2.8),'warn':ico(WARN,20,2.4)}[kind]; col=DANGER if kind!='ok' else INK
    return f'<div style="display:flex;align-items:flex-start;gap:10px;font-size:15px;font-weight:700;line-height:1.35;color:{col};"><span style="flex-shrink:0;margin-top:1px;">{ic}</span><span>{t}</span></div>'
dis=f'<a href="#" role="button" aria-disabled="true" style="min-height:52px;box-sizing:border-box;border-radius:26px;border:2px solid {INK};background:#DDD6EA;color:{INK};font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;">מחיקת החשבון</a>'
out2['D-DeleteAccount']=page('ד · מחיקת חשבון',900,hdr('מחיקת החשבון')
 +box(f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:10px;"><span style="font-weight:800;font-size:16px;">מה יקרה</span>{cons2("3 חברויות פעילות יסתיימו, והחיוב האוטומטי יופסק","ok")}{cons2("הפרטים האישיים יימחקו תוך 30 יום","ok")}{cons2("קבלות וחשבוניות נשמרות אצל הארגונים עד 7 שנים, כנדרש בחוק","ok")}</div>')
 +f'<section style="flex-shrink:0;background:#FFFFFF;border:2px solid {DANGER};border-radius:18px;box-shadow:0 3px 0 {DANGER};padding:12px 14px;display:flex;flex-direction:column;gap:8px;"><span style="font-weight:800;font-size:16px;color:{DANGER};">יש להסדיר לפני המחיקה</span>{cons2("חוב פתוח: ועד בית · דמי ועד · ₪120","no")}<div style="display:flex;gap:8px;">{btnsm("לתשלום החוב",True)}</div></section>'
 +fld('כדי לאשר, כתבו "מחיקה"','',False,'מחיקה')
 +'<div style="flex:1;min-height:6px;"></div>'+dis+sbtn('ביטול')+'<div style="height:6px;flex-shrink:0;"></div>','')
for k,v in out2.items(): open(f'/home/claude/project/{k}.dc.html','w',encoding='utf-8').write(v)
print(list(out2))
