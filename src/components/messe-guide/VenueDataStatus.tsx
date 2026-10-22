import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { globalVenues, STATUS_INFO } from "@/lib/messebau/venues";
import type { VerificationStatus } from "@/lib/messebau/schema";
import { localeInfo, pick } from "@/i18n/locales";

type T = { de: string; en: string; fr: string; es: string; it: string; nl: string };
const TX = {
  title: { de: "Datenstand", en: "Data status", fr: "État des données", es: "Estado de los datos", it: "Stato dei dati", nl: "Stand van de gegevens" },
  venues: { de: "Gelände", en: "venues", fr: "parcs", es: "recintos", it: "quartieri", nl: "locaties" },
  checked: { de: "Kerndaten aus Primärquellen geprüft", en: "core data verified from primary sources", fr: "données clés vérifiées aux sources primaires", es: "datos clave verificados en fuentes primarias", it: "dati principali verificati su fonti primarie", nl: "kerngegevens gecontroleerd bij primaire bronnen" },
  open: { de: "Prüfung gegen Primärquellen noch offen", en: "primary-source check still pending", fr: "vérification aux sources primaires en cours", es: "verificación en fuentes primarias pendiente", it: "verifica su fonti primarie in corso", nl: "controle bij primaire bronnen nog open" },
  research: { de: "Angaben aus Recherche mit Quellen – vor der Planung bestätigen", en: "researched entries with sources – confirm before planning", fr: "données issues de recherches, avec sources – à confirmer avant de planifier", es: "datos de investigación con fuentes: confirmar antes de planificar", it: "dati da ricerca con fonti: da confermare prima di progettare", nl: "gegevens uit onderzoek met bronnen – vóór de planning bevestigen" },
  latest: { de: "Letzter Quellenabruf", en: "Latest source check", fr: "Dernière consultation des sources", es: "Última consulta de fuentes", it: "Ultima consultazione delle fonti", nl: "Laatste broncontrole" },
  fairs: { de: "Messetermine geprüft am", en: "Trade fair dates checked on", fr: "Dates des salons vérifiées le", es: "Fechas de ferias verificadas el", it: "Date delle fiere verificate il", nl: "Beursdata gecontroleerd op" },
  note: { de: "Technische Richtlinien, Fristen und Lasten ändern sich. Vor der Planung immer die aktuelle Fassung beim Veranstalter bestätigen – jede Angabe nennt ihre Quelle.", en: "Technical guidelines, deadlines and loads change. Always confirm the current version with the organiser before planning – every entry names its source.", fr: "Les règlements techniques, délais et charges évoluent. Confirmez toujours la version en vigueur auprès de l’organisateur avant de planifier – chaque donnée cite sa source.", es: "Las normas técnicas, plazos y cargas cambian. Antes de planificar, confirme siempre la versión vigente con el organizador; cada dato indica su fuente.", it: "Regolamenti tecnici, scadenze e carichi cambiano. Prima di progettare conferma sempre la versione aggiornata con l’organizzatore: ogni dato indica la sua fonte.", nl: "Technische richtlijnen, deadlines en belastingen veranderen. Bevestig vóór de planning altijd de actuele versie bij de organisator – elke vermelding noemt haar bron." },
  ctaTitle: { de: "Projekt auf einem dieser Gelände?", en: "Project at one of these venues?", fr: "Un projet sur l’un de ces parcs ?", es: "¿Un proyecto en uno de estos recintos?", it: "Un progetto in uno di questi quartieri?", nl: "Een project op een van deze locaties?" },
  ctaText: { de: "Ich prüfe die Vorgaben des Geländes für Ihren Stand und plane danach.", en: "I check the venue's rules for your stand and plan accordingly.", fr: "Je vérifie les règles du parc pour votre stand et planifie en conséquence.", es: "Reviso las normas del recinto para su stand y planifico en consecuencia.", it: "Verifico le regole del quartiere per il vostro stand e pianifico di conseguenza.", nl: "Ik controleer de regels van de locatie voor uw stand en plan op basis daarvan." },
  cta: { de: "Planung anfragen", en: "Request planning", fr: "Demander une planification", es: "Solicitar planificación", it: "Richiedi la progettazione", nl: "Planning aanvragen" },
} satisfies Record<string, T>;

const VERIFIED: VerificationStatus[] = ["S3_PRIMARY_VERIFIED", "S4_RELEASE_READY"];

/** Datenstand der Gelände-Datenquelle: Anzahl je Prüfstufe, letzter Quellenabruf, Hinweis und Anfrage-Brücke (oben auf /messen). */
export function VenueDataStatus({ locale, fairsChecked }: { locale: string; fairsChecked: string }) {
  const L = (o: T) => pick(o, locale);
  const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(localeInfo(locale).intl, { day: "2-digit", month: "2-digit", year: "numeric" });
  const counts = new Map<VerificationStatus, number>();
  for (const v of globalVenues) counts.set(v.verification.status, (counts.get(v.verification.status) ?? 0) + 1);
  const verified = globalVenues.filter((v) => VERIFIED.includes(v.verification.status)).length;
  const accessed = globalVenues.flatMap((v) => v.sources.map((s) => s.accessed)).filter((d): d is string => !!d).sort();
  const latest = accessed.at(-1);
  return (
    <section className="container-x mt-10 grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" aria-label={L(TX.title)}>
      <div className="rounded-[1.5rem] border border-line bg-bg-raised p-5 sm:p-6">
        <p className="eyebrow">{L(TX.title)}</p>
        <p className="font-display mt-3 text-2xl font-semibold leading-tight">
          {globalVenues.length} {L(TX.venues)} · {verified > 0 ? <><span className="text-accent">{verified}</span> {L(TX.checked)}</> : L(TX.research)}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-xs">
          {(Object.keys(STATUS_INFO) as VerificationStatus[]).filter((s) => counts.get(s)).map((s) => (
            <li key={s} className={`rounded-full border px-2.5 py-1 font-semibold ${STATUS_INFO[s].tone}`} title={locale === "de" ? STATUS_INFO[s].de : STATUS_INFO[s].en}>
              {STATUS_INFO[s].short} · {counts.get(s)}
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-1 text-sm text-fg-muted sm:grid-cols-2">
          {latest && <div><dt className="inline">{L(TX.latest)}: </dt><dd className="inline tabular font-semibold text-fg">{fmt(latest)}</dd></div>}
          <div><dt className="inline">{L(TX.fairs)} </dt><dd className="inline tabular font-semibold text-fg">{fmt(fairsChecked)}</dd></div>
        </dl>
        {globalVenues.length - verified > 0 && <p className="mt-3 text-xs text-amber-300">{globalVenues.length - verified} {L(TX.venues)}: {L(TX.open)}.</p>}
        <p className="mt-3 text-xs leading-relaxed text-fg-subtle">{L(TX.note)}</p>
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-accent/60 bg-accent-soft p-5 sm:p-6">
        <div>
          <p className="font-display text-2xl font-semibold leading-tight">{L(TX.ctaTitle)}</p>
          <p className="mt-2 text-sm text-fg-muted">{L(TX.ctaText)}</p>
        </div>
        <Link href="/anfrage" className="inline-flex w-max items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition-transform hover:scale-[1.03]">
          {L(TX.cta)} <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
