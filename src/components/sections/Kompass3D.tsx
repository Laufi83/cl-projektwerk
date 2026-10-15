"use client";
/**
 * Echte 3D-Bühne des Messebau-Kompasses für alle Themen (three.js, Modelle unter public/media/kompass):
 * OC-Stand 6 × 4 m als gemeinsames Standmodell, Traverse 5 × 3 m an vier Kettenzügen (Abhängungen), Sattelzug
 * und Frontstapler (Logistik). Szenen und Engine liegen in ./kompass3d und werden erst bei Sichtkontakt geladen.
 * Ziehen dreht die Kamera, Mausrad/zwei Finger zoomen. Ohne WebGL oder bei Ladefehler zeigt `fallback` die CSS-Bühne.
 * Reduzierte Bewegung: Standbild je Thema, keine automatische Kamerafahrt.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNear } from "@/hooks/useNear";
import type { KompassDesc } from "./kompass3d/types";

type Engine = Awaited<ReturnType<typeof import("./kompass3d/engine").createEngine>>;

export function Kompass3D({ desc, label, reduced, de, fallback }: { desc: KompassDesc; label: string; reduced: boolean; de: boolean; fallback: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const near = useNear(host);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [phase, setPhase] = useState("");
  const engine = useRef<Engine | null>(null);
  const latest = useRef(desc);
  useEffect(() => { latest.current = desc; }, [desc]);

  useEffect(() => {
    if (!near || !host.current || !layer.current) return;
    let disposed = false;
    setState("loading");
    (async () => {
      const { createEngine } = await import("./kompass3d/engine");
      if (disposed || !host.current || !layer.current) return;
      const e = await createEngine(host.current, layer.current, { de, reduced, onPhase: setPhase });
      if (disposed) { e.dispose(); return; }
      engine.current = e;
      await e.show(latest.current);
      if (!disposed) setState("ready");
    })().catch(() => { if (!disposed) setState("error"); });
    return () => { disposed = true; engine.current?.dispose(); engine.current = null; };
  }, [near, reduced, de]);

  // Themen- oder Wertewechsel: nur die Szene tauschen
  const key = JSON.stringify(desc);
  useEffect(() => {
    if (state !== "ready" || !engine.current) return;
    engine.current.show(latest.current).catch(() => setState("error"));
  }, [key, state]);

  if (state === "error") return <>{fallback}</>;
  return (
    <div ref={host} role="img" aria-label={label}
      className="relative h-[380px] cursor-grab touch-pan-y select-none overflow-hidden rounded-[1.75rem] border border-line bg-[#bfc4ca] active:cursor-grabbing sm:h-[460px]">
      <div ref={layer} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden />
      {state !== "ready" && <p className="absolute inset-0 grid place-items-center text-sm text-neutral-600">{de ? "3D-Szene wird geladen …" : "Loading 3D scene …"}</p>}
      {phase && (
        <div className="pointer-events-none absolute bottom-3 left-3 text-xs font-semibold">
          <span className="rounded-full bg-black/70 px-3 py-1.5 text-white backdrop-blur">{phase}</span>
        </div>
      )}
    </div>
  );
}
