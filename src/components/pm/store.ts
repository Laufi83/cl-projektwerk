"use client";
/**
 * Kleiner Speicher für die Projektleiter-Werkzeuge: Werte liegen im Arbeitsspeicher und zusätzlich im localStorage
 * dieses Browsers (Schlüssel „pm:<name>“). Kein Server, keine Übertragung – andere Geräte sehen die Daten nicht.
 * Gesperrter Speicher (privater Modus) ist kein Fehler: dann gilt der Stand nur bis zum Neuladen.
 */
import { useCallback, useSyncExternalStore } from "react";

const EVT = "pm-store";
const mem = new Map<string, unknown>();

function get<T>(key: string, init: T): T {
  if (!mem.has(key)) {
    let v: T = init;
    try {
      const raw = localStorage.getItem("pm:" + key);
      if (raw) {
        const parsed = JSON.parse(raw);
        v = init && typeof init === "object" && !Array.isArray(init) && parsed && typeof parsed === "object" ? { ...init, ...parsed } : parsed;
      }
    } catch { /* gesperrt oder kaputt: Standard */ }
    mem.set(key, v);
  }
  return mem.get(key) as T;
}

function put<T>(key: string, v: T) {
  mem.set(key, v);
  try { localStorage.setItem("pm:" + key, JSON.stringify(v)); } catch { /* voll oder gesperrt: nur Arbeitsspeicher */ }
  window.dispatchEvent(new Event(EVT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
};

/** Wert mit Speicher; `init` muss eine stabile Konstante sein (Modulebene) */
export function usePm<T>(key: string, init: T): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(subscribe, () => get(key, init), () => init);
  const set = useCallback((next: T | ((prev: T) => T)) => {
    const prev = get(key, init);
    put(key, typeof next === "function" ? (next as (p: T) => T)(prev) : next);
  }, [key, init]);
  return [value, set];
}

/** alle Werkzeugdaten löschen (Projekt neu beginnen) */
export function resetPm() {
  try { for (const k of Object.keys(localStorage)) if (k.startsWith("pm:")) localStorage.removeItem(k); } catch { /* egal */ }
  mem.clear();
  window.dispatchEvent(new Event(EVT));
}
