import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowSquareOut, MapPin, Warning, Info } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { globalVenues, venueBySlug, STATUS_INFO, legacyIndexForVenue } from "@/lib/messebau/venues";
import type { GlobalVenue } from "@/lib/messebau/schema";
import { VenueCompass } from "@/components/messe-guide/VenueCompass";
import { StandCheckPanel } from "@/components/messe-guide/StandCheckPanel";
import type { Venue as CheckVenue } from "@/lib/expo-intelligence/types";
import { languageAlternates, localizedPath } from "@/i18n/locales";

/**
 * Detailseite je Messegelände – eine Route für alle Standorte der kanonischen Datenquelle
 * (src/data/messebau/venues.global.v2.json). Nicht belegte Felder erscheinen als „nicht belegt – prüfen“,
 * dazu Prüfstufe, Vollständigkeit und die priorisierten Datenlücken.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return (["de", "en"] as const).flatMap((locale) => globalVenues.map((v) => ({ locale, slug: v.slug })));
}

const pathOf = (slug: string) => [`/messen/${slug}`, `/trade-fairs/${slug}`] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const v = venueBySlug(slug);
  if (!v) return {};
  const de = locale === "de";
  const [dp, ep] = pathOf(slug);
  const title = de ? `${v.official_name} – Messebau-Guide ${v.city}` : `${v.official_name} – stand-builder guide ${v.city}`;
  const description = de
    ? `Technische Eckwerte, Richtlinien, Logistik, Kontakte und Quellen zum Messegelände ${v.official_name} in ${v.city} – mit Prüfstand und offenen Datenlücken.`
    : `Technical key data, regulations, logistics, contacts and sources for ${v.official_name} in ${v.city} – with verification status and open data gaps.`;
  return { title, description, alternates: { canonical: localizedPath(locale, dp, ep), languages: languageAlternates(dp, ep) } };
}

const fmt = (n: number, de: boolean, digits = 2) => n.toLocaleString(de ? "de-DE" : "en-GB", { maximumFractionDigits: digits });

function Field({ label, value, note, de }: { label: string; value: React.ReactNode; note?: string | null; de: boolean }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="rounded-2xl border border-line bg-bg-raised p-4">
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-subtle">{label}</dt>
      <dd className={`mt-1.5 text-sm leading-relaxed ${empty ? "text-amber-300" : "text-fg"}`}>{empty ? (de ? "nicht belegt – prüfen" : "not verified – check") : value}</dd>
      {note && <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{note}</p>}
    </div>
  );
}

const PRIO: Record<string, [string, string]> = {
  P0: ["vor Veröffentlichung", "before publishing"], P1: ["Technik", "technical"], P2: ["Betrieb", "operations"], P3: ["Medien", "media"],
};

export default async function VenuePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const v = venueBySlug(slug);
  if (!v) notFound();
  const de = locale === "de";
  const s = STATUS_INFO[v.verification.status];
  const facts = (v.legacy.guide?.facts ?? {}) as Record<string, string>;
  const notices = ((v.legacy.builder as { notices?: { level: string; title: string; text: string; source?: { label: string; url: string } }[] } | null)?.notices) ?? [];
  const h = v.typical_max_stand_build_height;
  const checkVenue: CheckVenue = {
    id: v.id, name: v.official_name, city: v.city, country: v.country, continent: v.region,
    technical: {
      maximumConstructionHeight: h.height_m === null ? undefined : {
        value: h.height_m,
        unit: "m",
        status: (v.verification.status === "S3_PRIMARY_VERIFIED" || v.verification.status === "S4_RELEASE_READY") && v.technical_rules.length > 0 ? "verified" : "unverified",
        scope: h.rule_type ?? undefined,
        source: v.technical_rules[0] ? { title: v.technical_rules[0].title, url: v.technical_rules[0].url, checkedAt: v.date_accessed ?? undefined } : undefined,
      },
    },
    sources: v.sources.map(source => ({ title: source.label, url: source.url, checkedAt: source.accessed ?? undefined })),
  };
  const coords = v.coordinates.lat !== null && v.coordinates.lon !== null ? `${fmt(v.coordinates.lat, de, 4)}, ${fmt(v.coordinates.lon, de, 4)}` : null;
  const guideLabels: [string, string, string][] = [["area", "Gelände", "Venue"], ["insider", "Insider & Orientierung", "Venue tips"], ["travel", "Anreise", "Getting there"], ["hotels", "Hotels", "Hotels"], ["dining", "Gastronomie", "Dining"], ["cityInfo", "Stadt", "City"]];
  const i = globalVenues.findIndex((x) => x.slug === v.slug);
  const prev: GlobalVenue = globalVenues[(i - 1 + globalVenues.length) % globalVenues.length];
  const next: GlobalVenue = globalVenues[(i + 1) % globalVenues.length];

  return (
    <div className="pt-28 md:pt-36">
      <div className="container-x">
        <Link href="/messen" className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"><ArrowLeft size={16} aria-hidden />{de ? "Alle Messegelände" : "All venues"}</Link>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="eyebrow">{de ? "Messebau-Guide" : "Stand-builder guide"} · {String(v.index).padStart(3, "0")}</p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-[1.02] md:text-6xl">{v.official_name}</h1>
            <p className="mt-3 flex items-center gap-2 text-lg text-fg-muted"><MapPin size={18} className="text-accent" aria-hidden />{v.city} · {v.country}</p>
          </div>
          <div className="w-full max-w-xs rounded-2xl border border-line bg-bg-raised p-4">
            <span className={`inline-flex rounded-full border px-3 py-1 font-mono text-xs font-bold ${s.tone}`}>{s.short}</span>
            <p className="mt-2 text-sm text-fg-muted">{de ? s.de : s.en}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v.verification.completeness_pct} aria-label={de ? "Vollständigkeit" : "Completeness"}>
              <div className="h-full bg-accent" style={{ width: `${v.verification.completeness_pct}%` }} />
            </div>
            <p className="mt-1.5 font-mono text-xs text-fg-subtle">{v.verification.completeness_pct} % {de ? "vollständig" : "complete"}{v.date_accessed ? ` · ${de ? "Stand" : "as of"} ${new Date(v.date_accessed).toLocaleDateString(de ? "de-DE" : "en-GB")}` : ""}</p>
          </div>
        </header>

        {notices.length > 0 && (
          <div className="mt-8 grid gap-3">
            {notices.map((n) => (
              <div key={n.title + n.text} role={n.level === "critical" ? "alert" : undefined}
                className={`flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${n.level === "critical" ? "border-rose-500/60 bg-rose-500/10" : n.level === "warning" ? "border-amber-400/60 bg-amber-400/10" : "border-line bg-bg-raised"}`}>
                {n.level === "info" ? <Info size={20} className="mt-0.5 shrink-0 text-fg-muted" aria-hidden /> : <Warning size={20} weight="fill" className={`mt-0.5 shrink-0 ${n.level === "critical" ? "text-rose-400" : "text-amber-400"}`} aria-hidden />}
                <p><strong className="text-fg">{n.title}.</strong> <span className="text-fg-muted">{n.text}</span>
                  {n.source && <a href={n.source.url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 underline underline-offset-4">{n.source.label}<ArrowSquareOut size={13} aria-hidden /></a>}</p>
              </div>
            ))}
          </div>
        )}

        <section aria-labelledby="core" className="mt-10">
          <h2 id="core" className="font-display text-2xl font-semibold md:text-3xl">{de ? "Kerndaten" : "Key data"}</h2>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field de={de} label={de ? "Betreiber" : "Operator"} value={v.operator} />
            <Field de={de} label={de ? "Offizielle Website" : "Official website"} value={v.official_website_url && <a href={v.official_website_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{new URL(v.official_website_url).host}</a>} />
            <Field de={de} label={de ? "Adresse" : "Address"} value={v.postal_address} />
            <Field de={de} label={de ? "Koordinaten" : "Coordinates"} value={coords} note={v.coordinates.precision === "city" ? (de ? "Nur Stadtmittelpunkt – keine Hallen- oder Eingangskoordinate." : "City centre only – not a hall or entrance coordinate.") : null} />
            <Field de={de} label={de ? "Hallen" : "Halls"} value={v.main_hall_count} note={v.hall_count_basis} />
            <Field de={de} label={de ? "Indoor-Ausstellungsfläche" : "Indoor exhibition area"} value={v.total_indoor_exhibition_area_m2 && `${fmt(v.total_indoor_exhibition_area_m2, de, 0)} m²`} note={v.area_note} />
            <Field de={de} label={de ? "Größte Hallenhöhe" : "Largest hall height"} value={v.largest_hall_height_m && `${fmt(v.largest_hall_height_m, de)} m`} />
            <Field de={de} label={de ? "Standbauhöhe" : "Stand build height"} value={h.height_m && `${fmt(h.height_m, de)} m`} note={[h.rule_type, h.text].filter(Boolean).join(" – ") || null} />
            <Field de={de} label={de ? "Last je Abhängepunkt" : "Load per rigging point"} value={v.rigging.max_load_kg_per_point && `≤ ${v.rigging.max_load_kg_per_point} kg`} note={v.rigging.text} />
            <Field de={de} label={de ? "Messespedition" : "Official forwarder"} value={v.logistics.forwarder.length ? v.logistics.forwarder.join(" · ") : null} note={v.logistics.text} />
            <Field de={de} label={de ? "Technische Anlaufstelle" : "Technical contact"} value={(v.public_contact.email || v.public_contact.phone) && [v.public_contact.name, v.public_contact.phone, v.public_contact.email].filter(Boolean).join(" · ")} />
            <Field de={de} label={de ? "Hallen-/Geländeplan" : "Hall / site plan"} value={v.hall_plan.url && <a href={v.hall_plan.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">{de ? "Plan öffnen" : "Open plan"}<ArrowSquareOut size={13} aria-hidden /></a>} />
          </dl>
          {v.event_specific_variations && <p className="mt-4 flex gap-2 text-xs leading-relaxed text-fg-subtle"><Info size={15} className="mt-0.5 shrink-0" aria-hidden />{de ? v.event_specific_variations : "Events may set stricter or different rules (build height, build-up times, traffic routing, rigging)."} {de ? "Keine Angabe ersetzt die Standbaugenehmigung." : "Nothing here replaces the stand approval."}</p>}
        </section>

        <StandCheckPanel venue={checkVenue} de={de} />

        {v.legacy.builder && legacyIndexForVenue(v.index) && <VenueCompass index={Number(legacyIndexForVenue(v.index))} />}

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="sources" className="rounded-[1.75rem] border border-line bg-bg-raised p-6 sm:p-8">
            <h2 id="sources" className="font-display text-2xl font-semibold">{de ? "Richtlinien & Quellen" : "Regulations & sources"}</h2>
            {v.sources.length ? (
              <ul className="mt-4 space-y-2.5 text-sm">
                {v.sources.map((src) => (
                  <li key={src.url} className="flex flex-wrap items-baseline gap-x-2">
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">{src.label}<ArrowSquareOut size={13} aria-hidden /></a>
                    {src.accessed && <span className="font-mono text-[11px] text-fg-subtle">{de ? "abgerufen" : "accessed"} {new Date(src.accessed).toLocaleDateString(de ? "de-DE" : "en-GB")}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-fg-muted">{de ? "Noch keine Primärquellen erfasst." : "No primary sources recorded yet."}</p>}
          </section>

          <section aria-labelledby="gaps" className="rounded-[1.75rem] border border-line bg-bg-raised p-6 sm:p-8">
            <h2 id="gaps" className="font-display text-2xl font-semibold">{de ? "Offene Datenlücken" : "Open data gaps"}</h2>
            <p className="mt-2 text-sm text-fg-muted">{de ? "Was vor einer vollständigen Freigabe noch aus Primärquellen belegt werden muss – nie geschätzt." : "What still has to be confirmed from primary sources before full release – never estimated."}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {v.verification.missing_prioritized.map((g) => (
                <li key={g.field} className="flex gap-3">
                  <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${g.priority === "P0" ? "bg-rose-500/20 text-rose-300" : g.priority === "P1" ? "bg-amber-400/20 text-amber-300" : "bg-line text-fg-muted"}`} title={PRIO[g.priority][de ? 0 : 1]}>{g.priority}</span>
                  <span className="text-fg-muted">{g.reason}</span>
                </li>
              ))}
              {!v.verification.missing_prioritized.length && <li className="text-emerald-300">{de ? "Keine offenen Lücken." : "No open gaps."}</li>}
            </ul>
          </section>
        </div>

        {Object.keys(facts).length > 0 && (
          <section aria-labelledby="guide" className="mt-6 rounded-[1.75rem] border border-line bg-bg-raised p-6 sm:p-8">
            <h2 id="guide" className="font-display text-2xl font-semibold">{de ? "Vor Ort" : "On site"}</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
              {guideLabels.filter(([k]) => facts[k]).map(([k, dl, el]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{de ? dl : el}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{facts[k]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-[11px] text-fg-subtle">{de ? "Redaktionelle Hinweise ohne Gewähr – vor der Planung auf den offiziellen Seiten prüfen." : "Editorial notes without guarantee – check the official websites before planning."}</p>
          </section>
        )}

        <nav aria-label={de ? "Weitere Messegelände" : "More venues"} className="mt-12 flex flex-wrap justify-between gap-4 border-t border-line py-8 text-sm">
          <Link href={{ pathname: "/messen/[slug]", params: { slug: prev.slug } }} className="inline-flex items-center gap-2 text-fg-muted hover:text-fg"><ArrowLeft size={16} aria-hidden />{prev.official_name}</Link>
          <Link href={{ pathname: "/messen/[slug]", params: { slug: next.slug } }} className="inline-flex items-center gap-2 text-fg-muted hover:text-fg">{next.official_name}<ArrowLeft size={16} className="rotate-180" aria-hidden /></Link>
        </nav>
      </div>
    </div>
  );
}
