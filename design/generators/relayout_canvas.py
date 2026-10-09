import json
c=json.load(open('/home/claude/_live/project/canvas.json'))
B=c['boards']
S=lambda *ns:[n+'.dc.html' for n in ns]
rows=[
('U1','אפליקציית חבר · 1 · כניסה, הרשמה והצטרפות',S('D-Welcome','D-Verify','D-VerifyError','D-Profile','D-Join','D-JoinRequest','D-JoinSent','D-InviteAccept')),
('U2','אפליקציית חבר · 2 · ארנק וכרטיס חברות',S('D-Wallet','D-WalletEmpty','D-Badge','D-BadgeGym','D-BadgeBack','D-BadgeFlip','D-WalletEdit','D-WalletMove','D-WalletArchive','D-WalletDelete')),
('U3','אפליקציית חבר · 3 · חיפוש וגילוי ארגונים',S('D-Search','D-SearchResults','D-SearchDiscover','D-OrgPage','D-SearchEmpty')),
('U4','אפליקציית חבר · 4 · קודים, סריקה ובקשות צירוף',S('D-QrScan','D-QrMyCode','D-QrConsent','D-QrInviteFriend','D-Invites','D-InvitesFilter')),
('U5','אפליקציית חבר · 5 · בתוך הארגון: הודעות, מדריך חברים ומנוי',S('D-Notifications','D-NotificationsDone','D-NotifOrg','D-Channel','D-ChannelReact','D-DirNotice','D-DirSetup','D-Directory','D-DirPerson','D-Section','D-MemberFinance','D-MyMembership')),
('U6','אפליקציית חבר · 6 · תשלומים',S('D-PayMethods','D-PayOrgSheet','D-PayAddCard','D-PayCharge','D-PaySuccess','D-PayFailed','D-PayReceipt','D-PayHistory','D-AutoPay','D-PayManual','D-PayManualSent','D-PlanChange','D-CancelMember')),
('U7','אפליקציית חבר · 7 · חשבון, הגדרות ונגישות',S('D-MySettings','D-Access','D-LoginMethods','D-ChangePhone','D-ChangePhone2','D-LostPhone','D-DataExport','D-DeleteAccount')),
('M1','אפליקציית ניהול (מובייל) · כל המסכים',S('D-MAdmHome','D-MAdmRequests','D-MAdmRequestsFilter','D-MAdmScan','D-MAdmAddMember','D-MAdmInvite','D-MAdmMember','D-MAdmPayRecord','D-MAdmMessage','D-AutoPayList')),
('D1','ניהול דסקטופ · 1 · יומיומי: סקירה, חברים, בקשות, הודעות ופניות',S('D-AdmOverview','D-Admin','D-AdmRequests','D-AdmMember','D-AdmMessage','D-AdmMessages','D-AdmInquiries','D-AdmActivities','D-AdmReports')),
('D2','ניהול דסקטופ · 2 · הצטרפות, ייבוא ומדריך חברים',S('D-AdmJoinQr','D-AdmAddMember','D-AdmImport1','D-AdmImport2','D-AdmImport3','D-AdmDirectory','D-AdmLabels','D-AdmRoles')),
('D3','ניהול דסקטופ · 3 · כספים וגבייה',S('D-AdmKupa','D-AdmCharge')),
('D4','ניהול דסקטופ · 4 · הקמת ארגון והגדרות',S('D-AdmWizard1','D-AdmWizard2','D-AdmWizard3','D-AdmWizard4','D-AdmWizard5','D-Settings','D-AdmOrgSettings','D-AdmPublicPage','D-AdmAppearance','D-AdmAccount','D-AdmTypes','D-AdmModules')),
('D5','ניהול דסקטופ · 5 · מודולים לפי סוג ארגון',S('D-ModSynSchedule','D-ModSynDonations','D-ModSynYahrzeit','D-ModHoaExpenses','D-ModHoaIssues','D-ModHoaMeetings','D-ModGymAccess','D-ModGymClasses','D-ModGymFreeze','D-ModClubTiers','D-ModClubEvents','D-ModClubPerks')),
]
arch=[
('X0','בצד · ספרייה והשוואות (לייחוס בלבד)',S('D-Components','D-Labels','D-HighContrast','D-Brand','D-BrandB','D-BrandLogo')),
('X1','בצד · ניסויי כרטיס וארנק (לא פעיל)',S('D-WalletN1','D-BadgeN1','D-BadgeN1a','D-BadgeN1b','D-BadgeN1c','D-PayChargeN','D-PaySuccessN','D-PayReceiptN')),
('XA','בצד · סבב קודם · כיוון א · כנס',S('A-Wallet','A-Badge','A-Mobile','Main')),
('XB','בצד · סבב קודם · כיוון ב · VIP',S('B-Wallet','B-Badge','B-Mobile','B-Desktop')),
('XC','בצד · סבב קודם · כיוון ג · פסטיבל',S('C-Wallet','C-Badge','C-Mobile','C-Desktop')),
]
used=[n for _,_,l in rows+arch for n in l]
assert len(used)==len(set(used)),[n for n in used if used.count(n)>1]
missing=set(B)-set(used); extra=set(used)-set(B)
assert not missing and not extra,(missing,extra)
notes={}; order=[]
y=0
def place(rs,y,gapfirst=0):
    for key,title,lst in rs:
        top=y+130
        x=0; mh=0
        for n in lst:
            v=B[n]; v['x']=x; v['y']=top; x+=v['w']+80; mh=max(mh,v['h']); order.append(n)
        notes['title-'+key.lower()]={'kind':'title1','maxW':max(x-80,860),'text':title,'w':240,'x':0,'y':y}
        y=top+mh+230
    return y
y=place(rows,0)
y+=700
notes['title-archive']={'kind':'title1','maxW':4000,'text':'—— למטה: מה שבצד. סבבים קודמים, ניסויים והשוואות. לא עובדים מכאן ——','w':240,'x':0,'y':y}
y+=200
y=place(arch,y)
c['boards']=B; c['order']=order; c['notes']=notes
json.dump(c,open('/home/claude/project/canvas.json','w'),ensure_ascii=False,indent=1)
print(len(order),y)
