"use client";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, ArrowRight, AirplaneTilt } from "@phosphor-icons/react";
import { SplitFlap } from "@/components/calendar/SplitFlap";
import { InquireLink } from "@/components/ui/InquireLink";
import { clockIn } from "@/hooks/useClock";
import { distanceKm, formatRange, monthLabel, type BoardRow, type FairState } from "@/lib/trade-fairs";
import { pick } from "@/i18n/locales";

export type BoardEntry = { row: BoardRow; s: FairState };
type Props = {
  entries: BoardEntry[];
  /** aktive Zeile (Reiseabschnitt), -1 = keine */
  step: number;
  home: { lat: number; lon: number };
  now: number;
  onPick: (index: number, el: HTMLElement) => void;
};

/**
 * Messekalender als Abflugtafel: je Stadt die nächste Messe, chronologisch.
 * Die aktive Zeile (Mitte des Bildschirms) klappt auf und zeigt Gelände, Entfernung ab Leipzig, Ortszeit,
 * offizielle Website und den Weg ins Anfrageformular (Messe und Termin vorausgefüllt).
 */
export function FairBoard({ entries, step, home, now, onPick }: Props) {
  const t = useTranslations("world.calendar");
  const locale = useLocale();

  const status = (s: FairState) =>
    s.state === "running" ? t("running") : s.state === "tba" ? t("tba") : s.days === 0 ? t("today") : s.days === 1 ? t("tomorrow") : t("inDays", { days: s.days });

  const months = entries.map(({ s }) => (s.fair ? monthLabel(s.fair.start, locale) : t("tba")));
  return (
    <ol className="board relative mt-8 overflow-hidden rounded-[1.75rem] border border-line bg-bg-sunken/80" aria-label={t("boardLabel")}>
      <li aria-hidden className="board-head grid grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-fg-subtle sm:grid-cols-[7.5rem_3.75rem_minmax(0,1fr)_auto] sm:px-5">
        <span className="hidden sm:block">{t("cols.date")}</span>
        <span>{t("cols.dest")}</span>
        <span>{t("cols.fair")}</span>
        <span className="text-right">{t("cols.status")}</span>
      </li>
      {entries.map(({ row, s }, i) => {
        const f = s.fair;
        const active = i === step;
        const month = months[i];
        const showMonth = i === 0 || month !== months[i - 1];
        const range = f ? formatRange(f.start, f.end, locale) : "—";
        const km = row.home ? 0 : Math.round(distanceKm(home, row));
        const year = f?.start.slice(0, 4) ?? "";
        return (
          <li key={row.id}>
            {showMonth && (
              <p aria-hidden className="board-month border-t border-line px-4 pb-1 pt-4 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-accent sm:px-5">{month}</p>
            )}
            <article
              data-row={i}
              data-active={active || undefined}
              data-running={s.state === "running" || undefined}
              className="board-row group relative cursor-pointer border-t border-line/70 px-4 py-3 transition-colors duration-500 ease-fluid hover:bg-white/[0.025] data-[active]:bg-white/[0.045] sm:px-5"
              onClick={(e) => { if (!(e.target as HTMLElement).closest("a")) onPick(i, e.currentTarget); }}
            >
              <div className="grid grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[7.5rem_3.75rem_minmax(0,1fr)_auto]">
                <time dateTime={f?.start} className="tabular hidden text-sm text-fg-muted sm:block">
                  <SplitFlap text={range} play={active} />
                </time>
                <span className="board-code font-display text-base font-semibold tracking-[0.16em] text-fg">
                  <SplitFlap text={row.code} play={active} />
                </span>
                <div className="min-w-0">
                  <h4 className="truncate font-display text-lg font-semibold leading-tight text-fg md:text-xl">
                    {f ? f.short : pick(row.city, locale)}
                  </h4>
                  <p className="truncate text-xs text-fg-subtle">
                    <span className="sm:hidden">{range} · </span>
                    {pick(row.city, locale)}{f && <> · {pick(f.sector, locale)}</>}
                  </p>
                </div>
                <span className={`board-status tabular whitespace-nowrap rounded-full px-2.5 py-1 text-right text-xs font-semibold ${s.state === "running" ? "bg-accent text-accent-contrast" : s.state === "tba" ? "text-fg-subtle" : "border border-line text-fg-muted"}`}>
                  {status(s)}
                </span>
              </div>

              {/* Bordkarte: aufgeklappt in der aktiven Zeile */}
              <div className="board-detail grid transition-[grid-template-rows,opacity] duration-700 ease-fluid" data-open={active || undefined}>
                <div className="overflow-hidden">
                  {f ? (
                    <div className="mt-3 grid gap-x-6 gap-y-3 border-t border-dashed border-line pt-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:pl-[calc(7.5rem+0.75rem)]">
                      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-fg-muted">
                        <dt className="text-fg-subtle">{t("fairName")}</dt><dd className="text-fg">{f.name}</dd>
                        <dt className="text-fg-subtle">{t("venue")}</dt><dd>{f.venue}</dd>
                        <dt className="text-fg-subtle">{t("route")}</dt>
                        <dd className="tabular inline-flex items-center gap-1.5">
                          {row.home ? t("homeBase") : <>LEJ <AirplaneTilt size={13} className="text-accent" aria-hidden /> {row.code} · {t("km", { km: km.toLocaleString(locale) })}</>}
                        </dd>
                        <dt className="text-fg-subtle">{t("localTime")}</dt>
                        <dd className="tabular">{clockIn(now, row.tz, locale) || "–"}</dd>
                      </dl>
                      <div className="flex flex-wrap items-start gap-2 sm:flex-col sm:items-end">
                        <InquireLink
                          fair={{ name: `${f.short} ${year}`, city: pick(row.city, locale), from: f.start, to: f.end }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]"
                        >
                          {t("inquire", { fair: f.short })} <ArrowRight size={14} aria-hidden />
                        </InquireLink>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg">
                          {t("website")} <ArrowUpRight size={12} className="text-accent" aria-hidden />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 border-t border-dashed border-line pt-3 text-sm text-fg-subtle sm:pl-[calc(7.5rem+0.75rem)]">{t("tbaNote")}</p>
                  )}
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
