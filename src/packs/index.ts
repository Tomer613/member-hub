import type { PackDefinition } from "./types";
import { hoaPack } from "./hoa";
import { synagoguePack } from "./synagogue";
import { gymPack } from "./gym";
import { clubPack } from "./club";

export type { PackDefinition } from "./types";

export const PACKS: Record<PackDefinition["id"], PackDefinition> = {
    hoa: hoaPack,
    synagogue: synagoguePack,
    gym: gymPack,
    club: clubPack,
    generic: {
        id: "generic",
        name: "כללי",
        status: "ready",
        terms: { member: "חבר", household: "חשבון", admin: "מנהל", fund: "קופה" },
        modules: ["members", "households", "funds", "billing", "payments", "events", "campaigns"],
        customFields: [],
        requestKinds: [],
        eventTypes: [{ value: "general", label: "כללי" }],
        defaultFunds: [{ key: "general", displayName: "כללי" }],
    },
};

export function getPack(packId: string): PackDefinition {
    return PACKS[packId as PackDefinition["id"]] ?? PACKS.generic;
}
