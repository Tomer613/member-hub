# Member's inquiries: list, empty, view.
full=open('/home/claude/gen/gen_gaps2.py',encoding='utf-8').read()
exec(full.split("\nfor k,v in g2.items()")[0])
g4={}
def stp(t):
    bg={'חדשה':'#E3DDFF','בטיפול':'#FFF6D1','נענתה':'#D7F5E8','נסגרה':'#EDE6D6'}[t]
    return tagp(t,bg)
def icard(kind,snippet,when,status,unread=False):
    dot=f'<span aria-label="תשובה חדשה" style="width:12px;height:12px;border-radius:50%;background:#FF5A36;border:2px solid {INK};flex-shrink:0;"></span>' if unread else ''
    return (f'<a href="#" style="flex-shrink:0;min-height:76px;box-sizing:border-box;padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1.5px solid #EDE6D6;">'
     f'<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:800;font-size:16px;">{kind}</span>{stp(status)}{dot}</div>'
     f'<span style="font-size:13.5px;font-weight:600;color:{SOFT};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{snippet}</span></div>'
     f'<span style="font-size:12.5px;font-weight:700;color:{SOFT};">{when}</span>{ico("M15 6l-6 6 6 6",18,2.4)}</a>')
lst=(icard('שאלה כללית #1042','בהמשך להודעה: חלוקת מפתחות חדשים','היום','נענתה',True)
 +icard('שינוי פרטים #1039','עברתי דירה, אפשר לעדכן את מספר הדירה?','אתמול','בטיפול')
 +icard('מחלוקת על חיוב #1031','חויבתי פעמיים בחודש ספטמבר','לפני שבוע','נסגרה'))
g4['D-InquiryList']=page('ד · הפניות שלי',844,orgband('הפניות שלי')+box(lst)+P('פניות סגורות נשמרות שנתיים ואז נמחקות.',13,SOFT)+'<div style="flex:1;min-height:4px;"></div>'+pbtn('פנייה חדשה')+'<div style="height:6px;flex-shrink:0;"></div>','')
g4['D-InquiryEmpty']=page('ד · הפניות שלי · ריק',844,orgband('הפניות שלי')
 +state('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z','עוד אין פניות','יש שאלה או בקשה להנהלה? אפשר לכתוב כאן, והתשובה תגיע לאותו מקום.',pbtn('פנייה חדשה')),'')
def bub(who,when,txt,mine):
    bg='#FFF6D1' if mine else '#fff'
    return (f'<section style="flex-shrink:0;background:{bg};border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:12px 14px;display:flex;flex-direction:column;gap:6px;">'
     f'<div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:800;font-size:15px;flex:1;">{who}</span><span style="font-size:12.5px;font-weight:700;color:{SOFT};">{when}</span></div>'
     f'<p style="margin:0;font-size:15px;font-weight:600;line-height:1.45;">{txt}</p></section>')
g4['D-InquiryView']=page('ד · פנייה',844,orgband('הפנייה שלי')
 +f'<div style="flex-shrink:0;display:flex;align-items:center;gap:8px;"><span style="font-family:\'Secular One\',sans-serif;font-size:22px;flex:1;">שאלה כללית <bdi>#1042</bdi></span>{stp("נענתה")}</div>'
 +f'<div style="flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 12px;border:2px dashed {INK};border-radius:14px;background:#FFF9EC;font-size:13.5px;font-weight:700;">{ico("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",18,2.2)}בהמשך להודעה: חלוקת מפתחות חדשים</div>'
 +bub('אתם','אתמול, 19:40','אני לא אהיה בבית מחר בשעות האלה. אפשר לקבל את המפתח ביום חמישי?',True)
 +bub('ההנהלה','היום, 09:15','אפשר. נשאיר לכם מפתח אצל גבאי הבניין בקומת הכניסה. תודה שעדכנתם.',False)
 +tf('התגובה שלכם','אפשר להגיב עד שהפנייה נסגרת',80,True,wl())+'<div style="flex:1;min-height:4px;"></div>'+pbtn('שליחת תגובה')+sbtn('סגירת הפנייה')+'<div style="height:6px;flex-shrink:0;"></div>','')
g4['D-InquiryClosed']=page('ד · פנייה סגורה',844,orgband('הפנייה שלי')
 +f'<div style="flex-shrink:0;display:flex;align-items:center;gap:8px;"><span style="font-family:\'Secular One\',sans-serif;font-size:22px;flex:1;">מחלוקת על חיוב <bdi>#1031</bdi></span>{stp("נסגרה")}</div>'
 +bub('אתם','לפני שבוע','חויבתי פעמיים בחודש ספטמבר.',True)
 +bub('ההנהלה','לפני שבוע','בדקנו. החיוב הכפול זוכה. תודה.',False)
 +f'<div style="flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 12px;border:2px dashed {INK};border-radius:14px;background:#FFF9EC;font-size:13.5px;font-weight:700;">{ico(LOCK,18,2.2)}הפנייה נסגרה ואי אפשר להגיב בה. אפשר לפתוח פנייה חדשה ולציין בה את מספר הפנייה.</div>'
 +'<div style="flex:1;min-height:4px;"></div>'+pbtn('פנייה חדשה בהמשך ל-#1031')+'<div style="height:6px;flex-shrink:0;"></div>','')
for k,v in g4.items(): open(P_+k+'.dc.html','w',encoding='utf-8').write(v)
print('ok gaps4')
