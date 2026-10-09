# סדר הרצת המחוללים
1. gen.py ואז patch_notifications.py (פריט תגובת פנייה ב-D-Notifications, מונים 2 ל-3)
2. gen_madmin.py (דורס D-MAdmRequests ו-D-MAdmRequestsFilter בגרסה ישנה)
3. gen_filters.py
4. gen_directory.py
5. gen_gaps.py עד gen_gaps6.py לפי הסדר (הם טוענים זה את זה ואת gen_admin). gen_gaps6 מייצר את תחומי האחריות ומשכתב את D-AdmRoles
6. gen_pay2.py
6.5 gen_gaps7.py (זהות מנהלים: D-AdmAddManager ושיוך פניות; משתמש ב-mgr_identity.py, שנטען גם ע"י gen_gaps6.py)
7. strip_subscreen_nav.py (מסיר סרגל תחתון ממסכי משנה, כרטיס חבר, חלונות תחתונים ומצבי עריכה)
8. patch_admin_inquiry_badge.py (אחרון: מונה "פניות" בתפריט הניהול ובדף הבית של אפליקציית הניהול)

אחרי כל הרצה של שלב 5 או 6 חוזרים על שלבים 7 ו-8.
בדיקת נגישות: python3 a11y_check.py שמות_לוחות (נדרש Playwright).
9. patch_admin_identity.py (אחרון: "מחובר כ" עם אווטר בתפריט הצד)
