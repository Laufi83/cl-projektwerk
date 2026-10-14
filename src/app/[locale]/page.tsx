import { getTranslations, setRequestLocale } from "next-intl/server";
import hero001 from "../../../public/hero/001/hero.json";
import hero021 from "../../../public/hero/021/hero.json";
import heroLumen from "../../../public/hero/lumen/hero.json";
import heroAtrium from "../../../public/hero/atrium/hero.json";
import heroCopper from "../../../public/hero/copper/hero.json";
import heroViolet from "../../../public/hero/violet/hero.json";
import heroCanopy from "../../../public/hero/canopy/hero.json";
import { getDesigns, getGalleryItems, getMediaDesign, sizeRange } from "@/lib/designs";
import { designAsset, mediaUrl } from "@/lib/media";
import { site } from "@/config/site";
import { HeroScrub, type HeroFilm } from "@/components/hero/HeroScrub";
import { Services } from "@/components/sections/Services";
import { StompTagline } from "@/components/sections/StompTagline";
import { Gallery } from "@/components/gallery/Gallery";
import { Process } from "@/components/sections/Process";
import { About } from "@/components/sections/About";
import { SeoSection } from "@/components/sections/SeoSection";
import { FairsTeaser } from "@/components/sections/FairsTeaser";
import { Hobbies } from "@/components/sections/Hobbies";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { ContactAside } from "@/components/contact/ContactAside";
import { Link } from "@/i18n/navigation";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { pick } from "@/i18n/locales";

/**
 * Startseite: Hero-Film, Leitsatz, Leistungen & Zusammenarbeit, Entwürfe, Messen (nächste Termine),
 * Über mich, Hobbys, Fragen, Kontakt. Der vollständige Messekalender mit Messegeländen liegt auf /messen.
 * Seite alle 5 Minuten erneuern (Messetermine in der Vorschau).
 */
export const revalidate = 300;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const designs = getDesigns();
  const note = pick(site.visualisationNote, locale);

  const galleryItems = getGalleryItems();
  const range = sizeRange();
  // geschützte Leerzeichen: Maße nicht umbrechen
  const rangeText = { min: `${range.min.width}\u00a0×\u00a0${range.min.depth}\u00a0m`, max: `${range.max.width}\u00a0×\u00a0${range.max.depth}\u00a0m` };
  const img = (d: (typeof designs)[number], base = "render-1") => ({
    src: designAsset(d.id, `${base}-1280.webp`),
    srcSet: `${designAsset(d.id, `${base}-640.webp`)} 640w, ${designAsset(d.id, `${base}-1280.webp`)} 1280w`,
  });
  const d1 = getMediaDesign("001") ?? designs[0];
  // Hero-Aufbaufilme je Layout (config/layouts.ts): Entwürfe 001 (Studio, Ersatzbild) und 021 (Wood), dazu Zeitraffer der CL-Stände ohne Entwurfsbezug
  const heroFilms: HeroFilm[] = [
    ...[hero001, hero021].map((h) => {
      const d = getMediaDesign(h.id) ?? d1;
      return { id: h.id, label: `${h.id} ${d.title}`, clip: designAsset(h.id, "clip.mp4"), desktop: h.desktop, mobile: h.mobile };
    }),
    ...[heroLumen, heroAtrium, heroCopper, heroViolet, heroCanopy].map((h) => ({
      id: h.id, label: "", clip: mediaUrl(`custom/${h.id}-aufbau.mp4`), desktop: h.desktop, mobile: h.mobile,
    })),
  ];

  const processImages = [
          {
            src: mediaUrl("process/briefing-poster.webp?v=2"),
            video: mediaUrl("process/briefing.mp4?v=2"),
            startPoster: mediaUrl("process/briefing-start.webp?v=2"),
            once: true,
            alt: `${t("process.steps.briefing.title")} · ${t("process.sketch")}`,
          },
          {
            src: mediaUrl("process/concept-poster.webp"),
            video: mediaUrl("process/concept.mp4"),
            alt: `${t("process.steps.concept.title")} (${note})`,
          },
          {
            src: mediaUrl("process/planung-poster.webp"),
            video: mediaUrl("process/planung.mp4"),
            clean: true,
            alt: `${t("process.steps.planning.title")} (${note})`,
          },
          {
            src: mediaUrl("process/cnc-poster.webp"),
            video: mediaUrl("process/cnc.mp4"),
            alt: `${t("process.steps.production.title")} (${note})`,
          },
          {
            src: designAsset(d1.id, "clip-poster.webp"),
            video: designAsset(d1.id, "clip.mp4"),
            alt: `${d1.title} · ${t("process.steps.logistics.title")} (${note})`,
          },
          {
            src: mediaUrl("process/onsite-poster.webp"),
            video: mediaUrl("process/onsite.mp4"),
            alt: `${t("process.steps.onsite.title")} (${note})`,
          },
        ];

  return (
    <>
      <HeroScrub films={heroFilms} visNote={note} />

      <StompTagline text={t("tagline.text")} beats={t.raw("tagline.stomp") as string[]} />

      {/* Leistungen und Zusammenarbeit (sechs Schritte) als ein Abschnitt */}
      <Services
        media={{
          // Bilder aus Designs ohne Fremdlogos
          tech: img(designs.find((d) => d.id === "040") ?? designs[2]),
          prep: img(designs[1]),
          control: img(designs.find((d) => d.id === "033") ?? designs[0]),
          concept: img(designs.find((d) => d.id === "026") ?? designs[0]),
          reuse: img(designs.find((d) => d.id === "022") ?? designs[1]),
        }}
        visNote={note}
      >
        <Process images={processImages} visNote={note} embedded />
      </Services>

      <section id="designs" aria-labelledby="gallery-title" className="relative scroll-mt-4 py-24 md:py-32">
        <div className="container-x mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[920px]" data-reveal>
            <p className="eyebrow">{t("gallery.eyebrow")}</p>
            <h2 id="gallery-title" className="font-display mt-4 text-6xl font-semibold leading-none md:text-8xl"><Kinetic text={t("gallery.title")} stomp /></h2>
            <p className="mt-6 text-lg text-fg-muted"><FxWords text={t("gallery.lead", { ...rangeText, count: galleryItems.length, total: galleryItems.length })} delay={350} /></p>
          </div>
        </div>
        <Gallery items={galleryItems} />

        {/* Crawlbare Liste aller Designs (semantisches HTML) */}
        <div className="container-x mt-12">
          <details className="group rounded-2xl border border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold">
              {t("gallery.listTitle")} <span className="text-fg-subtle transition-transform duration-500 ease-fluid group-open:rotate-45">+</span>
            </summary>
            <ol className="grid gap-x-6 gap-y-1 px-5 pb-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {designs.map((d) => (
                <li key={d.slug}>
                  <Link href={{ pathname: "/designs/[slug]", params: { slug: d.slug } }} className="flex gap-2 py-1 text-fg-muted hover:text-fg">
                    <span className="tabular text-fg-subtle">{String(d.number).padStart(3, "0")}</span> {d.title}
                    {d.size && <span className="tabular ml-auto text-fg-subtle">{d.size.width}×{d.size.depth}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </section>

      <FairsTeaser locale={locale} />
      <About />
      <Hobbies
        videos={[
          { src: mediaUrl("hobby/ski-2.mp4?v=2"), poster: mediaUrl("hobby/ski-2-poster.webp?v=2"), portrait: true, duration: "1:31" },
          { src: mediaUrl("hobby/ski-3.mp4"), poster: mediaUrl("hobby/ski-3-poster.webp"), duration: "2:03" },
          { src: mediaUrl("hobby/ski-1.mp4"), poster: mediaUrl("hobby/ski-1-poster.webp"), portrait: true, duration: "0:25" },
        ]}
      />
      <SeoSection />

      <section id="kontakt" aria-labelledby="contact-title" className="relative scroll-mt-24 py-24 md:py-32">
        <div className="container-x">
          <div className="max-w-[920px]" data-reveal>
            <p className="eyebrow">{t("contact.eyebrow")}</p>
            <h2 id="contact-title" className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("contact.title")} stomp /></h2>
            <p className="mt-6 text-lg text-fg-muted">
              <FxWords text={`${t("contact.lead")} ${t("contact.response", { time: pick(site.responseTime, locale) })}`} delay={350} />
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
            <InquiryForm items={galleryItems.map(({ id, slug, n, title }) => ({ id, slug, n, title }))} />
            <ContactAside />
          </div>
        </div>
      </section>
    </>
  );
}
