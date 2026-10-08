import { formatMoney } from "@/lib/money";

// Money is always integer minor units + ISO currency. Negative = owed by the member.
export function Money({ minor, currency = "ILS", locale = "he-IL" }: { minor: number; currency?: string; locale?: string }) {
  return (
    <bdi className={`font-extrabold ${minor < 0 ? "text-[var(--mh-danger)]" : ""}`}>
      {formatMoney(minor, currency, locale)}
    </bdi>
  );
}

export function DateText({ value, locale = "he-IL", timeZone = "Asia/Jerusalem" }: { value: Date | string; locale?: string; timeZone?: string }) {
  const d = typeof value === "string" ? new Date(value) : value;
  return <time dateTime={d.toISOString()}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(d)}</time>;
}
