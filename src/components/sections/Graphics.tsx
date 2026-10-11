import { getTranslations } from "next-intl/server";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { InViewVideo } from "@/components/media/InViewVideo";
import { mediaUrl } from "@/lib/media";

/** Grafikgestaltung & Großformatdruck: Text, Leistungsmerkmale und Video (public/media/graphics/). */
export async function Graphics({ visNote }: { visNote: string }) {
  const t = await getTranslations("graphics");
  const points = t.raw("points") as { title: string; text: string }[];
  return (
    <section id="grafik" aria-labelledby="graphics-title" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="container-x grid items-start gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-16">
        <div data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="graphics-title" className="font-display mt-4 text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={t("title")} /></h2>
          <p className="mt-6 max-w-xl text-lg text-fg-muted">{t("text")}</p>
          <ul className="mt-8 grid max-w-xl gap-4">
            {points.map((p) => (
              <li key={p.title} className="flex gap-3">
                <Check size={18} weight="bold" className="mt-1 shrink-0 text-accent" aria-hidden />
                <p><span className="font-semibold">{p.title}.</span> <span className="text-fg-muted">{p.text}</span></p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-xl text-xl font-semibold md:text-2xl">{t("close")}</p>
        </div>
        <figure className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-line bg-bg-raised lg:sticky lg:top-28" data-reveal>
          <InViewVideo
            src={mediaUrl("graphics/grafikdaten.mp4")}
            poster={mediaUrl("graphics/grafikdaten-poster.webp")}
            muted
            loop
            playsInline
            preload="none"
            aria-label={t("videoLabel")}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="vis-note absolute left-3 top-3">{visNote}</span>
        </figure>
      </div>
    </section>
  );
}
