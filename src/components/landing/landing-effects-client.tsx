"use client";

import { useEffect } from "react";
import { initLanding } from "./landing-effects";

// Runs the page's motion layer after hydration and tears it down on unmount.
export default function LandingEffects() {
    useEffect(() => {
        const root = document.getElementById("lp-root");
        return root ? initLanding(root) : undefined;
    }, []);
    return null;
}
