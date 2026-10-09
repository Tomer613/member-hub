# Screens with a back arrow, sheets and edit modes have no bottom bar. Run after generators.
import re
P='/home/claude/project/'
OLD='Access AutoPayList MemberFinance MyMembership MySettings NotifOrg OrgPage PayHistory PayMethods Section WalletArchive WalletDelete'
NEW='Badge BadgeBack BadgeFlip BadgeGym BadgeN1 BadgeN1a BadgeN1b BadgeN1c PayOrgSheet QrConsent WalletMove WalletEdit MAdmRequests MAdmRequestsFilter'
for n in (OLD+' '+NEW).split():
    f=P+'D-'+n+'.dc.html';s=open(f,encoding='utf-8').read()
    t=re.sub(r'<nav aria-label="ניווט[^"]*".*?</nav>','',s,flags=re.S)
    if t!=s: open(f,'w',encoding='utf-8').write(t);print('stripped',n)
