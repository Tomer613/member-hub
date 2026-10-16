import { headers } from "next/headers";

// The address the app is served from, for links printed under codes and for telling our links apart.
export async function appOrigin(): Promise<{ origin: string; host: string }> {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000").split(",")[0].trim().toLowerCase();
    const proto = (h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")).split(",")[0].trim();
    return { origin: `${proto}://${host}`, host };
}
