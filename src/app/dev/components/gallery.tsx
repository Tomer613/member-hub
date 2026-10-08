"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, OrgBand } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { DateText, Money } from "@/components/ui/money";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { onColor } from "@/lib/color";

const ORGS = [
  { name: "סגול", color: "#5B3DF5" },
  { name: "כתום", color: "#FF5A36" },
  { name: "ירוק", color: "#00B67A" },
  { name: "ורוד", color: "#FF5C9E" },
  { name: "תכלת", color: "#18B8F0" },
];

const rows = [
  { id: "1", name: "דוד כהן", status: "חוב", balance: -60000 },
  { id: "2", name: "שרה כהן", status: "פעיל", balance: 0 },
  { id: "3", name: "יוסי לוי", status: "פעיל", balance: 0 },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[22px]">{title}</h2>
      {children}
    </section>
  );
}

export function Gallery() {
  const [org, setOrg] = useState(ORGS[0]);
  const [admin, setAdmin] = useState(false);
  const [on, setOn] = useState(true);
  const [open, setOpen] = useState(false);
  const style = { "--org": org.color, "--on-org": onColor(org.color) } as CSSProperties;

  return (
    <main style={style} data-surface={admin ? "admin" : undefined} className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <h1 className="text-[30px]">גלריית רכיבים</h1>
      <div className="flex flex-wrap items-center gap-2">
        {ORGS.map((o) => (
          <button
            key={o.name}
            type="button"
            onClick={() => setOrg(o)}
            aria-label={`צבע ארגון ${o.name}`}
            aria-pressed={o.color === org.color}
            className="h-9 w-9 rounded-full border-2 border-[var(--mh-ink)]"
            style={{ background: o.color }}
          />
        ))}
        <Checkbox label="מצב ניהול (צפוף)" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
      </div>

      <Section title="כפתורים">
        <div className="flex flex-wrap gap-3">
          <Button>ראשי</Button>
          <Button variant="secondary">משני</Button>
          <Button variant="highlight">הדגשה</Button>
          <Button variant="danger">מחיקה</Button>
          <Button disabled>מושבת</Button>
        </div>
      </Section>

      <Section title="צ'יפים ומתגים">
        <div className="flex flex-wrap gap-2">
          <Chip tone="ok">פעיל</Chip>
          <Chip tone="debt">חוב פתוח</Chip>
          <Chip tone="dispute">מחלוקת</Chip>
          <Chip tone="pending">ממתין לאישור</Chip>
          <Chip tone="left">עזב עם חוב</Chip>
          <Chip tone="org">חבר מאז 2019</Chip>
        </div>
        <Toggle label="הטלפון שלי גלוי לארגון" checked={on} onChange={setOn} />
        <Toggle label="שדה חובה" checked locked onChange={() => {}} />
      </Section>

      <Section title="שדות">
        <Input label="טלפון" placeholder="050-0000000" ltr inputMode="tel" />
        <Input label="מייל" defaultValue="david@" error="כתובת המייל לא תקינה" />
        <Select label="סוג חברות" options={[{ value: "a", label: "משפחה" }, { value: "b", label: "יחיד" }]} />
        <Checkbox label="אני מאשר את תנאי השימוש" />
      </Section>

      <Section title="כרטיסים והודעות">
        <OrgBand>
          <div className="text-[13px] font-extrabold">השבת הקרובה</div>
          <div className="font-display text-[28px]">שבת פרשת בראשית</div>
        </OrgBand>
        <Card>
          סכום לתשלום: <Money minor={-60000} /> · עדכון אחרון: <DateText value="2026-10-08" />
        </Card>
        <Toast tone="ok">התשלום התקבל. תודה!</Toast>
        <Toast tone="error">לא הצלחנו לשמור. נסו שוב.</Toast>
      </Section>

      <Section title="לשוניות וחלון">
        <Tabs
          tabs={[
            { key: "a", label: "כספים", content: <Card>תוכן כספים</Card> },
            { key: "b", label: "פניות", content: <Card>תוכן פניות</Card> },
          ]}
        />
        <div>
          <Button variant="secondary" onClick={() => setOpen(true)}>פתיחת חלון</Button>
        </div>
        <Modal open={open} onClose={() => setOpen(false)} title="שליחת תזכורת חוב">
          <p className="mb-4 font-semibold">התזכורת תישלח פעם אחת בשבוע לכל חבר.</p>
          <div className="flex gap-2">
            <Button onClick={() => setOpen(false)}>שליחה</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>ביטול</Button>
          </div>
        </Modal>
      </Section>

      <Section title="טבלה">
        <DataTable
          rows={rows}
          highlight={(r) => r.status === "חוב"}
          columns={[
            { key: "n", header: "שם", render: (r) => <b>{r.name}</b>, width: "2fr" },
            { key: "s", header: "סטטוס", render: (r) => <Chip tone={r.status === "חוב" ? "debt" : "ok"}>{r.status}</Chip> },
            { key: "b", header: "יתרה", render: (r) => <Money minor={r.balance} /> },
          ]}
        />
        <DataTable rows={[]} columns={[{ key: "n", header: "שם", render: () => null }]} empty="עוד אין חברים. אפשר להזמין את הראשון." />
      </Section>
    </main>
  );
}
