// Generalized from d3teman's toWhatsAppNumber, which assumed Israel. The default country calling
// code is a parameter now (an org's country decides it).

// Digits only, international format without "+", as wa.me links require.
export function toWhatsAppNumber(phone: string, defaultCallingCode = "972"): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("00")) return digits.slice(2); // 00972... style
    if (digits.startsWith("0")) return `${defaultCallingCode}${digits.slice(1)}`;
    return digits;
}
