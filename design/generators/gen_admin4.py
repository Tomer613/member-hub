src=open('/home/claude/gen/gen_admin3.py',encoding='utf-8').read().split("for k_,v in out.items()")[0]
exec(src)
out={}
def kp(v,l,c): return k(v,l,c)
def table(title,sub,cols,rows,actions='',pillcol=None,filters=''):
    body=th(cols)+''.join(tr([(c,cols[i][1]) for i,c in enumerate(r)],j==len(rows)-1) for j,r in enumerate(rows))
    return panel(f'<div style="display:flex;align-items:center;gap:8px;">{h2(title,sub)}<span style="flex:1;"></span>{filters}{actions}</div>'+body,pad=16,gap=6,extra='flex:1;min-width:0;align-self:flex-start;')
def side(*parts,w=360): return f'<div style="width:{w}px;flex-shrink:0;display:flex;flex-direction:column;gap:14px;">'+''.join(parts)+'</div>'
ORGS={'hoa':('ו','ועד הרצל 12','ניהול · יו״ר הוועד'),'gym':('F','FitZone','ניהול · מנהל המכון')}
def page(title,active,pack,head_,*sections):
    h=shell(title,active,head_+''.join(sections),pack=pack)
    if pack in ORGS:
        l,n,r=ORGS[pack]
        h=h.replace('>א</span><div','>'+l+'</span><div',1).replace('>אור חדש</span>','>'+n+'</span>',1).replace('ניהול · גבאי ראשי',r,1)
    return h
def row(*c): return f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{"".join(c)}</section>'
G=lambda t:pill(t,'#D7F5E8'); Yl=lambda t:pill(t,'#FFF6D1'); R_=lambda t:pill(t,'#FFE9E6'); Bl=lambda t:pill(t,'#CFF0FC')
# ---------- בית כנסת
cols=[('יום','width:80px;'),('תפילה','flex:1;'),('שעה','width:80px;'),('מקום','width:130px;'),('מניין','width:100px;')]
rows=[('ראשון','שחרית','06:30','בית המדרש',G('מאושר')),('ראשון','מנחה וערבית','18:15','בית המדרש',G('מאושר')),('שישי','קבלת שבת','18:30','היכל',G('מאושר')),('שבת','שחרית','08:30','היכל',G('מאושר')),('שבת','מנחה','17:45','בית המדרש',Yl('חסר 2'))]
t=table('לוח תפילות','שבוע רגיל, נערך פעם אחת וחוזר',cols,rows,btn('+ תפילה'),filters=pill('שבוע זה',Y)+pill('קבוע','#fff'))
s=side(panel(h2('השבוע','מחושב אוטומטית לפי מיקום')+tr([('פרשת השבוע','flex:1;'),('<b>נח</b>','')])+tr([('כניסת שבת','flex:1;'),('<bdi><b>17:42</b></bdi>','')])+tr([('צאת שבת','flex:1;'),('<bdi><b>18:38</b></bdi>','')],True)+note('VERIFY: מקור זמני היום והתאריך העברי (ספריית חישוב מול שירות חיצוני) ושיטת החישוב לכל קהילה.'),pad=16,gap=2),panel(h2('עדכון ידני')+fld('הודעה לקהל','מנחה שבת בבית המדרש, חסרים 2 למניין','',h=60)+btn('שליחה כהודעה',True),pad=16,gap=10))
out['D-ModSynSchedule']=page('ד · מודול · תפילות ולוח זמנים','תפילות ולוח זמנים','synagogue',head('תפילות ולוח זמנים','',pk('בית כנסת')),row(t,s))
cols=[('תורם','flex:1;'),('סוג','width:110px;'),('מה','width:150px;'),('סכום','width:90px;text-align:end;'),('סטטוס','width:110px;')]
rows=[('דוד כהן','עלייה','שמחת תורה','<bdi><b>₪360</b></bdi>',G('שולם')),('שרה לוי','נדר','תיקון ספר תורה','<bdi><b>₪1,800</b></bdi>',Yl('בתשלומים')),('אורי פרידמן','תרומה','כללי','<bdi><b>₪500</b></bdi>',G('שולם')),('משה דהאן','נדר','קידוש','<bdi><b>₪250</b></bdi>',R_('באיחור')),('רחל מזרחי','עלייה','שבת נח','<bdi><b>₪180</b></bdi>',G('שולם'))]
t=table('נדרים ותרומות','כל עלייה ונדר הופכים לחיוב בכרטיס החבר',cols,rows,btn('+ נדר',True),filters=pill('הכל',Y)+pill('פתוחים','#fff')+pill('באיחור','#fff'))
s=side(f'<div style="display:flex;gap:10px;">{k("₪4,090","נדרים פתוחים",Y)}{k("₪7,200","נגבה החודש",GREEN)}</div>',panel(h2('נדר חדש')+fld('מי','שרה לוי')+fld('סוג','נדר')+fld('סכום','₪1,800')+swrow('פריסה לתשלומים','3 חיובים חודשיים',True,True)+btn('יצירת חיוב',True),pad=16,gap=8))
out['D-ModSynDonations']=page('ד · מודול · תרומות ונדרים','תרומות ונדרים','synagogue',head('תרומות ונדרים','',pk('בית כנסת')),row(t,s))
cols=[('לזכר','flex:1;'),('תאריך עברי','width:100px;'),('השנה','width:80px;'),('משפחה','width:120px;'),('תזכורת','width:110px;')]
rows=[('אבי הזקן ז״ל','כ״ח תשרי','03.11','משפחת כהן',G('נשלחה')),('אמא ע״ה','ב׳ חשוון','06.11','משפחת לוי',Yl('בעוד 3 ימים')),('סבא יעקב ז״ל','י״ז חשוון','25.11','משפחת דהאן',Bl('מתוכננת')),('אחי ז״ל','ה׳ כסלו','23.12','משפחת ברק',Bl('מתוכננת'))]
t=table('יארצייט','לפי התאריך העברי, מחושב מחדש כל שנה',cols,rows,btn('+ הוספה',True),filters=pill('30 ימים',Y)+pill('הכל','#fff'))
s=side(panel(h2('הוספת יארצייט')+fld('לזכר','אבי הזקן ז״ל')+fld('תאריך עברי','כ״ח תשרי')+fld('משפחה','משפחת כהן')+f'<div style="display:flex;gap:16px;">{chk(True,"תזכורת למשפחה")}{chk(True,"הודעה לקהל")}</div>'+btn('שמירה',True),pad=16,gap=8),panel(h2('הגדרות תזכורת')+tr([('מתי לשלוח','flex:1;'),('<b>7 ימים לפני</b>','')])+tr([('ערוץ','flex:1;'),('<b>דחיפה + SMS</b>','')],True)+note('תאריכים בעייתיים (שנה מעוברת, ל׳ בחודש) דורשים כלל אחד מוסכם. ראו open-questions.'),pad=16,gap=2))
out['D-ModSynYahrzeit']=page('ד · מודול · יארצייט','יארצייט','synagogue',head('יארצייט','',pk('בית כנסת')),row(t,s))
# ---------- ועד בית
cols=[('תאריך','width:90px;'),('ספק','flex:1;'),('קטגוריה','width:130px;'),('סכום','width:100px;text-align:end;'),('קבלה','width:90px;')]
rows=[('07.10','חברת החשמל','חשמל','<bdi><b>₪1,140</b></bdi>',G('צורפה')),('05.10','ניקיון הבניין','ניקיון','<bdi><b>₪2,400</b></bdi>',G('צורפה')),('01.10','מעליות בע״מ','מעליות','<bdi><b>₪850</b></bdi>',R_('חסרה')),('28.09','גינון','גינון','<bdi><b>₪600</b></bdi>',G('צורפה'))]
bars=''.join(f'<div style="display:flex;align-items:center;gap:8px;"><span style="width:70px;font-weight:700;">{n}</span><span style="height:16px;width:{w}px;background:{ORG};border:2px solid {INK};border-radius:6px;"></span><bdi style="font-weight:800;">{v}</bdi></div>' for n,w,v in [('ניקיון',160,'₪14,400'),('מעליות',90,'₪8,100'),('חשמל',70,'₪6,800'),('גינון',40,'₪3,600')])
t=table('הוצאות','כל הוצאה מקושרת לקבלה',cols,rows,btn('+ הוצאה',True),filters=pill('השנה',Y))
s=side(f'<div style="display:flex;gap:10px;">{k("₪120,000","תקציב שנתי",ORG)}{k("₪32,900","הוצא עד כה",Y)}</div>',panel(h2('לפי קטגוריה')+bars+note('כל דייר רואה בקצרה לאן הולך הכסף (שקיפות). ניתן לכבות.'),pad=16,gap=10))
out['D-ModHoaExpenses']=page('ד · מודול · הוצאות ותקציב','הוצאות ותקציב','hoa',head('הוצאות ותקציב','',pk('ועד בית')),row(t,s))
def col(t,c,items): return f'<div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:12px;border:2.5px solid {INK};border-radius:18px;background:#fff;box-shadow:0 3px 0 {INK};"><div style="display:flex;align-items:center;gap:8px;"><b class="h" style="font-size:18px;">{t}</b>{pill(str(len(items)),c)}</div>'+''.join(f'<div style="padding:10px;border:2px solid {INK};border-radius:14px;background:{CREAM};display:flex;flex-direction:column;gap:3px;"><b>{a}</b><span style="font-size:12.5px;color:{SOFT};font-weight:600;">{b}</span></div>' for a,b in items)+'</div>'
kb=f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{col("חדש",Y,[("נזילה בחדר מדרגות","דירה 12 · היום"),("מנורה שרופה בלובי","דירה 3 · אתמול")])}{col("בטיפול","#CFF0FC",[("תיקון שער חניה","טכנאי יגיע מחר"),("צביעת קומה 2","הצעת מחיר ממתינה")])}{col("טופל",GREEN+"33",[("החלפת מנעול","06.10"),("ניקוי מרזבים","03.10")])}</section>'
out['D-ModHoaIssues']=page('ד · מודול · תקלות ותחזוקה','תקלות ותחזוקה','hoa',head('תקלות ותחזוקה','דיירים מדווחים מהאפליקציה',pk('ועד בית')+btn('+ תקלה',True)),kb)
cols=[('תאריך','width:90px;'),('נושא','flex:1;'),('הגיעו','width:90px;'),('סטטוס','width:110px;')]
rows=[('22.10','אסיפה כללית שנתית','0 נרשמו',Yl('טיוטה')),('15.06','אישור תקציב','31 מתוך 40',G('הסתיימה'))]
t=table('אסיפות והצבעות','',cols,rows,btn('+ אסיפה',True))
res=''.join(f'<div style="display:flex;align-items:center;gap:8px;"><span style="width:60px;font-weight:700;">{n}</span><span style="height:18px;width:{w}px;background:{c};border:2px solid {INK};border-radius:6px;"></span><b>{v}</b></div>' for n,w,c,v in [('בעד',200,GREEN,'22'),('נגד',70,DANGER,'7'),('נמנע',26,'#B8AFC7','2')])
s=side(panel(h2('תוצאות: אישור תקציב')+res+tr([('מניין חוקי','flex:1;'),(G('כן · 31 מתוך 40'),'')])+tr([('משקל קול','flex:1;'),('<b>לפי שטח דירה</b>','')],True)+note('VERIFY: דרישות החוק לאסיפות, מניין ומשקל קול בבית משותף. להתייעץ עם עורך דין.'),pad=16,gap=8))
out['D-ModHoaMeetings']=page('ד · מודול · אסיפות והצבעות','אסיפות והצבעות','hoa',head('אסיפות והצבעות','',pk('ועד בית')),row(t,s))
# ---------- חדר כושר
cols=[('שעה','width:80px;'),('מתאמן','flex:1;'),('מנוי','width:130px;'),('תוצאה','width:130px;')]
rows=[('18:42','דנה אברהם','שנתי',G('נכנסה')),('18:40','יובל כהן','כרטיסייה · 3 נותרו',G('נכנס')),('18:31','רועי לוי','פג בתחילת החודש',R_('נדחה')),('18:20','מיכל בר','חודשי',G('נכנסה'))]
t=table('כניסות היום','מתעדכן בזמן אמת',cols,rows,btn('+ כניסה ידנית'),filters=pill('היום',Y)+pill('נדחו','#fff'))
s=side(f'<div style="display:flex;gap:10px;">{k("84","כניסות היום",ORG)}{k("3","נדחו",DANGER)}</div>',panel(h2('בקרת כניסה')+tr([('דלת ראשית','flex:1;'),(G('מחוברת'),'')])+swrow('כניסה למנוי פעיל בלבד','חוב פתוח לא חוסם אוטומטית',True)+swrow('כרטיסייה','מורידה כניסה בכל סריקה',True,True)+note('ייצוא רשימת מורשים לשער (קובץ). ראו ARCHITECTURE: access_control_export.'),pad=16,gap=2))
out['D-ModGymAccess']=page('ד · מודול · כניסות ובקרת כניסה','כניסות ובקרת כניסה','gym',head('כניסות ובקרת כניסה','',pk('חדר כושר')),row(t,s))
days=['ראשון','שני','שלישי','רביעי','חמישי']
def cl(n,t,c): return f'<div style="padding:8px;border:2px solid {INK};border-radius:12px;background:{c};font-weight:700;font-size:13px;"><b>{n}</b><br><span style="color:{SOFT};">{t}</span></div>'
grid=''.join(f'<div style="flex:1;display:flex;flex-direction:column;gap:8px;"><b style="text-align:center;">{d}</b>{cl("ספינינג","07:00 · 12/15","#D7F5E8")}{cl("יוגה","18:00 · 15/15","#FFE9E6")}{cl("כוח","19:00 · 6/20","#FFF6D1")}</div>' for d in days)
t=panel(f'<div style="display:flex;align-items:center;gap:8px;">{h2("מערכת שיעורים","מקומות תפוסים מתוך קיבולת")}<span style="flex:1;"></span>{btn("+ שיעור",True)}</div><div style="display:flex;gap:10px;">{grid}</div>',pad=16,gap=10,extra='flex:1;min-width:0;align-self:flex-start;')
s=side(panel(h2('יוגה · ראשון 18:00')+tr([('מאמנת','flex:1;'),('<b>נועה</b>','')])+tr([('רשומים','flex:1;'),('<b>15 מתוך 15</b>','')])+tr([('רשימת המתנה','flex:1;'),('<b>4</b>','')])+swrow('ביטול עד שעתיים לפני','אחרי כן נספרת כניסה',True,True)+btn('הודעה לרשומים'),pad=16,gap=2))
out['D-ModGymClasses']=page('ד · מודול · שיעורים והזמנות','שיעורים והזמנות','gym',head('שיעורים והזמנות','',pk('חדר כושר')),row(t,s))
cols=[('מתאמן','flex:1;'),('מתאריך','width:90px;'),('עד','width:90px;'),('סיבה','width:140px;'),('סטטוס','width:110px;')]
rows=[('דנה אברהם','01.11','01.12','נסיעה',Yl('ממתין לאישור')),('רועי לוי','15.10','15.11','פציעה',G('פעילה')),('מיכל בר','01.09','01.10','הריון',G('הסתיימה'))]
t=table('הקפאות מנוי','',cols,rows,btn('+ הקפאה'),filters=pill('ממתינות',Y)+pill('פעילות','#fff'))
s=side(panel(h2('כללי הקפאה')+tr([('מקסימום בשנה','flex:1;'),('<b>חודשיים</b>','')])+tr([('חיוב בזמן הקפאה','flex:1;'),('<b>ללא</b>','')])+tr([('המנוי מתארך','flex:1;'),('<b>בתקופת ההקפאה</b>','')],True)+note('זה אותו מסך שהחבר רואה ב"המנוי שלי > הקפאת מנוי". הכללים נקבעים כאן.'),pad=16,gap=2))
out['D-ModGymFreeze']=page('ד · מודול · הקפאות מנוי','הקפאות מנוי','gym',head('הקפאות מנוי','',pk('חדר כושר')),row(t,s))
for k_,v in out.items(): open(f'/home/claude/project/{k_}.dc.html','w',encoding='utf-8').write(v)
print(list(out))
# ---------- מועדון
ORGS['club']=('מ','מועדון הים','ניהול · יו״ר המועדון')
out={}
cols=[('רמה','width:130px;'),('מחיר שנתי','width:110px;'),('חברים','width:80px;'),('מה כלול','flex:1;')]
rows=[('<b>כסף</b>','<bdi><b>₪600</b></bdi>','210','כניסה למועדון, אירועים בסיסיים'),('<b>זהב</b>','<bdi><b>₪1,400</b></bdi>','86','הכל בכסף + הטבות ואירוח אורח'),('<b>פלטינה</b>','<bdi><b>₪3,000</b></bdi>','14','הכל בזהב + אירועי VIP')]
t=table('רמות חברות','כל רמה היא מסלול בליבה עם הטבות מהמודול',cols,rows,btn('+ רמה',True))
s=side(panel(h2('שדרוג בין רמות')+swrow('שדרוג באמצע שנה','חיוב הפרש יחסי',True)+swrow('שנמוך לא מוחזר','שינוי נכנס בחידוש הבא',True,True)+note('הרמה מופיעה בכרטיס החבר כתווית וקובעת אילו הטבות ואירועים פתוחים לו.'),pad=16,gap=2))
out['D-ModClubTiers']=page('ד · מודול · רמות חברות','רמות חברות','club',head('רמות חברות','',pk('מועדון')),row(t,s))
cols=[('תאריך','width:90px;'),('אירוע','flex:1;'),('פתוח ל','width:110px;'),('נרשמו','width:110px;'),('מחיר','width:80px;text-align:end;')]
rows=[('24.10','ערב יין וגבינה','זהב ומעלה','38 מתוך 50','<bdi><b>₪120</b></bdi>'),('07.11','הפלגה משפחתית','כולם','61 מתוך 80','<bdi><b>₪90</b></bdi>'),('21.11','גאלה שנתית','פלטינה','9 מתוך 30','<bdi><b>₪350</b></bdi>')]
t=table('אירועים והרשמה','',cols,rows,btn('+ אירוע',True))
s=side(panel(h2('ערב יין וגבינה')+tr([('נרשמו','flex:1;'),('<b>38 מתוך 50</b>','')])+tr([('רשימת המתנה','flex:1;'),('<b>0</b>','')])+tr([('אורח לכל חבר','flex:1;'),('<b>1 (זהב ומעלה)</b>','')],True)+btn('הודעה לנרשמים')+btn('רשימת נוכחות'),pad=16,gap=4))
out['D-ModClubEvents']=page('ד · מודול · אירועים והרשמה','אירועים והרשמה','club',head('אירועים והרשמה','',pk('מועדון')),row(t,s))
cols=[('הטבה','flex:1;'),('ספק','width:140px;'),('רמה','width:100px;'),('תוקף','width:100px;'),('שימושים','width:90px;')]
rows=[('15% בספא','ספא הים','זהב ומעלה','עד 31.12','41'),('ארוחה זוגית במחיר מיוחד','מסעדת המזח','כולם','עד 30.11','73'),('יום שייט חינם','חברת שייט','פלטינה','עד 31.03','5')]
t=table('הטבות','הטבות ספקים לפי רמת חברות',cols,rows,btn('+ הטבה',True))
s=side(panel(h2('איך חבר מממש')+tr([('קוד אישי באפליקציה','flex:1;'),(G('פעיל'),'')])+tr([('סריקה אצל הספק','flex:1;'),(Yl('בקרוב'),'')],True)+note('VERIFY: הסכם עם ספקים ואופן המעקב אחר מימוש. לא נבנה בשלב הראשון.'),pad=16,gap=2))
out['D-ModClubPerks']=page('ד · מודול · הטבות','הטבות','club',head('הטבות','',pk('מועדון')),row(t,s))
for k_,v in out.items(): open(f'/home/claude/project/{k_}.dc.html','w',encoding='utf-8').write(v)
print(list(out))
