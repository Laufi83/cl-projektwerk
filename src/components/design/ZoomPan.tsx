"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { MagnifyingGlassMinus, MagnifyingGlassPlus, ArrowsIn } from "@phosphor-icons/react";

/** Zoom & Pan per Mausrad, Ziehen, Doppelklick, Pinch und Tasten (+ / − / 0). */
export function ZoomPan({ children, labels, max = 6, className = "" }: { children: ReactNode; labels: { in: string; out: string; reset: string }; max?: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ x: number; y: number; d: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const clampPan = useCallback((s: number, x: number, y: number) => {
    const el = box.current;
    if (!el) return { s, x, y };
    const w = el.clientWidth, h = el.clientHeight;
    const mx = ((s - 1) * w) / 2, my = ((s - 1) * h) / 2;
    return { s, x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  }, []);

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    setZ((cur) => {
      const s = Math.max(1, Math.min(max, cur.s * factor));
      const el = box.current;
      if (!el || cx === undefined || cy === undefined) return clampPan(s, cur.x * (s / cur.s), cur.y * (s / cur.s));
      const r = el.getBoundingClientRect();
      const px = cx - r.left - r.width / 2, py = cy - r.top - r.height / 2;
      const k = s / cur.s;
      return clampPan(s, px - (px - cur.x) * k, py - (py - cur.y) * k);
    });
  }, [clampPan, max]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    last.current = null;
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const d = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    if (last.current) {
      const dx = cx - last.current.x, dy = cy - last.current.y;
      if (pts.length > 1 && last.current.d) zoomAt(d / last.current.d, cx, cy);
      setZ((cur) => (cur.s > 1 ? clampPan(cur.s, cur.x + dx, cur.y + dy) : cur));
    }
    last.current = { x: cx, y: cy, d };
  };
  const onUp = (e: React.PointerEvent) => { pointers.current.delete(e.pointerId); last.current = null; if (!pointers.current.size) setDragging(false); };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={box}
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onDoubleClick={(e) => (z.s > 1 ? setZ({ s: 1, x: 0, y: 0 }) : zoomAt(2.5, e.clientX, e.clientY))}
        onKeyDown={(e) => {
          if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomAt(1.4); }
          if (e.key === "-") { e.preventDefault(); zoomAt(1 / 1.4); }
          if (e.key === "0") { e.preventDefault(); setZ({ s: 1, x: 0, y: 0 }); }
        }}
        className="h-full w-full touch-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ cursor: z.s > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
        data-cursor="native"
        data-lenis-prevent
      >
        <div className="h-full w-full origin-center" style={{ transform: `translate3d(${z.x}px, ${z.y}px, 0) scale(${z.s})`, transition: dragging ? "none" : "transform 350ms var(--ease-fluid)" }}>
          {children}
        </div>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-1 rounded-full bg-black/55 p-1 backdrop-blur">
        <button type="button" onClick={() => zoomAt(1 / 1.4)} aria-label={labels.out} className="grid size-9 place-items-center rounded-full hover:bg-white/10"><MagnifyingGlassMinus size={16} /></button>
        <button type="button" onClick={() => setZ({ s: 1, x: 0, y: 0 })} aria-label={labels.reset} className="grid size-9 place-items-center rounded-full hover:bg-white/10"><ArrowsIn size={16} /></button>
        <button type="button" onClick={() => zoomAt(1.4)} aria-label={labels.in} className="grid size-9 place-items-center rounded-full hover:bg-white/10"><MagnifyingGlassPlus size={16} /></button>
      </div>
    </div>
  );
}
