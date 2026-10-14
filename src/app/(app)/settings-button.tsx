import Link from "next/link";
// The settings button at the top of the wallet. A dot asks for a backup sign-in method while the
// account has only one (decided 13.10.2026: gentle for members, the admin reminders live elsewhere).
export function SettingsButton({ needsBackup }: { needsBackup: boolean }) {
    return (
        <Link href="/settings" aria-label={needsBackup ? "הגדרות: כדאי להוסיף אמצעי גיבוי" : "הגדרות"} className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
            {needsBackup && <span className="absolute -top-[3px] -end-[3px] h-[14px] w-[14px] rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-org-orange)]" />}
        </Link>
    );
}
