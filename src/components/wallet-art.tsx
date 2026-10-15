// A happy wallet with the invitation card hopping out of it, drawn inline so it follows the org color.
export function WalletArt({ color }: { color: string }) {
    return (
        <svg viewBox="0 0 240 150" className="h-auto w-full max-w-[240px]" role="img" aria-label="כרטיס ההזמנה קופץ מתוך ארנק">
            <g className="wl-card">
                <rect x="70" y="18" width="104" height="70" rx="12" fill={color} stroke="var(--mh-ink)" strokeWidth="3" />
                <rect x="70" y="58" width="104" height="30" rx="0" fill="#fff" stroke="var(--mh-ink)" strokeWidth="3" />
                <circle cx="88" cy="38" r="9" fill="#fff" stroke="var(--mh-ink)" strokeWidth="2.5" />
                <path d="M104 34h44M104 44h28" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
                <path d="M84 72h50" stroke="var(--mh-ink)" strokeWidth="3" strokeLinecap="round" opacity=".35" />
            </g>
            <path d="M40 66h160a14 14 0 0 1 14 14v46a14 14 0 0 1-14 14H40a14 14 0 0 1-14-14V80a14 14 0 0 1 14-14z" fill="#5B3DF5" stroke="var(--mh-ink)" strokeWidth="3" />
            <path d="M26 86h188" stroke="var(--mh-ink)" strokeWidth="3" />
            <rect x="150" y="94" width="64" height="30" rx="10" fill="#FFD84D" stroke="var(--mh-ink)" strokeWidth="3" />
            <circle cx="166" cy="109" r="5" fill="var(--mh-ink)" />
            <path d="M58 110q14 10 28 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="100" r="3.5" fill="#fff" />
            <circle cx="84" cy="100" r="3.5" fill="#fff" />
            <path className="wl-spark" d="M30 30l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#FFD84D" stroke="var(--mh-ink)" strokeWidth="2" />
            <path className="wl-spark" d="M206 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FF5C9E" stroke="var(--mh-ink)" strokeWidth="2" />
            <rect className="wl-spark" x="196" y="52" width="10" height="10" rx="2" fill="#18B8F0" stroke="var(--mh-ink)" strokeWidth="2" transform="rotate(20 201 57)" />
            <circle className="wl-spark" cx="48" cy="56" r="5" fill="#00B67A" stroke="var(--mh-ink)" strokeWidth="2" />
            <rect className="wl-spark" x="186" y="6" width="8" height="8" rx="2" fill="#FF5A36" stroke="var(--mh-ink)" strokeWidth="2" />
        </svg>
    );
}
