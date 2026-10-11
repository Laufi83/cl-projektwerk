import type { ImageInfo } from "./design-types";

/**
 * Basis-URL für Medien: lokal /media (public/media/…), live z. B. Objektspeicher/CDN.
 * Bewusst nicht /designs – das ist die Seitenroute /designs/[slug].
 */
// zur Build-Zeit eingesetzt; leere Variable = Standard
export const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE || "/media").replace(/\/+$/, "");
export const mediaUrl = (path: string) => `${MEDIA_BASE}/${path.replace(/^\//, "")}`;

export const designAsset = (id: string, file: string) => `${MEDIA_BASE}/designs/${id}/${file}`;

/** srcset für AVIF und WebP aus den vorab erzeugten Varianten. */
export function srcSets(id: string, img: Pick<ImageInfo, "base" | "widths" | "width">) {
  const parts = img.widths.map((w) => ({
    w,
    avif: w === img.width ? null : designAsset(id, `${img.base}-${w}.avif`),
    webp: w === img.width ? designAsset(id, `${img.base}.webp`) : designAsset(id, `${img.base}-${w}.webp`),
  }));
  const avif = parts.filter((p) => p.avif).map((p) => `${p.avif} ${p.w}w`).join(", ");
  const webp = parts.map((p) => `${p.webp} ${p.w}w`).join(", ");
  return { avif, webp, fallback: designAsset(id, `${img.base}.webp`) };
}

/** Kleinste Variante ≥ Zielbreite (für Texturen des Sliders). */
export function variantUrl(id: string, base: string, width: 640 | 1280 | "master" = 640) {
  return width === "master" ? designAsset(id, `${base}.webp`) : designAsset(id, `${base}-${width}.webp`);
}
