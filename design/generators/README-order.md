# סדר הרצת המחוללים
1. gen_madmin.py (דורס D-MAdmRequests ו-D-MAdmRequestsFilter בגרסה ישנה)
2. gen_filters.py
3. gen_directory.py
4. gen_gaps.py, gen_gaps2.py, gen_gaps3.py (הם טוענים את gen_directory ואת gen_admin)
בדיקת נגישות: python3 a11y_check.py שמות_לוחות (נדרש Playwright).
5. gen_gaps4.py, gen_gaps5.py
6. gen_pay2.py (אם מריצים: חוזרים על שלב 7)
7. strip_subscreen_nav.py (מסיר סרגל תחתון ממסכי משנה, תמיד אחרון)
8. patch_notifications.py (אחרי gen.py: מוסיף פריט תגובת פנייה ל-D-Notifications, מונים 2 ל-3)
9. patch_admin_inquiry_badge.py (תמיד אחרון: מונה "פניות" בתפריט הניהול ובדף הבית של אפליקציית הניהול)
