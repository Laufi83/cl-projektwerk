"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { distanceKm, type BoardRow } from "@/lib/trade-fairs";
import { pick } from "@/i18n/locales";

const sel = "w-full rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-base text-fg sm:text-sm focus:border-accent focus:outline-none";

/**
 * Luftlinie (Großkreisentfernung) zwischen zwei Städten, Ausgangspunkt Leipzig.
 * Keine Straßenentfernung, keine Reisezeit. Die Zielstadt wird auf dem Globus markiert (onSelect).
 */
export function DistanceTool({ rows, onSelect, originId }: { rows: BoardRow[]; onSelect: (id: string) => void; originId?: string }) {
  const t = useTranslations("world.distance");
  const locale = useLocale();
  const home = rows.find((r) => r.home) ?? rows[0];
  const sorted = useMemo(() => [...rows].sort((a, b) => pick(a.city, locale).localeCompare(pick(b.city, locale), locale)), [rows, locale]);
  const [from, setFrom] = useState(originId ?? home.id);
  const [to, setTo] = useState("");
  const a = rows.find((r) => r.id === from) ?? home;
  const b = rows.find((r) => r.id === to);
  const km = b ? Math.round(distanceKm(a, b)) : null;
  const fmt = (n: number) => n.toLocaleString(locale);
  const names = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([locale], { type: "region" }) : null;
  const list = useMemo(() => rows.filter((r) => r.id !== a.id).map((r) => ({ r, km: Math.round(distanceKm(a, r)) })).sort((x, y) => x.km - y.km), [rows, a]);

  return (
    <section aria-labelledby="distance-title" className="mt-10 rounded-2xl border border-line p-5 md:p-6">
      <h4 id="distance-title" className="font-display text-2xl font-semibold">{t("title")}</h4>
      <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <label className="text-xs font-semibold">
          {t("from")}
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={`${sel} mt-1.5`}>
            {sorted.map((r) => <option key={r.id} value={r.id}>{pick(r.city, locale)}</option>)}
          </select>
        </label>
        <button
          type="button"
          aria-label={t("swap")}
          title={t("swap")}
          disabled={!to}
          onClick={() => { const f = from; setFrom(to); setTo(f); }}
          className="grid size-10 place-items-center justify-self-center rounded-full border border-line text-fg-muted hover:text-fg disabled:opacity-40"
        >
          <ArrowsLeftRight size={16} aria-hidden />
        </button>
        <label className="text-xs font-semibold">
          {t("to")}
          <select value={to} onChange={(e) => { setTo(e.target.value); if (e.target.value) onSelect(e.target.value); }} className={`${sel} mt-1.5`}>
            <option value="">{t("pick")}</option>
            {sorted.filter((r) => r.id !== from).map((r) => <option key={r.id} value={r.id}>{pick(r.city, locale)}</option>)}
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite" className="tabular mt-4 min-h-7 text-lg font-semibold text-accent">
        {km !== null && b ? t("resultFromTo", { from: pick(a.city, locale), to: pick(b.city, locale), km: fmt(km) }) : ""}
      </p>
      <p className="text-xs text-fg-subtle">{t("note")}</p>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold">{t("listTitle", { city: pick(a.city, locale) })}</summary>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.14em] text-fg-subtle">
            <tr>
              <th scope="col" className="py-1">{t("listCity")}</th>
              <th scope="col">{t("listCountry")}</th>
              <th scope="col" className="text-right">{t("listKm")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map(({ r, km: d }) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-1.5">{pick(r.city, locale)}</td>
                <td className="text-fg-muted">{names?.of(r.country) ?? r.country}</td>
                <td className="tabular text-right">{fmt(d)} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
