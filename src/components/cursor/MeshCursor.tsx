"use client";
import { useEffect, useRef } from "react";
import { createMeshGrid } from "./mesh-grid";
import { subscribeLayout } from "@/lib/layout";

/**
 * Interaktiver Hintergrund (alle Layouts)
 * - Vollbild-Ebene hinter dem Inhalt: 32-px-Raster, das sich zum Zeiger hin wie eine
 *   Gravitationsmulde zusammenzieht (Radius 240 px, Feder-Dynamik, Glow in --accent).
 * - Buttons mit data-magnetic folgen dem Zeiger leicht.
 * - Der native Mauszeiger bleibt sichtbar – der frühere eigene Zeiger (Punkt mit Ring) ist entfernt.
 * - Nur bei feinem Zeiger und ohne prefers-reduced-motion (siehe ClientShell).
 */
export default function MeshCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const root = document.documentElement;
    const accent = getComputedStyle(root).getPropertyValue("--accent").trim() || "#f26a1b";
    const grid = createMeshGrid(canvas, { spacing: 32, radius: 240, accent });

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const well = { ...target };      // Mulde im Raster (Feder)
    const vel = { x: 0, y: 0 };
    let strength = 0, strengthTarget = 0;
    let raf = 0, last = performance.now(), running = false;
    let magnet: HTMLElement | null = null;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // Mulde: gedämpfte Feder (folgt spürbar nach)
      const stiffness = 70, damping = 12.5;
      vel.x += ((target.x - well.x) * stiffness - vel.x * damping) * dt;
      vel.y += ((target.y - well.y) * stiffness - vel.y * damping) * dt;
      well.x += vel.x * dt;
      well.y += vel.y * dt;
      strength += (strengthTarget - strength) * (1 - Math.pow(0.02, dt));
      grid.render({ well, strength, scrollY: window.scrollY });
      const moving = Math.hypot(target.x - well.x, target.y - well.y) > 0.3 || Math.hypot(vel.x, vel.y) > 0.5 || Math.abs(strengthTarget - strength) > 0.002;
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
      if (strengthTarget === 0) { well.x = target.x; well.y = target.y; vel.x = vel.y = 0; strengthTarget = 1; }
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        magnet.style.transform = `translate3d(${dx * 0.22}px, ${dy * 0.3}px, 0)`;
      }
      wake();
    };
    const onOver = (e: PointerEvent) => {
      const m = (e.target as HTMLElement).closest<HTMLElement>("[data-magnetic]");
      if (m === magnet) return;
      if (magnet) magnet.style.transform = "";
      magnet = m;
      if (magnet) magnet.style.transition = "transform 600ms var(--ease-fluid)";
    };
    const onLeave = () => { strengthTarget = 0; if (magnet) { magnet.style.transform = ""; magnet = null; } wake(); };
    const onResize = () => { grid.resize(); wake(); };
    const onVisibility = () => { if (!document.hidden) wake(); };

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    root.addEventListener("mouseleave", onLeave);
    addEventListener("scroll", wake, { passive: true });
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    grid.resize();
    wake();
    // Layoutwechsel: Glühfarbe aus dem neuen --accent
    const unsubLayout = subscribeLayout(() => {
      grid.setAccent(getComputedStyle(root).getPropertyValue("--accent").trim() || "#f26a1b");
      wake();
    });

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("mouseleave", onLeave);
      removeEventListener("scroll", wake);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubLayout();
      grid.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
