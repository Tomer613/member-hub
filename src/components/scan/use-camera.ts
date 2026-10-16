"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

// The back camera in the browser, reading QR codes from its picture. Uses the browser's own detector where
// there is one (Chrome, Android) and a JavaScript reader elsewhere (Safari). A native app could do more
// (docs/waiting-for-services.he.md).
type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;

export type CameraState = "starting" | "on" | "denied" | "none";

function readFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    // A smaller copy is enough to read a code and keeps phones cool.
    const scale = Math.min(1, 640 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
}

export function useCamera(active: boolean, onCode: (text: string) => void) {
    const video = useRef<HTMLVideoElement>(null);
    const [state, setState] = useState<CameraState>("starting");
    const [torchable, setTorchable] = useState(false);
    const [torch, setTorchOn] = useState(false);
    const stream = useRef<MediaStream | null>(null);
    const handler = useRef(onCode);
    useEffect(() => {
        handler.current = onCode;
    }, [onCode]);

    useEffect(() => {
        if (!active) return;
        const run = { stop: false, timer: 0 };
        const canvas = document.createElement("canvas");
        const Ctor = (globalThis as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
        const detector = Ctor ? new Ctor({ formats: ["qr_code"] }) : null;
        (async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setState("none");
                return;
            }
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
                if (run.stop) {
                    s.getTracks().forEach((t) => t.stop());
                    return;
                }
                stream.current = s;
                const caps = (s.getVideoTracks()[0]?.getCapabilities?.() ?? {}) as { torch?: boolean };
                setTorchable(!!caps.torch);
                if (video.current) {
                    video.current.srcObject = s;
                    await video.current.play().catch(() => undefined);
                }
                setState("on");
            } catch (e) {
                setState((e as DOMException)?.name === "NotAllowedError" ? "denied" : "none");
                return;
            }
            const tick = async () => {
                if (run.stop || !video.current) return;
                let text: string | null = null;
                try {
                    text = detector ? ((await detector.detect(video.current))[0]?.rawValue ?? null) : readFrame(video.current, canvas);
                } catch {
                    text = readFrame(video.current, canvas);
                }
                if (run.stop) return;
                if (text) handler.current(text);
                else run.timer = window.setTimeout(tick, 220);
            };
            run.timer = window.setTimeout(tick, 300);
        })();
        return () => {
            run.stop = true;
            window.clearTimeout(run.timer);
            stream.current?.getTracks().forEach((t) => t.stop());
            stream.current = null;
            setTorchOn(false);
        };
    }, [active]);

    const setTorch = async (on: boolean) => {
        const track = stream.current?.getVideoTracks()[0];
        if (!track) return;
        try {
            await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
            setTorchOn(on);
        } catch {
            setTorchable(false);
        }
    };
    return { video, state, torchable, torch, setTorch };
}

// A code in a picture from the gallery.
export async function readImageFile(file: File): Promise<string | null> {
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
    } catch {
        return null;
    } finally {
        URL.revokeObjectURL(url);
    }
}
