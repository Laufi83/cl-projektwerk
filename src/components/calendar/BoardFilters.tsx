"use client";
import { useLocale, useTranslations } from "next-intl";
import { pick } from "@/i18n/locales";
import type { BoardEntry } from "@/components/calendar/FairBoard";

export type Period = "all" | "upcoming" | "running";
export type Filters = { q: string; country: string; city: string; period: Period; sector: string };
export const EMPTY_FILTERS: Filters = { q: "", country: "", city: "", period: "all", sector: "" };

const norm = (s: string, l: string) => s.toLocaleLowerCase(l).normalize("NFD").replace(/\p{M}/gu, "");

/** Suche und Filter der Abflugtafel: Land, Stadt, Zeitraum, Branche. */
export function applyFilters(entries: BoardEntry[], f: Filters, locale: string): BoardEntry[] {
  const q = norm(f.q.trim(), locale);
  return entries.filter(({ row, s }) => {
    if (f.country && row.country !== f.country) return false;
    if (f.city && row.id !== f.city) return false;
    if (f.period === "running" && s.state !== "running") return false;
    if (f.period === "upcoming" && s.state !== "upcoming") return false;
    if (f.sector && (!s.fair || pick(s.fair.sector, locale) !== f.sector)) return false;
    if (q) {
      const hay = norm([pick(row.city, locale), row.code, s.fair?.name ?? "", s.fair?.short ?? "", s.fair?.venue ?? ""].join(" "), locale);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const sel = "w-full rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-base text-fg sm:text-sm focus:border-accent focus:outline-none";

export function BoardFilters({ entries, value, onChange, count }: { entries: BoardEntry[]; value: Filters; onChange: (f: Filters) => void; count: number }) {
  const t = useTranslations("world.calendar");
  const locale = useLocale();
  const set = (p: Partial<Filters>) => onChange({ ...value, ...p });
  const countries = [...new Set(entries.map((e) => e.row.country))].sort();
  const cities = entries
    .filter((e) => !value.country || e.row.country === value.country)
    .map((e) => e.row)
    .sort((a, b) => pick(a.city, locale).localeCompare(pick(b.city, locale), locale));
  const sectors = [...new Set(entries.flatMap((e) => (e.s.fair ? [pick(e.s.fair.sector, locale)] : [])))].sort((a, b) => a.localeCompare(b, locale));
  const dirty = JSON.stringify(value) !== JSON.stringify(EMPTY_FILTERS);
  const names = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([locale], { type: "region" }) : null;
  return (
    <form role="search" aria-label={t("search")} onSubmit={(e) => e.preventDefault()} className="mt-8 grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-semibold sm:col-span-2 lg:col-span-3">
        {t("search")}
        <input type="search" value={value.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} className={`${sel} mt-1.5`} />
      </label>
      <label className="text-xs font-semibold">
        {t("filterCountry")}
        <select value={value.country} onChange={(e) => set({ country: e.target.value, city: "" })} className={`${sel} mt-1.5`}>
          <option value="">{t("filterAll")}</option>
          {countries.map((c) => <option key={c} value={c}>{names?.of(c) ?? c}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold">
        {t("filterCity")}
        <select value={value.city} onChange={(e) => set({ city: e.target.value })} className={`${sel} mt-1.5`}>
          <option value="">{t("filterAll")}</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{pick(c.city, locale)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold">
        {t("filterPeriod")}
        <select value={value.period} onChange={(e) => set({ period: e.target.value as Period })} className={`${sel} mt-1.5`}>
          <option value="all">{t("filterAll")}</option>
          <option value="upcoming">{t("periodUpcoming")}</option>
          <option value="running">{t("periodRunning")}</option>
        </select>
      </label>
      <label className="text-xs font-semibold sm:col-span-2 lg:col-span-3">
        {t("filterSector")}
        <select value={value.sector} onChange={(e) => set({ sector: e.target.value })} className={`${sel} mt-1.5`}>
          <option value="">{t("filterAll")}</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-3">
        <p role="status" aria-live="polite" className="text-xs text-fg-muted">{t("resultCount", { count })}</p>
        {dirty && <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fg-muted hover:text-fg">{t("reset")}</button>}
      </div>
    </form>
  );
}
