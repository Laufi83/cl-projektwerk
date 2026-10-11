"use client";
import { useSyncExternalStore } from "react";
import { localeInfo } from "@/i18n/locales";

/**
 * Gemeinsamer Takt für Uhren und Countdowns (alle 20 s).
 * Auf dem Server und beim Hydrieren 0 – damit stimmt das HTML überein; danach die echte Zeit.
 */
const listeners = new Set<() => void>();
let timer = 0;
let now = 0;
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = window.setInterval(() => { now = Date.now(); listeners.forEach((l) => l()); }, 20_000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size) { clearInterval(timer); timer = 0; }
  };
}
const snapshot = () => now || (now = Date.now());

/** Aktuelle Zeit (ms) – 0 bis nach dem Hydrieren */
export const useNow = () => useSyncExternalStore(subscribe, snapshot, () => 0);

const fmt = new Map<string, Intl.DateTimeFormat>();
/** Uhrzeit „14:32“ in einer Zeitzone; leer, solange `ms` 0 ist */
export function clockIn(ms: number, tz: string, locale: string) {
  if (!ms) return "";
  const key = `${locale}|${tz}`;
  let f = fmt.get(key);
  if (!f) fmt.set(key, (f = new Intl.DateTimeFormat(localeInfo(locale).intl, { hour: "2-digit", minute: "2-digit", timeZone: tz })));
  return f.format(ms);
}
