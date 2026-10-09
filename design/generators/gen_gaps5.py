# Admin: inquiry detail with reply.
full=open('/home/claude/gen/gen_gaps3.py',encoding='utf-8').read()
exec(full.split("\nopen(P_+'D-AdmOrgClose")[0])
def bubd(who,when,txt,mine):
    bg='#fff' if mine else '#FFF6D1'
    return (f'<div style="padding:12px 14px;border:2px solid {INK};border-radius:16px;background:{bg};display:flex;flex-direction:column;gap:4px;">'
     f'<div style="display:flex;gap:8px;align-items:center;"><b>{who}</b><span style="color:{SOFT};font-size:13px;font-weight:700;">{when}</span></div><span style="font-weight:600;line-height:1.45;">{txt}</span></div>')
rows=''
for n,k,s,on,c in [('דנה לוי','שאלה כללית #1042','נענתה',True,'#FFD9E8'),('אבי שמעוני','שינוי פרטים','חדשה',False,'#CFF0FC'),('חנה ברק','מחלוקת על חיוב #1043','תגובה חדשה',False,'#D7F5E8'),('יוסי כהן','שאלה כללית','נסגרה',False,'#E3DDFF')]:
    rows+=f'<div style="padding:10px 12px;border:2px solid {INK};border-radius:14px;background:{"#FFF6D1" if on else "#fff"};display:flex;gap:10px;align-items:center;">{av(n[0],c)}<div style="flex:1;display:flex;flex-direction:column;"><b>{n}</b><span style="color:{SOFT};font-size:13px;">{k}</span></div>{pill(s,"#FF8A6B" if s=="תגובה חדשה" else "#fff")}</div>'
lp=panel(h2('פניות')+rows,extra='width:340px;flex-shrink:0;align-self:flex-start;')
rp=panel(f'<div style="display:flex;align-items:center;gap:10px;">{av("ד","#FFD9E8",44)}<div style="flex:1;display:flex;flex-direction:column;"><h2 class="h" style="margin:0;font-size:22px;">שאלה כללית <bdi>#1042</bdi></h2><span style="color:{SOFT};font-weight:600;">דנה לוי · בהמשך להודעה: חלוקת מפתחות חדשים</span></div>{pill("נענתה","#D7F5E8")}</div>'
 +bubd('דנה לוי','אתמול, 19:40','אני לא אהיה בבית מחר בשעות האלה. אפשר לקבל את המפתח ביום חמישי?',True)
 +bubd('אתם','היום, 09:15','אפשר. נשאיר לכם מפתח אצל גבאי הבניין בקומת הכניסה. תודה שעדכנתם.',False)
 +fld('תשובה','כתבו כאן את התשובה…','אל תכתבו כאן מידע רפואי או מזהה רגיש. החבר יראה את התשובה בפניות שלו.',110,True)
 +f'<div style="display:flex;gap:10px;align-items:center;">{btn("הערה פנימית על החבר")}<span style="flex:1;"></span>{btn("סגירת הפנייה")}{btn("שליחת תשובה",True)}</div>'
 +note('אפשר לדון בפנייה עד שהיא נסגרת, והחבר מגיב באותו מקום. אפשר לסגור אותה ידנית. פנייה שנענתה נסגרת גם אוטומטית אחרי 14 ימים בלי תגובה. פניות סגורות נמחקות אחרי שנתיים.'),extra='flex:1;min-width:0;')
open(P_+'D-AdmInquiry.dc.html','w',encoding='utf-8').write(shell('ד · פנייה','פניות',head('פניות','',btn('מסנן: חדשות'))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{lp}{rp}</section>'))
print('ok gaps5')
