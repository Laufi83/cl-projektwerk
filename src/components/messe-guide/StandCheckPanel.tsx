"use client";

import { useMemo, useState } from "react";
import { checkStand } from "@/lib/expo-intelligence/stand-check";
import type { Venue } from "@/lib/expo-intelligence/types";

export function StandCheckPanel({ venue, de }: { venue: Venue; de: boolean }) {
  const [widthM, setWidthM] = useState(6);
  const [depthM, setDepthM] = useState(4);
  const [heightM, setHeightM] = useState(3);
  const [doubleDeck, setDoubleDeck] = useState(false);
  const valid = [widthM, depthM, heightM].every(v => Number.isFinite(v) && v > 0 && v <= 1000);
  const result = useMemo(() => valid ? checkStand(venue, { venueId: venue.id, widthM, depthM, heightM, doubleDeck }) : null, [venue, valid, widthM, depthM, heightM, doubleDeck]);
  const t = (deText: string, enText: string) => de ? deText : enText;
  return (
    <section id="stand-check" aria-labelledby="stand-check-title" className="mt-12 rounded-[1.75rem] border border-line bg-bg-raised p-6 sm:p-8">
      <p className="eyebrow">CL EXPO INTELLIGENCE</p>
      <h2 id="stand-check-title" className="font-display mt-3 text-2xl font-semibold md:text-3xl">{t("Messestand-Check","Stand feasibility check")}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-muted">{t("Gib deine Standmaße ein. Die Prüfung vergleicht nur vorhandene Regeln; sie ersetzt keine Statik, brandschutztechnische Bewertung oder Standgenehmigung.","Enter your stand dimensions. This check only compares recorded rules; it does not replace structural, fire-safety or official stand approvals.")}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {([
          ["width", t("Breite (m)","Width (m)"), widthM, setWidthM],
          ["depth", t("Tiefe (m)","Depth (m)"), depthM, setDepthM],
          ["height", t("Bauhöhe (m)","Build height (m)"), heightM, setHeightM],
        ] as const).map(([key,label,value,setter])=>(
          <label key={key} className="flex flex-col gap-2 text-xs font-semibold text-fg-muted">
            {label}
            <input type="number" min="0.01" max="1000" step="0.1" value={value} onChange={e=>setter(e.target.valueAsNumber)} className="w-full rounded-xl border border-line-strong bg-bg px-4 py-3 text-base text-fg outline-none focus:border-accent" />
          </label>
        ))}
      </div>
      <label className="mt-5 inline-flex cursor-pointer items-center gap-3 text-sm text-fg">
        <input type="checkbox" checked={doubleDeck} onChange={e=>setDoubleDeck(e.target.checked)} className="size-4 accent-[var(--accent)]" />
        {t("Doppelstock-Messestand geplant","Double-deck stand planned")}
      </label>
      {!valid ? <p role="alert" className="mt-6 text-sm text-rose-300">{t("Bitte gültige Maße größer als 0 und höchstens 1.000 m eingeben.","Please enter valid dimensions above 0 and at most 1,000 m.")}</p> : result && (
        <div className="mt-7 rounded-2xl border border-amber-400/40 bg-amber-400/5 p-5" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${result.status==="conflict"?"border-rose-400/70 text-rose-300":"border-amber-400/70 text-amber-300"}`}>
              {result.status==="conflict"?t("Konflikt mit hinterlegter Regel","Conflict with recorded rule"):t("Weitere Prüfung erforderlich","Further review required")}
            </span>
            <span className="text-xs text-fg-muted">{t("Keine automatische Freigabe","Not an automatic approval")}</span>
          </div>
          <ul className="mt-4 space-y-3">
            {result.findings.map((f,i)=>(
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden className={f.severity==="conflict"?"text-rose-300":f.severity==="needs-review"?"text-amber-300":"text-fg-muted"}>{f.severity==="conflict"?"●":f.severity==="needs-review"?"◆":"○"}</span>
                <span className="text-fg-muted">{f.message}{f.source && <a href={f.source.url} target="_blank" rel="noopener noreferrer" className="ml-2 underline underline-offset-4">{t("Quelle ↗","Source ↗")}</a>}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
