"use client";

import type { RefObject } from "react";
import type { CameraState } from "./use-camera";

const corner = "absolute h-12 w-12 border-[var(--mh-sun)]";

// The camera picture with the four yellow corners (board D-QrScan).
export function Viewfinder({ video, state, label }: { video: RefObject<HTMLVideoElement | null>; state: CameraState; label: string }) {
    return (
        <div className="relative mx-auto aspect-[308/300] w-full max-w-[308px]">
            <div className="absolute inset-[10px] overflow-hidden rounded-[18px] bg-black/40">
                <video ref={video} aria-label={label} muted playsInline className={`h-full w-full object-cover ${state === "on" ? "" : "invisible"}`} />
                {state !== "on" && (
                    <p role="status" className="absolute inset-0 m-0 flex items-center justify-center p-5 text-center text-[15px] font-bold text-white">
                        {state === "starting" ? "פותחים את המצלמה…" : state === "denied" ? "אין גישה למצלמה. אפשר לאשר אותה בהגדרות הדפדפן, או לבחור תמונה מהגלריה." : "אין כאן מצלמה זמינה. אפשר לבחור תמונה מהגלריה, להדביק קישור או להקליד קוד."}
                    </p>
                )}
                {state === "on" && <span aria-hidden="true" className="scan-line absolute inset-x-6 top-1/2 h-[3px] rounded-full bg-[var(--mh-sun)] opacity-80" />}
            </div>
            <span aria-hidden="true" className={`${corner} start-0 top-0 rounded-ss-[22px] border-s-[7px] border-t-[7px]`} />
            <span aria-hidden="true" className={`${corner} end-0 top-0 rounded-se-[22px] border-e-[7px] border-t-[7px]`} />
            <span aria-hidden="true" className={`${corner} bottom-0 start-0 rounded-es-[22px] border-b-[7px] border-s-[7px]`} />
            <span aria-hidden="true" className={`${corner} bottom-0 end-0 rounded-ee-[22px] border-b-[7px] border-e-[7px]`} />
        </div>
    );
}
