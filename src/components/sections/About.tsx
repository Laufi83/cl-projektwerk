import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { mediaUrl } from "@/lib/media";
import { portrait } from "@/config/profile";
import { CareerSpotlight } from "@/components/sections/CareerSpotlight";
import { CareerTimeline } from "@/components/sections/CareerTimeline";

/** Über mich – Foto, Text, Kennzahlen, Werdegang und Projekte aus Lebenslauf und Portfolio (siehe config/profile.ts). */
export async function About() {
  const t = await getTranslations("about");
  const tp = await getTranslations("profile");
  const facts = tp.raw("facts") as { value: string; label: string }[];
  const career = tp.raw("career") as { years: string; role: string; org: string }[];
  const projects = tp.raw("projects") as { year: string; client: string; event: string; size?: string; note?: string }[];
  const highlighted = projects.filter((p) => p.year === "2026" && (p.client === "BMW" || p.client === "Amazon"));
  const otherProjects = projects.filter((p) => !highlighted.includes(p));
  const tools = tp.raw("tools") as string[];
  const languages = tp.raw("languages") as string[];
  return (
    <section id="ueber" aria-labelledby="about-title" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-x grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        {/* freigestelltes Porträt ohne Rahmen; dezenter Lichtschein dahinter */}
        <figure
          className="relative mx-auto w-full max-w-sm lg:sticky lg:top-28 lg:mx-0 lg:max-w-[min(28rem,calc((100svh-9rem)*var(--ar)))]"
          style={{ aspectRatio: `${portrait.width} / ${portrait.height}`, ["--ar" as string]: portrait.width / portrait.height }}
          data-reveal
        >
          <div aria-hidden className="absolute inset-x-[10%] bottom-[25%] top-[8%] rounded-full bg-accent/10 blur-3xl" />
          <img
            src={mediaUrl(`${portrait.base}-640.webp`)}
            srcSet={portrait.widths.map((w) => `${mediaUrl(`${portrait.base}-${w}.webp`)} ${w}w`).join(", ")}
            sizes="(min-width: 1024px) 448px, 384px"
            width={portrait.width}
            height={portrait.height}
            alt={t("photoAlt")}
            loading="lazy"
            decoding="async"
            className="relative h-full w-full object-contain"
          />
        </figure>

        <div>
          <div data-reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 id="about-title" className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("name")} /></h2>
            <p className="mt-3 text-lg text-accent">{t("role")}</p>
            <p className="mt-6 max-w-xl text-lg text-fg-muted">{t("text")}</p>
            <p className="mt-4 max-w-xl text-xl font-semibold md:text-2xl">{t("close")}</p>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3 sm:gap-4" data-reveal>
            {facts.map((f) => (
              <div key={f.value} className="flex min-w-0 flex-col-reverse justify-end gap-2 rounded-2xl border border-line p-4">
                <dt className="text-xs leading-snug text-fg-muted">{f.label}</dt>
                <dd className="font-display text-xl font-semibold text-accent [overflow-wrap:anywhere] sm:text-2xl">{f.value}</dd>
              </div>
            ))}
          </dl>

          <a
            href="#kontakt"
            data-magnetic
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]"
            data-reveal
          >
            {t("cta")} <ArrowUpRight size={18} />
          </a>

          <div className="mt-16" data-reveal>
            <h3 className="eyebrow">{t("projects")}</h3>
            <p className="mt-2 text-sm text-fg-subtle">{t("projectsNote")}</p>
            {highlighted.length > 0 && career.length > 0 && <CareerSpotlight career={career[0]} projects={highlighted} />}
            <p className="mt-9 text-xs font-semibold uppercase tracking-[.13em] text-fg-subtle">{t("career")} / {t("projects")}</p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {otherProjects.map((p) => (
                <li key={p.client + p.year + p.event} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
                  <span className="tabular text-sm text-fg-subtle">{p.year}</span>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {p.client} <span className="font-normal text-fg-muted">· {p.event}</span>
                    </p>
                    {p.note && <p className="mt-0.5 text-sm text-fg-muted">{p.note}</p>}
                  </div>
                  {p.size && <span className="tabular col-start-2 mt-1 text-sm font-semibold text-accent sm:col-start-3 sm:mt-0">{p.size}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12" data-reveal>
            <h3 className="eyebrow">{t("career")}</h3>
            <CareerTimeline entries={career} />
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2" data-reveal>
            <div>
              <h3 className="eyebrow">{t("tools")}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {tools.map((x) => <li key={x} className="rounded-full border border-line px-3 py-1 text-sm">{x}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="eyebrow">{t("languages")}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {languages.map((x) => <li key={x} className="rounded-full border border-line px-3 py-1 text-sm">{x}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
