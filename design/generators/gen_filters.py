# Incoming-request filters: admin requests (desktop+mobile+filter sheet), member join-requests-from-orgs inbox + filter sheet.
src=open('/home/claude/gen/gen_madmin.py',encoding='utf-8').read().split("for k,v in mo.items()")[0]
exec(src)
P_='/home/claude/project/'
FIL='M3 5h18l-7 8v6l-4 2v-8z'; CHEV='M6 9l6 6 6-6'; CONT='M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0M20 8v6M17 11h6'
out4={}
def tagp(t,bg='#E3DDFF',ic=None):
    i=ico(ic,12,2.6) if ic else ''
    return f'<span style="display:inline-flex;align-items:center;gap:4px;min-height:22px;box-sizing:border-box;padding:0 8px;border-radius:11px;border:1.5px solid {INK};background:{bg};font-size:11.5px;font-weight:800;white-space:nowrap;">{i}{t}</span>'
def mchip(t,on=False,dd=False,cnt=None):
    bg,fg=(INK,'#fff') if on else ('#fff',INK)
    c=f'<span style="min-width:20px;height:20px;box-sizing:border-box;padding:0 5px;border-radius:10px;background:#FF5A36;color:{INK};border:2px solid {INK};font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-inline-start:5px;">{cnt}</span>' if cnt else ''
    d=ico(CHEV,14,2.6) if dd else ''
    return f'<span style="min-height:38px;box-sizing:border-box;padding:0 12px;border-radius:19px;border:2px solid {INK};background:{bg};color:{fg};font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">{t}{c}{d}</span>'
fbtn=lambda n: f'<a href="#" style="min-height:44px;box-sizing:border-box;padding:0 14px;border-radius:19px;border:2px solid {INK};background:{Y};box-shadow:0 2px 0 {INK};font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">{ico(FIL,16,2.4)}מסננים{(" · "+str(n)) if n else ""}</a>'
def sheet_wrap(title,inner,cta,clear):
    return (f'<div style="position:absolute;inset:0;background:rgba(30,22,51,.55);z-index:5;"></div><section role="dialog" aria-label="{title}" style="position:absolute;inset-inline:0;bottom:0;z-index:6;box-sizing:border-box;background:#fff;border-top:2.5px solid {INK};border-radius:24px 24px 0 0;padding:14px 16px 20px;display:flex;flex-direction:column;gap:12px;">'
     f'<div style="align-self:center;width:44px;height:5px;border-radius:3px;background:{INK};opacity:.25;"></div>'
     f'<div style="display:flex;align-items:center;"><span style="font-family:\'Secular One\',sans-serif;font-size:24px;flex:1;">{title}</span><a href="#" style="min-height:44px;padding:0 6px;display:inline-flex;align-items:center;font-weight:800;font-size:15px;text-decoration:underline;">{clear}</a></div>'
     +inner+pbtn(cta)+'</section>')
def sec(t,items): return f'<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;font-size:15px;">{t}</span><div style="display:flex;flex-wrap:wrap;gap:6px;">{items}</div></div>'
def trow(t,sub,on):
    return f'<div style="display:flex;align-items:center;gap:12px;min-height:46px;"><div style="flex:1;display:flex;flex-direction:column;"><span style="font-weight:800;font-size:15px;">{t}</span><span style="font-size:12.5px;font-weight:600;color:{SOFT};">{sub}</span></div>{tg(on)}</div>'
# ---- admin mobile: requests with tags + filter row
def req2(n,sub,tags):
    return (f'<div style="padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1.5px solid #EDE6D6;"><span style="width:42px;height:42px;border-radius:21px;border:2px solid {INK};background:#E3DDFF;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{n[0]}</span>'
     f'<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;"><span style="font-weight:800;font-size:16px;">{n}</span><span style="font-size:12.5px;font-weight:600;color:{SOFT};">{sub}</span><div style="display:flex;flex-wrap:wrap;gap:4px;">{tags}</div></div><div style="display:flex;flex-direction:column;gap:6px;">{btnsm("לאשר",True)}{btnsm("לדחות",danger=True)}</div></div>')
tC=tagp('באנשי הקשר שלך','#D7F5E8',CONT); tF=lambda n: tagp('הוזמנה על ידי '+n,'#FFD9E8')
mo4={}
mo4['D-MAdmRequests']=page('ד · ניהול במובייל · בקשות',844,
 abar('בקשות הצטרפות','9 ממתינות')
 +f'<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;">{fbtn(0)}{mchip("הכול",True,cnt=9)}{mchip("באנשי הקשר שלי",cnt=2)}{mchip("הוזמנו על ידי חבר",cnt=3)}</div>'
 +box(req2('דנה כהן','כסף · לפני שעה · בית שמש',tC+tF('יוסי לוי'))+req2('יוסי לוי','זהב · לפני 3 שעות · ירושלים',tagp('קוד פרופיל ארגון'))+req2('מיכל אברהם','כסף · אתמול · ניו יורק, ארה״ב',tagp('כרזה'))+req2('אורי פרידמן','כסף · אתמול · בית שמש',tC))
 +P('מוצגות 4 מתוך 9.',13,SOFT)
 +'<div style="flex:1;min-height:6px;"></div>'+sbtn('לאשר את כל הבקשות התקינות (7)')+'<div style="height:6px;flex-shrink:0;"></div>'
 ,anav('mem'))
fsheet=sheet_wrap('סינון בקשות',
  sec('מקור הבקשה',mchip('קוד פרופיל ארגון',True)+mchip('כרזה')+mchip('חבר הזמין',True)+mchip('סריקה בפגישה'))
  +sec('אזור או מדינה',mchip('ישראל',True)+mchip('באזור הארגון')+mchip('חו״ל')+mchip('עיר...',dd=True))
  +sec('מסלול שנבחר',mchip('חבר/ת קהילה')+mchip('משפחה')+mchip('תומך/ת'))
  +f'<div style="border:2px solid {INK};border-radius:14px;padding:2px 12px;background:#FFF9EC;">{trow("באנשי הקשר שלי","ההתאמה מתבצעת בטלפון שלך בלבד",True)}<div style="height:1.5px;background:#EDE6D6;"></div>{trow("הוזמנו על ידי חבר קיים","מי שחבר בארגון המליץ עליו",False)}<div style="height:1.5px;background:#EDE6D6;"></div>{trow("טלפון מאומת","הוזן קוד אימות",False)}</div>',
  'הצגת 3 בקשות','ניקוי')
mo4['D-MAdmRequestsFilter']=page('ד · ניהול במובייל · סינון בקשות',844,abar('בקשות הצטרפות','9 ממתינות')+box(req2('דנה כהן','כסף · לפני שעה',tC)+req2('יוסי לוי','זהב · לפני 3 שעות',tagp('קוד פרופיל ארגון'))),anav('mem'),extra=fsheet)
# ---- member: org requests (בקשות צירוף) + filter
def org_card(L,c,name,sub,tags,first=False):
    return (f'<section style="flex-shrink:0;background:#fff;border:2px solid {INK};border-radius:18px;box-shadow:0 3px 0 {INK};padding:12px 14px;display:flex;flex-direction:column;gap:8px;">'
     f'<div style="display:flex;align-items:center;gap:10px;">{logo(L,44,c)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;"><span style="font-family:\'Secular One\',sans-serif;font-size:19px;line-height:1.1;">{name}</span><span style="font-size:13px;font-weight:700;color:{SOFT};">{sub}</span></div></div>'
     f'<div style="display:flex;flex-wrap:wrap;gap:4px;">{tags}</div>'
     f'<div style="display:flex;gap:8px;">{btnsm("לאשר",True)}{btnsm("לדחות",danger=True)}{btnsm("עוד")}</div></section>')
tShared=tagp('2 מהחברים שלך חברים בו','#FFD9E8'); tVer=tagp('ארגון מאומת','#D7F5E8')
inv=(hdr('בקשות צירוף')
 +P('ארגונים שמבקשים לצרף אותך. אין הצטרפות עד שתאשרו.',13.5,SOFT)
 +f'<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;">{fbtn(0)}{mchip("הכול",True,cnt=4)}{mchip("באנשי הקשר שלי",cnt=1)}{mchip("חברים שלי חברים בו",cnt=2)}</div>'
 +org_card('כ','#18B8F0','כושר פלוס','חדר כושר · בית שמש',tagp('ארגון באנשי הקשר שלך','#D7F5E8',CONT)+tShared+tVer)
 +org_card('ח','#FF5C9E','מועדון הקריאה','מועדון · ירושלים',tVer)
 +org_card('ב','#00B67A','ועד בית שדרות הגפן','ועד בית · בית שמש',tShared))
out4['D-Invites']=page('ד · בקשות צירוף מארגונים',844,inv,'')
msheet=sheet_wrap('סינון בקשות צירוף',
  sec('סוג ארגון',mchip('ועד בית')+mchip('בית כנסת')+mchip('חדר כושר',True)+mchip('חוגים')+mchip('מועדונים',True))
  +sec('אזור או מדינה',mchip('ישראל',True)+mchip('באזור שלי')+mchip('חו״ל'))
  +f'<div style="border:2px solid {INK};border-radius:14px;padding:2px 12px;background:#FFF9EC;">{trow("ארגונים באנשי הקשר שלי","ההתאמה מתבצעת בטלפון שלך בלבד",True)}<div style="height:1.5px;background:#EDE6D6;"></div>{trow("חברים שלי חברים בהם","רק אנשי הקשר שלך שחברים בארגון",True)}<div style="height:1.5px;background:#EDE6D6;"></div>{trow("ארגונים מאומתים בלבד","אומת על ידי הפלטפורמה",False)}<div style="height:1.5px;background:#EDE6D6;"></div>{trow("להסתיר ארגונים שדחיתי","ארגון שדחיתי לא יציק שוב",True)}</div>',
  'הצגת 2 בקשות','ניקוי')
out4['D-InvitesFilter']=page('ד · סינון בקשות צירוף',844,hdr('בקשות צירוף')+org_card('כ','#18B8F0','כושר פלוס','חדר כושר · בית שמש',tVer),'',extra=msheet)
for k,v in {**mo4,**out4}.items(): open(P_+k+'.dc.html','w',encoding='utf-8').write(v)
# ---- admin desktop
asrc=open('/home/claude/gen/gen_admin.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(asrc)
def av(t,c='#E3DDFF',s=36): return f'<span class="h" style="width:{s}px;height:{s}px;flex-shrink:0;border-radius:50%;border:2px solid {INK};background:{c};display:inline-flex;align-items:center;justify-content:center;font-size:{s*0.45:.0f}px;color:{INK};">{t}</span>'
def dchip(t,on=False,dd=False,cnt=None):
    bg,fg=(INK,'#fff') if on else ('#fff',INK)
    c=f'<span style="min-width:20px;height:20px;box-sizing:border-box;padding:0 5px;border-radius:10px;background:#FF5A36;color:{INK};border:2px solid {INK};font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-inline-start:5px;">{cnt}</span>' if cnt else ''
    return f'<span style="min-height:34px;box-sizing:border-box;padding:0 12px;border-radius:17px;border:2px solid {INK};background:{bg};color:{fg};font-weight:800;font-size:13.5px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">{t}{c}{ico(CHEV,13,2.6) if dd else ""}</span>'
rq=[('אבי שמעוני','050-2345678',[('באנשי הקשר שלך','#D7F5E8')],'קוד פרופיל ארגון','בית שמש, ישראל','משפחה עם 3 ילדים, גרים ברחוב הרצל 14','לפני שעתיים','#FFD9E8'),
    ('דנה ברק','052-7766554',[('הוזמנה על ידי יוסי כהן','#FFD9E8')],'חבר הזמין','בית שמש, ישראל','חברה בבית הכנסת הישן, עברנו לשכונה','אתמול','#CFF0FC'),
    ('רועי אזולאי','054-1122334',[],'כרזה','ירושלים, ישראל','בלי הערה','אתמול','#D7F5E8'),
    ('מיכל פרידמן','+1 917-555-0142',[('מחו״ל','#FFF6D1')],'קוד פרופיל ארגון','ניו יורק, ארה״ב','מכירה את הגבאי יוסף','לפני 3 ימים','#E3DDFF')]
cols=[('מבקש/ת','width:230px;'),('מקור','width:120px;'),('אזור','width:130px;'),('הערה מהמבקש','flex:1;min-width:0;'),('מתי','width:90px;'),('פעולה','width:160px;')]
body=th(cols)
for i,(n,p,tg_,src_,reg,nt,w,c) in enumerate(rq):
    tags=''.join(f'<span style="display:inline-flex;align-items:center;min-height:20px;padding:0 8px;border-radius:10px;border:1.5px solid {INK};background:{bg};font-size:11.5px;font-weight:800;">{t}</span>' for t,bg in tg_)
    body+=tr([(f'<div style="display:flex;gap:10px;align-items:center;">{av(n[0],c)}<div style="display:flex;flex-direction:column;gap:3px;"><b>{n}</b><bdi style="color:{SOFT};font-size:12.5px;">{p}</bdi>{tags}</div></div>',cols[0][1]),(src_,cols[1][1]),(reg,cols[2][1]),(nt,cols[3][1]),(w,cols[4][1]),(f'<span style="display:flex;gap:8px;">{btn("לאשר",True)}{btn("לדחות")}</span>',cols[5][1])],i==len(rq)-1)
filters=(f'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">{dchip("הכול",True,cnt=9)}{dchip("מקור",dd=True)}{dchip("אזור או מדינה",dd=True)}{dchip("מסלול",dd=True)}{dchip("באנשי הקשר שלי",cnt=2)}{dchip("הוזמנו על ידי חבר",cnt=3)}{dchip("טלפון מאומת")}{dchip("פרטים מלאים")}<span style="flex:1;"></span><a href="#" style="font-weight:800;font-size:13.5px;text-decoration:underline;">שמירת המסנן</a></div>'
  f'<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:{SOFT};">{ico(CONT,16,2.2)}ההתאמה לאנשי הקשר נעשית באפליקציית הניהול בטלפון שלך. אנחנו לא מעלים את אנשי הקשר.</div>')
lst=panel(f'<div style="display:flex;align-items:center;gap:10px;">{h2("בקשות הצטרפות","מוצגות 4 מתוך 9 ממתינות")}<span style="flex:1;"></span>{pill("ממתינות",Y)}{pill("אושרו","#fff")}{pill("נדחו","#fff")}</div>'+filters+body+f'<div style="display:flex;align-items:center;gap:12px;padding-top:6px;"><span style="font-weight:700;color:{SOFT};flex:1;">בוחרים מסלול ותוויות בעת האישור, ודחייה נשלחת בנוסח נעים. המבקש/ת לא רואה פרטי חברים אחרים לעולם.</span>{btn("לאשר את 4 התוצאות",True)}</div>',pad=16,gap=12,extra='flex:1;min-width:0;align-self:flex-start;')
adm=shell('ד · בקשות הצטרפות','חברים',head('בקשות הצטרפות','',btn('לאשר הכול')+btn('מסננים שמורים (2)'))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{lst}</section>')
open(P_+'D-AdmRequests.dc.html','w',encoding='utf-8').write(adm)
print('ok',list(mo4)+list(out4)+['D-AdmRequests'])
