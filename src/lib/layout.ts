"use client";
import { useSyncExternalStore } from "react";
import { DEFAULT_LAYOUT, LAYOUT_STORAGE_KEY, isLayoutId, layoutById, type LayoutId } from "@/config/layouts";

/** Aktives Layout = data-layout am <html> (vom Init-Skript vor dem ersten Zeichnen gesetzt). */
const subs = new Set<() => void>();

export function getLayout(): LayoutId {
  const v = document.documentElement.dataset.layout;
  return isLayoutId(v) ? v : DEFAULT_LAYOUT;
}

function apply(id: LayoutId) {
  document.documentElement.dataset.layout = id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", layoutById(id).theme);
  try { localStorage.setItem(LAYOUT_STORAGE_KEY, id); } catch {}
  subs.forEach((s) => s());
}

/**
 * Layout wechseln. Mit View Transition (Kreis wächst vom Ursprung, z. B. der Lasche),
 * sonst sofort. Bei reduzierter Bewegung ohne Animation.
 */
export function setLayout(id: LayoutId, origin?: { x: number; y: number }) {
  if (id === getLayout()) return;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) { apply(id); return; }
  const root = document.documentElement;
  root.style.setProperty("--vt-x", `${origin?.x ?? innerWidth}px`);
  root.style.setProperty("--vt-y", `${origin?.y ?? innerHeight / 2}px`);
  doc.startViewTransition(() => apply(id));
}

export function subscribeLayout(cb: () => void) {
  subs.add(cb);
  return () => { subs.delete(cb); };
}

export function useLayout(): LayoutId {
  return useSyncExternalStore(subscribeLayout, getLayout, () => DEFAULT_LAYOUT);
}
