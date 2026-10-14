// "לפני 3 שעות" style labels for the devices list. Plural Hebrew forms, no gendered words.
export function timeAgoHe(then: Date, now = new Date()): string {
    const min = Math.floor((now.getTime() - then.getTime()) / 60000);
    if (min < 5) return "פעיל עכשיו";
    if (min < 60) return `לפני ${min} דקות`;
    const h = Math.floor(min / 60);
    if (h < 24) return h === 1 ? "לפני שעה" : h === 2 ? "לפני שעתיים" : `לפני ${h} שעות`;
    const d = Math.floor(h / 24);
    if (d < 30) return d === 1 ? "אתמול" : d === 2 ? "לפני יומיים" : `לפני ${d} ימים`;
    const m = Math.floor(d / 30);
    return m === 1 ? "לפני חודש" : m === 2 ? "לפני חודשיים" : `לפני ${m} חודשים`;
}
