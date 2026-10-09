# "Clean card" metaphor experiment: duplicates of existing boards WITHOUT the slot and the side punch notches (lanyard kept).
# Originals are NOT touched. Writes D-BadgeN1, D-BadgeN2, D-WalletN1, D-PayChargeN, D-PaySuccessN, D-PayReceiptN.
import re
P='/home/claude/project/'
def rd(n): return open(P+n+'.dc.html',encoding='utf-8').read()
def wr(n,s): open(P+n+'.dc.html','w',encoding='utf-8').write(s)
def strip_festival(s):
    s=re.sub(r'<span style="position: relative; width: 46px; height: 12px;[^>]*></span>\n*','',s,count=1)  # slot
    s=re.sub(r'<span style="position: absolute; top: 138px; (?:right|left): -13px;[^>]*></span>\n*','',s)  # side punch circles
    return s
# --- badge N1: clean vertical card
b=strip_festival(rd('D-Badge'))
b=b.replace('<title>ד · כרטיס חברות</title>','<title>ד · כרטיס חברות · רצועה בלי חריץ וניקוב (ניסוי)</title>').replace('margin-top: 84px;','margin-top: 84px;').replace('padding: 12px 20px 0; background: var(--org)','padding: 22px 20px 0; background: var(--org)')
wr('D-BadgeN1',b)
# --- wallet N1: stacked cards without side punch notches
w=rd('D-Wallet')
w=re.sub(r'<span aria-hidden="true" style="position: absolute; (?:left|right): -2px; top: 61px;[^>]*></span>\n*','',w)
w=w.replace('<title>','<title>',1)
w=re.sub(r'<title>(.*?)</title>',lambda m:'<title>'+m.group(1)+' · נקי (ניסוי)</title>',w,count=1)
wr('D-WalletN1',w)
# --- payment screens: ticket() without punch notches
g=open('/home/claude/gen/gen_pay.py',encoding='utf-8').read().split("for k,v in out.items()")[0]
g=re.sub(r'<span aria-hidden="true" style="\{n\}left:-2px;[^>]*></span><span aria-hidden="true" style="\{n\}right:-2px;[^>]*></span>','',g)
ns={}
exec(g,ns)
for k in ['D-PayCharge','D-PaySuccess','D-PayReceipt']:
    v=ns['out'][k]
    v=re.sub(r'<title>(.*?)</title>',lambda m:'<title>'+m.group(1)+' · נקי (ניסוי)</title>',v,count=1)
    wr(k+'N',v)
print('ok')
