# Sub-screens (back arrow) have no bottom bar. Run after generators.
import re
P='/home/claude/project/'
for n in 'Access AutoPayList MemberFinance MyMembership MySettings NotifOrg OrgPage PayHistory PayMethods Section WalletArchive WalletDelete'.split():
    f=P+'D-'+n+'.dc.html';s=open(f,encoding='utf-8').read()
    t=re.sub(r'<nav aria-label="ניווט ראשי".*?</nav>','',s,flags=re.S)
    if t!=s: open(f,'w',encoding='utf-8').write(t);print('stripped',n)
