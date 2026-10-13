"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createMeshGrid } from "./mesh-grid";
import { subscribeLayout } from "@/lib/layout";

/**
 * Leucht-Cursor mit Mesh-Hintergrund
 * - Vollbild-Ebene hinter dem Inhalt: 32-px-Raster, das sich zum Zeiger hin wie eine
 *   Gravitationsmulde zusammenzieht (Radius 240 px, Feder-Dynamik, Glow in --accent).
 * - Vorn ein kleiner leuchtender Punkt (folgt fast sofort) und ein Halo-Ring, der federnd nachläuft
 *   und sich in Bewegungsrichtung streckt. Über Links/Buttons wächst der Halo, ein Etikett erscheint
 *   neben dem Punkt; beim Klicken läuft eine Lichtwelle. Hand für ziehbare Flächen, Textfelder nativ.
 * - Nur bei feinem Zeiger und ohne prefers-reduced-motion (siehe ClientShell).
 * - Liegt als Popover in der Top-Layer: modale <dialog>-Fenster (Design-Overlay, Lightbox)
 *   liegen sonst über jedem z-index und verdecken den Cursor, während der native Zeiger aus ist.
 */
type CursorState = "default" | "ring" | "hand" | "grab" | "text" | "native" | "hidden";

/** Halo-Größe je Zustand (Faktor auf 30 px) */
const HALO: Partial<Record<CursorState, number>> = { default: 1, ring: 1.8, hand: 1.3, grab: 1.1 };

export default function MeshCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const haloRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const handRef = useRef<SVGSVGElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const t = useTranslations("common");
  const labels = useRef({ view: "", open: "", drag: "" });
  useEffect(() => { labels.current = { view: t("view"), open: t("open"), drag: t("drag") }; }, [t]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const cursor = cursorRef.current!;
    const dot = dotRef.current!, halo = haloRef.current!, label = labelRef.current!, hand = handRef.current!, ripple = rippleRef.current!;
    const root = document.documentElement;
    root.dataset.cursor = "on";

    const accent = getComputedStyle(root).getPropertyValue("--accent").trim() || "#f26a1b";
    const grid = createMeshGrid(canvas, { spacing: 32, radius: 240, accent });

    // Zustand
    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { ...target };       // Punkt (lerp, schnell)
    const ring = { ...target };      // Halo (Feder, läuft nach)
    const ringVel = { x: 0, y: 0 };
    const well = { ...target };      // Mulde im Raster (Feder)
    const vel = { x: 0, y: 0 };
    let scale = 1, dotScale = 1;
    let strength = 0, strengthTarget = 0;
    let state: CursorState = "default";
    let pressed = false;
    let raf = 0, last = performance.now(), running = false;
    let magnet: HTMLElement | null = null;

    const setState = (s: CursorState, text = "") => {
      if (s === state && label.textContent === text) return;
      state = s;
      cursor.dataset.state = s;
      label.textContent = text;
      wake();
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // Punkt: fast direkt am Zeiger (lerp 0.42 bei 60 fps, bildratenunabhängig)
      const k = 1 - Math.pow(1 - 0.42, dt * 60);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      // Halo: weichere Feder als der Punkt
      const hs = 210, hd = 21;
      ringVel.x += ((target.x - ring.x) * hs - ringVel.x * hd) * dt;
      ringVel.y += ((target.y - ring.y) * hs - ringVel.y * hd) * dt;
      ring.x += ringVel.x * dt;
      ring.y += ringVel.y * dt;
      // Mulde: gedämpfte Feder (folgt spürbar nach)
      const stiffness = 70, damping = 12.5;
      vel.x += ((target.x - well.x) * stiffness - vel.x * damping) * dt;
      vel.y += ((target.y - well.y) * stiffness - vel.y * damping) * dt;
      well.x += vel.x * dt;
      well.y += vel.y * dt;
      strength += (strengthTarget - strength) * (1 - Math.pow(0.02, dt));
      // Größen weich angleichen
      const ks = 1 - Math.pow(1 - 0.2, dt * 60);
      scale += ((HALO[state] ?? 1) * (pressed ? 0.78 : 1) - scale) * ks;
      dotScale += ((state === "ring" ? 0.55 : pressed ? 0.6 : 1) - dotScale) * ks;

      // Halo in Bewegungsrichtung strecken
      const speed = Math.hypot(ringVel.x, ringVel.y);
      const stretch = state === "default" ? Math.min(speed / 2600, 0.42) : 0;
      const angle = Math.atan2(ringVel.y, ringVel.x);
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${dotScale.toFixed(3)})`;
      halo.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) rotate(${angle}rad) scale(${(scale * (1 + stretch)).toFixed(3)}, ${(scale * (1 - stretch * 0.55)).toFixed(3)})`;
      label.style.transform = `translate3d(${pos.x + 18}px, ${pos.y + 16}px, 0)`;
      hand.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${state === "grab" ? 0.9 : 1})`;
      grid.render({ well, strength, scrollY: window.scrollY });

      const moving = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.1 || speed > 0.5 || Math.hypot(vel.x, vel.y) > 0.5
        || Math.abs(strengthTarget - strength) > 0.002 || Math.abs((HALO[state] ?? 1) * (pressed ? 0.78 : 1) - scale) > 0.002;
      if (moving) raf = requestAnimationFrame(frame);
      else running = false;
    };
    function wake() {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      target.x = e.clientX; target.y = e.clientY;
      if (strengthTarget === 0) { // nach dem Wiedereintreten nicht quer über den Schirm fliegen
        if (state === "hidden") { pos.x = ring.x = well.x = target.x; pos.y = ring.y = well.y = target.y; ringVel.x = ringVel.y = 0; }
        strengthTarget = 1;
        if (state === "hidden") setState("default");
      }
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        magnet.style.transform = `translate3d(${dx * 0.22}px, ${dy * 0.3}px, 0)`;
      }
      wake();
    };
    const onOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      // eigener nativer Zeiger (z. B. Lupe/Greifhand beim Zoomen)
      if (el.closest("[data-cursor='native']")) return setState("native");
      const textField = el.closest("input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, [contenteditable=true]");
      if (textField) return setState("text");
      const grab = el.closest<HTMLElement>("[data-cursor='hand']");
      if (grab) return setState(pressed ? "grab" : "hand", grab.dataset.cursorLabel ?? "");
      const interactive = el.closest<HTMLElement>("a, button, [role=button], select, summary, label, [data-cursor-label]");
      if (interactive) {
        const custom = interactive.dataset.cursorLabel;
        const fallback = interactive.tagName === "A" ? labels.current.view : "";
        setState("ring", custom ?? fallback);
      } else setState("default");

      const m = el.closest<HTMLElement>("[data-magnetic]");
      if (m !== magnet) {
        if (magnet) { magnet.style.transform = ""; }
        magnet = m;
        if (magnet) magnet.style.transition = "transform 600ms var(--ease-fluid)";
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pressed = true;
      if (state === "hand") setState("grab", label.textContent ?? "");
      cursor.dataset.pressed = "true";
      // Lichtwelle am Klickpunkt
      if (state !== "text" && state !== "native" && state !== "hidden") {
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        ripple.animate(
          [{ transform: "translate(-50%, -50%) scale(.3)", opacity: 0.9 }, { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 }],
          { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      }
      wake();
    };
    const onUp = () => { pressed = false; if (state === "grab") setState("hand", label.textContent ?? ""); cursor.dataset.pressed = "false"; wake(); };
    const onLeave = () => { strengthTarget = 0; setState("hidden"); if (magnet) { magnet.style.transform = ""; magnet = null; } wake(); };
    const onResize = () => { grid.resize(); wake(); };
    const onVisibility = () => { if (!document.hidden) wake(); };

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerover", onOver, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("mouseleave", onLeave);
    addEventListener("scroll", wake, { passive: true });
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    setState("hidden");
    grid.resize();
    wake();

    // In die Top-Layer heben – und nach jedem neu geöffneten Dialog erneut, damit der Cursor darüber liegt
    const lift = () => {
      if (typeof cursor.showPopover !== "function") return;
      try {
        if (cursor.matches(":popover-open")) cursor.hidePopover();
        cursor.showPopover();
      } catch {}
    };
    lift();
    const dialogs = new MutationObserver((records) => {
      if (records.some((r) => r.target instanceof HTMLDialogElement && r.target.open)) lift();
    });
    dialogs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    // Layoutwechsel: Glühfarbe aus dem neuen --accent
    const unsubLayout = subscribeLayout(() => {
      grid.setAccent(getComputedStyle(root).getPropertyValue("--accent").trim() || "#f26a1b");
      wake();
    });

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerover", onOver);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      removeEventListener("scroll", wake);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubLayout();
      dialogs.disconnect();
      try { cursor.hidePopover?.(); } catch {}
      grid.dispose();
      delete root.dataset.cursor;
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      <div ref={cursorRef} aria-hidden className="mesh-cursor" data-state="hidden" popover="manual">
        <span ref={rippleRef} className="mc-ripple" />
        <span ref={haloRef} className="mc-halo" />
        <span ref={dotRef} className="mc-dot" />
        <span ref={labelRef} className="mc-label" />
        <svg ref={handRef} className="mc-hand" viewBox="0 0 32 32" width="26" height="26">
          <path className="open" d="M11 16V7.5a1.75 1.75 0 0 1 3.5 0V15m0-.5V5.75a1.75 1.75 0 0 1 3.5 0V15m0-.5V7a1.75 1.75 0 0 1 3.5 0v9m0-4.5a1.75 1.75 0 0 1 3.5 0V19c0 5-3.6 9-8.5 9h-1.2c-2.7 0-4.4-1-6-3.1L6.4 19.6a1.8 1.8 0 0 1 2.7-2.4L11 19" />
          <path className="closed" d="M11 17v-4.5a1.75 1.75 0 0 1 3.5 0V15m0-3.5a1.75 1.75 0 0 1 3.5 0V15m0-3a1.75 1.75 0 0 1 3.5 0v3m0-1.5a1.75 1.75 0 0 1 3.5 0V19c0 5-3.6 9-8.5 9h-1.2c-2.7 0-4.4-1-6-3.1L7.5 20.7a1.8 1.8 0 0 1 2.6-2.4L11 19.3" />
        </svg>
      </div>
      <style>{`
        .mesh-cursor { position: fixed; inset: 0 auto auto 0; z-index: 95; width: 0; height: 0; margin: 0; padding: 0; border: 0; background: none; color: inherit; overflow: visible; pointer-events: none; }
        .mesh-cursor > * { position: absolute; left: 0; top: 0; will-change: transform; transition: opacity 300ms var(--ease-fluid); }
        /* Punkt: klein, hell, mit mehrstufigem Glühen */
        .mc-dot { width: 8px; height: 8px; border-radius: 50%; background: color-mix(in oklab, var(--accent) 70%, #fff);
          box-shadow: 0 0 4px 1px var(--accent), 0 0 14px 3px color-mix(in oklab, var(--accent) 65%, transparent), 0 0 34px 8px color-mix(in oklab, var(--accent) 28%, transparent); }
        /* Halo: läuft nach, atmet leicht, streckt sich in Bewegungsrichtung */
        .mc-halo { width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--accent);
          background: radial-gradient(circle, color-mix(in oklab, var(--accent) 18%, transparent) 0 45%, transparent 72%);
          box-shadow: 0 0 10px 0 color-mix(in oklab, var(--accent) 85%, transparent), 0 0 28px 3px color-mix(in oklab, var(--accent) 35%, transparent), inset 0 0 12px -2px color-mix(in oklab, var(--accent) 65%, transparent); }
        .mc-halo::after { content: ""; position: absolute; inset: -6px; border-radius: inherit; box-shadow: 0 0 22px 2px color-mix(in oklab, var(--accent) 45%, transparent); opacity: .35; animation: mc-breathe 2.6s ease-in-out infinite; }
        @keyframes mc-breathe { 50% { opacity: .9; } }
        .mesh-cursor[data-state="ring"] .mc-halo { background: radial-gradient(circle, color-mix(in oklab, var(--accent) 26%, transparent) 0 55%, transparent 75%); border-color: var(--accent); }
        /* Etikett neben dem Punkt (Ansehen, Öffnen, Ziehen …) */
        .mc-label { font: 700 10px/1 var(--font-sans); letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; color: var(--accent-contrast, #111);
          background: var(--accent); padding: 5px 8px 4px; border-radius: 999px; opacity: 0; box-shadow: 0 0 18px -2px color-mix(in oklab, var(--accent) 80%, transparent); }
        .mesh-cursor[data-state="ring"] .mc-label:not(:empty), .mesh-cursor[data-state="hand"] .mc-label:not(:empty), .mesh-cursor[data-state="grab"] .mc-label:not(:empty) { opacity: 1; }
        /* Lichtwelle beim Klicken */
        .mc-ripple { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--accent); box-shadow: 0 0 18px var(--accent); opacity: 0; transform: translate(-50%, -50%); }
        /* Hand für ziehbare Flächen */
        .mc-hand { opacity: 0; fill: none; stroke: #fff; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 80%, transparent)) drop-shadow(0 2px 4px rgba(0,0,0,.6)); }
        .mc-hand .closed { display: none; }
        .mesh-cursor[data-state="hand"] .mc-hand, .mesh-cursor[data-state="grab"] .mc-hand { opacity: 1; }
        .mesh-cursor[data-state="hand"] .mc-dot, .mesh-cursor[data-state="grab"] .mc-dot { opacity: 0; }
        .mesh-cursor[data-state="grab"] .mc-hand .open { display: none; }
        .mesh-cursor[data-state="grab"] .mc-hand .closed { display: block; }
        .mesh-cursor[data-state="text"] > *, .mesh-cursor[data-state="native"] > *, .mesh-cursor[data-state="hidden"] > * { opacity: 0 !important; }

        /* ── Eigener Cursor je Layout (html[data-layout]) ── */
        /* Wood: kleine Holzlamelle mit warmem Licht */
        html[data-layout="wood"] .mc-dot { width: 6px; height: 13px; border-radius: 2px; background: linear-gradient(#f3c48f, var(--accent)); }
        html[data-layout="wood"] .mc-halo { border-color: rgb(227 176 122 / .85); background: repeating-linear-gradient(90deg, rgb(211 154 94 / .16) 0 2px, transparent 2px 6px); }
        /* Aurora: Lichtpunkt in Mint, Halo in Violett */
        html[data-layout="aurora"] .mc-dot { background: radial-gradient(circle, #eafff8 0 30%, var(--accent) 70%); }
        html[data-layout="aurora"] .mc-halo { border-color: var(--accent-2); box-shadow: 0 0 18px -2px var(--accent-2), inset 0 0 12px -3px var(--accent); }
        /* Tide: Tropfen, der sich bewegt */
        html[data-layout="tide"] .mc-dot { width: 10px; height: 10px; border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%; animation: mc-blob 3.6s ease-in-out infinite; }
        html[data-layout="tide"] .mc-halo { border-radius: 58% 42% 52% 48% / 46% 54% 46% 54%; animation: mc-blob 3.2s ease-in-out infinite; }
        @keyframes mc-blob { 0%,100% { border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%; } 33% { border-radius: 42% 58% 38% 62% / 58% 42% 60% 40%; } 66% { border-radius: 52% 48% 63% 37% / 40% 60% 42% 58%; } }
        /* Monochrom: eckig, Schwarz-Weiß mit weißem Schein */
        html[data-layout="mono"] .mc-dot { border-radius: 1px; background: #fff; box-shadow: 0 0 10px 1px rgb(255 255 255 / .7); }
        html[data-layout="mono"] .mc-halo { border-radius: 2px; border-color: #fff; background: transparent; box-shadow: 0 0 14px -2px rgb(255 255 255 / .6); }
        html[data-layout="mono"] .mc-halo::after { box-shadow: 0 0 18px 1px rgb(255 255 255 / .35); }
        html[data-layout="mono"] .mc-label { background: #fff; color: #000; box-shadow: 0 0 14px rgb(255 255 255 / .5); }
        html[data-layout="mono"] .mc-ripple { border-color: #fff; box-shadow: 0 0 14px #fff; border-radius: 2px; }
      `}</style>
    </>
  );
}
