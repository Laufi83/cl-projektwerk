import { designAsset } from "@/lib/media";
export type GalleryItem = {
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
  w: number;
  h: number;
};

export const FILTERS = [
  { key: "all", test: () => true },
  { key: "clip", test: (d: GalleryItem) => d.clip },
  { key: "two-storey", test: (d: GalleryItem) => (d.floors ?? 1) >= 2 },
  { key: "size-s", test: (d: GalleryItem) => d.area != null && d.area <= 30 },
  { key: "size-m", test: (d: GalleryItem) => d.area != null && d.area > 30 && d.area <= 150 },
  { key: "size-l", test: (d: GalleryItem) => d.area != null && d.area > 150 },
  { key: "wood", test: (d: GalleryItem) => d.tags.includes("wood") },
  { key: "green", test: (d: GalleryItem) => d.tags.includes("green") },
  { key: "metal", test: (d: GalleryItem) => d.tags.includes("metal") },
  { key: "light", test: (d: GalleryItem) => d.tags.includes("light") },
  { key: "container", test: (d: GalleryItem) => d.tags.includes("container") },
  { key: "product", test: (d: GalleryItem) => d.tags.includes("product") },
  { key: "real-estate", test: (d: GalleryItem) => d.tags.includes("real-estate") },
  { key: "outdoor", test: (d: GalleryItem) => d.tags.includes("outdoor") },
] as const;
export type FilterKey = (typeof FILTERS)[number]["key"];

export const pad3 = (n: number) => String(n).padStart(3, "0");
export const thumbUrl = (id: string, base = "render-1", w: 640 | 1280 = 640) => designAsset(id, `${base}-${w}.webp`);
