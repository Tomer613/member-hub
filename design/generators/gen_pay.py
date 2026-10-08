# Payment boards (member side). Reuses helpers from gen.py WITHOUT running its board output.
import json,re
src=open('/home/claude/gen/gen.py',encoding='utf-8').read().split('\n')
def L(a,b): return '\n'.join(src[a-1:b])
exec(L(1,83))          # consts + page/nav/chip/logo/header...
exec(L(132,133))       # DANGER, stamp
exec(L(142,142))       # back
exec(L(213,226))       # lab/fld/pbtn/sbtn/sheetc
exec(L(322,325))       # tg, frow
CARD='M3 6h18v12H3zM3 10h18M7 15h4'; LOCK='M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3'
BANK='M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18'; RCPT='M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6'
CHEV='M15 6l-6 6 6 6'; XX='M6 6l12 12M18 6L6 18'; PLUS='M12 5v14M5 12h14'; WARN='M12 3l10 18H2zM12 10v5M12 18v.5'
H2=lambda t: f'<h2 style="margin:4px 4px 0;font-family:\'Secular One\',sans-serif;font-size:19px;font-weight:400;flex-shrink:0;">{t}</h2>'
P=lambda t,sz=14,c=INK,al='start': f'<p style="margin:0 4px;font-size:{sz}px;font-weight:700;line-height:1.4;color:{c};text-align:{al};flex-shrink:0;">{t}</p>'
def hdr(t): return f'<header style="display:flex;align-items:center;gap:12px;flex-shrink:0;">{back}<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:28px;line-height:1.05;font-weight:400;">{t}</h1></header>'
def pill(t,dark=True,col=None):
    if col: return f'<span style="padding:3px 10px;border-radius:12px;border:2px solid {col};color:{col};background:#FFFFFF;font-size:12px;font-weight:800;white-space:nowrap;">{t}</span>'
    return f'<span style="padding:3px 10px;border-radius:12px;background:{INK if dark else "#FFFFFF"};color:{"#FFFFFF" if dark else INK};{"" if dark else f"border:2px solid {INK};"}font-size:12px;font-weight:800;white-space:nowrap;">{t}</span>'
def btnsm(t,primary=False,danger=False):
    bg=Y if primary else '#FFFFFF'; fg=DANGER if danger else INK; bd=DANGER if danger else INK
    sh=f'box-shadow:0 3px 0 {INK};margin-bottom:3px;' if primary else ''
    return f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 16px;border-radius:22px;border:2px solid {bd};background:{bg};color:{fg};{sh}font-weight:800;font-size:15px;display:inline-flex;align-items:center;">{t}</a>'
def pm(icon,title,sub,default=False,warn=None,actions=''):
    tag=pill('ברירת מחדל') if default else ''
    wr=f'<span style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:{DANGER};">{ico(WARN,16,2.4)}{warn}</span>' if warn else ''
    act=f'<div style="display:flex;gap:8px;flex-wrap:wrap;">{actions}</div>' if actions else ''
    return f'<article style="flex-shrink:0;background:#FFFFFF;border:2px solid {DANGER if warn else INK};border-radius:18px;box-shadow:0 3px 0 {DANGER if warn else INK};padding:12px 14px;display:flex;flex-direction:column;gap:10px;"><div style="display:flex;align-items:center;gap:12px;">{logo("",44,CREAM,icon)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:17px;"><bdi>{title}</bdi></span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div>{tag}</div>{wr}{act}</article>'
def orgrow(lg,name,use,last=False):
    return f'<a href="#" style="min-height:60px;box-sizing:border-box;padding:8px 14px;display:flex;align-items:center;gap:12px;border-bottom:{"none" if last else "1.5px solid #EDE6D6"};">{lg}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{name}</span><span style="font-size:13px;font-weight:700;color:{SOFT};"><bdi>{use}</bdi></span></div>{ico(CHEV,22,2.4)}</a>'
def box(inner): return f'<section style="flex-shrink:0;background:#FFFFFF;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};overflow:hidden;">{inner}</section>'
LV=logo('ו',40,'#FF9B6B'); LF=logo('פ',40,'#5EE0C0'); LS=logo('ב',40,'#B9A4FF')
out={}
# 1. methods
out['D-PayMethods']=page('ד · אמצעי תשלום',1010,hdr('אמצעי תשלום')
 +P('אמצעי התשלום נשמרים אצל ספק התשלומים המאובטח שלנו. אנחנו לא שומרים מספרי כרטיס.',13.5,SOFT)
 +pm(CARD,'Visa ••4242','תוקף עד 08/28',True,actions=btnsm('מחיקה',danger=True))
 +pm(CARD,'Mastercard ••1881','תוקף 03/26',warn='פג תוקף בעוד חודשיים',actions=btnsm('עדכון כרטיס',True)+btnsm('הגדרה כברירת מחדל')+btnsm('מחיקה',danger=True))
 +pm(BANK,'חיוב חשבון בנק ••5532','בנק הפועלים · הרשאה פעילה',actions=btnsm('הגדרה כברירת מחדל')+btnsm('ביטול הרשאה',danger=True))
 +pbtn('הוספת אמצעי תשלום')
 +H2('לפי ארגון')
 +P('ברירת המחדל משמשת בכל הארגונים. אפשר לבחור אמצעי אחר לארגון מסוים.',13.5,SOFT)
 +box(orgrow(LV,'ועד בית · האמורים 62','ברירת מחדל (Visa ••4242)')+orgrow(LF,'פיט סיטי','Mastercard ••1881')+orgrow(LS,'בית הכנסת המרכזי','חיוב חשבון בנק ••5532',True)),nav('wallet'))
# 2. org sheet
def rad(t,sub,sel):
    dot=f'<span style="width:12px;height:12px;border-radius:50%;background:{INK};"></span>' if sel else ''
    bg=Y if sel else '#FFFFFF'
    return f'<div role="radio" aria-checked="{str(sel).lower()}" style="min-height:60px;box-sizing:border-box;padding:8px 14px;display:flex;align-items:center;gap:12px;border:2px solid {INK};border-radius:16px;background:{bg};{"box-shadow:0 3px 0 "+INK+";" if sel else ""}"><span style="width:24px;height:24px;flex-shrink:0;box-sizing:border-box;border-radius:50%;border:2px solid {INK};background:#FFFFFF;display:flex;align-items:center;justify-content:center;">{dot}</span><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;"><bdi>{t}</bdi></span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div></div>'
sheet=f'<div style="position:absolute;inset:0;background:rgba(30,22,51,.55);z-index:5;"></div><section role="dialog" aria-label="אמצעי תשלום לפיט סיטי" style="position:absolute;inset-inline:0;bottom:0;z-index:6;box-sizing:border-box;background:#FFFFFF;border-top:2.5px solid {INK};border-radius:24px 24px 0 0;padding:14px 16px 20px;display:flex;flex-direction:column;gap:10px;"><span aria-hidden="true" style="align-self:center;width:44px;height:5px;border-radius:3px;background:{INK};opacity:.35;"></span><div style="display:flex;align-items:center;gap:12px;">{LF}<div style="flex:1;"><span style="font-family:\'Secular One\',sans-serif;font-size:20px;">אמצעי תשלום לפיט סיטי</span></div></div>{rad("ברירת מחדל","Visa ••4242",False)}{rad("Mastercard ••1881","תוקף 03/26",True)}{rad("חיוב חשבון בנק ••5532","בנק הפועלים",False)}{sbtn("הוספת אמצעי תשלום חדש")}{pbtn("שמירה")}</section>'
out['D-PayOrgSheet']=page('ד · אמצעי תשלום · בחירה לארגון',844,hdr('אמצעי תשלום')+pm(CARD,'Visa ••4242','תוקף עד 08/28',True)+pm(CARD,'Mastercard ••1881','תוקף 03/26')+box(orgrow(LV,'ועד בית · האמורים 62','ברירת מחדל')+orgrow(LF,'פיט סיטי','Mastercard ••1881',True)),nav('wallet'),sheet)
# 3. add card
wallets=''.join(f'<a href="#" style="flex:1;min-height:48px;box-sizing:border-box;border-radius:24px;border:2px solid {INK};background:#FFFFFF;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;">{t}</a>' for t in ('Apple Pay','Google Pay','Bit'))
secure=f'<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:{SOFT};">{ico(LOCK,18,2.2)}<span>שדות מאובטחים של ספק התשלומים. הפרטים לא נשמרים אצלנו.</span></div>'
def chk(t,on,sub=''):
    box_=f'<span style="width:26px;height:26px;flex-shrink:0;box-sizing:border-box;border-radius:8px;border:2px solid {INK};background:{INK if on else "#FFFFFF"};color:#FFFFFF;display:flex;align-items:center;justify-content:center;">{ico(CHECK,18,3) if on else ""}</span>'
    s=f'<span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span>' if sub else ''
    return f'<div role="checkbox" aria-checked="{str(on).lower()}" style="min-height:48px;display:flex;align-items:center;gap:12px;">{box_}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15.5px;">{t}</span>{s}</div></div>'
scope=f'<div role="radiogroup" aria-label="שימוש בכרטיס" style="display:flex;flex-wrap:wrap;gap:8px;">{chip("בכל הארגונים",True)}{chip("רק בפיט סיטי",False)}</div>'
out['D-PayAddCard']=page('ד · הוספת כרטיס',844,hdr('הוספת כרטיס')
 +f'<div style="display:flex;gap:8px;flex-shrink:0;">{wallets}</div>'+P('או הזנת כרטיס',14,SOFT,'center')
 +sheetc(fld('מספר כרטיס','',True,'0000 0000 0000 0000')+f'<div style="display:flex;gap:10px;"><div style="flex:1;">{fld("תוקף","",True,"MM/YY")}</div><div style="flex:1;">{fld("CVV","",True,"123")}</div></div>'+fld('שם על הכרטיס','',False,'כמו שמופיע על הכרטיס')+secure)
 +H2('איפה להשתמש בו')+scope+chk('הגדרה כברירת מחדל',True)
 +pbtn('שמירת כרטיס'),'')
# 4. pay charge
def ticket(top,bot,topH,color=CREAM):
    n=f'position:absolute;top:{topH-10}px;width:12px;height:22px;box-sizing:border-box;background:{Y};border:2px solid {INK};z-index:2;'
    return f'<div style="flex-shrink:0;position:relative;background:{CREAM};border:2.5px solid {INK};border-radius:20px;box-shadow:0 3px 0 {INK};"><span aria-hidden="true" style="{n}left:-2px;border-left:none;border-radius:0 11px 11px 0;"></span><span aria-hidden="true" style="{n}right:-2px;border-right:none;border-radius:11px 0 0 11px;"></span><div style="border-radius:18px;overflow:hidden;"><div style="height:{topH}px;background:{color};border-bottom:2px solid {INK};box-sizing:content-box;">{top}</div><div style="padding:12px 16px 14px;display:flex;flex-direction:column;gap:6px;">{bot}</div></div></div>'
def kv(k,v): return f'<div style="display:flex;justify-content:space-between;gap:12px;font-size:15px;font-weight:700;"><span style="color:{SOFT};">{k}</span><span style="font-weight:800;text-align:end;"><bdi>{v}</bdi></span></div>'
chtop=f'<div style="height:100%;display:flex;align-items:center;gap:12px;padding:0 14px;">{LV.replace("40px","44px",2)}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;">ועד בית · האמורים 62</span><span style="font-size:13px;font-weight:700;">דמי ועד · אוקטובר 2026</span></div></div>'
chbot=f'<div style="display:flex;align-items:baseline;justify-content:space-between;"><span style="font-weight:800;font-size:16px;">סכום לתשלום</span><bdi style="font-family:\'Secular One\',sans-serif;font-size:34px;">₪120</bdi></div>'+kv('לתשלום עד','15.10.2026')
method=f'<a href="#" style="flex-shrink:0;min-height:60px;box-sizing:border-box;padding:8px 14px;display:flex;align-items:center;gap:12px;background:#FFFFFF;border:2px solid {INK};border-radius:16px;">{logo("",40,CREAM,CARD)}<div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">Visa ••4242</span><span style="font-size:13px;font-weight:700;color:{SOFT};">ברירת מחדל</span></div><span style="font-weight:800;font-size:14px;">שינוי</span>{ico(CHEV,20,2.4)}</a>'
rcp=f'<div style="flex-shrink:0;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;">{ico(RCPT,20,2.2)}<span style="flex:1;">הקבלה תישלח ל-<bdi dir="ltr">dana@example.com</bdi></span><a href="#" style="font-weight:800;text-decoration:underline;">שינוי</a></div>'
out['D-PayCharge']=page('ד · תשלום חיוב',844,hdr('תשלום')+ticket(chtop,chbot,60)+H2('אמצעי תשלום')+method+rcp
 +'<div style="flex:1;min-height:8px;"></div>'+pbtn('לתשלום ₪120')+f'<p style="margin:0 4px 14px;font-size:13px;font-weight:700;text-align:center;color:{SOFT};flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:6px;">{ico(LOCK,16,2.2)}התשלום מאובטח ועובר לקופת הארגון</p>',''); 
# 5. success
stampok=f'<div style="align-self:center;transform:rotate(-6deg);padding:6px 26px;border:3px solid {INK};border-radius:14px;background:#FFFFFF;box-shadow:0 4px 0 {INK};font-family:\'Secular One\',sans-serif;font-size:36px;">שולם</div>'
rbot=kv('סכום','₪120')+kv('אמצעי תשלום','Visa ••4242')+kv('תאריך','08.10.2026 · 16:40')+kv('אסמכתא','A-48213907')
rtop=f'<div style="height:100%;display:flex;align-items:center;gap:12px;padding:0 14px;">{LV.replace("40px","44px",2)}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;">ועד בית · האמורים 62</span><span style="font-size:13px;font-weight:700;">דמי ועד · אוקטובר 2026</span></div></div>'
out['D-PaySuccess']=page('ד · תשלום הצליח',844,'<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;">'+stampok+f'<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:28px;line-height:1.15;font-weight:400;text-align:center;">התשלום התקבל. תודה!</h1>'+ticket(rtop,rbot,60)+P('הקבלה נשלחה ל-dana@example.com',14,SOFT,'center')+'</div>'+pbtn('הורדת קבלה')+sbtn('חזרה לארנק')+'<div style="height:6px;flex-shrink:0;"></div>','')
# 6. failed
stampno=f'<div style="align-self:center;transform:rotate(-6deg);padding:6px 24px;border:3px solid {DANGER};border-radius:14px;background:#FFFFFF;box-shadow:0 4px 0 {DANGER};color:{DANGER};font-family:\'Secular One\',sans-serif;font-size:34px;">לא עבר</div>'
why=f'<section style="flex-shrink:0;background:#FFFFFF;border:2px solid {DANGER};border-radius:18px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:16px;color:{DANGER};">הכרטיס נדחה על ידי הבנק</span><span style="font-size:14px;font-weight:600;line-height:1.4;">לא בוצע חיוב. אפשר לנסות שוב, לבחור אמצעי תשלום אחר, או לפנות לבנק.</span></section>'
out['D-PayFailed']=page('ד · תשלום נכשל',844,'<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;">'+stampno+f'<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:28px;line-height:1.15;font-weight:400;text-align:center;">התשלום על ₪120 לא הושלם</h1>'+why+P('ועד בית · דמי ועד · אוקטובר 2026. עד 15.10.2026',14,SOFT,'center')+'</div>'+pbtn('ניסיון חוזר')+sbtn('בחירת אמצעי תשלום אחר')+f'<a href="#" style="flex-shrink:0;min-height:44px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;text-decoration:underline;">פנייה לארגון</a>','')
# 7. history
def hrow(lg,t,sub,amount,st,last=False,act=''):
    return f'<div style="min-height:68px;box-sizing:border-box;padding:8px 12px;display:flex;align-items:center;gap:10px;border-bottom:{"none" if last else "1.5px solid #EDE6D6"};">{lg}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;"><span style="font-weight:800;font-size:15px;">{t}</span><span style="font-size:13px;font-weight:700;color:{SOFT};"><bdi>{sub}</bdi></span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;"><bdi style="font-weight:800;font-size:16px;">{amount}</bdi>{st}</div>{act}</div>'
rb=f'<a href="#" aria-label="קבלה" style="width:44px;height:44px;flex-shrink:0;box-sizing:border-box;border-radius:50%;border:2px solid {INK};background:#FFFFFF;display:flex;align-items:center;justify-content:center;">{ico(RCPT,22,2.2)}</a>'
paid=pill('שולם',False); late=pill('לא שולם',True,DANGER); ref=pill('הוחזר',False)
fl='<div role="radiogroup" aria-label="סינון" style="display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0;">'+chip('הכל',True)+chip('ועד בית',False)+chip('פיט סיטי',False)+chip('בית הכנסת',False)+'</div>'
out['D-PayHistory']=page('ד · היסטוריית תשלומים',1000,hdr('היסטוריית תשלומים')+fl
 +H2('אוקטובר 2026')+box(hrow(LV,'דמי ועד','אוקטובר · ועד בית','₪120',late,False,f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 14px;border-radius:22px;border:2px solid {INK};background:{Y};box-shadow:0 3px 0 {INK};font-weight:800;font-size:14px;display:inline-flex;align-items:center;margin-bottom:3px;">לתשלום</a>')+hrow(LF,'מנוי חודשי','פיט סיטי · 05.10','₪220',paid,True,rb))
 +H2('ספטמבר 2026')+box(hrow(LV,'דמי ועד','ספטמבר · ועד בית','₪120',paid,False,rb)+hrow(LF,'מנוי חודשי','פיט סיטי · 05.09','₪220',paid,False,rb)+hrow(LS,'תרומה לקידוש','בית הכנסת המרכזי · 14.09','₪180',paid,False,rb)+hrow(LF,'דמי רישום (זיכוי)','פיט סיטי · 01.09','₪-50',ref,True,rb)),nav('wallet'))
# 8. autopay
def sw(label,sub,on,lead=None):
    base=f'<div style="min-height:60px;box-sizing:border-box;padding:8px 14px;display:flex;align-items:center;gap:12px;"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{label}</span><span style="font-size:13px;font-weight:600;color:{SOFT};line-height:1.35;">{sub}</span></div>{tg(on)}</div>'
    if lead is None or not on: return base
    labs=['יום לפני','3 ימים לפני','שבוע לפני']
    cs=''.join(chip(t,i==lead) for i,t in enumerate(labs))
    cap='כמה זמן לפני החיוב' if on else 'כמה זמן לפני החיוב (כשההודעה פעילה)'
    return base+f'<div style="padding:0 14px 12px;display:flex;flex-direction:column;gap:6px;{"" if on else "opacity:.55;"}"><span style="font-weight:800;font-size:13.5px;color:{SOFT};">{cap}</span><div role="radiogroup" aria-label="זמן ההודעה לפני חיוב" style="display:flex;flex-wrap:wrap;gap:6px;">{cs}</div></div>'
apt=f'<div style="height:100%;display:flex;align-items:center;gap:12px;padding:0 14px;">{LF.replace("40px","44px",2)}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;">פיט סיטי</span><span style="font-size:13px;font-weight:700;">מנוי חודשי</span></div></div>'
apb=kv('סכום','₪220 לחודש')+kv('מועד חיוב','ב-5 לכל חודש')+kv('אמצעי תשלום','Visa ••4242')
dbl=f'<div style="font-size:13px;font-weight:700;color:{SOFT};line-height:1.4;padding:0 14px 12px;">אם סכום החיוב ישתנה, תמיד תקבלו הודעה לפני החיוב, גם כשההודעה כבויה.</div>'
out['D-AutoPay']=page('ד · חיוב אוטומטי',844,hdr('חיוב אוטומטי')+P('בלי לזכור לשלם: החיוב יתבצע לבד, בשקט.',15)+ticket(apt,apb,60,'#5EE0C0')
 +box(sw('הודעה לפני כל חיוב','כבוי: לא תקבלו תזכורות מראש. אחרי כל חיוב תקבלו קבלה בלבד.',False,lead=1)+dbl)
 +box(f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:15px;">מה חשוב לדעת</span><span style="font-size:14px;font-weight:600;line-height:1.45;">אפשר לבטל בכל עת, והחיוב הבא לא יתבצע. אם חיוב נכשל, תקבלו הודעה ותוכלו לשלם ידנית.</span></div>')
 +chk('אישור חיוב אוטומטי של ₪220 בכל חודש עד לביטול',True)
 +'<div style="flex:1;min-height:8px;"></div>'+pbtn('הפעלת חיוב אוטומטי')+sbtn('לא עכשיו')+'<div style="height:6px;flex-shrink:0;"></div>','')
# 8b. autopay list
def apc(lg,name,sub,amount,nextd,method,notice,warn=None,lead=1):
    w=f'<div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:{DANGER};">{ico(WARN,16,2.4)}{warn}</div>' if warn else ''
    return f'<article style="flex-shrink:0;background:#FFFFFF;border:2px solid {DANGER if warn else INK};border-radius:18px;box-shadow:0 3px 0 {DANGER if warn else INK};overflow:hidden;"><div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;"><div style="display:flex;align-items:center;gap:12px;">{lg}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;">{name}</span><span style="font-size:13px;font-weight:700;color:{SOFT};">{sub}</span></div><bdi style="font-weight:800;font-size:17px;">{amount}</bdi></div>{w}<div style="display:flex;flex-direction:column;gap:2px;font-size:14px;font-weight:700;"><span>החיוב הבא: <bdi>{nextd}</bdi></span><span style="color:{SOFT};">אמצעי תשלום: <bdi>{method}</bdi></span></div></div><div style="border-top:1.5px solid #EDE6D6;">{sw("הודעה לפני החיוב","",notice,lead=lead)}</div><div style="border-top:1.5px solid #EDE6D6;padding:8px 14px;display:flex;gap:8px;flex-wrap:wrap;">{btnsm("שינוי אמצעי תשלום")}{btnsm("ביטול חיוב אוטומטי",danger=True)}</div></article>'
out['D-AutoPayList']=page('ד · חיובים אוטומטיים',1040,hdr('חיובים אוטומטיים')
 +P('הכסף זורם לבד. אפשר להשתיק הודעות או לבטל בכל עת.',14.5,SOFT)
 +box(sw('הודעה לפני חיוב: ברירת מחדל','חל על חיובים אוטומטיים חדשים. אפשר לשנות לכל ארגון בנפרד.',False,lead=1))
 +apc(LF,'פיט סיטי','מנוי חודשי','₪220','05.11.2026','Visa ••4242',False)
 +apc(LV,'ועד בית · האמורים 62','דמי ועד','₪120','10.11.2026','Mastercard ••1881',True,'החיוב האחרון נכשל. כדאי לעדכן כרטיס או לשלם ידנית',lead=0),nav('wallet'))
# 9. manual report
mtop=f'<div style="height:100%;display:flex;align-items:center;gap:12px;padding:0 14px;">{LV.replace("40px","44px",2)}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;">ועד בית · האמורים 62</span><span style="font-size:13px;font-weight:700;">דמי ועד · אוקטובר 2026</span></div></div>'
mbot=kv('סכום לתשלום','₪120')
mm=f'<div role="radiogroup" aria-label="איך שילמתם" style="display:flex;flex-wrap:wrap;gap:8px;">{chip("העברה בנקאית",True)}{chip("מזומן",False)}{chip("שיק",False)}{chip("אחר",False)}</div>'
attach=f'<a href="#" style="min-height:52px;box-sizing:border-box;padding:0 14px;display:flex;align-items:center;gap:10px;border:2px dashed {INK};border-radius:14px;background:{CREAM};font-weight:800;font-size:15px;">{ico(PLUS,22,2.4)}צירוף אישור (תמונה או קובץ)</a>'
out['D-PayManual']=page('ד · דיווח על תשלום',844,hdr('דיווח על תשלום')+P('שילמתם מחוץ לאפליקציה? ספרו לארגון, והוא יאשר.',14.5,SOFT)+ticket(mtop,mbot,60)
 +H2('איך שילמתם')+mm+fld('תאריך התשלום','08.10.2026',True)+fld('הערה','',False,'מספר אסמכתא או כל פרט שיעזור לארגון',True)+attach
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('שליחת דיווח')+'<div style="height:6px;flex-shrink:0;"></div>','')
stampsent=f'<div style="align-self:center;transform:rotate(-6deg);padding:6px 22px;border:3px solid {INK};border-radius:14px;background:#FFFFFF;box-shadow:0 4px 0 {INK};font-family:\'Secular One\',sans-serif;font-size:34px;">נשלח</div>'
out['D-PayManualSent']=page('ד · דיווח נשלח',844,'<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;">'+stampsent+f'<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:28px;line-height:1.15;font-weight:400;text-align:center;">הדיווח נשלח לוועד הבית</h1>'+P('החיוב יסומן "ממתין לאישור" עד שהארגון יאשר שקיבל את התשלום. תקבלו הודעה כשזה יקרה.',15,INK,'center')+'</div>'+pbtn('חזרה לארנק')+sbtn('היסטוריית תשלומים')+'<div style="height:6px;flex-shrink:0;"></div>','')
# 10. plan change
def plan_opt(t,sub,price,sel,tag=''):
    dot=f'<span style="width:12px;height:12px;border-radius:50%;background:{INK};"></span>' if sel else ''
    tg_=f'<span style="padding:2px 8px;border-radius:10px;background:{INK};color:#FFFFFF;font-size:11.5px;font-weight:800;">{tag}</span>' if tag else ''
    return f'<div role="radio" aria-checked="{str(sel).lower()}" style="min-height:64px;box-sizing:border-box;padding:8px 14px;display:flex;align-items:center;gap:12px;border:2px solid {INK};border-radius:16px;background:{Y if sel else "#FFFFFF"};{"box-shadow:0 3px 0 "+INK+";" if sel else ""}"><span style="width:24px;height:24px;flex-shrink:0;box-sizing:border-box;border-radius:50%;border:2px solid {INK};background:#FFFFFF;display:flex;align-items:center;justify-content:center;">{dot}</span><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;display:flex;align-items:center;gap:8px;">{t}{tg_}</span><span style="font-size:13px;font-weight:600;color:{SOFT};">{sub}</span></div><bdi style="font-weight:800;font-size:17px;">{price}</bdi></div>'
when=f'<div role="radiogroup" aria-label="מתי יכנס לתוקף" style="display:flex;flex-wrap:wrap;gap:8px;">{chip("בחידוש הבא (05.11)",True)}{chip("מיד, עם התחשבנות",False)}</div>'
out['D-PlanChange']=page('ד · שינוי מסלול',844,hdr('שינוי מסלול')+P('פיט סיטי · המסלול הנוכחי: מנוי חודשי',14.5,SOFT)
 +plan_opt('חודשי','מתחדש כל חודש','₪220',False,'נוכחי')+plan_opt('רבעוני','כל 3 חודשים','₪600',True,'חיסכון ₪60')+plan_opt('שנתי','פעם בשנה','₪2,200',False,'חיסכון ₪440')
 +H2('מתי יכנס לתוקף')+when
 +box(f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:6px;">{kv("החיוב הבא","₪600 ב-05.11.2026")}{kv("אמצעי תשלום","Visa ••4242")}</div>')
 +'<div style="flex:1;min-height:6px;"></div>'+pbtn('אישור שינוי המסלול')+sbtn('ביטול')+'<div style="height:6px;flex-shrink:0;"></div>','')
# 11. cancel membership
def cons(t,ok=True): return f'<div style="display:flex;align-items:flex-start;gap:10px;font-size:15px;font-weight:700;line-height:1.35;"><span style="flex-shrink:0;margin-top:1px;">{ico(CHECK if ok else XX,20,2.8)}</span><span>{t}</span></div>'
ctop=f'<div style="height:100%;display:flex;align-items:center;gap:12px;padding:0 14px;">{LF.replace("40px","44px",2)}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;">פיט סיטי</span><span style="font-size:13px;font-weight:700;">מנוי חודשי · ₪220 לחודש</span></div></div>'
cbot=cons('החברות נשארת פעילה עד 05.11.2026 (ששולם עד אז)')+cons('החיוב האוטומטי יופסק, ולא יהיו חיובים נוספים')+cons('אין חוב פתוח')
why=f'<div role="radiogroup" aria-label="סיבת הביטול" style="display:flex;flex-wrap:wrap;gap:8px;">{chip("עוברים דירה",False)}{chip("יקר לי",False)}{chip("לא משתמשים",True)}{chip("אחר",False)}</div>'
dbtn=f'<a href="#" style="min-height:52px;box-sizing:border-box;border-radius:26px;border:2.5px solid {INK};background:{DANGER};color:#FFFFFF;box-shadow:0 3px 0 {INK};font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;margin-bottom:3px;">ביטול החברות</a>'
out['D-CancelMember']=page('ד · ביטול חברות',844,hdr('ביטול חברות')+ticket(ctop,cbot,60)
 +H2('למה עוזבים? (לא חובה)')+why+P('התשובה עוזרת לארגון להשתפר. היא לא משפיעה על הביטול.',13,SOFT)
 +'<div style="flex:1;min-height:6px;"></div>'+dbtn+sbtn('השארת החברות')+'<div style="height:6px;flex-shrink:0;"></div>','')
for k,v in out.items(): open(f'/home/claude/project/{k}.dc.html','w',encoding='utf-8').write(v)
print(list(out))
