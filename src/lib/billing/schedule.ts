// Pure billing math, ported from the HOA project's data_loader.py (_compute_required_charges).
// No I/O, no framework imports: everything here is unit-testable with node:test.
//
// Money is in integer minor units (agorot). Months are "YYYY-MM" strings.

export type MonthKey = string; // "YYYY-MM"

// A month may only be split at these points, so a flat always owes exactly one fee per month.
export const CLEAN_FRACTIONS = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1] as const;

export function snapFraction(f: number): number {
    let best: number = CLEAN_FRACTIONS[0];
    for (const c of CLEAN_FRACTIONS) {
        if (Math.abs(c - f) < Math.abs(best - f)) best = c;
    }
    return best;
}

// Display label for a clean fraction; empty string for a full month or zero.
export function fractionLabel(f: number): string {
    const labels: Array<[number, string]> = [
        [1 / 4, "1/4"], [1 / 3, "1/3"], [1 / 2, "1/2"], [2 / 3, "2/3"], [3 / 4, "3/4"],
    ];
    return labels.find(([v]) => Math.abs(f - v) < 0.001)?.[1] ?? "";
}

export interface FeeSchedule {
    defaultFeeMinor: number;
    // Dated fee changes: the latest key <= the month applies, e.g. {"2024-12": 19500}.
    changes: Record<MonthKey, number>;
    // Extra amount added to specific months, e.g. a one-month elevator surcharge.
    routineSpecials: Record<MonthKey, number>;
}

// Latest dated change at or before the month; otherwise the default fee.
export function baseFeeForMonth(schedule: FeeSchedule, month: MonthKey): number {
    const past = Object.keys(schedule.changes).filter((m) => m <= month).sort();
    const latest = past.at(-1);
    return latest === undefined ? schedule.defaultFeeMinor : schedule.changes[latest];
}

export interface Occupancy {
    id: string; // member (tenant) id
    from: Date; // first day, inclusive (UTC)
    to: Date | null; // last day, inclusive (UTC); null = still there
}

function utcDay(y: number, m: number, d: number): number {
    return Date.UTC(y, m, d);
}

// Days of the month covered by the occupancy, inclusive on both ends.
function overlapDays(o: Occupancy, month: MonthKey): number {
    const [y, m] = month.split("-").map(Number);
    const monthStart = utcDay(y, m - 1, 1);
    const monthEnd = utcDay(y, m, 0); // day 0 of next month = last day of this one
    const start = Math.max(o.from.getTime(), monthStart);
    const end = Math.min(o.to ? o.to.getTime() : Infinity, monthEnd);
    if (start > end) return 0;
    return Math.round((end - start) / 86_400_000) + 1;
}

export function daysInMonth(month: MonthKey): number {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Share of the month each occupant owes. Empty map = nobody lived there (a "gap").
//  - One occupant: their share, snapped to a clean fraction.
//  - Two or more: the occupant with the fewest days is snapped; the one with the most days gets
//    the complement, so the total is exactly 1 regardless of gap days or exact move dates.
//    Any occupants in between are snapped individually (rare).
export function occupancyFractions(occupants: Occupancy[], month: MonthKey): Map<string, number> {
    const dim = daysInMonth(month);
    const raw: Array<[string, number]> = [];
    for (const o of occupants) {
        const d = overlapDays(o, month);
        if (d > 0) raw.push([o.id, d]);
    }
    const result = new Map<string, number>();
    if (raw.length === 0) return result;
    if (raw.length === 1) {
        result.set(raw[0][0], snapFraction(raw[0][1] / dim));
        return result;
    }
    const byDays = [...raw].sort((a, b) => a[1] - b[1]); // stable: ties keep input order
    const [minorId, minorDays] = byDays[0];
    const [majorId] = byDays[byDays.length - 1];
    const snappedMinor = snapFraction(minorDays / dim);
    result.set(minorId, snappedMinor);
    result.set(majorId, 1 - snappedMinor);
    for (const [id, d] of byDays.slice(1, -1)) result.set(id, snapFraction(d / dim));
    return result;
}

export type ChargeKind = "recurring" | "special";

export interface ChargeLine {
    occupantId: string;
    month: MonthKey;
    kind: ChargeKind;
    amountMinor: number;
    fraction: number;
    description: string;
}

export interface MonthlyChargeInput {
    month: MonthKey;
    displayName: string; // fund label shown on the charge, e.g. "ועד בית"
    schedule: FeeSchedule;
    specialLabels?: Record<MonthKey, string>;
    occupants: Occupancy[];
    monthLabel: string; // e.g. "10/26"
}

// Recurring charge lines for one household and one month, split by occupancy.
// Rounds each line half-up in minor units (1/3 of 27500 -> 9167, 2/3 -> 18333, sum 27500).
export function computeMonthlyCharges(input: MonthlyChargeInput): ChargeLine[] {
    const fractions = occupancyFractions(input.occupants, input.month);
    const base = baseFeeForMonth(input.schedule, input.month);
    const extra = input.schedule.routineSpecials[input.month] ?? 0;
    const lines: ChargeLine[] = [];
    for (const [occupantId, fraction] of fractions) {
        if (fraction < 0.001) continue;
        const lbl = fractionLabel(fraction);
        const note = lbl ? ` (${lbl})` : "";
        const baseMinor = Math.round(base * fraction);
        const extraMinor = Math.round(extra * fraction);
        if (baseMinor) {
            lines.push({
                occupantId, month: input.month, kind: "recurring", amountMinor: baseMinor, fraction,
                description: `${input.displayName} ${input.monthLabel}${note}`,
            });
        }
        if (extraMinor) {
            const label = input.specialLabels?.[input.month] ?? `${input.displayName} - תוספת`;
            lines.push({
                occupantId, month: input.month, kind: "special", amountMinor: extraMinor, fraction,
                description: `${label}${note}`,
            });
        }
    }
    return lines;
}
