# Retention-driven admin screens: closing the organization, members who left.
full=open('/home/claude/gen/gen_gaps.py',encoding='utf-8').read()
exec(full.split("\n# ---- admin\n")[0].split("\nfor k,v in gm.items()")[0])
asrc=open('/home/claude/gen/gen_admin.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
exec(asrc)
def av(t,c='#E3DDFF',s=30): return f'<span class="h" style="width:{s}px;height:{s}px;flex-shrink:0;border-radius:50%;border:2px solid {INK};background:{c};display:inline-flex;align-items:center;justify-content:center;font-size:{s*0.45:.0f}px;color:{INK};">{t}</span>'
def step(n,t,sub,on=False):
    return (f'<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border:2px solid {INK};border-radius:14px;background:{"#FFF6D1" if on else "#fff"};">'
      f'<span style="min-width:30px;height:30px;border-radius:15px;border:2px solid {INK};background:{Y};display:inline-flex;align-items:center;justify-content:center;font-weight:800;">{n}</span>'
      f'<div style="display:flex;flex-direction:column;"><b>{t}</b><span style="font-size:13.5px;font-weight:600;color:{SOFT};">{sub}</span></div></div>')
left=panel(h2('מה קורה כשסוגרים ארגון','אפשר לחזור בכל שלב עד יום המחיקה')
 +step('1','היום','החברים מפסיקים לראות את הארגון. חיובים אוטומטיים מופסקים. אתם מקבלים קובץ של כל החברים.',True)
 +step('2','עד 90 יום','אפשר להפעיל את הארגון מחדש. עד אז המידע נשמר.')
 +step('3','אחרי 90 יום','כל המידע על החברים נמחק. נשארים רק רישומי כספים, קבלות וחשבוניות לפי הדין (עד 7 שנים).')
 +note('קבלות וחשבוניות נשמרות 7 שנים גם אחרי שהארגון נסגר. זה נדרש בחוק.'),extra='flex:1;min-width:0;')
right=panel(h2('סגירת הארגון','ועד בית שדרות הגפן · 128 חברים')
 +f'<div style="display:flex;flex-direction:column;gap:6px;"><b>1. ייצוא החברים</b><span style="font-size:13.5px;font-weight:600;color:{SOFT};">קובץ עם כל החברים, התשלומים והקבלות. הקישור תקף 7 ימים.</span><div>{btn("ייצוא החברים")}</div></div>'
 +fld('כדי לאשר, כתבו את שם הארגון','ועד בית שדרות הגפן','',46,True)
 +f'<div style="display:flex;gap:10px;align-items:center;"><span style="flex:1;"></span>{btn("ביטול")}{btn("סגירת הארגון",danger=True)}</div>'
 +note('הסגירה לא מוחקת כלום ביום הראשון. המחיקה תתבצע רק אחרי 90 יום, ואפשר לבטל עד אז.',True),extra='width:420px;flex-shrink:0;')
open(P_+'D-AdmOrgClose.dc.html','w',encoding='utf-8').write(shell('ד · סגירת הארגון','הגדרות הארגון',head('סגירת הארגון','',btn('חזרה להגדרות'))+f'<section style="flex:1;min-height:0;display:flex;gap:14px;">{left}{right}</section>'))
# members who left
cols=[('חבר/ה','width:210px;'),('עזב/ה','width:120px;'),('הפרטים יימחקו ב','width:150px;'),('סיבה','width:170px;'),('פעולה','width:300px;')]
rws=[('אורי פרידמן','לפני חודש','בעוד 11 חודשים','עזב בעצמו','#CFF0FC'),('מיכל ברק','לפני 4 חודשים','בעוד 8 חודשים','הוסר על ידי ההנהלה','#FFD9E8'),('יוסי שמש','לפני 10 חודשים','בעוד חודשיים','עזב בעצמו','#D7F5E8'),('נועה אביב','לפני שנה','נמחקו','הוסרה על ידי ההנהלה','#E3DDFF')]
t=th(cols)
for i,(n,w,d,r,c) in enumerate(rws):
    gone=d=='נמחקו'
    act=pill('הפרטים נמחקו','#EDE6D6') if gone else btn('החזרת חבר')+' '+btn('מחיקה עכשיו',danger=True)
    t+=tr([(f'<div style="display:flex;gap:10px;align-items:center;">{av(n[0],c)}<b>{n}</b></div>',cols[0][1]),(w,cols[1][1]),(d if not gone else '—',cols[2][1]),(r,cols[3][1]),(act,cols[4][1])],i==len(rws)-1)
body=panel(f'<div style="display:flex;gap:8px;align-items:center;">{pill("פעילים · 128","#fff")}{pill("עזבו · 4",Y)}{pill("ממתינים · 9","#fff")}</div>'
 +h2('חברים שעזבו','פרטיהם האישיים נשמרים 12 חודשים ואז נמחקים. רישומי כספים נשארים לפי הדין.')+t
 +note('אפשר להחזיר חבר שעזב בתוך 12 חודשים. אחרי המחיקה הוא יצטרף מחדש כחבר חדש, בלי ההיסטוריה.'),extra='flex:1;min-width:0;')
open(P_+'D-AdmMembersLeft.dc.html','w',encoding='utf-8').write(shell('ד · חברים שעזבו','חברים',head('חברים','',btn('ייצוא'))+f'<section style="flex:1;min-height:0;display:flex;">{body}</section>'))
print('ok gaps3')
