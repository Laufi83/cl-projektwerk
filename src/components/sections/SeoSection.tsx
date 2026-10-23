import { getTranslations } from "next-intl/server";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { JsonLd } from "@/components/seo/JsonLd";

type Faq = { q: string; a: string };

/**
 * Häufige Fragen mit kurzer Einordnung des Büros – für Besucher und Suchmaschinen;
 * die Fragen zusätzlich als FAQPage (strukturierte Daten).
 */
export async function SeoSection() {
  const t = await getTranslations("seo");
  const faq = t.raw("faq") as Faq[];
  return (
    <section id="fragen" aria-labelledby="seo-title" className="relative scroll-mt-24 py-24 md:py-32">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="container-x grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="seo-title" className="font-display mt-4 text-4xl font-semibold leading-[1.05] md:text-6xl"><Kinetic text={t("title")} stomp /></h2>
          <p className="mt-6 max-w-xl text-fg-muted"><FxWords text={t("intro")} delay={350} /></p>
        </div>
        <div className="divide-y divide-line border-y border-line self-start" data-fx-list style={{ ["--fx-delay" as string]: "200ms" }}>
          {faq.map((f, i) => (
            <details key={f.q} className="group" style={{ ["--i" as string]: i }}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold">
                {f.q}
                <Plus size={18} className="shrink-0 text-accent transition-transform duration-500 ease-fluid group-open:rotate-45" aria-hidden />
              </summary>
              <p className="pb-5 text-fg-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
