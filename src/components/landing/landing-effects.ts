// Motion and small interactions for the public home page (Landing.tsx).
// Plain DOM code on purpose: the page markup is static and server-rendered; this only adds life on top.
// Everything started here is tracked, so the returned cleanup undoes it (React StrictMode runs effects twice).

type Card = [name: string, letter: string, color: string, line: string, tag: string];
type Body = { x: number; y: number; r: number; vx: number; vy: number; vr: number };
type Box = { l: number; t: number; r: number; b: number };
type Frame = { left: number; top: number; width: number; height: number };

const DOODLES: Record<string, string> = {
    star: '<path d="M12 2l3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z"/>',
    ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="2 2.4"/>',
    medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',
    conf: '<rect x="5" y="9" width="14" height="6" rx="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
};

// Example communities thrown out of the card stack: half institutional, half for younger audiences. Fictional.
const INSTITUTIONAL: Card[] = [
    ["מקהלת הקהילה", "ק", "--violet", "חזרה ביום שלישי", "40 חברים"], ["ועד ההורים", "ה", "--teal", "גבייה לטיול השנתי", "כיתה ד׳"],
    ["עמותת הוותיקים", "ע", "--pink", "הרצאה חודשית", "120 חברים"], ["תנועת נוער", "ת", "--orange", "מפעל קיץ", "3 שבטים"],
    ["גינה קהילתית", "ג", "--teal", "תורנות השקיה", "פתוח"], ["ספריית השכונה", "ס", "--violet", "השאלה בלי תור", "חדש"],
    ["מתנדבי חירום", "מ", "--orange", "כוננות לסוף השבוע", "32 מתנדבים"], ["ועד העובדים", "ו", "--pink", "הטבות לחברים", "פעיל"],
    ["קופת גמ״ח", "ג", "--teal", "הלוואה בלי ריבית", "פתוח"], ["עמותת הבוגרים", "ב", "--violet", "מפגש מחזור 2010", "חדש"],
    ["חוג תנ״ך", "ת", "--orange", "שיעור במוצאי שבת", "פתוח"], ["מרכז קהילתי", "מ", "--pink", "חוגים לכל הגילאים", "הרשמה"],
    ["אמנות בגיל הזהב", "א", "--teal", "סדנת ציור שבועית", "12 מקומות"], ["קהילת הורים צעירים", "ה", "--violet", "גן שעשועים בחמישי", "חדש"],
    ["חברת קדישא מקומית", "ח", "--orange", "דמי חבר שנתיים", "פעיל"],
];
const YOUNG: Card[] = [
    ["ליגת כדורגל שכונתית", "ל", "--teal", "משחק במוצאי שבת", "14 קבוצות"], ["ריצת שישי בבוקר", "ר", "--orange", "יוצאים ב־6:30", "פתוח"],
    ["מועדון גיימרים", "ג", "--pink", "טורניר ביום חמישי", "חדש"], ["קבוצת גלישה", "ג", "--violet", "תחזית: גלים טובים", "פתוח"],
    ["להקת חובבים", "ל", "--orange", "הופעה בחנוכה", "5 נגנים"], ["מועדון ספר", "ס", "--pink", "הספר של החודש", "חדש"],
    ["טיולי ג׳יפים", "ט", "--teal", "יציאה לנגב", "8 רכבים"], ["מועדון יין", "י", "--violet", "טעימה בשישי", "חדש"],
    ["יוגה בפארק", "י", "--teal", "שיעור בזריחה", "פתוח"], ["ערב משחקי קופסה", "מ", "--orange", "קטאן ופיצה", "חדש"],
    ["חוג קרמיקה", "ק", "--pink", "8 מקומות פנויים", "חדש"], ["מועדון שחמט", "ש", "--violet", "דירוג חברים", "פתוח"],
    ["רכיבת שטח", "ר", "--orange", "מסלול בכרמל", "פתוח"], ["ערב סטנדאפ פתוח", "ס", "--pink", "במה לכולם", "חדש"],
    ["קבוצת צילום", "צ", "--teal", "יציאה לשקיעה", "פתוח"],
];
// Landing spots in percent of the hero (desktop) or of the viewport (phone).
const DESK_SLOTS = [[0, 1], [52, 0], [52, 21], [0, 71], [54, 64]];
const MOB_SLOTS = [[2, 3], [12, 22], [0, 41], [14, 60], [3, 79]];
const EASES = ["cubic-bezier(.12,.82,.22,1)", "cubic-bezier(.2,.9,.3,1.04)", "cubic-bezier(.05,.7,.2,1)"];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
function shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

export function initLanding(root: HTMLElement): () => void {
    const timeouts = new Set<number>();
    const intervals = new Set<number>();
    const frames = new Set<number>();
    const offs: Array<() => void> = [];
    const added: Element[] = [];

    const later = (fn: () => void, ms: number) => {
        const id = window.setTimeout(() => { timeouts.delete(id); fn(); }, ms);
        timeouts.add(id);
        return id;
    };
    const cancel = (id: number | null | undefined) => { if (id != null) { clearTimeout(id); timeouts.delete(id); } };
    const every = (fn: () => void, ms: number) => { const id = window.setInterval(fn, ms); intervals.add(id); return id; };
    const stopEvery = (id: number | null) => { if (id != null) { clearInterval(id); intervals.delete(id); } };
    const frame = (fn: FrameRequestCallback) => {
        const id = requestAnimationFrame((t) => { frames.delete(id); fn(t); });
        frames.add(id);
        return id;
    };
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window, type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
        el.addEventListener(type, fn as EventListener, opts);
        offs.push(() => el.removeEventListener(type, fn as EventListener, opts));
    };
    const onView = (el: Element | null, fn: (el: Element) => void, threshold = 0.25) => {
        if (!el) return;
        if (!("IntersectionObserver" in window)) { fn(el); return; }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } });
        }, { threshold });
        io.observe(el);
        offs.push(() => io.disconnect());
    };
    const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel);
    const $$ = <T extends HTMLElement = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
    const make = (tag: string, cls: string, parent: Element) => {
        const el = document.createElement(tag);
        el.className = cls;
        parent.appendChild(el);
        added.push(el);
        return el;
    };

    // On very wide screens the page is zoomed (--z in globals.css). Element boxes come back in screen pixels,
    // while positions we set are in page pixels, so divide by the zoom.
    const zrect = (el: Element): DOMRect => {
        const z = (parseFloat(getComputedStyle(document.body).zoom) || 1) * (parseFloat(getComputedStyle(root).zoom) || 1);
        const r = el.getBoundingClientRect();
        return new DOMRect(r.left / z, r.top / z, r.width / z, r.height / z);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width:860px)");
    if (!reduce) root.classList.add("js");

    // Floating doodles in the hero: they fade out and come back somewhere else.
    const layer = $("#doodles");
    if (layer) {
        const keys = Object.keys(DOODLES);
        const place = (d: HTMLElement) => {
            d.style.left = rnd(2, 94) + "%";
            d.style.top = rnd(3, 93) + "%";
            d.style.setProperty("--r", rnd(-20, 20).toFixed(0) + "deg");
        };
        const cycle = (d: HTMLElement) => {
            place(d);
            frame(() => d.classList.add("on"));
            later(() => { d.classList.remove("on"); later(() => cycle(d), rnd(1600, 3100)); }, rnd(5000, 11000));
        };
        for (let i = 0; i < 22; i++) {
            const k = keys[i % keys.length];
            const d = make("div", "dd", layer);
            const size = k === "conf" || k === "plus" ? rnd(22, 32) : rnd(34, 56);
            d.style.width = d.style.height = size + "px";
            d.style.setProperty("--f", rnd(4, 8).toFixed(1) + "s");
            d.style.setProperty("--d", (-rnd(0, 6)).toFixed(1) + "s");
            d.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + DOODLES[k] + "</svg>";
            if (reduce) { place(d); d.classList.add("on"); } else later(() => cycle(d), rnd(0, 4000));
        }
    }

    // Scroll cue rests once the visitor has started scrolling; the sticky bar appears after the first screen.
    const cue = $(".cue");
    const bar = $("#stickybar");
    const onScroll = () => {
        cue?.classList.toggle("idle", window.scrollY > 60);
        bar?.classList.toggle("on", window.scrollY > window.innerHeight * 0.85);
    };
    on(window, "scroll", onScroll, { passive: true });
    onScroll();

    // Card toss: hovering (or tapping) the card stack throws 5 example cards that drift apart and fade one by one.
    const hero = $("#hero"), box = $("#minis"), stack = hero?.querySelector<HTMLElement>(".cards");
    if (hero && box && stack) {
        const els: Array<HTMLElement & { _s?: Body | null }> = [];
        for (let i = 0; i < 5; i++) els.push(make("div", "mini", box));
        const own = Array.from(stack.querySelectorAll<HTMLElement>(".bc"));
        const base = [-3, 2, -1];
        let busy = false, raf = 0, last: string[] = [];
        let tossTimers: number[] = [];

        const draw = () => {
            const pick = (pool: Card[], n: number) => shuffle(pool.filter((d) => !last.includes(d[0]))).slice(0, n);
            const ni = Math.random() < 0.5 ? 2 : 3;
            const set = shuffle(pick(INSTITUTIONAL, ni).concat(pick(YOUNG, 5 - ni)));
            last = set.map((d) => d[0]);
            set.forEach((d, i) => {
                els[i].innerHTML = `<div class="hd" style="background:var(${d[2]})"><span class="av">${esc(d[1])}</span><span class="nm">${esc(d[0])}</span><span class="st">${esc(d[4])}</span></div><div class="ft">${esc(d[3])}</div>`;
            });
        };
        const area = (): Frame => (narrow.matches ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : zrect(hero));

        // After landing, cards keep sliding slowly until none hides another, the scroll cue or the stack.
        const drift = (f: Frame, w: number, h: number, cueBox: DOMRect | null, c: DOMRect) => {
            els.forEach((m) => { m.style.transition = "none"; });
            const obs: Box[] = [];
            if (cueBox) obs.push({ l: cueBox.left - f.left - 20, t: cueBox.top - f.top - 24, r: cueBox.right - f.left + 20, b: cueBox.bottom - f.top });
            obs.push({ l: c.left - f.left, t: c.top - f.top, r: c.right - f.left, b: c.bottom - f.top });
            let prev = performance.now();
            const step = (now: number) => {
                const dt = Math.min(0.05, (now - prev) / 1000);
                prev = now;
                els.forEach((a, i) => {
                    const A = a._s;
                    if (!A) return;
                    let fx = 0, fy = 0;
                    els.forEach((b, j) => {
                        const B = b._s;
                        if (i === j || !B) return;
                        const ox = w - Math.abs(A.x - B.x), oy = h - Math.abs(A.y - B.y);
                        if (ox > 0 && oy > 0) {
                            const sx = A.x < B.x ? -1 : 1, sy = A.y < B.y ? -1 : 1;
                            if (ox < oy * 2.2) fx += sx * ox * 0.9; else fy += sy * oy * 0.9;
                        }
                    });
                    obs.forEach((o) => {
                        if (A.x < o.r && A.x + w > o.l && A.y + h > o.t && A.y < o.b) {
                            const pl = A.x + w - o.l, pr = o.r - A.x, pu = A.y + h - o.t, pd = o.b - A.y, m = Math.min(pl, pr, pu, pd);
                            if (m === pl) fx -= pl * 1.2; else if (m === pr) fx += pr * 1.2; else if (m === pu) fy -= pu * 1.2; else fy += pd * 1.2;
                        }
                    });
                    A.vx = A.vx * 0.98 + fx * dt * 1.1;
                    A.vy = A.vy * 0.98 + fy * dt * 1.1;
                    const sp = Math.hypot(A.vx, A.vy), mx = 30;
                    if (sp > mx) { A.vx *= mx / sp; A.vy *= mx / sp; }
                    A.x += A.vx * dt; A.y += A.vy * dt; A.r += A.vr * dt; A.vr *= 0.99;
                    if (A.x < 0) { A.x = 0; A.vx = Math.abs(A.vx) * 0.3; }
                    if (A.x > f.width - w) { A.x = f.width - w; A.vx = -Math.abs(A.vx) * 0.3; }
                    if (A.y < 0) { A.y = 0; A.vy = Math.abs(A.vy) * 0.3; }
                    if (A.y > f.height - h) { A.y = f.height - h; A.vy = -Math.abs(A.vy) * 0.3; }
                    a.style.transform = `translate(${A.x.toFixed(1)}px,${A.y.toFixed(1)}px) rotate(${A.r.toFixed(2)}deg)`;
                });
                raf = frame(step);
            };
            raf = frame(step);
        };
        const reset = () => {
            cancelAnimationFrame(raf); frames.delete(raf);
            tossTimers.forEach(cancel); tossTimers = [];
            els.forEach((m) => { m._s = null; m.className = "mini"; m.style.transition = "none"; });
            busy = false;
        };
        const jostle = () => own.forEach((el, i) => {
            el.style.transition = `transform ${rnd(0.5, 0.8).toFixed(2)}s cubic-bezier(.2,1.3,.4,1) ${rnd(0, 0.08).toFixed(2)}s`;
            el.style.transform = `translate(${rnd(-34, 34).toFixed(0)}px,${rnd(-18, 18).toFixed(0)}px) rotate(${(base[i] + rnd(-12, 12)).toFixed(1)}deg)`;
        });
        const settle = () => {
            own.forEach((el, i) => { el.style.transition = `transform .9s cubic-bezier(.2,1.25,.4,1) ${i * 0.08}s`; el.style.transform = `rotate(${base[i]}deg)`; });
            tossTimers.push(later(() => own.forEach((el) => { el.style.transition = ""; el.style.transform = ""; }), 1400));
        };
        const toss = () => {
            if (busy) return;
            busy = true;
            draw();
            const w = own[0].offsetWidth, h = own[0].offsetHeight;
            const f = area(), c = zrect(stack);
            const ox = c.left - f.left + c.width / 2 - w / 2, oy = c.top - f.top + c.height / 2 - h / 2;
            const cueBox = cue && !narrow.matches ? zrect(cue) : null;
            const slots = shuffle((narrow.matches ? MOB_SLOTS : DESK_SLOTS).slice());
            const mode = Math.floor(Math.random() * 3); // 0 burst, 1 fan one by one, 2 wide slide
            const ease = EASES[Math.floor(Math.random() * EASES.length)];
            const push = rnd(-40, 40);
            els.forEach((m) => {
                m.style.width = w + "px"; m.style.height = h + "px"; m.style.transition = "none";
                m.style.transform = `translate(${ox + rnd(-6, 6)}px,${oy + rnd(-6, 6)}px) rotate(${rnd(-4, 4).toFixed(1)}deg)`;
                m.className = "mini flying";
            });
            void box.offsetWidth;
            jostle();
            let landAt = 0;
            els.forEach((m, i) => {
                const s = slots[i % slots.length];
                const x = Math.min(f.width - w, Math.max(0, (s[0] / 100) * f.width + rnd(-26, 26) + push));
                let y = Math.min(f.height - h, Math.max(0, (s[1] / 100) * f.height + rnd(-18, 18)));
                if (cueBox) {
                    const cl = cueBox.left - f.left, cr = cueBox.right - f.left, ct = cueBox.top - f.top - 14;
                    if (x < cr && x + w > cl && y + h > ct) y = Math.max(0, ct - h - rnd(0, 20));
                }
                const dur = reduce ? 0 : mode === 1 ? rnd(0.55, 0.8) : mode === 2 ? rnd(0.9, 1.3) : rnd(0.65, 1.1);
                const del = reduce ? 0 : mode === 1 ? i * 0.07 : rnd(0, 0.09);
                const dx = x - ox, dy = y - oy;
                // Rotation follows the direction of travel, never a full spin.
                const spin = Math.max(-28, Math.min(28, dx / 18 + dy / 40)) + rnd(-7, 7);
                m.style.transition = `transform ${dur.toFixed(2)}s ${ease} ${del.toFixed(2)}s`;
                m.style.transform = `translate(${x.toFixed(0)}px,${y.toFixed(0)}px) rotate(${spin.toFixed(1)}deg)`;
                const len = Math.hypot(dx, dy) || 1;
                m._s = { x, y, r: spin, vx: (dx / len) * 9, vy: (dy / len) * 9, vr: rnd(-1.5, 1.5) };
                landAt = Math.max(landAt, (dur + del) * 1000);
            });
            if (!reduce) tossTimers.push(later(() => drift(f, w, h, cueBox, c), landAt + 30));
            const order = shuffle(els.slice());
            order.forEach((m, k) => tossTimers.push(later(() => m.classList.add("gone"), 3600 + k * 700)));
            tossTimers.push(later(settle, 3600 + order.length * 700 - 400));
            tossTimers.push(later(reset, 3600 + order.length * 700 + 1600));
        };
        on(stack, "mouseenter", () => { if (!narrow.matches) toss(); });
        on(stack, "click", toss);
        on(window, "resize", reset);
        offs.push(() => own.forEach((el) => { el.style.transition = ""; el.style.transform = ""; }));
    }

    // Sections below the hero animate in once, when they scroll into view.
    $$(".more .band").forEach((b) => onView(b, (t) => t.classList.add("in"), 0.15));

    const sparks = (host: HTMLElement, cols: string[]) => {
        if (reduce) return;
        for (let k = 0; k < 10; k++) {
            const d = make("span", "spark", host);
            const a = Math.random() * Math.PI * 2, r = rnd(30, 70);
            d.style.cssText = `left:50%;top:50%;background:${cols[k % cols.length]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px`;
            later(() => d.remove(), 900);
        }
    };

    // "How it works": the three steps light up in turn and the phone plays the story
    // (a new card joins the wallet, lifts, then the payment turns into "paid"). Hovering a step shows it.
    const phone = $("#howPhone");
    const steps = $$(".steps li");
    const newCard = phone?.querySelector<HTMLElement>(".pc.new");
    const pay = phone?.querySelector<HTMLElement>(".ph-pay");
    if (phone && newCard && pay) {
        const setStep = (n: number) => {
            steps.forEach((li) => li.classList.toggle("act", Number(li.dataset.s) === n));
            newCard.classList.toggle("out", n < 1);
            newCard.classList.toggle("hi", n === 2);
            const was = pay.classList.contains("done");
            pay.classList.toggle("done", n === 3);
            if (n === 3 && !was) sparks(pay, ["var(--sun)", "var(--teal)", "var(--pink)"]);
        };
        let cur = 0, paused = false, timer: number | null = null;
        const tick = () => {
            if (paused) return;
            cur = cur >= 3 ? 0 : cur + 1;
            setStep(cur);
            timer = later(tick, cur === 3 ? 3200 : cur === 0 ? 900 : 2200);
        };
        if (reduce) setStep(3);
        else onView($("#how"), () => { timer = later(tick, 700); }, 0.35);
        steps.forEach((li) => {
            on(li, "mouseenter", () => { paused = true; cancel(timer); cur = Number(li.dataset.s); setStep(cur); });
            on(li, "mouseleave", () => { paused = false; cancel(timer); timer = later(tick, 1600); });
        });
    }

    // Trust: the padlock clicks shut when it scrolls in; hovering it shows an encrypted stream behind it.
    const lock = $("#lock"), stream = $("#stream");
    if (lock) {
        const shut = () => { lock.classList.remove("open", "click"); void lock.offsetWidth; lock.classList.add("click"); };
        const toggle = () => { if (lock.classList.contains("open")) shut(); else { lock.classList.add("open"); later(shut, 700); } };
        if (reduce) lock.classList.remove("open");
        else onView($("#trust"), () => later(shut, 900), 0.4);
        on(lock, "click", toggle);
        on(lock, "keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
        offs.push(() => lock.classList.add("open"));
    }
    if (lock && stream) {
        const HEX = "0123456789ABCDEF";
        const chunk = () => {
            let o = "";
            for (let k = 0; k < 34; k++) {
                o += Math.random() < 0.55 ? (Math.random() < 0.5 ? "0" : "1") : HEX[(Math.random() * 16) | 0];
                if (k % 4 === 3) o += " ";
            }
            return o;
        };
        const rows: HTMLElement[] = [];
        for (let r = 0; r < 9; r++) {
            const row = make("div", "srow", stream);
            const sp = document.createElement("span");
            const c = chunk();
            sp.textContent = c + c;
            sp.style.setProperty("--t", rnd(10, 20).toFixed(1) + "s");
            row.appendChild(sp);
            rows.push(sp);
        }
        const center = () => {
            const b = zrect(stream.parentNode as HTMLElement), l = zrect(lock);
            stream.style.top = l.top - b.top + l.height / 2 + "px";
        };
        let mut: number | null = null, hideT: number | null = null;
        const show = () => {
            center();
            cancel(hideT);
            stream.classList.add("on");
            if (!reduce && mut == null) mut = every(() => { const c = chunk(); rows[(Math.random() * rows.length) | 0].textContent = c + c; }, 380);
        };
        const hide = () => { stream.classList.remove("on"); hideT = later(() => { stopEvery(mut); mut = null; }, 700); };
        on(lock, "mouseenter", show);
        on(lock, "mouseleave", hide);
        on(lock, "click", () => { show(); cancel(hideT); hideT = later(hide, 2200); });
        on(window, "resize", center);
    }

    // Security standards: hovering or focusing a chip swaps the caption below for what that standard means.
    const cap = $(".std-cap");
    const capText = cap?.querySelector("span");
    if (cap && capText) {
        const base = capText.textContent ?? "";
        const show = (chip: HTMLElement | null) => {
            $$(".std").forEach((c) => c.classList.toggle("on", c === chip));
            const text = chip?.dataset.tip ?? base;
            if (capText.textContent === text) return;
            capText.textContent = text;
            cap.classList.toggle("tip", !!chip);
            cap.classList.remove("swap");
            void cap.offsetWidth; // restart the entrance animation
            cap.classList.add("swap");
        };
        $$(".std").forEach((chip) => {
            on(chip, "mouseenter", () => show(chip));
            on(chip, "focus", () => show(chip));
            on(chip, "click", () => show(chip));
            on(chip, "mouseleave", () => show(null));
            on(chip, "blur", () => show(null));
        });
    }

    // Admins: numbers count up, then apartment 11 pays and the totals update.
    const fmt = (n: number, thousands: boolean) => (thousands ? n.toLocaleString("en-US") : String(n));
    const meter = $("#bar");
    const counters = $$("#stats .cnt");
    const countTo = (el: HTMLElement, to: number, dur: number) => {
        const from = Number(el.dataset.now || 0);
        let t0: number | null = null;
        el.dataset.now = String(to);
        const st = (t: number) => {
            if (t0 == null) t0 = t;
            const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(Math.round(from + (to - from) * e), !!el.dataset.fmt);
            if (p < 1) frame(st);
        };
        frame(st);
    };
    const bump = (el: HTMLElement) => { const b = el.parentElement; if (!b) return; b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); };
    $$(".side-ink .btn.pri").forEach((b) => on(b, "mouseenter", () => counters.forEach(bump)));
    if (!reduce && meter && counters.length === 3) {
        counters.forEach((c) => { c.textContent = "0"; });
        meter.style.width = "0%";
        onView($("#admins"), () => {
            meter.style.width = "76%";
            counters.forEach((c) => countTo(c, Number(c.dataset.to), 1400));
            later(() => {
                const row = $("#row11"), em = row?.querySelector("em");
                if (!row || !em) return;
                row.classList.add("flipnow");
                em.className = "ok";
                em.textContent = "שולם";
                const coin = make("span", "coin", row);
                coin.textContent = "+280 ₪";
                later(() => coin.remove(), 1500);
                countTo(counters[0], 4560, 900);
                countTo(counters[1], 20, 600);
                meter.style.width = "81%";
                bump(counters[0]);
                bump(counters[1]);
            }, 3600);
        }, 0.3);
    }

    // Admin demo window: the sidebar switches the view.
    const tabs = $$(".br-side span"), views = $$(".br-main .view");
    tabs.forEach((t, i) => on(t, "click", () => {
        tabs.forEach((x) => x.classList.toggle("on", x === t));
        views.forEach((v) => v.classList.toggle("cur", Number(v.dataset.v) === i));
    }));

    // In your pocket: tapping the badge plays "scanned at the door".
    const badgePhone = $("#badgePhone"), badge = badgePhone?.querySelector<HTMLElement>(".ph-badge");
    if (badgePhone && badge) {
        const scan = () => {
            if (badge.classList.contains("scanned")) return;
            badge.classList.add("scanned");
            sparks(badge, ["var(--teal)", "var(--sun)", "var(--violet)"]);
            later(() => badge.classList.remove("scanned"), 1800);
        };
        on(badgePhone, "click", scan);
        if (!reduce) onView($("#app"), () => later(scan, 2600), 0.45);
    }

    return () => {
        timeouts.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        frames.forEach(cancelAnimationFrame);
        offs.forEach((off) => off());
        added.forEach((el) => el.remove());
        root.classList.remove("js");
    };
}
