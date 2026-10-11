/** Datenmodell eines Designs, wie es in content/designs.json steht. */
export type Locale = "de" | "en";
export type LocalizedText = { de: string; en: string };

export type MediaRef = {
  /** Dateiname im Ordner public/media/designs/NNN/ */
  file: string;
  label: LocalizedText;
};

export type StandType = "corner" | "head" | "island" | "row" | null;

export type DesignEntry = {
  id: string;
  slug: string;
  /** Quellordner im Render-Bestand (nur für den Import relevant) */
  source?: string;
  published?: boolean;
  featured?: boolean;
  series?: string;
  title: string;
  tags: string[];
  size: { width: number; depth: number; area: number } | null;
  floors: number | null;
  height: number | null;
  standType: StandType;
  description: LocalizedText;
  materials: LocalizedText | null;
  colours: LocalizedText | null;
  renderings: MediaRef[];
  floorplan: MediaRef | null;
  elevation: MediaRef | null;
  extraPlans: MediaRef[];
  clip: { file: string; poster: string; end?: string; duration?: number } | null;
};

/** Ergänzt vom Build-Skript (src/generated/manifest.json). */
export type ImageInfo = {
  file: string;
  /** Basisname ohne Endung, z. B. „render-1“ */
  base: string;
  width: number;
  height: number;
  /** Erzeugte Breiten (AVIF + WebP), die größte ist der WebP-Master */
  widths: number[];
  blur?: string;
  label: LocalizedText;
  /** Download-Datei (JPG) für Pläne */
  download?: string;
  placeholder?: boolean;
};

export type Design = Omit<DesignEntry, "renderings" | "floorplan" | "elevation" | "extraPlans"> & {
  number: number;
  renderings: ImageInfo[];
  floorplan: ImageInfo | null;
  elevation: ImageInfo | null;
  extraPlans: ImageInfo[];
  /** Grundfarbe des Hauptrenderings (für Ladezustände) */
  tone: string;
};

/** Kompakter Eintrag für den Slider (public/media/designs/index.json). */
export type DesignIndexItem = {
  id: string;
  slug: string;
  n: number;
  title: string;
  tags: string[];
  size: string | null;
  area: number | null;
  floors: number | null;
  clip: boolean;
  tone: string;
  blur: string;
  w: number;
  h: number;
};
