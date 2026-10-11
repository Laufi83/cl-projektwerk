import { getTranslations, setRequestLocale } from "next-intl/server";
import hero001 from "../../../public/hero/001/hero.json";
import hero002 from "../../../public/hero/002/hero.json";
import hero003 from "../../../public/hero/003/hero.json";
import hero004 from "../../../public/hero/004/hero.json";
import hero005 from "../../../public/hero/005/hero.json";
import { getDesigns, getGalleryItems, getMediaDesign, releaseInfo, sizeRange } from "@/lib/designs";
import { designAsset, mediaUrl } from "@/lib/media";
import { site } from "@/config/site";
import { HeroScrub, type HeroFilm } from "@/components/hero/HeroScrub";
import { Services } from "@/components/sections/Services";
import { TaglineReveal } from "@/components/sections/TaglineReveal";
import { Gallery } from "@/components/gallery/Gallery";
import { Process } from "@/components/sections/Process";
import { World } from "@/components/sections/World";
import { locations } from "@/config/locations";
import { tradeFairs, TRADE_FAIRS_CHECKED } from "@/config/trade-fairs";
import { boardRows } from "@/lib/trade-fairs";
import { LedShowreel } from "@/components/sections/LedShowreel";
import { Graphics } from "@/components/sections/Graphics";
import { About } from "@/components/sections/About";
import { SeoSection } from "@/components/sections/SeoSection";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { ContactAside } from "@/components/contact/ContactAside";
import { Link } from "@/i18n/navigation";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { DailyDrop } from "@/components/gallery/DailyDrop";
import { pick } from "@/i18n/locales";

/** Jeden Morgen um 5:00 Uhr kommt ein Design dazu (lib/release.ts): Seite alle 5 Minuten erneuern */
export const revalidate = 300;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const designs = getDesigns();
  const note = pick(site.visualisationNote, locale);

  const galleryItems = getGalleryItems();
  // Messekalender: je Stadt die nächste Messe ab heute (Seite wird alle 5 Minuten erneuert)
  const now = new Date();
  const release = releaseInfo();
  const range = sizeRange();
  // geschützte Leerzeichen: Maße nicht umbrechen
  const rangeText = { min: `${range.min.width}\u00a0×\u00a0${range.min.depth}\u00a0m`, max: `${range.max.width}\u00a0×\u00a0${range.max.depth}\u00a0m` };
  const img = (d: (typeof designs)[number], base = "render-1") => ({
    src: designAsset(d.id, `${base}-1280.webp`),
    srcSet: `${designAsset(d.id, `${base}-640.webp`)} 640w, ${designAsset(d.id, `${base}-1280.webp`)} 1280w`,
  });
  const d1 = getMediaDesign("001") ?? designs[0];
  // Je Layout ein eigener Aufbaufilm im Hero (Designs 001–005, siehe config/layouts.ts)
  const heroFilms: HeroFilm[] = [hero001, hero002, hero003, hero004, hero005].map((h) => {
    const d = getMediaDesign(h.id) ?? d1;
    return { id: h.id, slug: d.slug, title: d.title, desktop: h.desktop, mobile: h.mobile };
  });

  return (
    <>
      <HeroScrub films={heroFilms} visNote={note} />

      <Services
        media={{
          // Bilder aus Designs ohne Fremdlogos
          tech: img(designs.find((d) => d.id === "040") ?? designs[2]),
          prep: img(designs[1]),
          control: img(designs.find((d) => d.id === "033") ?? designs[0]),
          concept: { src: mediaUrl("graphics/grafikdaten-poster.webp"), video: mediaUrl("custom/skizze-animation.mp4") },
          reuse: { src: "/led/led-automotive-16x9.webp", video: "/led/led-automotive-16x9.mp4" },
        }}
        packageImage={designAsset((designs.find((d) => d.id === "026") ?? designs[0]).id, "render-1-1280.webp")}
        visNote={note}
      />

      <TaglineReveal text={t("tagline.text")} />

      <section id="designs" aria-labelledby="gallery-title" className="relative scroll-mt-4 py-24 md:py-32">
        <div className="container-x mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[920px]" data-reveal>
            <p className="eyebrow">{t("gallery.eyebrow")}</p>
            <h2 id="gallery-title" className="font-display mt-4 text-6xl font-semibold leading-none md:text-8xl"><Kinetic text={t("gallery.title")} /></h2>
            <p className="mt-6 text-lg text-fg-muted">{t("gallery.lead", { ...rangeText, count: release.released, total: release.total })}</p>
          </div>
          <DailyDrop info={release} className="w-full" />
        </div>
        <Gallery items={galleryItems} dayPick={release.latest.slug} />

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

      <Process
        images={[
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
        ]}
        visNote={note}
      />

      <Graphics visNote={note} />
      <LedShowreel />
      <World rows={boardRows(locations, tradeFairs, now)} nowIso={now.toISOString()} checked={TRADE_FAIRS_CHECKED} />
      <SeoSection />
      <About />

      <section id="kontakt" aria-labelledby="contact-title" className="relative scroll-mt-24 py-24 md:py-32">
        <div className="container-x">
          <div className="max-w-[920px]" data-reveal>
            <p className="eyebrow">{t("contact.eyebrow")}</p>
            <h2 id="contact-title" className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("contact.title")} /></h2>
            <p className="mt-6 text-lg text-fg-muted">
              {t("contact.lead")} {t("contact.response", { time: pick(site.responseTime, locale) })}
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
