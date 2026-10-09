# מריצים אחרון, אחרי strip_subscreen_nav.py ו-patch_notifications.py. אידמפוטנטי.
# 1) מונה כתום על "פניות" בתפריט הצד של הניהול בדסקטופ (4 פניות פתוחות שדורשות מענה)
# 2) באפליקציית הניהול: שורת המשימה "פניות חדשות" מציינת תגובות חדשות מחברים
import glob,re
B='<span aria-label="4 פניות שדורשות מענה" style="margin-inline-start:auto;min-width:20px;height:20px;box-sizing:border-box;padding:0 5px;border-radius:10px;background:#FF5A36;color:#1E1633;border:2px solid #1E1633;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">4</span>'
n=0
for f in glob.glob('/home/claude/project/D-*.dc.html'):
    s=open(f,encoding='utf-8').read()
    if '</svg>פניות</a>' in s and 'פניות שדורשות מענה' not in s:
        s=s.replace('</svg>פניות</a>','</svg>פניות'+B+'</a>'); n+=1
        open(f,'w',encoding='utf-8').write(s)
f='/home/claude/project/D-MAdmHome.dc.html'
s=open(f,encoding='utf-8').read()
if '2 דחופות</span>' in s:
    s=s.replace('2 דחופות</span>','2 דחופות · 1 תגובה חדשה מחבר</span>'); open(f,'w',encoding='utf-8').write(s)
print('badged',n)
