"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

export type VenueSummary = {
  index: number;
  slug: string;
  name: string;
  city: string;
  country: string;
  region: string;
  status: string;
  completeness: number;
  heightM: number | null;
  riggingKg: number | null;
  officialUrl: string | null;
  rulesCount: number;
};

const REGIONS: Record<string, { de: string; en: string }> = {
  europe: { de: "Europa", en: "Europe" },
  asia_pacific: { de: "Asien & Ozeanien", en: "Asia & Oceania" },
  middle_east: { de: "Naher Osten", en: "Middle East" },
  north_america: { de: "Nordamerika", en: "North America" },
  latin_america: { de: "Südamerika", en: "South America" },
  africa: { de: "Afrika", en: "Africa" },
};
const VERIFIED = new Set(["S3_PRIMARY_VERIFIED", "S4_RELEASE_READY"]);
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
const LIMIT = 18;

export function GlobalVenueExplorer({ venues, de }: { venues: VenueSummary[]; de: boolean }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [country, setCountry] = useState("all");
  const [minStatus, setMinStatus] = useState("all");
  const [limit, setLimit] = useState(LIMIT);
  const [selected, setSelected] = useState<string[]>([]);

  const countries = useMemo(() => [...new Set(venues.filter(v => region === "all" || v.region === region).map(v => v.country))].sort((a,b)=>a.localeCompare(b,"de")), [venues, region]);
  const matches = useMemo(() => venues.filter(v => {
    if (region !== "all" && v.region !== region) return false;
    if (country !== "all" && v.country !== country) return false;
    if (minStatus === "checked" && !VERIFIED.has(v.status)) return false;
    const q = norm(search.trim());
    return !q || norm([v.name,v.city,v.country].join(" ")).includes(q);
  }), [venues, search, region, country, minStatus]);
  const chosen = selected.map(slug => venues.find(v => v.slug === slug)).filter((v): v is VenueSummary => Boolean(v));
  const toggle = (slug: string) => setSelected(old => old.includes(slug) ? old.filter(s => s !== slug) : old.length < 5 ? [...old,slug] : old);
  const regionLabel = (key: string) => REGIONS[key]?.[de ? "de" : "en"] ?? key;
  const txt = (deText: string, enText: string) => de ? deText : enText;
  const display = (v: number | null, unit: string, status: string) => v === null ? txt("Nicht verifiziert","Not verified") : VERIFIED.has(status) ? `${v.toLocaleString(de?"de-DE":"en-GB")} ${unit}` : `${v.toLocaleString(de?"de-DE":"en-GB")} ${unit} · ${txt("Prüfung offen","Review pending")}`;

  return (
    <section id="global-expo-explorer" className="border-t border-line py-20 md:py-28" aria-labelledby="global-expo-title">
      <div className="container-x">
        <p className="eyebrow">{txt("CL EXPO INTELLIGENCE · GLOBAL","CL EXPO INTELLIGENCE · GLOBAL")}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h2 id="global-expo-title" className="font-display text-4xl font-semibold leading-tight md:text-6xl">{txt("101 Messegelände.","101 exhibition venues.")} <span className="text-accent">{txt("Ein Navigator.","One navigator.")}</span></h2>
            <p className="mt-4 text-base leading-relaxed text-fg-muted">{txt("Standorte weltweit finden, vergleichen und technische Daten mit transparentem Prüfstatus einsehen. Noch nicht recherchierte Werte bleiben ausdrücklich offen.","Find and compare venues worldwide, with transparent verification levels for technical data. Unresearched values are explicitly marked.")}</p>
          </div>
          <div className="rounded-2xl border border-line bg-bg-raised px-5 py-4 text-right">
            <p className="font-mono text-3xl font-semibold text-accent">{venues.length}</p>
            <p className="text-xs text-fg-muted">{txt("Standorte im Verzeichnis","venues in directory")}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 rounded-3xl border border-line bg-bg-raised p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          <label className="flex flex-col gap-2 text-xs font-semibold text-fg-muted">
            {txt("Suche","Search")}
            <input type="search" value={search} onChange={e=>{setSearch(e.target.value);setLimit(LIMIT);}} placeholder={txt("Name, Stadt, Land …","Name, city, country …")} className="min-w-0 rounded-xl border border-line-strong bg-bg px-3 py-3 text-sm text-fg outline-none focus:border-accent" />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-fg-muted">
            {txt("Region","Region")}
            <select value={region} onChange={e=>{setRegion(e.target.value);setCountry("all");setLimit(LIMIT);}} className="rounded-xl border border-line-strong bg-bg px-3 py-3 text-sm text-fg focus:border-accent">
              <option value="all">{txt("Alle Regionen","All regions")}</option>
              {Object.keys(REGIONS).map(k=><option key={k} value={k}>{regionLabel(k)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-fg-muted">
            {txt("Land","Country")}
            <select value={country} onChange={e=>{setCountry(e.target.value);setLimit(LIMIT);}} className="rounded-xl border border-line-strong bg-bg px-3 py-3 text-sm text-fg focus:border-accent">
              <option value="all">{txt("Alle Länder","All countries")}</option>
              {countries.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-fg-muted">
            {txt("Prüfstatus","Verification")}
            <select value={minStatus} onChange={e=>{setMinStatus(e.target.value);setLimit(LIMIT);}} className="rounded-xl border border-line-strong bg-bg px-3 py-3 text-sm text-fg focus:border-accent">
              <option value="all">{txt("Alle Prüfstände","All verification levels")}</option>
              <option value="checked">{txt("Nur S3 / S4","Only S3 / S4")}</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-fg-muted">
          <p aria-live="polite">{matches.length} {txt("Standorte gefunden","venues found")} · {selected.length}/5 {txt("für Vergleich gewählt","selected for comparison")}</p>
          {selected.length > 0 && <button type="button" onClick={()=>setSelected([])} className="rounded-full border border-line px-4 py-2 text-xs hover:border-accent">{txt("Vergleich leeren","Clear comparison")}</button>}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.slice(0,limit).map(v=>(
            <article key={v.slug} className="flex flex-col rounded-[1.5rem] border border-line bg-bg-raised p-5 transition-colors hover:border-line-strong">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-accent">NO. {String(v.index).padStart(3,"0")}</span>
                <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-fg-muted">{v.status.slice(0,2)} · {v.completeness}%</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold leading-tight">{v.name}</h3>
              <p className="mt-2 text-sm text-fg-muted">{v.city} · {v.country}</p>
              <p className="mt-2 text-xs text-fg-subtle">{regionLabel(v.region)}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                <Link href={{pathname:"/messen/[slug]",params:{slug:v.slug}}} className="rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-accent-contrast transition-opacity hover:opacity-80">{txt("Profil öffnen ↗","Open profile ↗")}</Link>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
                  <input type="checkbox" checked={selected.includes(v.slug)} disabled={selected.length>=5&&!selected.includes(v.slug)} onChange={()=>toggle(v.slug)} className="accent-[var(--accent)]" />
                  {txt("Vergleichen","Compare")}
                </label>
              </div>
            </article>
          ))}
        </div>
        {matches.length===0 && <p className="mt-8 rounded-2xl border border-line bg-bg-raised p-8 text-center text-fg-muted">{txt("Keine Standorte gefunden. Filter anpassen.","No venues found. Try different filters.")}</p>}
        {limit < matches.length && <div className="mt-7 text-center"><button type="button" onClick={()=>setLimit(n=>n+LIMIT)} className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold hover:border-accent">{txt("Weitere Standorte laden","Load more venues")}</button></div>}

        {chosen.length>0 && (
          <section id="expo-comparison" aria-labelledby="expo-comparison-title" className="mt-12 rounded-[1.75rem] border border-accent/40 bg-bg-raised p-5 sm:p-8">
            <h3 id="expo-comparison-title" className="font-display text-2xl font-semibold">{txt("Messegelände vergleichen","Compare venues")}</h3>
            <p className="mt-2 text-sm text-fg-muted">{txt("Ungeprüfte Werte sind keine Planungsfreigabe. Unterschiedliche Hallen und Veranstaltungen können abweichende Regeln haben.","Unverified figures do not constitute planning approval. Halls and events may impose different rules.")}</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-line">
                  <th scope="col" className="p-3 text-fg-muted">{txt("Merkmal","Field")}</th>
                  {chosen.map(v=><th scope="col" key={v.slug} className="p-3 align-top"><Link href={{pathname:"/messen/[slug]",params:{slug:v.slug}}} className="underline decoration-line-strong underline-offset-4">{v.name}</Link></th>)}
                </tr></thead>
                <tbody>
                  <tr className="border-b border-line"><th scope="row" className="p-3 text-fg-muted">{txt("Land","Country")}</th>{chosen.map(v=><td key={v.slug} className="p-3">{v.country}</td>)}</tr>
                  <tr className="border-b border-line"><th scope="row" className="p-3 text-fg-muted">{txt("Datenvollständigkeit","Data completeness")}</th>{chosen.map(v=><td key={v.slug} className="p-3">{v.completeness}% · {v.status.slice(0,2)}</td>)}</tr>
                  <tr className="border-b border-line"><th scope="row" className="p-3 text-fg-muted">{txt("Hinterlegte Bauhöhe","Recorded build height")}</th>{chosen.map(v=><td key={v.slug} className="p-3">{display(v.heightM,"m",v.status)}</td>)}</tr>
                  <tr className="border-b border-line"><th scope="row" className="p-3 text-fg-muted">{txt("Abhängung je Punkt","Rigging load per point")}</th>{chosen.map(v=><td key={v.slug} className="p-3">{display(v.riggingKg,"kg",v.status)}</td>)}</tr>
                  <tr><th scope="row" className="p-3 text-fg-muted">{txt("Richtliniendokumente","Rules documents")}</th>{chosen.map(v=><td key={v.slug} className="p-3">{v.rulesCount}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
