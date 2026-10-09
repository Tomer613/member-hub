# Light mobile admin boards (Direction D). Reuses gen_pay2 helpers; writes 5 boards.
src=open('/home/claude/gen/gen_pay2.py',encoding='utf-8').read().split("for k,v in out2.items()")[0]
exec(src)
OA='#5B3DF5'; WH='#FFFFFF'
HOMEI='M3 11l9-8 9 8v9H3zM9 20v-6h6v6'; PPL='M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21c0-4 4-6 8-6s8 2 8 6'
COIN='M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5h4.5'
MORE='M5 12h.01M12 12h.01M19 12h.01'; MAIL='M3 6h18v12H3zM3 7l9 7 9-7'; MON='M3 5h18v11H3zM8 21h8M12 16v5'
SWAP='M7 7h13l-3-3M17 17H4l3 3'
def anav(active):
    def tab(k,l,d,b=''):
        on=k==active
        st=f"border:2px solid {INK};background:{Y};" if on else "border:2px solid transparent;"
        lab=f'<span style="font-weight:800;font-size:13.5px;margin-inline-start:5px;">{l}</span>' if on else ''
        bd=f'<span style="position:absolute;top:-6px;inset-inline-end:2px;min-width:18px;height:18px;box-sizing:border-box;padding:0 4px;border-radius:9px;background:#FF5A36;color:{INK};border:2px solid {INK};font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;">{b}</span>' if b else ''
        return f'<a href="#" aria-label="{l}" style="display:flex;align-items:center;justify-content:center;position:relative;min-height:48px;box-sizing:border-box;border-radius:24px;{st}color:{INK};">{ico(d)}{lab}{bd}</a>'
    return f'<nav aria-label="ניווט ניהול" style="flex-shrink:0;height:64px;box-sizing:border-box;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;background:{WH};border-top:2px solid {INK};padding:7px 10px;">{tab("home","סקירה",HOMEI)}{tab("mem","חברים",PPL,"9")}{tab("fin","כספים",COIN)}{tab("more","עוד",MORE)}</nav>'
def abar(title,sub='',back_=True,right=''):
    b=f'<span style="color:{INK};display:flex;">{back}</span>' if back_ else ''
    s=f'<span style="font-size:13px;font-weight:700;opacity:.9;">{sub}</span>' if sub else ''
    return f'<div style="flex-shrink:0;margin:-18px -16px 0;padding:18px 16px 14px;background:{OA};border-bottom:2.5px solid {INK};color:{WH};display:flex;align-items:center;gap:12px;">{b}<div style="flex:1;display:flex;flex-direction:column;"><span style="font-family:\'Secular One\',sans-serif;font-size:24px;line-height:1.1;">{title}</span>{s}</div>{right}</div>'
def swpill(): return f'<span style="padding:6px 12px;border-radius:16px;border:2px solid {INK};background:{Y};color:{INK};font-size:13px;font-weight:800;display:inline-flex;align-items:center;gap:5px;">{ico(SWAP,15,2.4)}תצוגת חבר</span>'
def task(n,t,sub,col=OA):
    return f'<a href="#" style="flex-shrink:0;min-height:64px;box-sizing:border-box;background:{WH};border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:10px 14px;display:flex;align-items:center;gap:12px;"><span style="min-width:40px;height:40px;border-radius:20px;background:{col};color:{INK if col=='#FF8A6B' else WH};border:2px solid {INK};font-family:\'Secular One\',sans-serif;font-size:20px;display:flex;align-items:center;justify-content:center;">{n}</span><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16.5px;">{t}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{ico(CHEV,22,2.4)}</a>'
def qa(icon,t):
    return f'<a href="#" style="min-height:76px;box-sizing:border-box;background:{WH};border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-weight:800;font-size:14.5px;text-align:center;">{ico(icon,26,2.2)}{t}</a>'
def chip(label,sel,count=None):
    bg,fg=(INK,'#FFFFFF') if sel else ('#FFFFFF',INK)
    c=f'<span style="min-width:22px;height:22px;box-sizing:border-box;padding:0 5px;border-radius:11px;background:#FF8A6B;color:{INK};border:2px solid {INK};font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-inline-start:6px;">{count}</span>' if count else ''
    return f'<span role="radio" aria-checked="{str(sel).lower()}" style="min-height:44px;box-sizing:border-box;padding:0 14px;border-radius:22px;border:2px solid {INK};background:{bg};color:{fg};font-weight:800;font-size:15px;display:inline-flex;align-items:center;white-space:nowrap;">{label}{c}</span>'
mo={}
# 1 home
mo['D-MAdmHome']=page('ד · ניהול במובייל · סקירה',844,
 abar('מועדון הים','ניהול · יו״ר המועדון',False,swpill())
 +H2('דורש טיפול')
 +task(9,'בקשות הצטרפות','ממתינות לאישור','#FF8A6B')
 +task(23,'חייבים','סה״כ ₪14,820 פתוח',DANGER)
 +task(4,'פניות חדשות','2 דחופות',OA)
 +H2('פעולות מהירות')
 +f'<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;flex-shrink:0;">{qa(COIN,"רישום תשלום ידני")}{qa(MAIL,"הודעה מהירה")}{qa(SRC,"חיפוש חבר")}{qa(PLUS,"יצירת חיוב")}</div>'
 +P('לניהול מלא — דוחות, הגדרות, צוות והרשאות — עברו למערכת בדסקטופ.',13,SOFT)
 +f'<a href="#" style="flex-shrink:0;min-height:44px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:15px;text-decoration:underline;">{ico(MON,20,2.2)}פתיחת המערכת המלאה</a>'
 ,anav('home'))
# 2 requests
def req(n,sub,last=False):
    return f'<div style="padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:{"none" if last else "1.5px solid #EDE6D6"};"><span style="width:42px;height:42px;border-radius:21px;border:2px solid {INK};background:#E3DDFF;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{n[0]}</span><div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{n}</span><span style="font-size:12.5px;font-weight:600;color:{SOFT};">{sub}</span></div>{btnsm("דחייה",danger=True)}{btnsm("אישור",True)}</div>'
mo['D-MAdmRequests']=page('ד · ניהול במובייל · בקשות',844,
 abar('בקשות הצטרפות','9 ממתינות')
 +box(req('דנה כהן','כסף · לפני שעה')+req('יוסי לוי','זהב · לפני 3 שעות')+req('מיכל אברהם','כסף · אתמול')+req('אורי פרידמן','כסף · אתמול',True))
 +P('מוצגות 4 מתוך 9. בקשות עם פרטים חסרים נשארות לטיפול בדסקטופ.',13,SOFT)
 +'<div style="flex:1;min-height:6px;"></div>'+sbtn('לאשר את כל הבקשות התקינות (7)')+'<div style="height:6px;flex-shrink:0;"></div>'
 ,anav('mem'))
# 3 member quick view
mo['D-MAdmMember']=page('ד · ניהול במובייל · חבר',900,
 abar('דנה כהן','חברות מאז 2023 · רמת זהב')
 +box(f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;">{kv("סטטוס","פעילה")}{kv("חיוב הבא","01.11 · ₪1,400")}{kv("טלפון","<span dir=ltr>050-123-4567</span>")}{kv("תוויות","תומכת · מתנדבת")}</div>')
 +f'<section style="flex-shrink:0;background:#FFFFFF;border:2px solid {DANGER};border-radius:18px;box-shadow:0 3px 0 {DANGER};padding:12px 14px;display:flex;flex-direction:column;gap:8px;"><span style="font-weight:800;font-size:16px;color:{DANGER};">חוב פתוח · ₪350</span><span style="font-size:13.5px;font-weight:600;">אירוע גאלה שנתית · באיחור 12 ימים</span><div style="display:flex;gap:8px;">{btnsm("רישום תשלום ידני",True)}{btnsm("תזכורת")}</div></section>'
 +f'<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;flex-shrink:0;">{qa(MAIL,"שליחת הודעה")}{qa(COIN,"יצירת חיוב")}</div>'
 +P('היסטוריה מלאה, שינוי רמה וביטול חברות — בתיק החבר בדסקטופ.',13,SOFT)
 ,'')
# 4 manual payment
mo['D-MAdmPayRecord']=page('ד · ניהול במובייל · רישום תשלום',900,
 abar('רישום תשלום ידני','דנה כהן · חוב ₪350')
 +fld('סכום','₪350',True)
 +f'<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:15px;">איך שולם</span><div style="display:flex;gap:8px;flex-wrap:wrap;">{chip("מזומן",True)}{chip("העברה",False)}{chip("צ׳ק",False)}{chip("ביט / פייבוקס",False)}</div></div>'
 +fld('תאריך קבלת התשלום','היום',False,'',True)
 +fld('הערה','',False,'לדוגמה: שולם ליד הכניסה',True)
 +box(f'<div style="padding:10px 14px;">{chk("שליחת קבלה לחברה",True,"נשלחת אוטומטית בהודעה ובדוא״ל")}</div>')
 +P('הרישום נכנס לקופה ומתועד בשם המנהל שביצע אותו.',13,SOFT)
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('רישום התשלום')+'<div style="height:6px;flex-shrink:0;"></div>'
 ,'')
# 5 quick message
mo['D-MAdmMessage']=page('ד · ניהול במובייל · הודעה מהירה',900,
 abar('הודעה מהירה','לחברי המועדון')
 +f'<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:15px;">למי</span><div style="display:flex;gap:8px;flex-wrap:wrap;">{chip("כולם",True,"310")}{chip("רמת זהב",False)}{chip("חייבים",False,"23")}{chip("חבר בודד",False)}</div></div>'
 +fld('נושא','',False,'לדוגמה: אירוע ביום חמישי',True)
 +f'<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:15px;">ההודעה</span><div style="min-height:130px;box-sizing:border-box;padding:12px 14px;background:#FFFFFF;border:2px solid {INK};border-radius:14px;font-size:16px;font-weight:600;color:{SOFT};line-height:1.45;">כתבו כאן את ההודעה…</div><span style="font-size:12.5px;font-weight:600;color:#5A4E70;">אל תכתבו כאן מידע רפואי או מזהה רגיש.</span></div>'
 +P('ההודעה תישלח כהתראה באפליקציה. הודעות מעוצבות, קבצים ותזמון — בדסקטופ.',13,SOFT)
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('שליחה ל-310 חברים')+'<div style="height:6px;flex-shrink:0;"></div>'
 ,'')
for k,v in mo.items(): open(f'/home/claude/project/{k}.dc.html','w',encoding='utf-8').write(v)
print(list(mo))
