import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

// Dense admin table. Sorting and paging are driven by the parent through props/URL (server side).
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty = "אין נתונים להצגה",
  loading = false,
  highlight,
}: {
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  empty?: string;
  loading?: boolean;
  highlight?: (row: T) => boolean;
}) {
  const template = columns.map((c) => c.width ?? "1fr").join(" ");
  return (
    <div className="overflow-hidden rounded-[14px] border-2 border-[var(--mh-ink)] bg-white" role="table">
      <div role="row" className="grid h-9 items-center gap-[10px] bg-[var(--mh-ink)] px-[14px] text-xs font-extrabold text-white" style={{ gridTemplateColumns: template }}>
        {columns.map((c) => (
          <span key={c.key} role="columnheader">
            {c.header}
          </span>
        ))}
      </div>
      {loading ? (
        <div role="status" className="p-6 text-center font-bold text-[var(--mh-ink-soft)]">
          טוען...
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center font-bold text-[var(--mh-ink-soft)]">{empty}</div>
      ) : (
        rows.map((r) => (
          <div
            key={r.id}
            role="row"
            className={`grid min-h-[46px] items-center gap-[10px] border-b-[1.5px] border-[#EDE6D6] px-[14px] font-semibold ${highlight?.(r) ? "bg-[#FFF6D1]" : ""}`}
            style={{ gridTemplateColumns: template }}
          >
            {columns.map((c) => (
              <span key={c.key} role="cell">
                {c.render(r)}
              </span>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
