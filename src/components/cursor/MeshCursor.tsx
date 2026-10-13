"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createMeshGrid } from "./mesh-grid";
import { subscribeLayout } from "@/lib/layout";

/**
 * Mesh-Flow-Cursor
 * - Vollbild-Ebene hinter dem Inhalt: 32-px-Raster, das sich zum Zeiger hin wie eine
 *   Gravitationsmulde zusammenzieht (Radius 240 px, Feder-Dynamik, Glow in --accent).
 * - Fadenkreuz „+“ folgt per lerp 0.15; Zustände: Ring mit Label, Hand (Slider), Text (Formulare).
 * - Nur bei feinem Zeiger und ohne prefers-reduced-motion (siehe ClientShell).
 * - Liegt als Popover in der Top-Layer: modale <dialog>-Fenster (Design-Overlay, Lightbox)
 *   liegen sonst über jedem z-index und verdecken den Cursor, während der native Zeiger aus ist.
 */
type CursorState = "default" | "ring" | "hand" | "grab" | "text" | "native" | "hidden";

export default function MeshCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const t = useTranslations("common");
  const labels = useRef({ view: "", open: "", drag: "" });
  useEffect(() => { labels.current = { view: t("view"), open: t("open"), drag: t("drag") }; }, [t]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const cursor = cursorRef.current!;
    const label = labelRef.current!;
    const root = document.documentElement;
    root.dataset.cursor = "on";

    const accent = getComputedStyle(root).getPropertyValue("--accent").trim() || "#f26a1b";
    const grid = createMeshGrid(canvas, { spacing: 32, radius: 240, accent });

    // Zustand
    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { ...target };       // Fadenkreuz (lerp)
    const well = { ...target };      // Mulde (Feder)
    const vel = { x: 0, y: 0 };
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
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // Fadenkreuz: lerp 0.15 bei 60 fps, bildratenunabhängig
      const k = 1 - Math.pow(1 - 0.15, dt * 60);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      // Mulde: gedämpfte Feder (folgt spürbar nach)
      const stiffness = 70, damping = 12.5;
      vel.x += ((target.x - well.x) * stiffness - vel.x * damping) * dt;
      vel.y += ((target.y - well.y) * stiffness - vel.y * damping) * dt;
      well.x += vel.x * dt;
      well.y += vel.y * dt;
      strength += (strengthTarget - strength) * (1 - Math.pow(0.02, dt));

      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      grid.render({ well, strength, scrollY: window.scrollY });

      const moving = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.1 || Math.hypot(vel.x, vel.y) > 0.5 || Math.abs(strengthTarget - strength) > 0.002;
      if (moving) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const wake = () => {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      target.x = e.clientX; target.y = e.clientY;
      if (strengthTarget === 0) { // nach dem Wiedereintreten nicht quer über den Schirm fliegen
        if (state === "hidden") { pos.x = well.x = target.x; pos.y = well.y = target.y; }
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
      const hand = el.closest<HTMLElement>("[data-cursor='hand']");
      if (hand) return setState(pressed ? "grab" : "hand", hand.dataset.cursorLabel ?? "");
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
    const onDown = () => { pressed = true; if (state === "hand") setState("grab", label.textContent ?? ""); cursor.dataset.pressed = "true"; };
    const onUp = () => { pressed = false; if (state === "grab") setState("hand", label.textContent ?? ""); cursor.dataset.pressed = "false"; };
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
        <span className="mesh-cursor__halo" />
        <span className="mesh-cursor__cross" />
        <span className="mesh-cursor__ring">
          <span ref={labelRef} className="mesh-cursor__label" />
        </span>
        <svg className="mesh-cursor__hand" viewBox="0 0 32 32" width="32" height="32">
          <path className="open" d="M11 16V7.5a1.75 1.75 0 0 1 3.5 0V15m0-.5V5.75a1.75 1.75 0 0 1 3.5 0V15m0-.5V7a1.75 1.75 0 0 1 3.5 0v9m0-4.5a1.75 1.75 0 0 1 3.5 0V19c0 5-3.6 9-8.5 9h-1.2c-2.7 0-4.4-1-6-3.1L6.4 19.6a1.8 1.8 0 0 1 2.7-2.4L11 19" />
          <path className="closed" d="M11 17v-4.5a1.75 1.75 0 0 1 3.5 0V15m0-3.5a1.75 1.75 0 0 1 3.5 0V15m0-3a1.75 1.75 0 0 1 3.5 0v3m0-1.5a1.75 1.75 0 0 1 3.5 0V19c0 5-3.6 9-8.5 9h-1.2c-2.7 0-4.4-1-6-3.1L7.5 20.7a1.8 1.8 0 0 1 2.6-2.4L11 19.3" />
        </svg>
      </div>
      <style>{`
        .mesh-cursor { position: fixed; inset: 0 auto auto 0; z-index: 95; width: 0; height: 0; margin: 0; padding: 0; border: 0; background: none; color: inherit; overflow: visible; pointer-events: none; will-change: transform; }
        .mesh-cursor > * { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); transition: opacity 400ms var(--ease-fluid), transform 600ms var(--ease-fluid), width 600ms var(--ease-fluid), height 600ms var(--ease-fluid); }
        .mesh-cursor__halo { width: 42px; height: 42px; border: 1px solid color-mix(in oklab, var(--accent) 52%, transparent); border-radius: 50%; opacity: .7; box-shadow: 0 0 24px -10px var(--accent), inset 0 0 14px -11px var(--accent); transition: width 280ms cubic-bezier(.2,.8,.2,1), height 280ms cubic-bezier(.2,.8,.2,1), opacity 280ms ease; }
        .mesh-cursor[data-state="ring"] .mesh-cursor__halo { width: 98px; height: 98px; opacity: .3; }
        .mesh-cursor[data-state="hand"] .mesh-cursor__halo, .mesh-cursor[data-state="grab"] .mesh-cursor__halo { width: 48px; height: 48px; opacity: .35; }
        .mesh-cursor[data-pressed="true"] .mesh-cursor__halo { width: 26px; height: 26px; }
        @media (prefers-reduced-motion:reduce) { .mesh-cursor__halo { transition: none; } }
        .mesh-cursor__cross { width: 22px; height: 22px; }
        .mesh-cursor__cross::before, .mesh-cursor__cross::after { content: ""; position: absolute; background: #fff; mix-blend-mode: difference; }
        .mesh-cursor__cross::before { left: 50%; top: 0; width: 1.25px; height: 100%; transform: translateX(-50%); }
        .mesh-cursor__cross::after { top: 50%; left: 0; height: 1.25px; width: 100%; transform: translateY(-50%); }
        .mesh-cursor__ring { width: 10px; height: 10px; border-radius: 999px; border: 1px solid var(--accent); opacity: 0; display: grid; place-items: center; background: color-mix(in oklab, var(--bg) 35%, transparent); backdrop-filter: blur(2px); }
        .mesh-cursor__label { font: 600 10px/1 var(--font-sans); letter-spacing: .16em; text-transform: uppercase; color: var(--fg); white-space: nowrap; opacity: 0; transition: opacity 300ms var(--ease-fluid); }
        .mesh-cursor__hand { width: 34px; height: 34px; opacity: 0; fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 2px 6px rgba(0,0,0,.6)); }
        .mesh-cursor__hand .closed { display: none; }
        .mesh-cursor[data-state="ring"] .mesh-cursor__cross { opacity: 0; transform: translate(-50%, -50%) scale(.4); }
        .mesh-cursor[data-state="ring"] .mesh-cursor__ring { opacity: 1; width: 76px; height: 76px; }
        .mesh-cursor[data-state="ring"] .mesh-cursor__label:not(:empty) { opacity: 1; }
        .mesh-cursor[data-state="ring"][data-pressed="true"] .mesh-cursor__ring { transform: translate(-50%, -50%) scale(.9); }
        .mesh-cursor[data-state="hand"] .mesh-cursor__cross, .mesh-cursor[data-state="grab"] .mesh-cursor__cross { opacity: 0; }
        .mesh-cursor[data-state="hand"] .mesh-cursor__hand, .mesh-cursor[data-state="grab"] .mesh-cursor__hand { opacity: 1; }
        .mesh-cursor[data-state="grab"] .mesh-cursor__hand .open { display: none; }
        .mesh-cursor[data-state="grab"] .mesh-cursor__hand .closed { display: block; }
        .mesh-cursor[data-state="grab"] .mesh-cursor__hand { transform: translate(-50%, -50%) scale(.92); }
        /* ── Eigener Cursor je Layout (html[data-layout]) ── */
        /* Wood: kleine Holzlamelle, Ring mit Lamellenstruktur und warmem Licht */
        html[data-layout="wood"] .mesh-cursor__cross { width: 14px; height: 22px; border-radius: 3px; background: repeating-linear-gradient(90deg, var(--accent) 0 3px, transparent 3px 5px); mix-blend-mode: normal; }
        html[data-layout="wood"] .mesh-cursor__cross::before, html[data-layout="wood"] .mesh-cursor__cross::after { display: none; }
        html[data-layout="wood"] .mesh-cursor__ring { border-color: var(--accent); background: repeating-linear-gradient(90deg, rgb(211 154 94 / .14) 0 2px, transparent 2px 7px); box-shadow: 0 0 30px -8px rgb(227 176 122 / .7); }
        /* Aurora: weicher Lichtpunkt, Ring als leuchtende Linse */
        html[data-layout="aurora"] .mesh-cursor__cross { width: 28px; height: 28px; border-radius: 50%; background: radial-gradient(circle, rgb(124 245 212 / .9) 0 18%, rgb(182 156 255 / .45) 45%, transparent 70%); filter: blur(.6px); }
        html[data-layout="aurora"] .mesh-cursor__cross::before, html[data-layout="aurora"] .mesh-cursor__cross::after { display: none; }
        html[data-layout="aurora"] .mesh-cursor__ring { border-color: var(--accent-2); box-shadow: 0 0 28px -4px var(--accent-2), inset 0 0 18px -6px var(--accent); }
        html[data-layout="aurora"] .mesh-cursor[data-state="ring"] .mesh-cursor__ring { width: 88px; height: 88px; }
        /* Tide: fließender Tropfen, Ring als Welle */
        html[data-layout="tide"] .mesh-cursor__cross { width: 26px; height: 26px; background: var(--accent); opacity: .92; border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%; animation: cursor-blob 4.2s ease-in-out infinite; mix-blend-mode: normal; }
        html[data-layout="tide"] .mesh-cursor__cross::before, html[data-layout="tide"] .mesh-cursor__cross::after { display: none; }
        html[data-layout="tide"] .mesh-cursor__ring { border-radius: 58% 42% 52% 48% / 46% 54% 46% 54%; border-width: 2px; animation: cursor-blob 3.2s ease-in-out infinite; }
        html[data-layout="tide"] .mesh-cursor[data-state="ring"] .mesh-cursor__ring { width: 84px; height: 84px; }
        @keyframes cursor-blob { 0%,100% { border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%; } 33% { border-radius: 42% 58% 38% 62% / 58% 42% 60% 40%; } 66% { border-radius: 52% 48% 63% 37% / 40% 60% 42% 58%; } }
        /* Monochrom: eckiger Rahmen, rein Schwarz-Weiß */
        html[data-layout="mono"] .mesh-cursor__cross { width: 16px; height: 16px; border: 1px solid #fff; mix-blend-mode: difference; }
        html[data-layout="mono"] .mesh-cursor__cross::before, html[data-layout="mono"] .mesh-cursor__cross::after { display: none; }
        html[data-layout="mono"] .mesh-cursor__ring { border-radius: 0; border: 1px solid #fff; background: transparent; backdrop-filter: none; }
        html[data-layout="mono"] .mesh-cursor[data-state="ring"] .mesh-cursor__ring { width: 72px; height: 72px; background: #fff; mix-blend-mode: difference; }
        html[data-layout="mono"] .mesh-cursor__label { color: #000; }
        html[data-layout="mono"] .mesh-cursor__hand { filter: none; }
        .mesh-cursor[data-state="text"] > *, .mesh-cursor[data-state="native"] > *, .mesh-cursor[data-state="hidden"] > * { opacity: 0 !important; }
      `}</style>
    </>
  );
}
