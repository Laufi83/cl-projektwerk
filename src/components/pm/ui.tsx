"use client";
/** Bausteine der Projektleiter-Werkzeuge: Karten, Eingabefelder, Ampel, Knöpfe – im Stil der Website (Tokens aus globals.css). */
import type { ReactNode } from "react";

export const inputCls = "w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent";
export const btnCls = "inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent disabled:opacity-50";
export const btnAccent = "inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-transform hover:scale-[1.03] active:scale-[0.98]";

export function Card({ title, sub, actions, children, className = "" }: { title?: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[1.5rem] border border-line bg-bg-raised p-5 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h3 className="font-display text-lg font-semibold">{title}</h3>}
            {sub && <p className="mt-1 text-sm text-fg-muted">{sub}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-xs font-semibold text-fg-muted">
      <span className="mb-1 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block font-normal text-fg-subtle">{hint}</span>}
    </label>
  );
}

export function Num({ value, onChange, min, max, step = 1, suffix }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <span className="relative block">
      <input type="number" inputMode="decimal" className={inputCls + (suffix ? " pr-10" : "")} value={Number.isFinite(value) ? value : ""} min={min} max={max} step={step}
        onChange={(e) => { const v = parseFloat(e.target.value.replace(",", ".")); onChange(Number.isFinite(v) ? v : 0); }} />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fg-subtle">{suffix}</span>}
    </span>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export type Level = "stop" | "warn" | "info" | "ok" | "unknown";
const LV: Record<Level, string> = {
  stop: "border-rose-500/60 bg-rose-500/15 text-rose-200",
  warn: "border-amber-400/60 bg-amber-400/15 text-amber-100",
  info: "border-sky-400/50 bg-sky-400/10 text-sky-100",
  ok: "border-emerald-400/50 bg-emerald-400/10 text-emerald-100",
  unknown: "border-line-strong bg-white/5 text-fg-muted",
};
const DOT: Record<Level, string> = { stop: "bg-rose-500", warn: "bg-amber-400", info: "bg-sky-400", ok: "bg-emerald-400", unknown: "bg-fg-subtle" };

export function Badge({ level, children }: { level: Level; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${LV[level]}`}><i className={`size-1.5 rounded-full ${DOT[level]}`} />{children}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-bg p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">{label}</p>
      <p className="font-display mt-2 text-2xl font-semibold leading-none">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-fg-muted">{sub}</p>}
    </div>
  );
}

/** Hinweis, dass Werte Richtwerte sind */
export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-fg-subtle">{children}</p>;
}
