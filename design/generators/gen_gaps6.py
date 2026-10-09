# Admin responsibilities: per-manager read / write / notify by area, plus the managers overview (replaces the old D-AdmRoles).
full=open('/home/claude/gen/gen_gaps5.py',encoding='utf-8').read()
exec(full.split("\ndef bubd")[0])
exec(open('/home/claude/gen/mgr_identity.py',encoding='utf-8').read())
def tgm(on,dis=False):
    bg=GREEN if on else '#B8AFC7'; pos='inset-inline-end:1px;' if on else 'inset-inline-start:1px;'
    op='opacity:.35;' if dis else ''
    return f'<span style="position:relative;width:40px;height:22px;border-radius:11px;background:{bg};border:2px solid {INK};box-sizing:border-box;flex-shrink:0;display:inline-block;{op}"><span style="position:absolute;top:0;{pos}width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid {INK};box-sizing:border-box;"></span></span>'
LOCK='M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3'
# areas: (name, read, write, notify or None when the area has no notifications)
CORE=[('חברים',1,0,0),('בקשות הצטרפות',0,0,0),('פניות',1,0,0),('הודעות',1,0,0),('כספים וחיובים',0,0,0),('קופה ומשיכות',0,0,0),('פעילויות ואירועים',1,0,0),('דוחות',0,0,None)]
MODS=[('תפילות ולוח זמנים',1,1,1),('תרומות ונדרים',0,0,0),('יארצייט',1,1,1)]
CW=[('תחום','flex:1;min-width:0;'),('קריאה','width:70px;text-align:center;'),('כתיבה','width:70px;text-align:center;'),('התראה','width:70px;text-align:center;')]
def arow(name,r,w,n,last=False,star=False):
    dis_w=not r; dis_n=not r
    cn=tgm(n,dis_n) if n is not None else f'<span style="color:{SOFT};">—</span>'
    cells=[(name,'flex:1;min-width:0;font-weight:800;'),(tgm(r),'width:70px;display:flex;justify-content:center;'),(tgm(w,dis_w),'width:70px;display:flex;justify-content:center;'),(cn,'width:70px;display:flex;justify-content:center;')]
    return f'<div style="display:flex;gap:12px;align-items:center;padding:6px 12px;border-bottom:{"none" if last else "1.5px solid "+LINE};font-weight:600;">'+''.join(f'<span style="{w}">{c}</span>' for c,w in cells)+'</div>'
def grp(t): return f'<div style="padding:8px 12px 2px;font-weight:800;color:{SOFT};font-size:13px;">{t}</div>'
tmpl=''.join(pill(t,Y if i==0 else '#fff') for i,t in enumerate(['גבאי','גזבר','דובר','מזכיר','התחלה ריקה']))
who=[('יוסף לוי','מנהל ראשי','י','#5EE0C0','הכל. תמיד, ואי אפשר לצמצם',False),
     ('שרה כהן','גזבר','ש','#FFD9E8','כתיבה: כספים וחיובים, קופה ומשיכות',False),
     ('דוד ישראלי','מזכיר','ד','#CFF0FC','כתיבה: חברים, בקשות הצטרפות, הודעות',False),
     ('מיכה אדלר','דובר','מ','#E3DDFF','כתיבה: פניות, הודעות',False),
     ('אבי בן דוד','גבאי','א','#FFD84A','כתיבה: תפילות, יארצייט',True)]
cards=''
for n,role,l,c,sm,on in who:
    cards+=(f'<div style="padding:10px 12px;border:2px solid {INK};border-radius:14px;background:{"#FFF6D1" if on else "#fff"};{"box-shadow:0 3px 0 "+INK+";" if on else ""}display:flex;gap:10px;align-items:center;">{mav(n,36)}'
            f'<div style="flex:1;min-width:0;display:flex;flex-direction:column;">{mname(n)}<span style="color:{SOFT};font-size:13px;font-weight:600;">{role}</span></div></div>')
sw=''.join(f'<span style="width:22px;height:22px;border-radius:50%;background:{c};border:2.5px solid {INK if c=="#FFD84A" else "transparent"};box-shadow:0 0 0 {2 if c=="#FFD84A" else 1}px {"#fff" if c=="#FFD84A" else INK} inset;box-sizing:border-box;display:inline-block;"></span>' for c in MPAL)
lp1=panel(f'<div style="display:flex;align-items:center;">{h2("מנהלים")}<span style="flex:1;"></span>{btn("+ הוספת מנהל",True)}</div>'+cards
 +f'<div style="font-size:13px;font-weight:600;color:{SOFT};line-height:1.4;">מנהל הוא חבר בארגון עם חשבון באפליקציה. הגדרות הארגון וצוות והרשאות: למנהל ראשי בלבד.</div>',extra='box-sizing:border-box;')
lp2=panel(h2('איך אבי נראה בניהול','צבע ותמונה בכל מקום שמופיעה פעולה שלו')
 +f'<div style="display:flex;flex-wrap:wrap;gap:6px;">{sw}</div>'
 +f'<div style="display:flex;flex-direction:column;gap:6px;">{opt("תמונת הפרופיל שלו","אם אישר להציג אותה",False)}{opt("אות על הצבע","ברירת מחדל",True)}</div>'
,pad=14,gap=10,extra='box-sizing:border-box;')
lp=f'<div style="box-sizing:border-box;width:270px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;align-self:flex-start;">{lp1}{lp2}</div>'
table=(th(CW)+grp('ליבה')+''.join(arow(*a) for a in CORE)+grp('מודולי בית כנסת')+''.join(arow(*a,last=(i==len(MODS)-1)) for i,a in enumerate(MODS)))
cp=panel(f'<div style="display:flex;align-items:center;gap:10px;">{mav("אבי בן דוד",44)}<div style="flex:1;display:flex;flex-direction:column;"><h2 class="h" style="margin:0;font-size:22px;">אבי בן דוד</h2><span style="color:{SOFT};font-weight:600;">גבאי</span></div></div>'
 +f'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span style="font-weight:800;">להתחיל מתבנית:</span>{tmpl}</div>'
 +table
 +note('קריאה פותחת את התחום. כתיבה והתראה נפתחות רק אחרי קריאה. התראה היא דחיפה ומייל על דברים שדורשים טיפול בתחום, ורק לאחראים עליו.'),
 extra='box-sizing:border-box;flex:1;min-width:0;gap:6px;')
def role_row(n,tags,last=False):
    return tr([(f'<b>{n}</b>','flex:1;'),(tags,'')],last)
P=lambda t,bg='#D7F5E8':pill(t,bg)
inq=panel(h2('פניות: מי עושה מה','כך זה נראה כשמסתכלים לפי תחום')
 +tr([('<b>יוסף לוי</b><br><span style="color:'+SOFT+';font-size:12.5px;">מנהל ראשי</span>','flex:1;'),(P('קריאה')+' '+P('כתיבה')+' '+P('התראה'),'')])
 +tr([('<b>מיכה אדלר</b><br><span style="color:'+SOFT+';font-size:12.5px;">דובר</span>','flex:1;'),(P('קריאה')+' '+P('כתיבה')+' '+P('התראה'),'')])
 +tr([('<b>אבי בן דוד</b><br><span style="color:'+SOFT+';font-size:12.5px;">גבאי</span>','flex:1;'),(P('קריאה','#EAF6FF'),'')])
 +tr([('<b>שרה כהן</b><br><span style="color:'+SOFT+';font-size:12.5px;">גזבר</span>','flex:1;'),(pill('—','#fff',SOFT),'')],True)
 +note('אם אף אחד לא מוגדר להתראה על תחום, המנהל הראשי מקבל אותה.'),pad=16,gap=4,extra='box-sizing:border-box;width:340px;flex-shrink:0;align-self:flex-start;')
how=panel(h2('איך להתריע לאבי')
 +swrow('דחיפה לנייד','על דברים בתחומים שלו',True)
 +swrow('מייל','אל abi@example.com',True)
 +swrow('סיכום אחד בבוקר','במקום התראה על כל דבר',False,True)
 +f'<div style="display:flex;gap:8px;">{btn("השתקה לשבוע")}{btn("הסתרת תחום")}</div>',pad=16,gap=0,extra='box-sizing:border-box;width:340px;flex-shrink:0;align-self:flex-start;')
rp=f'<div style="box-sizing:border-box;width:340px;flex-shrink:0;display:flex;flex-direction:column;gap:14px;">{inq}{how}</div>'
open(P_+'D-AdmResponsibilities.dc.html','w',encoding='utf-8').write(shell('ד · תחומי אחריות','הגדרות הארגון',head('תחומי אחריות והתראות','מה כל מנהל רואה, עושה ומקבל',SAVE)+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{lp}{cp}{rp}</section>'))
# overview: replaces the older D-AdmRoles matrix
def chips(ts,bg): return ' · '.join(ts) if ts else f'<span style="color:{SOFT};">—</span>'
RC=[('מנהל','width:180px;'),('כותב','flex:1;min-width:0;'),('קורא בלבד','width:200px;'),('מקבל התראות','width:200px;'),('','width:80px;')]
rows=[('יוסף לוי','מנהל ראשי',['הכל'],[],'הכל'),
      ('שרה כהן','גזבר',['כספים','קופה'],['חברים','דוחות'],'כספים'),
      ('דוד ישראלי','מזכיר',['חברים','בקשות','הודעות'],['כספים'],'בקשות'),
      ('מיכה אדלר','דובר',['פניות','הודעות'],['חברים'],'פניות, הודעות'),
      ('אבי בן דוד','גבאי',['תפילות','יארצייט'],['פניות','חברים'],'תפילות, יארצייט')]
rb=th(RC)+''.join(tr([(f'<span style="display:flex;align-items:center;gap:8px;">{mav(n,34)}<span style="display:flex;flex-direction:column;">{mname(n)}<span style="color:{SOFT};font-size:12.5px;">{r}</span></span></span>',RC[0][1]),(chips(w,'#D7F5E8'),RC[1][1]),(chips(rd,'#EAF6FF'),RC[2][1]),(nt,RC[3][1]),(btn('עריכה'),RC[4][1])],i==len(rows)-1) for i,(n,r,w,rd,nt) in enumerate(rows))
tbl=panel(f'<div style="display:flex;align-items:center;">{h2("מנהלים והרשאות","מי אחראי על מה, ומי מקבל התראות")}<span style="flex:1;"></span>{btn("+ הוספת מנהל",True)}</div>'+rb
 +note('פעולות רגישות (משיכה מהקופה, שינוי חשבון בנק, הוספת מנהל) מחייבות אישור שני של מנהל ראשי נוסף. VERIFY: האם לדרוש זאת לכל ארגון.'),pad=16,gap=10,extra='box-sizing:border-box;flex-shrink:0;')
lg2=lg.replace('width:420px;flex-shrink:0;align-self:flex-start;','flex-shrink:0;')
LOGR=[('09.10','יוסף לוי','הוסיף ל-שרה כהן התראה בתחום "כספים וחיובים"'),('09.10','יוסף לוי','הסיר מ-אבי בן דוד התראה בתחום "פניות"'),('08.10','שרה כהן','יצרה חיוב "דמי ועד"')]
def _lr(i,d,n,t):
    return tr([(f'{d} · {mwho(n,False,22)}',''),(t,'')],i==len(LOGR)-1)
lg2=panel(h2('יומן פעולות','כולל שינויי הרשאות: מי שינה, למי, ומה')+''.join(_lr(i,*r) for i,r in enumerate(LOGR)),extra='flex-shrink:0;')
open(P_+'D-AdmRoles.dc.html','w',encoding='utf-8').write(shell('ד · מנהלים והרשאות','הגדרות הארגון',head('צוות והרשאות','',SAVE)+f'<section style="flex:1;min-height:0;display:flex;flex-direction:column;gap:14px;">{tbl}{lg2}</section>'))
print('ok gaps6')
