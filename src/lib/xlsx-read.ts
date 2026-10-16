// Reads the first sheet of an Excel .xlsx file into rows of text, in the browser, with no library: an .xlsx is
// a zip of XML files. Only what a member list needs: shared and inline strings, numbers and booleans.
// Formulas give their last saved value. Dates come out as Excel serial numbers (a member list rarely has them).

const td = new TextDecoder();

async function inflate(data: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

// The files in the zip, by name, read through the central directory.
async function unzip(buf: ArrayBuffer, want: (name: string) => boolean): Promise<Map<string, string>> {
    const v = new DataView(buf);
    const bytes = new Uint8Array(buf);
    let end = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66_000); i--) {
        if (v.getUint32(i, true) === 0x06054b50) { end = i; break; }
    }
    if (end < 0) throw new Error("not a zip");
    const count = v.getUint16(end + 10, true);
    let p = v.getUint32(end + 16, true);
    const out = new Map<string, string>();
    for (let n = 0; n < count; n++) {
        if (v.getUint32(p, true) !== 0x02014b50) break;
        const method = v.getUint16(p + 10, true);
        const size = v.getUint32(p + 20, true);
        const nameLen = v.getUint16(p + 28, true);
        const extraLen = v.getUint16(p + 30, true);
        const commentLen = v.getUint16(p + 32, true);
        const local = v.getUint32(p + 42, true);
        const name = td.decode(bytes.subarray(p + 46, p + 46 + nameLen));
        p += 46 + nameLen + extraLen + commentLen;
        if (!want(name)) continue;
        const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
        const raw = bytes.subarray(start, start + size);
        out.set(name, td.decode(method === 8 ? await inflate(raw) : raw));
    }
    return out;
}

const unescape = (s: string) =>
    s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, "&");
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unescape(m[1])).join("");

function colIndex(ref: string): number {
    const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
}

export async function readXlsx(buf: ArrayBuffer): Promise<string[][]> {
    const files = await unzip(buf, (n) => n === "xl/sharedStrings.xml" || n === "xl/workbook.xml" || n === "xl/_rels/workbook.xml.rels" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
    const shared = [...(files.get("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]));
    // The first sheet in the workbook's own order, not always sheet1.xml.
    const firstId = /<sheet\s[^>]*r:id="([^"]+)"/.exec(files.get("xl/workbook.xml") ?? "")?.[1];
    const target = firstId ? new RegExp(`<Relationship[^>]*Id="${firstId}"[^>]*Target="([^"]+)"`).exec(files.get("xl/_rels/workbook.xml.rels") ?? "")?.[1] : null;
    const path = target ? `xl/${target.replace(/^\/?xl\//, "")}` : "xl/worksheets/sheet1.xml";
    const sheet = files.get(path) ?? [...files.entries()].find(([n]) => n.startsWith("xl/worksheets/"))?.[1];
    if (!sheet) throw new Error("no sheet");
    const rows: string[][] = [];
    for (const r of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
        const row: string[] = [];
        for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
            const attrs = c[1];
            const body = c[2] ?? "";
            const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
            const type = /\bt="(\w+)"/.exec(attrs)?.[1];
            const val = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
            let text = "";
            if (type === "s") text = shared[Number(val)] ?? "";
            else if (type === "inlineStr") text = texts(body);
            else if (type === "b") text = val === "1" ? "TRUE" : "FALSE";
            else if (val !== undefined) text = unescape(val);
            const i = ref ? colIndex(ref) : row.length;
            while (row.length < i) row.push("");
            row[i] = text.trim();
        }
        if (row.some((x) => x)) rows.push(row);
    }
    return rows;
}
