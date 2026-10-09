# Manager identity: add-manager screen + inquiry thread attributed to managers.
full=open('/home/claude/gen/gen_gaps5.py',encoding='utf-8').read()
exec(full.split("\ndef bubd")[0])
exec(open('/home/claude/gen/mgr_identity.py',encoding='utf-8').read())
def bubm(n,when,txt,note_=False):
    bd='dashed' if note_ else 'solid'; bg=tint(n,0.22 if note_ else 0.4)
    tag=f'<span style="font-size:12px;font-weight:800;color:{SOFT};">הערה פנימית · רק מנהלים רואים</span>' if note_ else ''
    return (f'<div style="padding:12px 14px;border:2px {bd} {INK};border-radius:16px;background:{bg};display:flex;flex-direction:column;gap:5px;">'
     f'<div style="display:flex;gap:8px;align-items:center;">{mwho(n,True,28)}<span style="color:{SOFT};font-size:13px;font-weight:700;">{when}</span></div>{tag}<span style="font-weight:600;line-height:1.45;">{txt}</span></div>')
def bubmem(who,when,txt):
    return (f'<div style="padding:12px 14px;border:2px solid {INK};border-radius:16px;background:#fff;display:flex;flex-direction:column;gap:4px;">'
     f'<div style="display:flex;gap:8px;align-items:center;"><b>{who}</b><span style="color:{SOFT};font-size:13px;font-weight:700;">{when}</span></div><span style="font-weight:600;line-height:1.45;">{txt}</span></div>')
rows=''
for n,k,s,on,c,h in [('דנה לוי','שאלה כללית #1042','נענתה',True,'#FFD9E8','מיכה אדלר'),('אבי שמעוני','שינוי פרטים','חדשה',False,'#CFF0FC',None),('חנה ברק','מחלוקת על חיוב #1043','תגובה חדשה',False,'#D7F5E8','שרה כהן'),('יוסי כהן','שאלה כללית','נסגרה',False,'#E3DDFF','מיכה אדלר')]:
    hh=f'<span title="מטפל/ת: {h}">{mav(h,26)}</span>' if h else f'<span style="font-size:12.5px;font-weight:800;color:{DANGER};">ללא מטפל</span>'
    rows+=f'<div style="padding:10px 12px;border:2px solid {INK};border-radius:14px;background:{"#FFF6D1" if on else "#fff"};display:flex;gap:10px;align-items:center;">{av(n[0],c)}<div style="flex:1;display:flex;flex-direction:column;"><b>{n}</b><span style="color:{SOFT};font-size:13px;">{k}</span></div>{pill(s,"#FF8A6B" if s=="תגובה חדשה" else "#fff")}{hh}</div>'
lp=panel(h2('פניות')+rows+note('העיגול הצבעוני הוא המנהל שמטפל בפנייה. פנייה בלי מטפל מגיעה למנהל הראשי.'),extra='width:340px;flex-shrink:0;align-self:flex-start;box-sizing:border-box;')
rp=panel(f'<div style="display:flex;align-items:center;gap:10px;">{av("ד","#FFD9E8",44)}<div style="flex:1;display:flex;flex-direction:column;"><h2 class="h" style="margin:0;font-size:22px;">שאלה כללית <bdi>#1042</bdi></h2><span style="color:{SOFT};font-weight:600;">דנה לוי · בהמשך להודעה: חלוקת מפתחות חדשים</span></div>{pill("נענתה","#D7F5E8")}</div>'
 +bubmem('דנה לוי','אתמול, 19:40','אני לא אהיה בבית מחר בשעות האלה. אפשר לקבל את המפתח ביום חמישי?')
 +bubm('מיכה אדלר','היום, 09:15','אפשר. נשאיר לכם מפתח אצל גבאי הבניין בקומת הכניסה. תודה שעדכנתם.')
 +bubm('אבי בן דוד','היום, 09:40','המפתח כבר אצלי, אפשר לאסוף עד חמישי.',True)
 +fld('תשובה','כתבו כאן את התשובה…','אל תכתבו כאן מידע רפואי או מזהה רגיש. החבר יראה את התשובה בפניות שלו, עם השם הפרטי והתפקיד שלכם.',90,True)
 +f'<div style="display:flex;gap:10px;align-items:center;"><span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;color:{SOFT};">משיבים בשם: {mwho("מיכה אדלר",True,26)}</span><span style="flex:1;"></span>{btn("הערה פנימית")}{btn("סגירת הפנייה")}{btn("שליחת תשובה",True)}</div>'
 +note('אפשר לדון בפנייה עד שהיא נסגרת, והחבר מגיב באותו מקום. פנייה שנענתה נסגרת גם אוטומטית אחרי 14 ימים בלי תגובה. כל תשובה והערה נשמרות עם שם המנהל שכתב אותן.'),extra='flex:1;min-width:0;box-sizing:border-box;')
open(P_+'D-AdmInquiry.dc.html','w',encoding='utf-8').write(shell('ד · פנייה','פניות',head('פניות','',btn('מסנן: חדשות'))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{lp}{rp}</section>'))

# add manager
cand=''
for n,sub,sel in [('רונית אלון','חברה מ-2021',False),('אורי פרידמן','חבר מ-2019',True),('נועה שמש','חברה מ-2023',False)]:
    cand+=f'<div style="padding:10px 12px;border:2px solid {INK};border-radius:14px;background:{"#FFF6D1" if sel else "#fff"};display:flex;gap:10px;align-items:center;">{av(n[0],"#E3DDFF")}<div style="flex:1;display:flex;flex-direction:column;"><b>{n}</b><span style="color:{SOFT};font-size:13px;">{sub}</span></div><span style="width:22px;height:22px;border-radius:50%;border:2px solid {INK};background:{INK if sel else "#fff"};display:inline-block;"></span></div>'
left=panel(h2('1. מי יהיה מנהל','רק חבר בארגון שיש לו חשבון באפליקציה')
 +fld('חיפוש חבר','שם או טלפון','',48,False)+cand
 +f'<div style="padding:12px;background:{CREAM};border:2px dashed {INK};border-radius:14px;display:flex;flex-direction:column;gap:8px;"><b>לא מוצאים אותו?</b><span style="color:{SOFT};font-weight:600;font-size:14px;">מי שאינו חבר בארגון או אין לו חשבון צריך קודם להצטרף.</span>{btn("הזמנה להצטרפות")}</div>',pad=16,gap=10,extra='width:420px;flex-shrink:0;align-self:flex-start;box-sizing:border-box;')
sw=''.join(f'<span style="width:32px;height:32px;border-radius:50%;background:{c};border:2.5px solid {INK};box-sizing:border-box;display:inline-block;{"box-shadow:0 0 0 3px #fff,0 0 0 5px "+INK+";" if i==2 else ""}"></span>' for i,c in enumerate(MPAL))
tm=''.join(pill(t,Y if t=='מזכיר' else '#fff') for t in ['גבאי','גזבר','דובר','מזכיר','ריק'])
MGR['אורי פרידמן']=('א','#FF9B6B','מזכיר')
mid=panel(h2('2. תפקיד והרשאות','אפשר לשנות כל תחום אחר כך')
 +f'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><b>תבנית:</b>{tm}</div>'
 +f'<div style="padding:12px;border:2px solid {INK};border-radius:14px;background:#fff;line-height:1.7;font-weight:600;"><b>מזכיר מקבל:</b><br>חברים: קריאה וכתיבה<br>בקשות הצטרפות: קריאה, כתיבה והתראה<br>הודעות: קריאה וכתיבה<br>כספים: ללא גישה</div>'
 +h2('3. הצבע שלו','מופיע ליד כל פעולה שלו, בכל מסך')+f'<div style="display:flex;gap:8px;flex-wrap:wrap;">{sw}</div>'
 +f'<div style="padding:10px 12px;background:{CREAM};border:2px solid {INK};border-radius:14px;">{mwho("אורי פרידמן")}</div>'
 +note('הצבע נבחר אוטומטית מתוך צבעים שלא בשימוש, כדי שלא יהיו שני מנהלים באותו צבע.'),pad=16,gap=10,extra='flex:1;min-width:0;box-sizing:border-box;')
right=panel(h2('איך זה ממשיך')
 +''.join(f'<div style="display:flex;gap:10px;align-items:flex-start;"><span class="h" style="width:28px;height:28px;border-radius:50%;background:{Y};border:2px solid {INK};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;">{i}</span><span style="font-weight:600;line-height:1.45;">{t}</span></div>' for i,t in [(1,'אורי מקבל בקשה בהתראה ובמייל.'),(2,'הוא מאשר, ואז התפקיד מתחיל.'),(3,'מנהל ראשי נוסף מאשר את ההוספה, כי זו פעולה רגישה.'),(4,'ההוספה נרשמת ביומן הפעולות.')])
 +btn('שליחת בקשה לאורי',True),pad=16,gap=12,extra='width:300px;flex-shrink:0;align-self:flex-start;box-sizing:border-box;')
open(P_+'D-AdmAddManager.dc.html','w',encoding='utf-8').write(shell('ד · הוספת מנהל','הגדרות הארגון',head('הוספת מנהל','',btn('ביטול'))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{left}{mid}{right}</section>'))
print('ok gaps7')
