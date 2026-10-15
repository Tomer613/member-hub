// Public home page (logged-out showcase): brand promise, entry buttons, and sections for members and admins.
// Approved design: design/landing/showcase.html (keep both in sync until this page fully replaces it).
// Copy is a draft; the product name PIRI is not final. Entry buttons open the sign-in flow inside the side panel
// (entry-panel.tsx); footer links go to the short pages in src/app/(info).
import type { CSSProperties } from "react";
import Link from "next/link";
import EntryPanel from "./entry-panel";
import InstallButton from "./install-button";
import LangButton from "./lang-button";
import LandingEffects from "./landing-effects-client";
import "./landing.css";

const BRAND = "PIRI";
const CUE = "רוצים לראות מה עוד יש כאן?";

export default function Landing() {
    return (
        <div className="lp" id="lp-root" dir="rtl" lang="he">
            <div className="doodles" id="doodles" aria-hidden="true"></div>
            <div className="split" dir="rtl" lang="he">
            <div className="showcol">
            <header className="top">
                <bdi className="brand">PIRI</bdi>
                <LangButton />
              </header>
            <main className="show">
                  <section className="hero" id="hero">
                    <div className="minis" id="minis" aria-hidden="true"></div>
                    <div className="htext"><h1><span className="l">כל החברויות שלך</span><span className="l">בארנק אחד</span></h1>
                    <p className="lead">ועד הבית, בית הכנסת, חדר הכושר והמועדון. כרטיס חבר, תשלומים והודעות, במקום אחד.</p></div>
                    <div className="cards" aria-hidden="true">
                      <div className="bc c1"><div className="hd"><span className="av">ב</span><span className="nm">בית כנסת אוהל משה</span><span className="st">חבר</span></div><div className="ft">דמי חבר לשנה שולמו</div></div>
                      <div className="bc c2"><div className="hd"><span className="av">ו</span><span className="nm">ועד הבית הרצל 12</span><span className="st">דירה 7</span></div><div className="ft">התשלום הבא ב־1 בחודש</div></div>
                      <div className="bc c3"><div className="hd"><span className="av">כ</span><span className="nm">חובבי החתולים בצפון</span><span className="st">חדש</span></div><div className="ft">מפגש קהילה ביום שישי</div></div>
                    </div>
                    <a href="#members" className="cue"><span className="txt">{Array.from(CUE).map((ch, i) => <span key={i} className="ch" style={{ "--i": i } as CSSProperties}>{ch}</span>)}</span><span className="ball"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span></a>
                  </section>

                  <section className="s-mem" id="members">
                    <h2>לחברים</h2>
                    <div className="feats">
                      <div className="feat" style={{ "--c": "var(--violet)" } as CSSProperties}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/></svg></span><b>כרטיס חבר בכיס</b><span>מראים את הכרטיס בכניסה, בלי לחפש.</span></div>
                      <div className="feat" style={{ "--c": "var(--teal)" } as CSSProperties}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12l4 4 10-10"/></svg></span><b>משלמים בלחיצה</b><span>רואים מה שולם ומה פתוח, עם קבלה לכל תשלום.</span></div>
                      <div className="feat" style={{ "--c": "var(--orange)" } as CSSProperties}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></span><b>כל ההודעות במקום אחד</b><span>במקום עשר קבוצות וואטסאפ.</span></div>
                    </div>
                  </section>

                  <section className="s-adm">
                    <h2>למנהלים</h2>
                    <div className="feats">
                      <div className="feat" style={{ "--c": "var(--pink)" } as CSSProperties}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3v18M7 8h7a3 3 0 0 1 0 6H8"/></svg></span><b>גבייה בלי מרדפים</b><span>חיובים קבועים ותזכורות שיוצאות לבד.</span></div>
                      <div className="feat" style={{ "--c": "var(--teal)" } as CSSProperties}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M21 20c0-2-1-4-4-5"/></svg></span><b>רשימת חברים מסודרת</b><span>מי חבר, מי משלם, ומי מתגורר איפה.</span></div>
                      <div className="feat" style={{ "--c": "var(--violet)" } as CSSProperties}><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg></span><b>הודעה לכולם בשנייה</b><span>ולראות מי קרא.</span></div>
                    </div>
                  </section>

                  <section className="s-typ">
                    <h2>מתאים ל</h2>
                    <div className="types"><span className="chip" tabIndex={0}>ועד בית<span className="more">גבייה, תקלות ואסיפות</span></span><span className="chip" tabIndex={0}>בית כנסת וקהילה<span className="more">תרומות וזמני תפילה</span></span><span className="chip" tabIndex={0}>חדר כושר<span className="more">מנויים וכניסה בקוד</span></span><span className="chip" tabIndex={0}>מועדון ותחביב<span className="more">מפגשים והטבות</span></span><span className="chip" tabIndex={0}>חגיגה ואירוע<span className="more">אישורי הגעה ומתנה משותפת</span></span><span className="chip" tabIndex={0}>ועוד<span className="more">כל ארגון עם חברים</span></span></div>
                  </section>
                </main>
            </div>
            <aside className="entry" aria-label="כניסה והצטרפות"><div className="entry-in"><EntryPanel /><p className="draft">טיוטה לבדיקה. השם והטקסטים זמניים.</p></div></aside>
            </div>
            <div className="more" dir="rtl" lang="he">

            <section className="band flip sec-dark" id="how">
              <div className="b-main">
                <div className="b-in">
                  <span className="eyebrow rv">איך זה עובד</span>
                  <h2 className="big rv" style={{ "--d": ".08s" } as CSSProperties}>שלושה צעדים, וכל החברויות אצלכם</h2>
                  <ol className="steps">
                    <li className="rv" style={{ "--d": ".15s" } as CSSProperties} data-s="1"><span className="n">1</span><div><b>מצטרפים</b><span>מקבלים הזמנה מהארגון, או מוצאים קהילה חדשה בחיפוש.</span></div></li>
                    <li className="rv" style={{ "--d": ".3s" } as CSSProperties} data-s="2"><span className="n">2</span><div><b>מקבלים כרטיס חבר</b><span>הכרטיס נכנס לארנק, ומראים אותו בכניסה בלחיצה אחת.</span></div></li>
                    <li className="rv" style={{ "--d": ".45s" } as CSSProperties} data-s="3"><span className="n">3</span><div><b>משלמים ומתעדכנים</b><span>דמי חבר, קבלות והודעות מהארגון, הכול במקום אחד.</span></div></li>
                  </ol>
                  <Link href="/login?intent=join" data-start="join" className="btn pri inline">להצטרף לארגון</Link>
                </div>
              </div>
              <div className="b-side side-violet">
                <div className="phone" id="howPhone" aria-hidden="true">
                  <div className="ph-top"><span>הארנק שלי</span><span className="ph-dot"></span></div>
                  <div className="ph-cards">
                    <div className="pc" style={{ "--c": "var(--violet)" } as CSSProperties}><span className="pav">ב</span><span className="pnm">בית כנסת אוהל משה</span></div>
                    <div className="pc" style={{ "--c": "var(--teal)" } as CSSProperties}><span className="pav">ו</span><span className="pnm">ועד הבית הרצל 12</span></div>
                    <div className="pc" style={{ "--c": "var(--orange)" } as CSSProperties}><span className="pav">כ</span><span className="pnm">חובבי החתולים בצפון</span></div>
                    <div className="pc new out" style={{ "--c": "var(--pink)" } as CSSProperties}><span className="pav">י</span><span className="pnm">יוגה בפארק</span></div>
                  </div>
                  <div className="ph-pay"><span className="due-t"><span>התשלום הבא</span><b>180 ₪ ב־1 בנובמבר</b></span><span className="paid"><span>שולם, תודה!</span><b>180 ₪ · קבלה נשלחה</b></span><span className="stamp">✓</span></div>
                </div>
              </div>
            </section>

            <section className="band sec-light" id="trust">
              <div className="b-main">
                <div className="b-in">
                  <span className="eyebrow rv">ביטחון ופרטיות</span>
                  <h2 className="big rv" style={{ "--d": ".08s" } as CSSProperties}>הכסף והמידע שלכם בידיים טובות</h2>
                  <div className="trust">
                    <div className="tr rv" style={{ "--d": "0.22s" } as CSSProperties}><span className="ti"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span><b>לא נוגעים בכרטיס האשראי</b><span>התשלום עובר דרך חברת סליקה מורשית. אנחנו לא שומרים את פרטי הכרטיס.</span></div>
                    <div className="tr rv" style={{ "--d": "0.34s" } as CSSProperties}><span className="ti"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg></span><b>כל ארגון רואה רק מה שאישרתם</b><span>אתם מחליטים אילו פרטים כל ארגון מקבל, ואפשר לשנות בכל רגע.</span></div>
                    <div className="tr rv" style={{ "--d": "0.46s" } as CSSProperties}><span className="ti"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M10 17h4"/></svg></span><b>בלי סיסמאות</b><span>נכנסים עם קוד חד־פעמי לטלפון או למייל, ורואים את כל המכשירים המחוברים.</span></div>
                    <div className="tr rv" style={{ "--d": "0.58s" } as CSSProperties}><span className="ti"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg></span><b>המידע שלכם, בשליטתכם</b><span>אפשר להוריד עותק של המידע או למחוק את החשבון.</span></div>
                  </div>
                  <p className="verify">טיוטה: נוסחי האבטחה והתשלום יאומתו מול ספק הסליקה ומבחינה משפטית לפני פרסום.</p>
                </div>
              </div>
              <div className="b-side side-teal">
                <div className="lockart open" id="lock" role="button" tabIndex={0} aria-label="מנעול"><span className="ring"></span>
                  <svg viewBox="0 0 120 140"><rect x="14" y="58" width="92" height="72" rx="16" fill="var(--white)" stroke="var(--ink)" strokeWidth="5"/><g className="shk"><path d="M34 58V40a26 26 0 0 1 52 0v18" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round"/></g><circle cx="60" cy="90" r="9" fill="var(--ink)"/><path d="M60 98v14" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round"/></svg>
                </div>
                <p className="side-note">נבנה כך שגם אנחנו לא רואים את פרטי האשראי שלכם.</p>
                <div className="stds"><span className="std" tabIndex={0} data-tip="תקן האבטחה של חברות האשראי. פרטי הכרטיס לא נשמרים אצלנו">PCI DSS</span><span className="std" tabIndex={0} data-tip="כל מה שעובר בין המכשיר שלכם לשרת מוצפן בדרך">TLS 1.3</span><span className="std" tabIndex={0} data-tip="המידע ששמור אצלנו מוצפן, גם על הדיסק">AES-256</span></div>
                <p className="std-cap" aria-live="polite"><span>אותם תקני אבטחה שעליהם סומכים הבנקים וחברות האשראי.</span></p>
                <div className="stream" id="stream" aria-hidden="true"></div>
              </div>
            </section>

            <section className="band flip sec-beige" id="admins">
              <div className="b-main">
                <div className="b-in">
                  <span className="eyebrow rv">למנהלים</span>
                  <h2 className="big rv" style={{ "--d": ".08s" } as CSSProperties}>פחות אקסלים, פחות מרדפים אחרי תשלומים</h2>
                  <div className="browser rv" style={{ "--d": ".15s" } as CSSProperties} aria-hidden="true">
                    <div className="br-bar"><span></span><span></span><span></span><i>ניהול · ועד הבית הרצל 12</i></div>
                    <div className="br-body">
                      <aside className="br-side"><b>הרצל 12</b><span className="on">סקירה</span><span>חשבונות</span><span>חיובים</span><span>הודעות</span><span>דוחות</span></aside>
                      <div className="br-main">
                        <div className="view cur" data-v="0"><div className="rows">
                          <div className="row"><span>דירה 3 · משפחת לוי</span><em className="ok">שולם</em></div>
                          <div className="row"><span>דירה 7 · דנה כהן</span><em className="ok">שולם</em></div>
                          <div className="row" id="row11"><span>דירה 11 · משפחת אזולאי</span><em className="due">תזכורת נשלחה</em></div>
                          <div className="row"><span>דירה 14 · יוסי מזרחי</span><em className="ok">שולם</em></div>
                          <div className="row"><span>דירה 18 · רונית ושי</span><em className="ok">שולם</em></div>
                        </div></div>
                        <div className="view" data-v="1"><div className="vhead"><span>חשבונות</span><em className="tag">24 דירות</em></div><div className="rows">
                          <div className="row"><span>דירה 3 · משפחת לוי<small>4 חברים · משלם: אבי</small></span><em className="tag">בעלים</em></div>
                          <div className="row"><span>דירה 7 · דנה כהן<small>חברה אחת · משלמת: דנה</small></span><em className="tag vio">שוכרת</em></div>
                          <div className="row"><span>דירה 11 · משפחת אזולאי<small>3 חברים · משלמת: מירי</small></span><em className="tag">בעלים</em></div>
                          <div className="row"><span>דירה 14 · יוסי מזרחי<small>2 חברים · משלם: יוסי</small></span><em className="tag vio">שוכר</em></div>
                        </div></div>
                        <div className="view" data-v="2"><div className="vhead"><span>חיובים</span><em className="tag sun">גבייה אוטומטית פעילה</em></div><div className="rows">
                          <div className="row"><span>דמי ועד, נובמבר<small>1 בנובמבר · 24 דירות</small></span><em className="tag sun">מתוזמן</em></div>
                          <div className="row"><span>תיקון המעלית<small>חיוב חד־פעמי · 350 ₪ לדירה</small></span><em className="tag vio">ממתין לאישור</em></div>
                          <div className="row"><span>דמי ועד, אוקטובר<small>נגבו 4,280 ₪ מתוך 5,600 ₪</small></span><em className="due">5 פתוחים</em></div>
                          <div className="row"><span>דמי ועד, ספטמבר<small>נגבו 5,600 ₪</small></span><em className="ok">הושלם</em></div>
                        </div></div>
                        <div className="view" data-v="3"><div className="vhead"><span>הודעות</span><em className="tag sun">הודעה חדשה +</em></div><div className="rows">
                          <div className="row"><span>ניקיון חדר המדרגות<small>נשלחה לכל הדיירים · אתמול</small></span><em className="tag">21 מתוך 24 קראו</em></div>
                          <div className="row"><span>הפסקת מים ביום שלישי<small>נשלחה לכל הדיירים · לפני שבוע</small></span><em className="ok">כולם קראו</em></div>
                          <div className="row"><span>אסיפת דיירים<small>נשלחה לבעלי הדירות · לפני שבועיים</small></span><em className="tag">12 מתוך 14 קראו</em></div>
                          <div className="row"><span>תודה על הגינה החדשה<small>נשלחה לכל הדיירים · לפני חודש</small></span><em className="ok">כולם קראו</em></div>
                        </div></div>
                        <div className="view" data-v="4"><div className="vhead"><span>גבייה לפי חודש</span><em className="tag">2026</em></div>
                          <div className="chart"><div><b style={{ "--h": "92%", "--i": 0 } as CSSProperties}></b>מאי</div><div><b style={{ "--h": "100%", "--i": 1 } as CSSProperties}></b>יוני</div><div><b style={{ "--h": "96%", "--i": 2 } as CSSProperties}></b>יולי</div><div><b style={{ "--h": "88%", "--i": 3 } as CSSProperties}></b>אוג׳</div><div><b style={{ "--h": "100%", "--i": 4 } as CSSProperties}></b>ספט׳</div><div><b style={{ "--h": "76%", "--i": 5 } as CSSProperties}></b>אוק׳</div></div>
                          <p className="chart-note">אוקטובר עדיין פתוח: 76% נגבו עד עכשיו.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="perks">
                    <div className="perk rv" style={{ "--d": "0.25s", "--c": "var(--sun)" } as CSSProperties}><b>גבייה אוטומטית</b><span>חיוב חודשי או שנתי, ותזכורות שיוצאות לבד.</span></div>
                    <div className="perk rv" style={{ "--d": "0.35s", "--c": "var(--teal)" } as CSSProperties}><b>דוחות ברורים</b><span>מי שילם, מה פתוח, ולאן הלך הכסף.</span></div>
                    <div className="perk rv" style={{ "--d": "0.45s", "--c": "var(--violet)" } as CSSProperties}><b>הודעות שמגיעות</b><span>הודעה לכולם או לקבוצה, ורואים מי קרא.</span></div>
                    <div className="perk rv" style={{ "--d": "0.55s", "--c": "var(--orange)" } as CSSProperties}><b>הרשאות לצוות</b><span>גזבר, מזכירה או ועד שלם, כל אחד עם מה שהוא צריך.</span></div>
                  </div>
                </div>
              </div>
              <div className="b-side side-ink">
                <div className="stats" id="stats">
                  <div className="stat"><b><span className="cnt" data-to="4280" data-fmt="1">4,280</span> ₪</b><span>נגבו החודש, מתוך 5,600 ₪</span><div className="bar"><i id="bar" style={{ width: "76%" } as CSSProperties}></i></div></div>
                  <div className="stat"><b><span className="cnt" data-to="19">19</span> מתוך 24</b><span>דירות כבר שילמו</span></div>
                  <div className="stat"><b><span className="cnt" data-to="21">21</span> קראו</b><span>את ההודעה על ניקיון חדר המדרגות</span></div>
                  <Link href="/login?intent=open" data-start="open" className="btn pri">לפתוח ארגון<small>הקמה וניהול, בכמה דקות</small></Link>
                </div>
              </div>
            </section>

            <section className="band sec-sun" id="app">
              <div className="b-main">
                <div className="b-in">
                  <span className="eyebrow rv">בכיס שלכם</span>
                  <h2 className="big rv" style={{ "--d": ".08s" } as CSSProperties}>הכרטיס תמיד איתכם</h2>
                  <p className="lead2 rv" style={{ "--d": ".16s" } as CSSProperties}>פותחים בטלפון, מוסיפים למסך הבית, והכרטיס מוכן בכניסה. עובד גם בלי להוריד כלום מהחנות.</p>
                  <div className="stores rv" style={{ "--d": ".24s" } as CSSProperties}>
                    <InstallButton />
                    <span className="store">בקרוב ב־Google Play</span>
                    <span className="store">בקרוב ב־App Store</span>
                  </div>
                </div>
              </div>
              <div className="b-side side-pink">
                <div className="phone tilt" id="badgePhone" aria-hidden="true">
                  <div className="ph-badge">
                    <div className="bh" style={{ background: "var(--teal)" } as CSSProperties}><span className="pav">ו</span><b>ועד הבית הרצל 12</b></div>
                    <div className="bq"><div className="qr"></div><span>דנה כהן · דירה 7</span><em className="ok">חברה פעילה</em></div>
                    <div className="okflash"><i>✓</i><span>ברוכה הבאה, דנה!</span></div>
                  </div>
                </div>
              </div>
            </section>

            <footer className="foot">
              <div className="foot-in">
                <div className="fbrand"><bdi>{Array.from(BRAND).map((ch, i) => <i key={i} style={{ "--i": i } as CSSProperties}>{ch}</i>)}</bdi><span>כל החברויות שלך, בארנק אחד.</span></div>
                <nav className="fcol" aria-label="המוצר"><b>המוצר</b><a href="#how">איך זה עובד</a><a href="#admins">למנהלים</a><Link href="/pricing">מחירים</Link><Link href="/types">סוגי ארגונים</Link></nav>
                <nav className="fcol" aria-label="עזרה"><b>עזרה</b><Link href="/help">מרכז עזרה</Link><Link href="/contact">יצירת קשר</Link><Link href="/status">מצב המערכת</Link></nav>
                <nav className="fcol" aria-label="מידע משפטי"><b>משפטי</b><Link href="/terms">תנאי שימוש</Link><Link href="/privacy">מדיניות פרטיות</Link><Link href="/accessibility">הצהרת נגישות</Link><Link href="/cookies">עוגיות</Link></nav>
              </div>
              <div className="foot-bot"><span>© 2026 PIRI</span><span>עברית · English</span></div>
            </footer>

            </div>
            <div className="stickybar" id="stickybar" aria-label="כניסה והצטרפות">
              <bdi className="sb-brand">PIRI</bdi>
              <div className="sb-act"><Link href="/login?intent=join" data-start="join" className="sb-join">להצטרף</Link><Link href="/login?intent=open" data-start="open" className="sb-open">לפתוח ארגון</Link><Link href="/login" data-start="login" className="sb-login">כניסה</Link></div>
            </div>
            <LandingEffects />
        </div>
    );
}
