import "server-only";
import manifest from "@/generated/manifest.json";
import type { Design, Locale } from "./design-types";
import type { GalleryItem } from "@/components/gallery/types";
import { RELEASE } from "./release";
import { contentLocale } from "@/i18n/locales";

const everything = [...(manifest as unknown as { designs: Design[] }).designs].sort((a, b) => a.number - b.number);
/** veröffentlichbare Designs (ohne RELEASE.exclude, z. B. wegen Fremdlogos) */
const all = everything.filter((d) => !RELEASE.exclude.includes(d.number));
/** Alle veröffentlichten Designs in Nummernfolge (siehe lib/release.ts) */
export function getDesigns(): Design[] {
  return all;
}

export function getDesign(slug: string): Design | undefined {
  return getDesigns().find((d) => d.slug === slug);
}

export function getNeighbours(slug: string) {
  const list = getDesigns();
  const i = list.findIndex((d) => d.slug === slug);
  return {
    prev: i > 0 ? list[i - 1] : list[list.length - 1],
    next: i < list.length - 1 ? list[i + 1] : list[0],
  };
}

export function sizeRange() {
  const areas = getDesigns().map((d) => d.size).filter(Boolean) as NonNullable<Design["size"]>[];
  const min = areas.reduce((a, b) => (b.area < a.area ? b : a));
  const max = areas.reduce((a, b) => (b.area > a.area ? b : a));
  return { min, max };
}

export const localized = <T extends { de: string; en: string } | null | undefined>(t: T, locale: Locale) =>
  t ? t[contentLocale(locale)] || t.de : "";

/** Design unabhängig von der Veröffentlichung – nur für Medien (Hero-Filme, Aufbaufilme), nie für Seiten oder Links */
export function getMediaDesign(id: string): Design | undefined {
  return everything.find((d) => d.id === id);
}

/** Designs mit Aufbaufilm (für „5 Stände. 10 Sekunden.“) – unabhängig von der Galerie */
export function getFilmItems(): GalleryItem[] {
  return everything.filter((d) => d.clip).slice(0, 5).map(toItem);
}

const toItem = (d: Design): GalleryItem => ({
  id: d.id, slug: d.slug, n: d.number, title: d.title, tags: d.tags,
  size: d.size ? `${d.size.width} × ${d.size.depth} m` : null, area: d.size?.area ?? null, floors: d.floors,
  clip: !!d.clip, tone: d.tone, w: d.renderings[0].width, h: d.renderings[0].height,
});

/** Kompakte Liste für Slider, Raster und Favoriten (ohne Blur-Daten, klein im RSC-Payload). */
export function getGalleryItems(): GalleryItem[] {
  return getDesigns().map(toItem);
}
