import { getTranslations } from "next-intl/server";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { JsonLd } from "@/components/seo/JsonLd";

type Block = { title: string; text: string };
type Faq = { q: string; a: string };

/**
 * Messebau & Standbau: Fließtext zu den Kernleistungen (Messebau, Standdesign, Messegrafik, Messen in München)
 * und häufige Fragen – für Besucher und Suchmaschinen; die Fragen zusätzlich als FAQPage (strukturierte Daten).
 */
export async function SeoSection() {
  const t = await getTranslations("seo");
  const blocks = t.raw("blocks") as Block[];
  const faq = t.raw("faq") as Faq[];
  return (
    <section id="messebau" aria-labelledby="seo-title" className="relative scroll-mt-24 py-24 md:py-32">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="container-x">
        <div className="max-w-[920px]" data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="seo-title" className="font-display mt-4 text-4xl font-semibold leading-tight md:text-6xl"><Kinetic text={t("title")} /></h2>
          <p className="mt-6 max-w-3xl text-lg text-fg-muted">{t("intro")}</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {blocks.map((b, i) => (
            <article key={b.title} className="rounded-3xl border border-line p-6 md:p-8" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 2) * 90}ms` }}>
              <h3 className="text-xl font-semibold md:text-2xl">{b.title}</h3>
              <p className="mt-3 text-fg-muted">{b.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-16 max-w-3xl" data-reveal>
          <h3 className="eyebrow">{t("faqTitle")}</h3>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {faq.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold">
                  {f.q}
                  <Plus size={18} className="shrink-0 text-accent transition-transform duration-500 ease-fluid group-open:rotate-45" aria-hidden />
                </summary>
                <p className="pb-5 text-fg-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
