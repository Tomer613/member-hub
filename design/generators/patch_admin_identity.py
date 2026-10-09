# מריצים אחרי patch_admin_inquiry_badge.py. אידמפוטנטי.
# בתפריט הצד של הניהול: "מחובר כ" עם אווטר בצבע האישי של המנהל המחובר.
import glob
O='<span style="font-size:12px;font-weight:700;opacity:.85;">ניהול · גבאי ראשי</span>'
N=('<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;opacity:.95;">'
   '<span class="h" aria-hidden="true" style="width:18px;height:18px;border-radius:50%;background:#5EE0C0;border:2px solid #fff;box-sizing:border-box;color:#1E1633;display:inline-flex;align-items:center;justify-content:center;font-size:9px;">י</span>יוסף לוי · מנהל ראשי</span>')
n=0
for f in glob.glob('/home/claude/project/D-*.dc.html'):
    s=open(f,encoding='utf-8').read()
    if O in s:
        open(f,'w',encoding='utf-8').write(s.replace(O,N)); n+=1
print('identity',n)
