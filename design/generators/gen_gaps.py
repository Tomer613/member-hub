# Gaps: org membership settings, dislike flow, empty/error states, admin compose + import errors.
full=open('/home/claude/gen/gen_directory.py',encoding='utf-8').read()
mobsrc,admsrc=full.split("# ---- admin")
exec(mobsrc)
gm={}
def lbl(t): return f'<span style="font-weight:800;font-size:15px;flex-shrink:0;">{t}</span>'
def sect(t): return f'<span style="flex-shrink:0;margin:6px 4px 0;font-family:\'Secular One\',sans-serif;font-size:19px;">{t}</span>'
def nrow(t,sub,on,last=False):
    return f'<div style="{"" if last else "border-bottom:1.5px solid #EDE6D6;"}">'+trow(t,sub,on).replace('min-height:46px','min-height:52px;padding:4px 14px;box-sizing:border-box')+'</div>'
def linkrow(t,sub,last=False):
    return f'<div style="display:flex;align-items:center;gap:12px;min-height:56px;box-sizing:border-box;padding:6px 14px;{"" if last else "border-bottom:1.5px solid #EDE6D6;"}"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;">{t}</span><span style="font-size:12.5px;font-weight:600;color:{SOFT};">{sub}</span></div>{ico("M15 6l-6 6 6 6",20,2.4)}</div>'
# 1. org membership settings
gm['D-OrgSettings']=page('ד · הגדרות החברות בארגון',844,orgband('הגדרות החברות')
 +sect('מדריך החברים')
 +box(nrow('להופיע במדריך','החברים בארגון יראו אתכם',True)+linkrow('מה להציג','שם, דירה','')+linkrow('שם מוצג בארגון הזה','דנה',True))
 +sect('התראות מהארגון')
 +box(nrow('הודעות מההנהלה','',True)+nrow('תזכורות לתשלום','',True)+nrow('תשובות לפניות','',True,True))
 +sect('עזיבה')
 +box(linkrow('עזיבת הארגון','תפסיקו להיות חברים. החובות והחשבוניות נשמרים לפי החוק.',True))
 +P('ההגדרות האלה חלות רק על הארגון הזה.',13,SOFT,'center'),'')
# 2. dislike -> tell why
def chipsel(t,on=False): return mchip(t,on)
why=(f'<span style="font-size:14px;font-weight:600;color:{SOFT};">לא חובה. הפנייה תגיע להנהלה בשמכם, ואף חבר אחר לא יראה אותה.</span>'
 +'<div style="display:flex;flex-wrap:wrap;gap:8px;">'+chipsel('לא רלוונטי לי')+chipsel('לא ברור לי',True)+chipsel('לא מסכים/ה')+chipsel('אחר')+'</div>'
 +f'<span style="min-height:84px;box-sizing:border-box;padding:10px 14px;border:2px solid {INK};border-radius:14px;background:#fff;color:{SOFT};font-weight:600;">אפשר להוסיף כמה מילים</span><span style="font-size:12.5px;font-weight:600;color:{SOFT};">אל תכתבו כאן מידע רפואי או מזהה רגיש.</span>')
dsheet=sheet_wrap('רוצים לספר למה?',why,'שליחה להנהלה','לא עכשיו')
gm['D-ChannelDislike']=page('ד · ערוץ הודעות · לא אהבתי',844,orgband('הודעות')+m1+m2+bar,'',extra=dsheet)
# 3. empty / error states
def state(icon_d,title,text,btns,color='#FFF6D1'):
    ic=f'<span style="width:96px;height:96px;border-radius:50%;border:2.5px solid {INK};background:{color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 0 {INK};">{ico(icon_d,46,2.2)}</span>'
    return (f'<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:0 10px;">{ic}'
      f'<span style="font-family:\'Secular One\',sans-serif;font-size:26px;line-height:1.15;">{title}</span>{P(text,15,SOFT,"center")}</div>'+btns+'<div style="height:6px;flex-shrink:0;"></div>')
USERS='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.900M16 3.100a4 4 0 0 1 0 7.800'
CLOCK='M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2'
XC='M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6'
LOCK='M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4'
gm['D-DirEmpty']=page('ד · מדריך חברים · ריק',844,orgband('מדריך החברים')
 +state(USERS,'עוד אף אחד לא מופיע','אתם יכולים להיות הראשונים. אתם מחליטים מה יוצג.',pbtn('להופיע במדריך')+sbtn('חזרה')),'')
gm['D-DirClosed']=page('ד · מדריך חברים · סגור',844,orgband('מדריך החברים')
 +state(LOCK,'המדריך סגור כרגע','ההנהלה סגרה את מדריך החברים. אם הייתם מופיעים בו, הפרטים שלכם לא מוצגים.',sbtn('חזרה'),'#E3DDFF'),'')
gm['D-InviteExpired']=page('ד · הזמנה שפג תוקפה',844,hdr('הזמנה לארגון')
 +state(CLOCK,'ההזמנה כבר לא בתוקף','הזמנה תקפה ל-14 ימים. אפשר לבקש מההנהלה הזמנה חדשה.',pbtn('לבקש הזמנה חדשה')+sbtn('חיפוש הארגון'),'#FFE9E6'),'')
gm['D-JoinDeclined']=page('ד · בקשת הצטרפות לא אושרה',844,hdr('בקשת הצטרפות')
 +state(XC,'הבקשה לא אושרה','ועד בית שדרות הגפן לא אישר את בקשת ההצטרפות. אפשר לפנות אליהם ישירות.',sbtn('הבנתי'),'#FFE9E6'),'')
for k,v in gm.items(): open(P_+k+'.dc.html','w',encoding='utf-8').write(v)
# ---- admin
asrc=open('/home/claude/gen/gen_admin.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(asrc)
audience=(opt('כל החברים','128 חברים',True)+opt('חבר אחד','הודעה אישית. תופיע בערוץ שלו עם הסימון "אישית, רק לכם"',False)+opt('לפי סינון','למשל: מי שיש לו חוב, או לפי קבוצה',False))
left=panel(h2('למי לשלוח')+audience+h2('אפשרויות')
 +swrow('לאפשר "לא אהבתי"','חברים יוכלו להגיב באייקון ולספר למה',True)
 +swrow('לאפשר תגובות','אייקונים בלבד, בלי טקסט',True,True),extra='width:420px;flex-shrink:0;')
right=panel(h2('תוכן ההודעה','תופיע בערוץ ההודעות של הארגון')
 +fld('כותרת','חלוקת מפתחות חדשים')
 +fld('ההודעה','מחר בין 17:00 ל-19:00 נחלק מפתחות חדשים ללובי. אפשר לבוא עם תעודה מזהה.','אל תכתבו כאן מידע רפואי או מזהה רגיש.',140)
 +f'<div style="display:flex;gap:10px;align-items:center;"><span style="flex:1;"></span>{btn("שליחה בזמן אחר")}{btn("שליחה עכשיו",True)}</div>'
 +note('החברים יקבלו התראה. כל מי שביטל התראות יראה את ההודעה בערוץ בלבד.'),extra='flex:1;min-width:0;')
open(P_+'D-AdmCompose.dc.html','w',encoding='utf-8').write(shell('ד · הודעה חדשה','הודעות',head('הודעה חדשה','',btn('ביטול'))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{left}{right}</section>'))
# import errors
colsE=[('שורה','width:60px;'),('שם','width:170px;'),('טלפון','width:150px;'),('מה לתקן','flex:1;min-width:0;')]
er=[('3','יעל גולן','050-12345','מספר הטלפון קצר מדי'),('8','דוד מזרחי','','חסר מספר טלפון'),('15','רחל אבני','052-345-6789','המספר מופיע גם בשורה 12'),('21','','054-222-3333','חסר שם')]
tE=th(colsE)
for i,(a,b_,c_,d_) in enumerate(er):
    tE+=tr([(a,colsE[0][1]),(b_ or '—',colsE[1][1]),(f'<bdi dir="ltr">{c_}</bdi>' if c_ else '—',colsE[2][1]),(pill(d_,'#FFE9E6'),colsE[3][1])],i==len(er)-1)
panelE=panel(h2('4 שורות צריכות תיקון','124 שורות תקינות וממתינות להזמנה')+f'<div style="display:flex;gap:10px;flex-wrap:wrap;">{pill("124 תקינות","#D7F5E8")}{pill("4 לתיקון","#FFE9E6")}</div>'+tE
 +f'<div style="display:flex;gap:10px;align-items:center;"><span style="flex:1;"></span>{btn("הורדת השורות לתיקון")}{btn("להמשיך בלי השורות האלה",True)}</div>'
 +note('אפשר להמשיך עכשיו ולהוסיף את ארבעת החברים האלה בהמשך, אחד אחד.'))
open(P_+'D-AdmImportErrors.dc.html','w',encoding='utf-8').write(shell('ד · ייבוא · שגיאות','חברים',head('ייבוא חברים','',btn('חזרה לקובץ'))+panelE))
print('ok gaps')
