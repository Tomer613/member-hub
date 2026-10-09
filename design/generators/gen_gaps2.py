# New inquiry (member) + sent state + admin note on member (mobile admin).
full=open('/home/claude/gen/gen_gaps.py',encoding='utf-8').read()
exec(full.split("\n# ---- admin\n")[0].split("\nfor k,v in gm.items()")[0])
g2={}
WARN='אל תכתבו כאן מידע רפואי או מזהה רגיש.'
def wl(t=WARN): return f'<span style="font-size:12.5px;font-weight:600;color:{SOFT};">{t}</span>'
def tf(label,val,h=52,ph=True,hint=''):
    c=SOFT if ph else INK
    return (f'<div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:15px;">{label}</span>'
     f'<div style="min-height:{h}px;box-sizing:border-box;padding:12px 14px;display:flex;align-items:flex-start;background:#fff;border:2px solid {INK};border-radius:14px;font-size:16px;font-weight:600;color:{c};line-height:1.45;">{val}</div>{hint}</div>')
kinds=''.join(mchip(t,i==2) for i,t in enumerate(['שינוי פרטים','מחלוקת על חיוב','שאלה כללית','אחר']))
g2['D-InquiryNew']=page('ד · פנייה חדשה',844,orgband('פנייה חדשה')
 +f'<div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:15px;">על מה הפנייה?</span><div style="display:flex;flex-wrap:wrap;gap:8px;">{kinds}</div></div>'
 +tf('בהמשך לפנייה קודמת (לא חובה)','#1042',52,False)
 +f'<div style="flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 12px;border:2px dashed {INK};border-radius:14px;background:#FFF9EC;font-size:13.5px;font-weight:700;">{ico("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",18,2.2)}בהמשך להודעה: חלוקת מפתחות חדשים</div>'
 +tf('כמה מילים','אפשר לפרט, או להשאיר ריק',130,True,wl())
 +P('הפנייה מגיעה להנהלה בשמכם. חברים אחרים לא רואים אותה.',13,SOFT)
 +'<div style="flex:1;min-height:4px;"></div>'+pbtn('שליחה להנהלה')+'<div style="height:6px;flex-shrink:0;"></div>','')
CHK='M5 12.5l4.5 4.5L19 7.5'
g2['D-InquirySent']=page('ד · פנייה נשלחה',844,orgband('פנייה חדשה')
 +state(CHK,'הפנייה נשלחה','ההנהלה תקבל אותה ותענה כאן. נעדכן אתכם כשיש תשובה.',pbtn('חזרה להודעות')+sbtn('הפניות שלי'),'#D7F5E8'),'')
# admin mobile: note on member
sel=''.join(mchip(t,i==0) for i,t in enumerate(['רק מנהלים','חבר ההנהלה בלבד']))
g2['D-MAdmNote']=page('ד · ניהול במובייל · הערה על חבר',844,abar('הערה על חבר','דנה לוי')
 +tf('ההערה','כתבו כאן…',130,True,wl())
 +P('ההערה נראית רק למנהלים ומתועדת בשם מי שכתב אותה. היא לא מוצגת לחבר באפליקציה.',13,SOFT)
 +'<div style="flex:1;min-height:4px;"></div>'+pbtn('שמירת הערה')+'<div style="height:6px;flex-shrink:0;"></div>','')
for k,v in g2.items(): open(P_+k+'.dc.html','w',encoding='utf-8').write(v)
print('ok gaps2')
