import { getTranslations } from "next-intl/server";
import { ArrowRight, CalendarCheck, Timer, Cube, FilmStrip, Truck, Package, UsersThree, Coins, Broadcast, Signature } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { Kinetic } from "@/components/kinetic/Kinetic";

/** Startseite: Projektleitung mit den zehn Werkzeugen als Kacheln – jede öffnet das Werkzeug auf /projektleitung. */
const TOOLS = [
  { id: "plan", icon: CalendarCheck, de: "Terminablaufplan", en: "Master schedule", d: ["Vom Eröffnungstag rückwärts gerechnet, als Kalender exportierbar", "Calculated back from opening day, exportable"] },
  { id: "fristen", icon: Timer, de: "Fristen-Radar", en: "Deadline radar", d: ["Bestellfristen je Gelände als Countdown", "Order deadlines per venue as countdowns"] },
  { id: "konfig", icon: Cube, de: "Machbarkeit 3D", en: "Feasibility 3D", d: ["Höhe, Decke, Doppelstock, Rigging live geprüft", "Height, ceiling, deck, rigging checked live"] },
  { id: "sim", icon: FilmStrip, de: "4D-Aufbau", en: "4D build-up", d: ["Gewerke über die Zeit in 3D, Konflikte sichtbar", "Trades over time in 3D, conflicts visible"] },
  { id: "logistik", icon: Truck, de: "Logistikrechner", en: "Logistics calculator", d: ["Volumen, Fahrzeuge, Zeitfenster, Stapler", "Volume, vehicles, slots, forklifts"] },
  { id: "ladung", icon: Package, de: "Ladeplaner 3D", en: "Load planner 3D", d: ["Beladung nach Aufbaureihenfolge, Packliste mit QR", "Load by build order, QR packing list"] },
  { id: "schicht", icon: UsersThree, de: "Personal & Schichten", en: "Crew & shifts", d: ["Schichtplan, Hotel, Ausweise", "Shift plan, hotel, passes"] },
  { id: "budget", icon: Coins, de: "Budget & Nachträge", en: "Budget & changes", d: ["Kalkulation, Ist, Prognose je Gewerk", "Estimate, actual, forecast per trade"] },
  { id: "leitstand", icon: Broadcast, de: "Aufbautag-Leitstand", en: "Build-day cockpit", d: ["Ein Bildschirm für den Tag vor Ort", "One screen for the day on site"] },
  { id: "abnahme", icon: Signature, de: "Übergabeprotokoll", en: "Handover report", d: ["Fotos, Mängel, Unterschrift, PDF", "Photos, defects, signature, PDF"] },
] as const;

export async function PmTeaser({ locale }: { locale: string }) {
  const t = await getTranslations("pm");
  const de = locale === "de";
  return (
    <section id="projektleitung" aria-labelledby="pm-teaser-title" className="relative scroll-mt-24 border-t border-line py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
          <div className="max-w-[760px]">
            <p className="eyebrow">{t("teaser")}</p>
            <h2 id="pm-teaser-title" className="font-display mt-4 text-4xl font-semibold leading-none md:text-6xl"><Kinetic text={t("title")} /></h2>
            <p className="mt-5 text-lg text-fg-muted">{t("lead")}</p>
          </div>
          <Link href="/projektleitung" data-magnetic className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03]">
            {t("cta")} <ArrowRight size={18} />
          </Link>
        </div>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TOOLS.map((x, i) => {
            const I = x.icon;
            return (
              <li key={x.id} data-reveal style={{ transitionDelay: `${i * 40}ms` }}>
                <Link href={{ pathname: "/projektleitung", hash: x.id }} className="group flex h-full flex-col rounded-[1.5rem] border border-line bg-bg-raised p-5 transition-colors duration-300 hover:border-accent">
                  <I size={28} weight="duotone" className="text-accent" aria-hidden />
                  <span className="mt-4 font-semibold">{de ? x.de : x.en}</span>
                  <span className="mt-1.5 text-sm text-fg-muted">{x.d[de ? 0 : 1]}</span>
                  <ArrowRight size={16} className="mt-auto pt-4 text-fg-subtle transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
