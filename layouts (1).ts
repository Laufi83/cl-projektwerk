/**
 * Vier Layouts (Art Direction: Studio 1, Aurora 2, Tide 4, Monochrom), umschaltbar über die Lasche links.
 * Je Layout: Farben, Schriften, Hero-Anordnung (alles in src/app/layouts.css),
 * eigener Aufbaufilm im Hero und eigener Hover-Effekt der animierten Schriften.
 */
export const LAYOUTS = [
  {
    id: "studio",
    n: "01",
    name: "Studio",
    design: "001",
    theme: "#0a0a0b",
    swatch: "linear-gradient(135deg,#0a0a0b 50%,#f26a1b 50%)",
    effect: "lift",
    font: "var(--font-mona)",
    desc: { de: "Anthrazit & Orange · Buchstaben heben sich", en: "Charcoal & orange · letters lift" },
  },
  {
    id: "aurora",
    n: "02",
    name: "Aurora",
    design: "002",
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
    theme: "#062a2c",
    swatch: "linear-gradient(135deg,#062a2c 50%,#ff8f6b 50%)",
    effect: "weight",
    font: "var(--font-bricolage)",
    desc: { de: "Petrol & Koralle · Schriftgewicht-Welle", en: "Petrol & coral · weight wave" },
  },
  {
    id: "mono",
    n: "M",
    name: "Monochrom",
    design: "003",
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
