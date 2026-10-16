import QRCode from "qrcode";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/org-setup";

// The person's permanent profile code, made on first need. A new one replaces the old, which stops working.
export async function profileCode(userId: string, fresh = false): Promise<string> {
    if (!fresh) {
        const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { profileCode: true } });
        if (u.profileCode) return u.profileCode;
    }
    for (let attempt = 0; ; attempt++) {
        try {
            const code = randomToken(10);
            await db.user.update({ where: { id: userId }, data: { profileCode: code } });
            return code;
        } catch (e) {
            if (attempt < 4 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
            throw e;
        }
    }
}

export const qrSvg = (text: string) => QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#1E1633", light: "#FFFFFF" } });
