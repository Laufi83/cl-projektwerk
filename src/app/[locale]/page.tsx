import { getTranslations, setRequestLocale } from "next-intl/server";
import hero001 from "../../../public/hero/001/hero.json";
import heroLumen from "../../../public/hero/lumen/hero.json";
import heroCopper from "../../../public/hero/copper/hero.json";
import heroViolet from "../../../public/hero/violet/hero.json";
import { getDesigns, getGalleryItems, getMediaDesign } from "@/lib/designs";
import { designAsset, mediaUrl } from "@/lib/media";
import { site } from "@/config/site";
import { HeroScrub, type HeroFilm } from "@/components/hero/HeroScrub";
import { Services } from "@/components/sections/Services";
import { Gallery } from "@/components/gallery/Gallery";
import { About } from "@/components/sections/About";
import { References } from "@/components/sections/References";
import { SeoSection } from "@/components/sections/SeoSection";
import { InquiryForm } from "@/components/contact/InquiryForm";
import { ContactAside } from "@/components/contact/ContactAside";
import { Link } from "@/i18n/navigation";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";
import { pick } from "@/i18n/locales";

/**
 * Startseite als Verkaufsseite (seit 20.10.2026, sieben Abschnitte): Hero, Leistungen & Zusammenarbeit,
 * zwölf Designstudien, Über mich, Referenzen, Fragen, Kontakt. Atlas, Messekalender und Projektleiter-Werkzeuge liegen auf eigenen
 * Seiten (/messen, /projektleitung) und nicht mehr auf der Startseite.
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
  // alle veröffentlichten Designstudien (kuratierte Auswahl in lib/release.ts)
  const studies = galleryItems;
  const img = (d: (typeof designs)[number], base = "render-1") => ({
    src: designAsset(d.id, `${base}-1280.webp`),
    srcSet: `${designAsset(d.id, `${base}-640.webp`)} 640w, ${designAsset(d.id, `${base}-1280.webp`)} 1280w`,
  });
  // vom Auftraggeber gewählte Renderings je Leistung (public/media/services)
  // ein Klick aufs Bild öffnet den abgebildeten Entwurf (Ordner 142 → 010, 29 → 043, 36 → 048, 48 → 112)
  const linked = (id: string) => {
    const g = galleryItems.find((x) => x.id === id);
    return g ? { slug: g.slug, label: `${id} ${g.title}`, tone: g.tone } : undefined;
  };
  const svc = (k: string, id: string) => ({ src: mediaUrl(`services/${k}-1280.webp`), srcSet: `${mediaUrl(`services/${k}-640.webp`)} 640w, ${mediaUrl(`services/${k}-1280.webp`)} 1280w`, design: linked(id) });
  const d1 = getMediaDesign("001") ?? designs[0];
  // Hero-Aufbaufilme je Layout (config/layouts.ts): Entwurf 001 (Studio, Ersatzbild), dazu Zeitraffer der CL-Stände (Lumen, Copper, Violet)
  const heroFilms: HeroFilm[] = [
    ...[hero001].map((h) => {
      const d = getMediaDesign(h.id) ?? d1;
      return { id: h.id, label: `${h.id} ${d.title}`, clip: designAsset(h.id, "clip.mp4"), desktop: h.desktop, mobile: h.mobile };
    }),
    ...[heroLumen, heroCopper, heroViolet].map((h) => ({
      id: h.id, label: "", clip: mediaUrl(`custom/${h.id}-aufbau.mp4`), desktop: h.desktop, mobile: h.mobile,
    })),
  ];


  return (
    <>
      <HeroScrub films={heroFilms} visNote={note} />

      {/* Leistungen und Zusammenarbeit (sechs Schritte) als ein Abschnitt */}
      <Services
        media={{
          tech: svc("tech", "010"),
          prep: svc("prep", "043"),
          control: { ...img(designs.find((d) => d.id === "033") ?? designs[0]), design: linked("033") },
          concept: svc("concept", "048"),
          reuse: svc("reuse", "112"),
        }}
        visNote={note}
      >
      </Services>

      <section id="designs" aria-labelledby="gallery-title" className="relative scroll-mt-4 py-24 md:py-32">
        <div className="container-x mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[920px]" data-reveal>
            <p className="eyebrow">{t("studies.eyebrow")}</p>
            <h2 id="gallery-title" className="font-display mt-4 text-6xl font-semibold leading-none md:text-8xl"><Kinetic text={t("studies.title")} stomp /></h2>
            <p className="mt-6 text-lg text-fg-muted"><FxWords text={t("studies.lead", { count: studies.length })} delay={350} /></p>
          </div>
          <Link href="/designs" className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-semibold hover:bg-white/5">{t("studies.all")}</Link>
        </div>
        <Gallery items={studies} />
      </section>

      <About />
      <References />
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
