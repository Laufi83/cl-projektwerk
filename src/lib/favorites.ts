"use client";
import { useSyncExternalStore } from "react";

/** Favoriten („Meine Auswahl“) – gerätelokal in localStorage, ohne Server. */
const KEY = "favorites:v1";
const listeners = new Set<() => void>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

function read(): string[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache!;
}
function write(next: string[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* privater Modus */ }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    cache = null;
    listeners.forEach((l) => l());
  });
}

export const favorites = {
  list: read,
  has: (id: string) => read().includes(id),
  toggle(id: string) {
    const cur = read();
    write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  },
  remove: (id: string) => write(read().filter((x) => x !== id)),
  clear: () => write([]),
};

export function useFavorites() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    read,
    () => EMPTY,
  );
}
