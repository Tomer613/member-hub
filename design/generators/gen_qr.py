# QR flows: card back + flip, scanner, my join code, consent, invite-a-friend, admin scan + admin join-code poster.
import re,segno
src=open('/home/claude/gen/gen_pay.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(src)
P_='/home/claude/project/'
ORGC='#5B3DF5'
out3={}
def qr(payload,size,col=ORGC,logo_on=True):
    q=segno.make(payload,error='h',boost_error=False); m=q.matrix; n=len(m)
    d=''
    for y,row in enumerate(m):
        x=0
        while x<n:
            if row[x]:
                x0=x
                while x<n and row[x]: x+=1
                d+=f'M{x0} {y}h{x-x0}v1h-{x-x0}z'
            else: x+=1
    c=n/2; lg=''
    if logo_on:
        s=n*0.27
        lg=(f'<rect x="{c-s/2:.2f}" y="{c-s/2:.2f}" width="{s:.2f}" height="{s:.2f}" rx="{s*0.28:.2f}" fill="#fff"/>'
            f'<circle cx="{c}" cy="{c}" r="{s*0.36:.2f}" fill="{col}" stroke="{INK}" stroke-width=".5"/>'
            f'<path d="M{c-s*0.17:.2f} {c+s*0.01:.2f}l{s*0.13:.2f} {s*0.13:.2f} {s*0.22:.2f}-{s*0.26:.2f}" fill="none" stroke="#fff" stroke-width="{s*0.1:.2f}" stroke-linecap="round" stroke-linejoin="round"/>')
    return f'<svg width="{size}" height="{size}" viewBox="0 0 {n} {n}" shape-rendering="crispEdges" role="img" aria-label="קוד QR" style="display:block;"><path d="{d}" fill="{INK}"/>{lg}</svg>'
def qrtile(payload,size,col=ORGC,pad=12,shadow=True):
    sh=f'box-shadow:0 4px 0 {INK};' if shadow else ''
    return f'<div style="background:#fff;border:2.5px solid {INK};border-radius:20px;{sh}padding:{pad}px;display:flex;align-items:center;justify-content:center;">{qr(payload,size,col)}</div>'
SUN='M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'
SCAN='M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10'
QRI='M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v7h-3M14 20h3'
TORCH='M9 2h6l-1 6h-4zM10 8v4a2 2 0 0 0 4 0V8M12 14v8'
KEY='M14 10a4 4 0 1 0-3.5 4L13 16.5V19h2.5v-2.5H18V14h-2.4z'
SHARE='M12 15V4M8 8l4-4 4 4M5 13v6h14v-6'
COPY='M9 9h11v11H9zM5 15V4h11'
USERP='M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0M19 8v5M16.5 10.5h5'
# ------------------------------------------------ card back + flip (derived from D-Badge)
b=open(P_+'D-Badge.dc.html',encoding='utf-8').read()
head=b[:b.index('<article')]
tail=b[b.index('<nav aria-label="ניווט ראשי"'):]
front=re.search(r'<article.*?</article>',b,flags=re.S).group(0)
FRONT=front.replace('margin-top: 84px;','margin-top: 0;',1)
def backface(mt):
    ico_=lambda d,s=18,sw=2.4: ico(d,s,sw)
    return f'''<article style="position: relative; margin-top: {mt}px; width: 308px; height: 340px; box-sizing: border-box; border: 2.5px solid #1E1633; border-radius: 28px; background: #FFF9EC; overflow: hidden; box-shadow: 0 4px 0 #1E1633;">
<div style="position: relative; height: 56px; box-sizing: border-box; padding: 0 14px; background: var(--org); color: var(--on); border-bottom: 2.5px solid #1E1633; display: flex; align-items: center; gap: 10px; overflow: hidden;">
<span style="position: absolute; top: -50px; right: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.16);"></span>
<span style="position: relative; width: 34px; height: 34px; flex-shrink: 0; box-sizing: border-box; border-radius: 50%; background: #FFFFFF; color: #1E1633; border: 2px solid #1E1633; display: flex; align-items: center; justify-content: center; font-family: 'Secular One', sans-serif; font-size: 18px;">{{{{letter}}}}</span>
<span style="position: relative; flex: 1; min-width: 0; font-family: 'Secular One', sans-serif; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{{{orgName}}}}</span>
<span style="position: relative; padding: 1px 10px; background: #FFD84A; color: #1E1633; border: 2px solid #1E1633; border-radius: 10px; font-size: 12.5px; font-weight: 800; white-space: nowrap;">{{{{role}}}}</span>
</div>
<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 0 0;">
<div style="background: #FFFFFF; border: 2px solid #1E1633; border-radius: 16px; padding: 8px; display: flex;">{qr('https://app.example/m/AOR-0418-7Q2K',164)}</div>
<div style="text-align: center; line-height: 1.1;"><div style="font-family: 'Secular One', sans-serif; font-size: 22px;">{{{{memberName}}}}</div><div style="margin-top: 2px; font-size: 13px; font-weight: 700; color: #5A4E70;">מספר חבר <bdi>{{{{number}}}}</bdi></div></div>
</div>
<div style="position: absolute; left: 14px; right: 14px; bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12.5px; font-weight: 800; color: #5A4E70;">{ico_('M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',15,2.4)}<span>מתחדש בעוד <bdi>0:42</bdi></span></div>
</article>'''
below=f'''<div style="position: relative; margin-top: 12px; width: 358px; box-sizing: border-box; padding: 10px 12px; display: flex; align-items: flex-start; gap: 10px; background: #FFFFFF; border: 2px solid #1E1633; border-radius: 16px; box-shadow: 0 3px 0 #1E1633;">
<span style="flex-shrink: 0; width: 34px; height: 34px; box-sizing: border-box; border-radius: 50%; background: #D5F5E8; border: 2px solid #1E1633; display: flex; align-items: center; justify-content: center;">{ico('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',18,2.2)}</span>
<span style="flex: 1; font-size: 14.5px; font-weight: 700; line-height: 1.4;">זה קוד הכניסה שלך, שמעיד על החברות שלך בארגון. הוא מתחלף כל כמה דקות, ולכן אי אפשר לשתף אותו או לצלם אותו.</span></div>
<div style="position: relative; margin-top: 10px; width: 358px; display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #1E1633;">{ico(SUN,18,2.2)}<span>הבהירות עלתה כדי שיהיה קל לסרוק.</span></div>
<div style="position: absolute; left: 16px; right: 16px; bottom: 76px;"><button type="button" style="width: 100%; height: 56px; border-radius: 28px; border: 2.5px solid #1E1633; background: #1E1633; color: #FFFFFF; font: inherit; font-size: 18px; font-weight: 800; box-shadow: 0 3px 0 rgba(30,22,51,0.35); cursor: pointer;">חזרה לכרטיס</button></div>
'''
def mk(h):
    return h.replace('<title>ד · כרטיס חברות</title>','<title>@@T@@</title>')
back_page=mk(head)+backface(84)+below+tail
out3['D-BadgeBack']=back_page.replace('@@T@@','ד · כרטיס חברות · גב הכרטיס (קוד כניסה)')
# animated flip
css='''
body{margin:0}
a{color:inherit;text-decoration:none}
.fl{position:relative;margin-top:84px;width:308px;height:340px;perspective:1100px;flex-shrink:0}
.fl-in{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:flip 9s infinite}
.face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.face.bk{transform:rotateY(180deg)}
.strap{transform-origin:195px 0;animation:sway 9s infinite}
@keyframes flip{
 0%,26%{transform:rotateY(0deg);animation-timing-function:cubic-bezier(.35,.05,.25,1)}
 38%,76%{transform:rotateY(180deg);animation-timing-function:cubic-bezier(.35,.05,.25,1)}
 88%,100%{transform:rotateY(360deg)}}
@keyframes sway{
 0%,26%{transform:rotate(0deg)} 29%{transform:rotate(5deg)} 32%{transform:rotate(-3.5deg)} 35%{transform:rotate(2.2deg)} 38%{transform:rotate(-1.2deg)} 42%,76%{transform:rotate(0deg)}
 79%{transform:rotate(-5deg)} 82%{transform:rotate(3.5deg)} 85%{transform:rotate(-2deg)} 88%{transform:rotate(1deg)} 92%,100%{transform:rotate(0deg)}}
@media (prefers-reduced-motion: reduce){.fl-in,.strap{animation:none}.face.bk{display:none}}
'''
fh=head.replace('body{margin:0}\na{color:inherit;text-decoration:none}',css,1)
fh=fh.replace('<svg width="390" height="110" viewBox="0 0 390 110" style="position: absolute; top: 0; left: 0;"','<svg class="strap" width="390" height="110" viewBox="0 0 390 110" style="position: absolute; top: 0; left: 0;"',1)
assert 'class="strap"' in fh and '.fl{' in fh
bmid=backface(0).replace('position: relative; margin-top: 0px;','position: relative; margin-top: 0;')
rest=b[b.index('</article>')+len('</article>'):]
flip=fh+'<div class="fl"><div class="fl-in"><div class="face">'+FRONT+'</div><div class="face bk">'+bmid+'</div></div></div>'+rest
out3['D-BadgeFlip']=flip.replace('<title>ד · כרטיס חברות</title>','<title>ד · כרטיס חברות · הפיכה (אנימציה בלולאה)</title>')
# ------------------------------------------------ scanner (member)
def dark_page(title,h,inner,bgextra=''):
    return page(title,h,'','',extra=f'<div style="position:absolute;inset:0;background:{INK};z-index:1;{bgextra}"></div><div style="position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;box-sizing:border-box;padding:18px 16px 24px;gap:14px;color:#fff;">{inner}</div>')
def seg(active):
    def t(k,l,ic):
        on=k==active
        st=f'background:{Y};color:{INK};border:2px solid {INK};box-shadow:0 3px 0 {INK};' if on else f'background:transparent;color:inherit;border:2px solid transparent;'
        return f'<a href="#" role="tab" aria-selected="{str(on).lower()}" style="flex:1;min-height:48px;box-sizing:border-box;border-radius:24px;{st}display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:16px;">{ico(ic,20,2.2)}{l}</a>'
    return t,seg
def segctl(active,dark=True):
    def t(k,l,ic):
        on=k==active
        st=f'background:{Y};color:{INK};border:2px solid {INK};box-shadow:0 3px 0 {INK};' if on else 'background:transparent;border:2px solid transparent;'
        return f'<a href="#" role="tab" aria-selected="{str(on).lower()}" style="flex:1;min-height:48px;box-sizing:border-box;border-radius:24px;{st}display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:16px;">{ico(ic,20,2.2)}{l}</a>'
    bg='rgba(255,255,255,.14)' if dark else '#fff'
    bd='rgba(255,255,255,.5)' if dark else INK
    col='#fff' if dark else INK
    return f'<div role="tablist" style="flex-shrink:0;display:flex;gap:4px;padding:4px;border-radius:30px;background:{bg};border:2px solid {bd};color:{col};">{t("scan","סריקה",SCAN)}{t("mine","קוד פרופיל",QRI)}</div>'
brackets=''.join(f'<path d="{d}" fill="none" stroke="{Y}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' for d in ('M10 58V28a18 18 0 0 1 18-18h30','M250 10h30a18 18 0 0 1 18 18v30','M298 242v30a18 18 0 0 1-18 18h-30','M58 290H28a18 18 0 0 1-18-18v-30'))
feed='<div style="position:absolute;inset:6px;border-radius:14px;background:repeating-linear-gradient(135deg,#2B2144 0 14px,#251B3B 14px 28px);opacity:.9;"></div>'
ph=lambda: ''
torch=f'<a href="#" aria-label="פנס" style="width:56px;height:56px;border-radius:50%;border:2px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;color:#fff;">{ico(TORCH,26,2)}</a>'
GAL='M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M8.5 9.5h.01'
LINK='M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'
lnk=lambda t,ic: f'<a href="#" style="flex:1;min-height:44px;box-sizing:border-box;border:2px solid rgba(255,255,255,.5);border-radius:22px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:800;font-size:13.5px;color:#fff;white-space:nowrap;">{ico(ic,17,2.2)}{t}</a>'
scan_inner=(f'<div style="display:flex;align-items:center;gap:12px;flex-shrink:0;"><span style="color:{INK};display:flex;">{back}</span><h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:28px;font-weight:400;">סריקה</h1></div>'
 +f'<div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;"><div style="position:relative;width:308px;height:300px;">{feed}<svg width="308" height="300" viewBox="0 0 308 300" style="position:absolute;inset:0;" aria-hidden="true">{brackets}</svg></div>'
 +f'<div style="text-align:center;max-width:300px;"><div style="font-family:\'Secular One\',sans-serif;font-size:22px;">מכוונים אל הקוד</div><div style="margin-top:6px;font-size:15.5px;font-weight:600;line-height:1.45;color:#E3DDFF;">קוד פרופיל ארגון, מכרזה, מעמוד הארגון או מחבר שהמליץ. הצטרפות תמיד מסתיימת באישור שלכם.</div></div></div>'
 +f'<div style="flex-shrink:0;display:flex;align-items:center;gap:12px;">{torch}<div style="flex:1;">{segctl("scan")}</div></div>'
 +f'<div style="flex-shrink:0;display:flex;gap:8px;">{lnk("בחירה מהגלריה",GAL)}{lnk("הדבקת קישור",LINK)}{lnk("הקלדת קוד",KEY)}</div>')
out3['D-QrScan']=dark_page('ד · סריקה',844,scan_inner)
# ------------------------------------------------ my join code (member)
mine=(f'<div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">{back}<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:26px;line-height:1.05;font-weight:400;">קוד פרופיל משתמש</h1></div>'
 +f'<section style="flex-shrink:0;background:#fff;border:2.5px solid {INK};border-radius:24px;box-shadow:0 4px 0 {INK};padding:18px 16px 16px;display:flex;flex-direction:column;align-items:center;gap:12px;">'
 +f'<div style="display:flex;align-items:center;gap:10px;align-self:stretch;">{logo("ד",44,"#FFD9E8")}<div style="display:flex;flex-direction:column;"><span style="font-family:\'Secular One\',sans-serif;font-size:22px;line-height:1.1;">דנה לוי</span><span style="font-size:13px;font-weight:700;color:{SOFT};">הקוד הקבוע שלך, אפשר לשתף</span></div></div>'
 +f'<div style="border:2px solid {INK};border-radius:16px;padding:10px;">{qr("https://app.example/p/DL-8K29-TQ41",200,INK)}</div>'
 +f'<div style="display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:800;color:{SOFT};"><span dir="ltr">app.example/p/DL-8K29</span></div></section>'
 +f'<div style="display:flex;gap:10px;flex-shrink:0;"><div style="flex:1;">{pbtn("שיתוף כתמונה")}</div><a href="#" style="min-height:52px;box-sizing:border-box;padding:0 16px;border-radius:26px;border:2px solid {INK};background:#fff;font-weight:800;font-size:16px;display:flex;align-items:center;gap:8px;">{ico(COPY,20,2.2)}קישור</a></div>'
 +box(f'<div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;"><span style="font-weight:800;font-size:16px;">איך זה עובד</span><span style="font-size:14.5px;font-weight:600;line-height:1.45;">מנהל ארגון סורק את קוד פרופיל המשתמש שלך, ואתם מאשרים את ההצטרפות בטלפון. הוא יראה רק <b>שם וטלפון</b>, או מה שהארגון דורש כשדות חובה.</span></div>')
 +f'<a href="#" style="flex-shrink:0;min-height:44px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;text-decoration:underline;">יצירת קוד חדש (הקוד הקיים יפסיק לעבוד)</a>'
 +'<div style="flex:1;min-height:0;"></div>'
 +f'<div style="flex-shrink:0;display:flex;align-items:center;gap:12px;"><span style="width:56px;flex-shrink:0;"></span><div style="flex:1;">{segctl("mine",False)}</div></div>')
out3['D-QrMyCode']=page('ד · קוד פרופיל משתמש',844,mine,'')
# ------------------------------------------------ consent sheet after admin scanned me
def row_field(k,v,chg=True):
    return f'<div style="display:flex;align-items:center;gap:10px;min-height:44px;"><span style="color:{SOFT};font-weight:700;width:70px;">{k}</span><span style="flex:1;font-weight:800;"><bdi>{v}</bdi></span>{"<a href=#"+" style=font-weight:800;text-decoration:underline;font-size:14px;>שינוי</a>" if chg else ""}</div>'
sheet=(f'<div style="position:absolute;inset:0;background:rgba(30,22,51,.55);z-index:5;"></div><section role="dialog" aria-label="בקשת הצטרפות" style="position:absolute;inset-inline:0;bottom:0;z-index:6;box-sizing:border-box;background:#fff;border-top:2.5px solid {INK};border-radius:24px 24px 0 0;padding:18px 16px 24px;display:flex;flex-direction:column;gap:14px;">'
 +f'<div style="align-self:center;width:44px;height:5px;border-radius:3px;background:{INK};opacity:.25;"></div>'
 +f'<div style="display:flex;align-items:center;gap:12px;">{logo("א",56,ORGC)}<div style="display:flex;flex-direction:column;"><span style="font-family:\'Secular One\',sans-serif;font-size:23px;line-height:1.1;">בית הכנסת אור חדש</span><span style="font-size:14px;font-weight:700;color:{SOFT};">יוסף, הגבאי, מוסיף אתכם עכשיו</span></div></div>'
 +f'<div style="font-size:16px;font-weight:700;line-height:1.4;">הארגון יראה את הפרטים האלה, ורק אותם:</div>'
 +f'<div style="border:2px solid {INK};border-radius:16px;padding:6px 14px;background:{CREAM};">{row_field("שם","דנה לוי")}<div style="height:1.5px;background:#EDE6D6;"></div>{row_field("טלפון","050-123-4567")}</div>'
 +f'<div style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.4;">אפשר לשנות מה מוצג בכל רגע, בהגדרות החברות.</div>'
 +pbtn('מצטרפים')+sbtn('לא עכשיו')+'</section>')
out3['D-QrConsent']=page('ד · אישור הצטרפות אחרי סריקה',844,header('החברויות שלי','')+f'<div style="flex:1;"></div>',nav('wallet'),extra=sheet)
# ------------------------------------------------ invite a friend (member shows org QR)
share_btns=f'<div style="display:flex;gap:10px;flex-shrink:0;"><div style="flex:1;">{pbtn("שיתוף כתמונה")}</div><a href="#" style="min-height:52px;box-sizing:border-box;padding:0 18px;border-radius:26px;border:2px solid {INK};background:#fff;font-weight:800;font-size:17px;display:flex;align-items:center;gap:8px;">{ico(COPY,20,2.2)}העתקה</a></div>'
inv=(hdr('קוד פרופיל ארגון')
 +f'<section style="flex-shrink:0;background:#fff;border:2.5px solid {INK};border-radius:24px;box-shadow:0 4px 0 {INK};padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">'
 +f'<div style="display:flex;align-items:center;gap:10px;align-self:stretch;">{logo("א",48,ORGC)}<div style="display:flex;flex-direction:column;"><span style="font-family:\'Secular One\',sans-serif;font-size:21px;line-height:1.1;">בית הכנסת אור חדש</span><span style="font-size:13px;font-weight:700;color:{SOFT};">חבר מספר לחבר? הוא סורק וזהו</span></div></div>'
 +f'<div style="border:2px solid {INK};border-radius:16px;padding:10px;">{qr("https://app.example/j/AOR-2931?r=DL",188,ORGC)}</div>'
 +f'<div dir="ltr" style="font-weight:800;font-size:15px;background:{CREAM};border:2px solid {INK};border-radius:12px;padding:6px 12px;">app.example/j/AOR-2931</div></section>'
 +share_btns
 +box(f'<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15.5px;">לציין שאני הזמנתי</span><span style="font-size:13px;font-weight:600;color:{SOFT};">הארגון יראה "הוזמן על ידי דנה" בבקשת ההצטרפות.</span></div>{tg(True)}</div>')
 +P('קוד פרופיל הארגון פותח את עמוד הארגון גם למי שעוד אין לו את האפליקציה. כל בקשת הצטרפות עוברת את המצב שהארגון קבע: באישור, פתוח או בהזמנה בלבד.',13.5,SOFT))
out3['D-QrInviteFriend']=page('ד · קוד פרופיל ארגון (שיתוף בין חברים)',844,inv,'')
# ------------------------------------------------ admin mobile: scanned a member
OA='#5B3DF5'
admsheet=(f'<div style="position:absolute;inset:0;background:rgba(30,22,51,.6);z-index:5;"></div><section role="dialog" aria-label="חבר חדש שנסרק" style="position:absolute;inset-inline:0;bottom:0;z-index:6;box-sizing:border-box;background:#fff;border-top:2.5px solid {INK};border-radius:24px 24px 0 0;padding:18px 16px 22px;display:flex;flex-direction:column;gap:12px;">'
 +f'<div style="align-self:center;width:44px;height:5px;border-radius:3px;background:{INK};opacity:.25;"></div>'
 +f'<div style="display:flex;align-items:center;gap:12px;">{logo("ד",52,"#FFD9E8")}<div style="display:flex;flex-direction:column;flex:1;"><span style="font-family:\'Secular One\',sans-serif;font-size:23px;line-height:1.1;">דנה לוי</span><span style="font-size:14px;font-weight:700;color:{SOFT};"><bdi>050-123-4567</bdi> · מצטרפת לראשונה</span></div></div>'
 +f'<div style="font-weight:800;font-size:15.5px;">מסלול</div><div role="radiogroup" style="display:flex;flex-wrap:wrap;gap:8px;">{chip("חבר/ת קהילה",True)}{chip("משפחה",False)}{chip("תומך/ת",False)}</div>'
 +f'<div style="font-weight:800;font-size:15.5px;">תוויות (לא חובה)</div><div style="display:flex;flex-wrap:wrap;gap:8px;">{chip("גבאי",False)}{chip("מתנדב/ת",False)}</div>'
 +f'<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:2px solid {INK};border-radius:14px;background:#FFF6D1;font-weight:600;font-size:13.5px;line-height:1.45;">{ico("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",20,2.2)}<span>דנה תקבל בקשה לאשר את ההצטרפות בטלפון שלה. עד שתאשר, היא לא תופיע ברשימת החברים.</span></div>'
 +pbtn('שליחת בקשת הצטרפות')+sbtn('סריקה מחדש')+'</section>')
scan_feed=f'<div style="position:absolute;inset:0;background:repeating-linear-gradient(135deg,#2B2144 0 14px,#251B3B 14px 28px);"></div>'
adm_scan=page('ד · ניהול במובייל · סריקת חבר חדש',844,f'<div style="display:flex;align-items:center;gap:12px;flex-shrink:0;position:relative;z-index:2;color:#fff;">{back}<h1 style="margin:0;font-family:\'Secular One\',sans-serif;font-size:22px;font-weight:400;">סריקת קוד פרופיל משתמש</h1></div>',
   '',extra=admsheet)
adm_scan=adm_scan.replace('<div style="flex:1;min-height:0;box-sizing:border-box;padding:18px 16px 0;','<div style="position:absolute;inset:0;background:'+INK+';"></div><div style="position:absolute;inset:0;background:repeating-linear-gradient(135deg,#2B2144 0 14px,#251B3B 14px 28px);"></div><div style="position:relative;z-index:2;flex:1;min-height:0;box-sizing:border-box;padding:18px 16px 0;',1)
out3['D-MAdmScan']=adm_scan
# ------------------------------------------------ write mobile boards
for k,v in out3.items():
    open(P_+k+'.dc.html','w',encoding='utf-8').write(v)
# ------------------------------------------------ admin desktop: org join-code poster
asrc=open('/home/claude/gen/gen_admin.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(asrc)
def poster():
    return (f'<div style="width:330px;height:456px;box-sizing:border-box;background:#fff;border:2.5px solid {INK};border-radius:6px;box-shadow:0 6px 0 {INK};padding:24px 22px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;">'
     f'<div style="display:flex;align-items:center;gap:10px;"><span class="h" style="width:52px;height:52px;border-radius:50%;background:{ORG};color:#fff;border:2px solid {INK};display:flex;align-items:center;justify-content:center;font-size:26px;">א</span><span class="h" style="font-size:24px;">בית הכנסת אור חדש</span></div>'
     f'<div class="h" style="font-size:30px;line-height:1.1;">מצטרפים בסריקה</div>'
     f'<div style="border:2px solid {INK};border-radius:14px;padding:8px;">{qr("https://app.example/j/AOR-2931",190,ORG)}</div>'
     f'<div style="font-size:14.5px;font-weight:700;line-height:1.4;">פותחים את המצלמה, סורקים, ומצטרפים.<br>אפשר גם דרך האפליקציה: סריקה.</div>'
     f'<div dir="ltr" style="font-weight:800;font-size:14px;color:{SOFT};">app.example/j/AOR-2931</div></div>')
left=panel(h2('קוד פרופיל הארגון','קוד קבוע, אפשר לשתף אותו כתמונה, כקישור או כרזה מודפסת')+f'<div style="display:flex;justify-content:center;padding:18px 0;background:#FFF6D1;border:2px solid {INK};border-radius:16px;">{poster()}</div>'
  +f'<div style="display:flex;gap:10px;flex-wrap:wrap;">{btn("הורדה כ-PDF",True)}{btn("הורדת התמונה")}{btn("העתקת קישור")}{btn("הדפסה")}</div>',extra='width:430px;flex-shrink:0;')
right=(panel(h2('מצב הצטרפות בסריקה','הסריקה מציגה רק את עמוד הארגון')
   +opt('בבקשה','כל סורק שולח בקשה, ומנהל מאשר.',True,'ברירת מחדל')
   +opt('פתוח','כל מי שסורק מצטרף מיד.',False)
   +opt('בהזמנה בלבד','מצטרפים רק עם הזמנה אישית חד-פעמית.',False))
  +panel(h2('ארגון שלא מופיע בחיפוש')
   +swrow('להציג את הארגון בחיפוש','כבוי: הקוד ממשיך לעבוד למי שקיבל אותו.',False,True))
  +panel(h2('הצטרפות בפגישה')
   +f'<div style="display:flex;gap:14px;align-items:flex-start;"><div style="flex:1;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;">אתה סורק אותו</span><span style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.45;">סורקים את קוד פרופיל המשתמש שלו, והוא מאשר בטלפון.</span></div><div style="flex:1;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;">הוא סורק אותך</span><span style="font-size:13.5px;font-weight:600;color:{SOFT};line-height:1.45;">הוא סורק את קוד פרופיל הארגון ושולח בקשה.</span></div></div>')
  +panel(h2('אבטחה')+swrow('השהיית הקוד','בזמן ההשהיה אי אפשר לשלוח בקשות חדשות.',False,True)+f'<div style="display:flex;gap:10px;">{btn("יצירת קוד חדש (מבטל את הקודם, כולל כרזות)",False,True)}</div>'))
admin=shell('ד · קוד פרופיל הארגון','הגדרות הארגון',head('קוד פרופיל הארגון','הצטרפות בסריקה, כרזה ושיתוף',btn('ביטול')+btn('שמירה',True))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{sidemenu(SM,7)}{left}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;">{right}</div></section>')
open(P_+'D-AdmJoinQr.dc.html','w',encoding='utf-8').write(admin)
print('ok',list(out3.keys())+['D-AdmJoinQr'])
