"use client";
/** Welche Karte gerade „ausgeflogen“ ist (im Overlay) – der Slider blendet sie aus. */
let hidden: string | null = null;
const subs = new Set<() => void>();
export const hiddenCard = {
  get: () => hidden,
  set(slug: string | null) { hidden = slug; subs.forEach((s) => s()); },
  subscribe(cb: () => void) { subs.add(cb); return () => { subs.delete(cb); }; },
};

/** Karte unter dem Mauszeiger (Index in der gefilterten Liste, Position relativ zur Bühne). */
export type HoverInfo = { i: number; x: number; y: number } | null;
export type HoverStore = {
  get: () => HoverInfo;
  set: (h: HoverInfo) => void;
  subscribe: (cb: () => void) => () => void;
};

/** Ein Hover-Speicher je Slider (Galerie und Aufbaufilme laufen auf derselben Seite). */
export function createHoverStore(): HoverStore {
  let hover: HoverInfo = null;
  const hoverSubs = new Set<() => void>();
  return {
    get: () => hover,
    set(h) {
      if (h === hover || (h && hover && h.i === hover.i && h.x === hover.x && h.y === hover.y)) return;
      hover = h;
      hoverSubs.forEach((s) => s());
    },
    subscribe(cb) { hoverSubs.add(cb); return () => { hoverSubs.delete(cb); }; },
  };
}
