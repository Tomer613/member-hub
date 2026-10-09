# Manager identity: every manager is a member with an account, with a personal color (+ optional photo).
# Shown wherever an action is attributed (replies, notes, log, messages, payments).
MGR={'יוסף לוי':('י','#5EE0C0','מנהל ראשי'),'שרה כהן':('ש','#FF8FB8','גזבר'),'דוד ישראלי':('ד','#7CC4FF','מזכיר'),'מיכה אדלר':('מ','#B9A4FF','דובר'),'אבי בן דוד':('א','#FFD84A','גבאי')}
MPAL=['#5EE0C0','#FF8FB8','#FF9B6B','#7CC4FF','#B9A4FF','#FFD84A','#8FD66B','#FF7A7A']
def mav(n,s=30):
    l,c,_=MGR[n]
    return f'<span class="h" title="{n}" style="width:{s}px;height:{s}px;flex-shrink:0;border-radius:50%;border:2.5px solid #1E1633;background:{c};box-shadow:0 2px 0 #1E1633;display:inline-flex;align-items:center;justify-content:center;font-size:{s*0.45:.0f}px;color:#1E1633;box-sizing:border-box;">{l}</span>'
def tint(n,a=0.35):
    c=MGR[n][1].lstrip('#'); r,g,b=[int(c[k:k+2],16) for k in (0,2,4)]
    return '#%02X%02X%02X'%tuple(round(x*a+255*(1-a)) for x in (r,g,b))
def mname(n): return f'<b>{n}</b>'
def mwho(n,role=True,s=26):
    r=f'<span style="color:#5A4E70;font-size:12.5px;font-weight:700;">· {MGR[n][2]}</span>' if role else ''
    return f'<span style="display:inline-flex;align-items:center;gap:6px;">{mav(n,s)}{mname(n)}{r}</span>'
