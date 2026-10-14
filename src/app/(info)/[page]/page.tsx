import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Short pages behind the public home page's footer links. Legal texts stay drafts in docs/legal until a
// lawyer approves them (docs/legal/README.he.md), so those pages only say the text is on its way.

type Info = { title: string; lead: string; items?: Array<[string, string]> };

const PAGES: Record<string, Info> = {
    terms: { title: "תנאי שימוש", lead: "הנוסח המלא בהכנה ויפורסם כאן לפני הפתיחה לציבור." },
    privacy: { title: "מדיניות פרטיות", lead: "הנוסח המלא בהכנה ויפורסם כאן לפני הפתיחה לציבור. כבר עכשיו: בלי סיסמאות, ומספר הטלפון שלכם לא מוצג לאף אחד בלי אישור." },
    accessibility: { title: "הצהרת נגישות", lead: "ההצהרה המלאה בהכנה, יחד עם פרטי הקשר לפניות בנושא נגישות." },
    cookies: { title: "עוגיות", lead: "אנחנו משתמשים רק בעוגיות שנדרשות כדי להיכנס ולהישאר מחוברים. אין עוגיות פרסום או מעקב." },
    pricing: { title: "מחירים", lead: "לחברים השימוש חינם. המחירים לארגונים יפורסמו כאן לפני הפתיחה." },
    types: {
        title: "סוגי ארגונים",
        lead: "כל ארגון שיש לו חברים. לכל סוג יש ערכה עם הכלים שמתאימים לו.",
        items: [
            ["ועד בית", "גבייה, תקלות ואסיפות"],
            ["בית כנסת וקהילה", "תרומות וזמני תפילה"],
            ["חדר כושר", "מנויים וכניסה בקוד"],
            ["מועדון ותחביב", "מפגשים והטבות"],
        ],
    },
    help: { title: "מרכז עזרה", lead: "מדריכים ותשובות לשאלות נפוצות יעלו כאן בקרוב." },
    contact: { title: "יצירת קשר", lead: "טופס יצירת קשר יעלה כאן בקרוב." },
    status: { title: "מצב המערכת", lead: "כאן יוצג אם יש תקלה או עבודות תחזוקה. בינתיים הכל פועל כרגיל." },
};

export const dynamicParams = false;
export function generateStaticParams() {
    return Object.keys(PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
    const info = PAGES[(await params).page];
    return { title: info ? `${info.title} · PIRI` : "PIRI" };
}

export default async function InfoPage({ params }: { params: Promise<{ page: string }> }) {
    const info = PAGES[(await params).page];
    if (!info) notFound();
    return (
        <div className="min-h-dvh bg-[var(--mh-sun)] px-4 py-6">
            <main className="mx-auto flex max-w-[640px] flex-col gap-4">
                <Link href="/" className="self-start font-display text-[24px]"><bdi>PIRI</bdi></Link>
                <div className="flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-surface)] p-5 shadow-[0_4px_0_var(--mh-ink)]">
                    <h1 className="m-0 font-display text-[32px] leading-[1.1]">{info.title}</h1>
                    <p className="m-0 text-[17px] font-semibold text-[var(--mh-ink-soft)]">{info.lead}</p>
                    {info.items && (
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                            {info.items.map(([name, what]) => (
                                <li key={name} className="rounded-2xl border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] px-4 py-3">
                                    <b className="block text-[17px]">{name}</b>
                                    <span className="font-semibold text-[var(--mh-ink-soft)]">{what}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <Link href="/" className="min-h-11 self-start font-extrabold underline">חזרה לדף הבית</Link>
            </main>
        </div>
    );
}
