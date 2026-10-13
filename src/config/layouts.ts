/**
 * Fünf Layouts (01 Studio, 02 Wood, 03 Aurora, 04 Tide, 05 Monochrom), umschaltbar über die Lasche links.
 * Je Layout: Farben, Schriften, Hero-Anordnung (alles in src/app/layouts.css),
 * eigener Aufbaufilm im Hero und eigener Hover-Effekt der animierten Schriften.
 * sharedFilm: true = Hero zeigt das gemeinsame Scroll-Video (media/custom/homepage-scroll-build.mp4),
 * false = die eigene Bildsequenz des Layouts (Wood: Firefly-Zeitraffer von Entwurf 021).
 */
export const LAYOUTS = [
  {
    id: "studio",
    n: "01",
    name: "Studio",
    design: "001",
    sharedFilm: true,
    theme: "#0a0a0b",
    swatch: "linear-gradient(135deg,#0a0a0b 50%,#f26a1b 50%)",
    effect: "lift",
    font: "var(--font-mona)",
    desc: { de: "Anthrazit & Orange · Buchstaben heben sich", en: "Charcoal & orange · letters lift" },
  },
  {
    id: "wood",
    n: "02",
    name: "Wood",
    // Entwurf 021 „Lamello“: Aufbaufilm aus dem Firefly-Zeitraffer (public/hero/021)
    design: "021",
    sharedFilm: false,
    theme: "#16100b",
    swatch: "linear-gradient(135deg,#16100b 45%,#c98d55 45% 72%,#efe3cf 72%)",
    effect: "slat",
    font: "var(--font-fraunces)",
    desc: { de: "Eiche, Walnuss & Creme · Lamellen drehen sich", en: "Oak, walnut & cream · turning slats" },
  },
  {
    id: "aurora",
    n: "03",
    name: "Aurora",
    design: "002",
    sharedFilm: true,
    theme: "#070b1d",
    swatch: "linear-gradient(135deg,#070b1d 45%,#7cf5d4 45% 72%,#b69cff 72%)",
    effect: "loupe",
    font: "var(--font-instrument)",
    desc: { de: "Mitternacht, Mint & Serif · Lupe", en: "Midnight, mint & serif · loupe" },
  },
  {
    id: "tide",
    n: "04",
    name: "Tide",
    design: "004",
    sharedFilm: true,
    theme: "#062a2c",
    swatch: "linear-gradient(135deg,#062a2c 50%,#ff8f6b 50%)",
    effect: "weight",
    font: "var(--font-bricolage)",
    desc: { de: "Petrol & Koralle · Schriftgewicht-Welle", en: "Petrol & coral · weight wave" },
  },
  {
    id: "mono",
    n: "05",
    name: "Monochrom",
    design: "003",
    sharedFilm: true,
    theme: "#000000",
    swatch: "linear-gradient(135deg,#000 50%,#fff 50%)",
    effect: "line",
    font: "var(--font-spacegrotesk)",
    desc: { de: "Schwarz & Weiß · Linienversatz", en: "Black & white · line offset" },
  },
] as const;

export type Layout = (typeof LAYOUTS)[number];
export type LayoutId = Layout["id"];
export type KineticEffect = Layout["effect"];

export const DEFAULT_LAYOUT: LayoutId = "studio";
export const LAYOUT_STORAGE_KEY = "layout:v1";
export const isLayoutId = (v: unknown): v is LayoutId => LAYOUTS.some((l) => l.id === v);
export const layoutById = (id: LayoutId) => LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];

/** Media-Query für Hochformat-Poster und -Frames des Heros (wie in layouts.css und HeroScrub) */
export const HERO_PORTRAIT_QUERY = "(orientation: portrait)";

/**
 * Inline-Skript im <head>, läuft beim Parsen vor dem ersten Zeichnen:
 * gespeichertes Layout setzen (kein Aufblitzen) und das passende Hero-Poster (LCP-Bild) sofort mit hoher Priorität vorladen –
 * sonst entdeckt der Browser es erst nach dem Stylesheet (CSS-Variable --hero-poster).
 */
export const layoutInitScript = `(function(){var d=document.documentElement,l=${JSON.stringify(DEFAULT_LAYOUT)};try{var v=localStorage.getItem(${JSON.stringify(LAYOUT_STORAGE_KEY)});if(${JSON.stringify(
  LAYOUTS.map((l) => l.id),
)}.indexOf(v)>-1){d.setAttribute("data-layout",v);l=v;}}catch(e){}try{var m=${JSON.stringify(
  Object.fromEntries(LAYOUTS.map((l) => [l.id, l.design])),
)};var k=document.createElement("link");k.rel="preload";k.as="image";k.setAttribute("fetchpriority","high");k.href="/hero/"+m[l]+"/poster-"+(matchMedia(${JSON.stringify(HERO_PORTRAIT_QUERY)}).matches?"mobile":"desktop")+".webp";document.head.appendChild(k);}catch(e){}})();`;
