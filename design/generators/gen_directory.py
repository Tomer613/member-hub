# Members directory (consent, setup, list, person) + main channel with reactions + admin directory/messages.
src=open('/home/claude/gen/gen_filters.py',encoding='utf-8').read().split("for k,v in {**mo4,**out4}.items()")[0]
exec(src)
mob={}
EM=['heart','trophy','like','dislike','laugh','ok']
RX={'like':('M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zM7 11l4-8c1.600 0 2.500 1 2.500 2.500V9h5a2 2 0 0 1 2 2.300l-1.200 7a2 2 0 0 1-2 1.700H7','#18B8F0','אהבתי'),
 'heart':('M12 20.500C5 15.500 3 12 3 8.800 3 6 5 4 7.500 4c1.900 0 3.500 1 4.500 2.700C13 5 14.600 4 16.500 4 19 4 21 6 21 8.800c0 3.200-2 6.700-9 11.700z','#FF5C9E','לב'),
 'trophy':None,'dislike':None,'laugh':None,'ok':None}
LB={'like':'אהבתי','heart':'לב','trophy':'כל הכבוד','dislike':'לא אהבתי','laugh':'מצחיק','ok':'הבנתי'}
def RI(k,s=26):
    c=f'viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
    if k=='trophy': return f'<svg {c}><path d="M8 4h8v5a4 4 0 0 1-8 0z" fill="#FFC53D"/><path d="M8 6H5.500a2 2 0 0 0 0 4A3 3 0 0 0 8 11M16 6h2.500a2 2 0 0 1 0 4A3 3 0 0 1 16 11M12 13v4M8.500 20h7M9.500 17h5"/></svg>'
    if k=='dislike': return f'<svg {c}><g transform="rotate(180 12 12)"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zM7 11l4-8c1.600 0 2.500 1 2.500 2.500V9h5a2 2 0 0 1 2 2.300l-1.200 7a2 2 0 0 1-2 1.700H7" fill="#FF5A36"/></g></svg>'
    if k=='laugh': return f'<svg {c}><circle cx="12" cy="12" r="9" fill="#FFD84A"/><path d="M8 10q1-1.500 2 0M14 10q1-1.500 2 0"/><path d="M7.500 13.500h9a4.500 4.500 0 0 1-9 0z" fill="#fff"/></svg>'
    if k=='ok': return f'<svg {c}><circle cx="12" cy="12" r="9" fill="#00B67A"/><path d="M8 12.500l2.800 2.800L16.500 9.500" stroke-width="2.500"/></svg>'
    d,f,_=RX[k]; return f'<svg {c}><path d="{d}" fill="{f}"/></svg>'
def av_(t,c='#E3DDFF',s=44): return f'<span class="h" style="width:{s}px;height:{s}px;flex-shrink:0;border-radius:50%;border:2px solid {INK};background:{c};display:inline-flex;align-items:center;justify-content:center;font-size:{s*0.45:.0f}px;">{t}</span>'
WA='M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3zM9 9c0 3 3 6 6 6l1.5-1.5-2-1-1 .7c-1-.4-2-1.400-2.400-2.400l.7-1-1-2z'
ORG=lambda: f'<div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">{logo("ב",40,"#00B67A")}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;line-height:1.1;">ועד בית שדרות הגפן</span><span style="font-size:12.5px;font-weight:700;color:{SOFT};">בית שמש</span></div></div>'
ORGH=lambda: f'<div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">{back}{ORG()}</div>'
def orgband(title):
    return f'<div style="flex-shrink:0;margin:-18px -16px 0;padding:18px 16px 14px;background:#00B67A;border-bottom:2.5px solid {INK};color:{INK};display:flex;align-items:center;gap:12px;">{back}<div style="flex:1;display:flex;flex-direction:column;"><span style="font-family:\'Secular One\',sans-serif;font-size:24px;line-height:1.1;">{title}</span><span style="font-size:13px;font-weight:700;">ועד בית שדרות הגפן</span></div>{logo("ב",40,"#FFFFFF")}</div>'
# 1. notice
card=(f'<section style="flex-shrink:0;background:#fff;border:2.5px solid {INK};border-radius:22px;box-shadow:0 4px 0 {INK};padding:18px;display:flex;flex-direction:column;gap:12px;">'
 +f'<span style="font-family:\'Secular One\',sans-serif;font-size:26px;line-height:1.15;">הארגון פתח מדריך חברים. רוצים להופיע בו?</span>'
 +P('במדריך החברים של הארגון אפשר לראות מי עוד חבר. אתם מחליטים אם להופיע ומה להציג. אם לא תרצו, שום דבר לא יוצג.',14.5,SOFT)
 +pbtn('להופיע במדריך')+sbtn('לא עכשיו')
 +P('אפשר לשנות את זה בכל רגע, בהגדרות החברות בארגון.',13,SOFT,'center')+'</section>')
mob['D-DirNotice']=page('ד · מדריך חברים · הודעה',844,orgband('הודעה מהארגון')+card,'')
# 2. setup
def frow2(t,sub,on,lock=False):
    return f'<div style="display:flex;align-items:center;gap:12px;min-height:52px;"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;">{t}</span><span style="font-size:12.5px;font-weight:600;color:{SOFT};">{sub}</span></div>{"<span style=\"font-size:12.5px;font-weight:800;color:"+SOFT+";\">תמיד</span>" if lock else tg(on)}</div>'
sep=f'<div style="height:1.5px;background:#EDE6D6;"></div>'
prev=(f'<section style="flex-shrink:0;background:#FFF9EC;border:2px dashed {INK};border-radius:18px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">'
 f'<span style="font-weight:800;font-size:13px;color:{SOFT};">כך יראו אותך החברים בארגון</span>'
 f'<div style="display:flex;align-items:center;gap:10px;">{av_("ד","#FFD9E8",48)}<div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:18px;">דנה</span><span style="font-size:13px;font-weight:700;color:{SOFT};">דירה 4</span></div></div></section>')
nm=(f'<div style="flex-shrink:0;display:flex;flex-direction:column;gap:4px;"><span style="font-weight:800;font-size:15px;">שם מוצג בארגון הזה</span><span style="min-height:46px;box-sizing:border-box;padding:0 14px;border:2px solid {INK};border-radius:14px;background:#fff;font-weight:700;display:flex;align-items:center;">דנה</span>'
 f'<span style="font-size:12.5px;font-weight:600;color:{SOFT};">שם הפרופיל שלכם: דנה לוי. ההנהלה תמיד רואה אותו.</span></div>')
mob['D-DirSetup']=page('ד · מדריך חברים · ההופעה שלי',844,orgband('ההופעה שלי במדריך')+nm
 +box(f'<div style="padding:2px 14px;">'+frow2('שם ותמונה','זה המינימום להופעה',True,True)+sep+frow2('מספר דירה','',True)+sep+frow2('תפקיד בארגון','',False)+sep+frow2('טלפון','מי שיראה יוכל לפתוח וואטסאפ',False)+sep+frow2('דוא״ל','',False)+'</div>')
 +prev+'<div style="flex:1;min-height:4px;"></div>'+pbtn('להופיע במדריך')+f'<div style="height:6px;flex-shrink:0;"></div>','')
# 3. directory
def drow(n,sub,c,wa=False,me=False):
    w=f'<span style="width:38px;height:38px;border-radius:50%;border:2px solid {INK};background:#D7F5E8;display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-label="וואטסאפ">{ico(WA,20,2.2)}</span>' if wa else ''
    m=tagp('אתם','#FFF6D1') if me else ''
    return f'<div style="padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1.5px solid #EDE6D6;">{av_(n[0],c,44)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:16px;display:flex;gap:6px;align-items:center;">{n}{m}</span><span style="font-size:12.5px;font-weight:600;color:{SOFT};">{sub}</span></div>{w}</div>'
srch=f'<span style="flex-shrink:0;min-height:44px;box-sizing:border-box;padding:0 14px;border:2px solid {INK};border-radius:22px;background:#fff;color:{SOFT};font-weight:600;display:flex;align-items:center;gap:8px;">{ico("M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",18,2.2)}חיפוש לפי שם</span>'
rows=drow('אבי שמעוני','דירה 7','#CFF0FC',True)+drow('דנה','דירה 4','#FFD9E8',False,True)+drow('חנה ברק','דירה 6 · גזברית','#D7F5E8',True)+drow('יוסי כהן','דירה 14','#E3DDFF')+drow('מיכל','דירה 12','#FFD9E8',True)+drow('נועה פרץ','דירה 21','#CFF0FC')+drow('רועי א.','','#D7F5E8')
mob['D-Directory']=page('ד · מדריך חברים',844,orgband('מדריך החברים')+P('42 חברים מופיעים במדריך. מי שלא בחר להופיע לא מוצג.',13.5,SOFT)+srch+box(rows),'')
# 4. person
def prow(l,v,last=False): return f'<div style="display:flex;align-items:center;gap:12px;min-height:50px;padding:6px 14px;border-bottom:{"none" if last else "1.5px solid #EDE6D6"};"><span style="width:90px;font-weight:700;color:{SOFT};font-size:14px;">{l}</span><span style="font-weight:800;">{v}</span></div>'
mob['D-DirPerson']=page('ד · מדריך חברים · חבר',844,orgband('חבר בארגון')
 +f'<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0;">{av_("א","#CFF0FC",96)}<span style="font-family:\'Secular One\',sans-serif;font-size:28px;">אבי שמעוני</span><span style="font-weight:700;color:{SOFT};">חבר בארגון</span></div>'
 +box(prow('דירה','7')+prow('טלפון','<bdi dir="ltr">050-234-5678</bdi>',True))
 +pbtn('שליחת וואטסאפ')+sbtn('העתקת הטלפון')
 +P('מוצג רק מה שאבי בחר לשתף עם הארגון הזה.',13,SOFT,'center'),'')
# 5. channel
def reacts(items,mine=None,add=True):
    s=''
    for e,c in items:
        on=(e==mine)
        s+=f'<span style="min-height:44px;box-sizing:border-box;padding:0 8px;border-radius:12px;background:{"#FFEFA8" if on else "transparent"};font-weight:800;display:inline-flex;align-items:center;gap:5px;">{RI(e,28)}<span style="font-size:15px;">{c}</span></span>'
    if add: s+=f'<span style="min-height:44px;min-width:44px;justify-content:center;padding:0 6px;display:inline-flex;align-items:center;" aria-label="להוסיף תגובה">{ico("M12 5v14M5 12h14",22,2.800)}</span>'
    return f'<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">{s}</div>'
def msg(t,when,body,rx,personal=False,extra=''):
    tg_=tagp('אישית, רק לכם','#FFF6D1') if personal else ''
    return (f'<section style="flex-shrink:0;background:{"#FFF9EC" if personal else "#fff"};border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:12px 14px;display:flex;flex-direction:column;gap:8px;">'
      f'<div style="display:flex;align-items:center;gap:8px;"><span style="font-family:\'Secular One\',sans-serif;font-size:18px;flex:1;">{t}</span>{tg_}<span style="font-size:12.5px;font-weight:700;color:{SOFT};">{when}</span></div>'
      f'<p style="margin:0;font-size:14.5px;font-weight:600;line-height:1.45;">{body}</p>{rx}{extra}</section>')
m1=msg('חלוקת מפתחות חדשים','לפני שעה','מחר בין 17:00 ל-19:00 נחלק מפתחות חדשים ללובי. אפשר לבוא עם תעודה מזהה.',reacts([('like',31),('trophy',6),('heart',9),('ok',44),('dislike',3)],'like'))
m2=msg('תשלום ועד בית','אתמול','תודה לכל מי ששילם. מי שעדיין לא, אפשר לשלם מהארנק.',reacts([('like',12),('heart',9)]),True,f'<div style="display:flex;">{btnsm("להשיב בפנייה")}</div>')
m3=msg('שיפוץ גג','לפני 3 ימים','עבודות בגג יתחילו ביום ראשון. נעדכן כאן.',reacts([('like',22),('laugh',2),('ok',51),('dislike',1)]))
bar=f'<div style="flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 14px;border:2px dashed {INK};border-radius:16px;background:#FFF9EC;font-size:13px;font-weight:700;color:{SOFT};">{ico("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",18,2.2)}בערוץ הזה ההנהלה כותבת. אפשר להגיב באייקון.</div>'
mob['D-Channel']=page('ד · ערוץ הודעות',844,orgband('הודעות')+m1+m2+m3+bar,'')
pick=('<div style="position:absolute;inset:0;background:rgba(30,22,51,.35);z-index:5;"></div>'
 f'<div style="position:absolute;z-index:6;inset-inline:16px;top:292px;background:#fff;border:2.5px solid {INK};border-radius:24px;box-shadow:0 4px 0 {INK};padding:12px;display:flex;justify-content:space-around;">'
 +''.join(f'<span style="width:52px;height:52px;border-radius:16px;background:{"#FFEFA8" if e=="like" else "transparent"};display:flex;align-items:center;justify-content:center;" aria-label="{LB[e]}">{RI(e,38)}</span>' for e in EM)+'</div>')
mob['D-ChannelReact']=page('ד · ערוץ הודעות · תגובה',844,orgband('הודעות')+m1+m2+m3+bar,'',extra=pick)
for k,v in mob.items(): open(P_+k+'.dc.html','w',encoding='utf-8').write(v)
# ---- admin
asrc=open('/home/claude/gen/gen_admin.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(asrc)
def av(t,c='#E3DDFF',s=34): return f'<span class="h" style="width:{s}px;height:{s}px;flex-shrink:0;border-radius:50%;border:2px solid {INK};background:{c};display:inline-flex;align-items:center;justify-content:center;font-size:{s*0.45:.0f}px;color:{INK};">{t}</span>'
cols=[('חבר/ה','width:200px;'),('שם מוצג במדריך','width:160px;'),('מה מוצג','flex:1;min-width:0;'),('פעולה','width:150px;')]
rws=[('דנה לוי','דנה','שם, דירה','#FFD9E8',False),('אבי שמעוני','אבי שמעוני','שם, דירה, טלפון','#CFF0FC',False),('מיכל פרידמן','המיכל הגדולה','שם','#E3DDFF',True),('חנה ברק','חנה ברק','שם, דירה, תפקיד, טלפון','#D7F5E8',False)]
b=th(cols)
for i,(n,d,w,c,flag) in enumerate(rws):
    act=btn('הסתרת הכינוי',danger=True) if flag else btn('עוד')
    fl=f' {pill("כינוי לבדיקה","#FFE9E6")}' if flag else ''
    b+=tr([(f'<div style="display:flex;gap:10px;align-items:center;">{av(n[0],c)}<b>{n}</b></div>',cols[0][1]),(d+fl,cols[1][1]),(w,cols[2][1]),(act,cols[3][1])],i==len(rws)-1)
left=panel(h2('מדריך חברים','אתם מחליטים אם הוא פתוח. כל חבר מחליט בעצמו אם להופיע.')
 +swrow('מדריך חברים פתוח','חברים יקבלו הודעה אחת ויוכלו לבחור אם להופיע',True)
 +f'<div style="display:flex;align-items:center;gap:10px;">{pill("42 מופיעים מתוך 128","#D7F5E8")}<span style="color:{SOFT};font-weight:600;font-size:13.5px;">אי אפשר לדעת מי לא בחר להופיע, וזה בכוונה.</span></div>'
 +h2('מה אפשר להציג','החבר בוחר מתוך מה שאתם מאפשרים')
 +swrow('מספר דירה','',True)+swrow('תפקיד בארגון','',True)+swrow('טלפון','רק אם החבר בחר',True)+swrow('דוא״ל','',False,True)
 +note('אי אפשר לחייב חבר להופיע במדריך.'),extra='width:420px;flex-shrink:0;')
right=panel(h2('מי מופיע ובאיזה שם','אתם רואים תמיד את השם האמיתי לצד השם המוצג')+b
 +note('כינוי מטעה או פוגעני אפשר להסתיר. החבר יופיע בשמו מהפרופיל.',True),extra='flex:1;min-width:0;')
open(P_+'D-AdmDirectory.dc.html','w',encoding='utf-8').write(shell('ד · מדריך חברים','חברים',head('מדריך חברים','',btn('הודעה על המדריך לחברים'))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{left}{right}</section>'))
# messages
ml=''
for t,s,on in [('חלוקת מפתחות חדשים','לפני שעה · לכולם',True),('תשלום ועד בית','אתמול · אישית לדנה',False),('שיפוץ גג','לפני 3 ימים · לכולם',False)]:
    ml+=f'<div style="padding:10px 12px;border:2px solid {INK};border-radius:14px;background:{"#FFF6D1" if on else "#fff"};display:flex;flex-direction:column;gap:2px;"><b>{t}</b><span style="color:{SOFT};font-size:13px;">{s}</span></div>'
cols2=[('חבר/ה','width:210px;'),('נקראה','width:120px;'),('תגובה','flex:1;min-width:0;')]
mr=[('דנה לוי','לפני 50 דקות','like','#FFD9E8'),('אבי שמעוני','לפני 40 דקות','ok','#CFF0FC'),('חנה ברק','לפני 20 דקות','trophy','#D7F5E8'),('יוסי כהן','לא נקראה','','#E3DDFF'),('מיכל פרידמן','לא נקראה','','#FFD9E8')]
t2=th(cols2)
for i,(n,w,r,c) in enumerate(mr):
    t2+=tr([(f'<div style="display:flex;gap:10px;align-items:center;">{av(n[0],c,30)}<b>{n}</b></div>',cols2[0][1]),(w if w!='לא נקראה' else pill('לא נקראה','#FFE9E6'),cols2[1][1]),(RI(r,24) if r else '—',cols2[2][1])],i==len(mr)-1)
rx=''.join(f'<span style="min-height:34px;font-weight:800;display:inline-flex;align-items:center;gap:6px;">{RI(e,28)}<span>{c}</span></span>' for e,c in [('like',31),('trophy',6),('heart',9),('ok',44),('dislike',3)])
lp=panel(h2('הודעות')+btn('הודעה חדשה',True)+ml,extra='width:340px;flex-shrink:0;')
rp=panel(h2('חלוקת מפתחות חדשים','נשלחה לפני שעה, לכל החברים')
 +f'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">{pill("נקראה על ידי 90 מתוך 128","#D7F5E8")}{pill("81 הגיבו","#E3DDFF")}<span style="flex:1;"></span>{btn("שליחת תזכורת ל-38 שלא קראו")}</div>'
 +f'<div style="display:flex;gap:18px;">{rx}</div>'
 +t2+note('רק ההנהלה רואה מי קרא ומי הגיב. החברים רואים אייקוני תגובה עם מספרים, בלי שמות.'),extra='flex:1;min-width:0;')
open(P_+'D-AdmMessages.dc.html','w',encoding='utf-8').write(shell('ד · הודעות','הודעות',head('הודעות','',btn('מסנן: לא קראו'))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{lp}{rp}</section>'))
print('ok')
