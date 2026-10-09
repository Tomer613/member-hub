## נספח: ישויות חדשות (אוקטובר 2026)
מפרט בלבד, בלי קוד. שמות השדות אינם סופיים.

| ישות | שדות עיקריים | כללים |
|---|---|---|
| קוד פרופיל משתמש | user_id, code (ייחודי, קבוע) | אפשר לשתף. אין רוטציה |
| קוד פרופיל ארגון | org_id, code, join_mode (request/open), paused, regenerated_at | הנפקה מחדש מבטלת את הישן. השהיה חוסמת צירוף |
| אסימון אישור חברות | membership_id, signature, issued_at, ttl | מתחלף כל כמה שניות. נבדק בשרת. לא נשמר |
| הזמנה אישית | invite_id, org_id, phone, token, created_at, expires_at (14 ימים), status (sent/approved/expired/revoked) | קשורה לטלפון. אישור בלחיצה אחת יוצר חברות מיד |
| בקשת צירוף | org_id, user_id, source (admin/import/invite), status | יוזמת ההנהלה |
| בקשת הצטרפות | org_id, user_id, source (profile_code/banner/friend), status (pending/approved/declined), decided_by, decided_at, declined_at | יוזמת המשתמש. סינון: קשר, הוזמן על ידי חבר, מקור |
| אצווה ייבוא | batch_id, org_id, file, row_count | שורות: row_no, name, phone, state (invited/not_invited/to_fix), error_reason |
| הופעה במדריך | membership_id, appears (bool), display_name, shown_fields (מערך) | ברירת מחדל: לא מופיע. שם מוצג ברירת מחדל = שם הפרופיל. שדות מותרים נקבעים בארגון (org.directory_allowed_fields) |
| הגדרת ארגון: מדריך | org_id, directory_open, directory_allowed_fields | אי אפשר לחייב חבר להופיע. אי אפשר לדעת מי בחר לא להופיע |
| הודעה | message_id, org_id, author_admin_id, title, body, audience (all/one/filter), recipient_ids, allow_dislike, sent_at, scheduled_at | חד כיווני. הודעה אישית מסומנת |
| קריאת הודעה | message_id, membership_id, read_at | ההנהלה רואה שמות. חברים אינם רואים |
| תגובה | message_id, membership_id, kind (heart/trophy/like/dislike/laugh/ok), created_at | תגובה אחת לחבר להודעה. החלפה מותרת. ללא טקסט. חברים רואים ספירה בלבד |
| פנייה על הודעה | message_id, membership_id, reasons, free_text | נוצרת מ"לא אהבתי: רוצים לספר למה?". לא חובה. נראית להנהלה בלבד, בשם החבר |
| הגדרות חברות | membership_id, notify_messages, notify_payments, notify_inquiries | חלות על הארגון הזה בלבד |

### נקודות לאכיפה בשרת
- אסימון חברות וקוד פרופיל ארגון הם דברים שונים. לא להשתמש באחד במקום השני.
- ספירות תגובה נחשבות בשרת. שמות לא נשלחים ללקוח של חבר.
- תגובת "לא אהבתי" אפשרית רק אם allow_dislike.
- בעזיבת ארגון: חובות וחשבוניות נשמרים. הופעה במדריך נמחקת.
- בקשת הצטרפות שנדחתה: המתנה לפני בקשה חדשה? (שאלה פתוחה, ראו להלן)

### נוספו אחרי החלטות השמירה והמסכים החדשים
| ישות | שדות עיקריים | כללים |
|---|---|---|
| הערה על חבר | note_id, membership_id, author_admin_id, body, visibility (admins), created_at | לא מוצגת לחבר באפליקציה. מתועדת בשם הכותב. נמחקת עם פרטי החבר. שאלת עיון פתוחה (C5) |
| פנייה | inquiry_id, membership_id, kind, source_message_id (אופציונלי), status (new/in_progress/answered/closed), closed_at, closed_by (member/admin/auto) | נוצרת מ"פנייה חדשה" או מ"להשיב בפנייה" או מ"לא אהבתי". סגורה: נמחקת אחרי 2 שנים |
| חבר שעזב | membership.left_at, left_reason (self/removed), purge_at = left_at + 12 חודשים | אחרי purge_at נמחקים הפרטים האישיים. רישומי כספים נשארים. החזרה מותרת לפני purge_at |
| סגירת ארגון | org.closed_at, org.purge_at = closed_at + 90 יום, export_requested_at | ביום הסגירה: מפסיקים חיובים אוטומטיים, מוסתר מהחברים. הפעלה מחדש מותרת עד purge_at. אחרי: מחיקת כל המידע חוץ מכספים |
| שמירת רישומי כספים | receipt.retain_until = תאריך + 7 שנים | אחרי התאריך נמחק או מושמט מידע מזהה. VERIFY |
| שמירת הודעות | message.retain_until = sent_at + 3 שנים, reaction/read נמחקים איתה | |

הערה: מחיקת חשבון על ידי החבר עצמו (30 יום) נפרדת מעזיבת ארגון (12 חודשים). הראשונה על רצון החבר, והשנייה זמן טיפול בחובות וחזרה.

| תגובה בפנייה | inquiry_message_id, inquiry_id, author_type (member/admin), author_id, body, created_at | שרשור כמו Issues. אפשר להגיב עד הסגירה. הודעה ראשונה היא גוף הפנייה. נמחקת עם הפנייה (שנתיים אחרי הסגירה) |

### פניות: מספר, הפניה והתראות (אוקטובר 2026)
| ישות / שדה | פירוט | כללים |
|---|---|---|
| inquiry.number | מספר רץ לארגון (#1042) | מוצג לחבר ולהנהלה. ייחודי בתוך הארגון. לא ממוחזר |
| inquiry.related_inquiry_id | הפניה אופציונלית לפנייה קודמת (בדרך כלל סגורה) | נוצרת מהכפתור "פנייה חדשה בהמשך ל-#..." או משדה "בהמשך לפנייה קודמת". לא מחייבת שהפנייה הקודמת קיימת בארגון אחר. פנייה סגורה לא נפתחת מחדש: closed_at קבוע, והשרת דוחה תגובה חדשה |
| inquiry.closed_by | member / admin / auto | auto: 14 ימים בלי תגובה אחרי מענה |
| notification | notification_id, recipient_type (member/admin), recipient_id, org_id, kind (inquiry_reply, ...), ref_id, needs_action (bool), created_at, read_at | הפריט בהודעות של החבר עם "דורש טיפול". נוצר בכל תגובה בפנייה לצד השני. needs_action נסגר כשהנמען קורא או מגיב |
| notification_delivery | notification_id, channel (bell/push/email), sent_at | פעמון תמיד. דחיפה ברירת מחדל לחבר, כבוי לפי הגדרות החברות (notify_inquiries). ערוצי ההנהלה פתוחים לשאלה |
| מונה פניות בניהול | נגזר: פניות פתוחות שהתגובה האחרונה בהן של חבר או שהן חדשות | מוצג על "פניות" בתפריט ובשורת המשימות של אפליקציית הניהול |

### תחומי אחריות והתראות למנהלים (אוקטובר 2026)
| ישות | שדות עיקריים | כללים |
|---|---|---|
| הרשאת מנהל בתחום | membership_id (המנהל), area (members, join_requests, inquiries, messages, finance, treasury, activities, reports, module:<key>), can_read, can_write, can_notify | can_write ו-can_notify דורשים can_read. נאכף בשרת, לא רק בממשק. מנהל ראשי: כל התחומים, לא ניתן לצמצם. הגדרות הארגון וצוות והרשאות נשארות לתפקיד מנהל ראשי |
| תבנית תפקיד | key (treasurer, spokesperson, gabbai, secretary, empty), permissions | נקודת פתיחה בלבד. אין קשר חי אחרי יצירה |
| העדפת התראה של מנהל | membership_id, push, email, daily_digest, muted_until, hidden_areas | חלה על התחומים שבהם can_notify. הסתרת תחום מסתירה גם מתפריט וממונים |
| ניתוב התראה | נגזר: נמענים = מנהלים עם can_notify בתחום. ריק: המנהל הראשי | כל התראה נרשמת ב-notification (ראו פניות) |

## זהות מנהלים (9.10.2026)

- תפקיד מנהל דורש `membership` פעיל וגם `user`. אי אפשר ליצור מנהל בלי שניהם.
- שדה `color` (hex) על שיוך המנהל לארגון, ייחודי בתוך הארגון. שדה `avatar_mode`: letter או photo. תמונה מוצגת רק עם הסכמה.
- הזמנת מנהל: שני צדדים. הבקשה נשלחת לחבר, התפקיד פעיל רק אחרי אישורו. הוספה דורשת גם אישור מנהל ראשי נוסף.
- כל תשובה, הערה ופעולה נשמרות עם `actor_manager_id`. לפנייה שדה `handler_manager_id` (ריק: המנהל הראשי).
- יומן הפעולות כולל אירועי הרשאות: מי, למי, תחום, הרשאה, ערך קודם וחדש.

