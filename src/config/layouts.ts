/**
 * Sieben Layouts (01 Studio, 02 Wood, 03 Lumen, 04 Atrium, 05 Copper, 06 Violet, 07 Canopy),
 * umschaltbar über die Lasche am rechten Rand (Rollmenü wie die Sprachwahl).
 * Je Layout: Farben, Schriften, Hero-Anordnung (alles in src/app/layouts.css),
 * Aufbaufilm im Hero und eigener Hover-Effekt der animierten Schriften.
 * film = Bildsequenz des Hero-Aufbaufilms in public/hero/<film>/ (auch Poster und Ersatzbild).
 * sharedFilm: true = Hero zeigt das gemeinsame Scroll-Video (Studio) (media/custom/homepage-scroll-build.mp4),
 * false = die eigene Bildsequenz (Wood: Entwurf 021 „Lamello“, Lumen: Firefly-Zeitraffer des hellen CL-Stands,
 * Atrium, Copper, Violet, Canopy: Zeitraffer der CL-Stände CL-02 bis CL-05; Farben je Layout aus dem jeweiligen Film).
 */
export const LAYOUTS = [
  {
    id: "studio",
    n: "01",
    name: "Studio",
    film: "001",
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
    // Entwurf 021 „Lamello“: eigener Aufbaufilm aus dem Firefly-Zeitraffer (public/hero/021)
    film: "021",
    sharedFilm: false,
    theme: "#16100b",
    swatch: "linear-gradient(135deg,#16100b 45%,#c98d55 45% 72%,#efe3cf 72%)",
    effect: "slat",
    font: "var(--font-raleway)",
    desc: { de: "Eiche, Walnuss & Creme · filigrane Schrift · Lamellen drehen sich", en: "Oak, walnut & cream · fine type · turning slats" },
  },
  {
    id: "lumen",
    n: "03",
    name: "Lumen",
    // Eigener Aufbaufilm: Firefly-Zeitraffer des hellen CL-Stands mit hinterleuchteter Lichtwand (public/hero/lumen)
    film: "lumen",
    sharedFilm: false,
    theme: "#060b12",
    swatch: "linear-gradient(135deg,#060b12 45%,#4fd2f7 45% 72%,#e9eef2 72%)",
    effect: "glow",
    font: "var(--font-sora)",
    desc: { de: "Eisblau, Silber & Glas · Buchstaben leuchten auf", en: "Ice blue, silver & glass · letters light up" },
  },
  {
    id: "atrium",
    n: "04",
    name: "Atrium",
    // Zeitraffer CL-02: runder, zweigeschossiger Stand in Creme mit Messing und warmem Lichtband (public/hero/atrium)
    film: "atrium",
    sharedFilm: false,
    theme: "#14100a",
    swatch: "linear-gradient(135deg,#14100a 45%,#d8b06a 45% 72%,#f1e7d6 72%)",
    effect: "shimmer",
    font: "var(--font-jost)",
    desc: { de: "Espresso, Champagner & Creme · Goldschimmer", en: "Espresso, champagne & cream · golden shimmer" },
  },
  {
    id: "copper",
    n: "05",
    name: "Copper",
    // Zeitraffer CL-03: schwarzes Stahlgerüst mit gefaltetem Kupferdach (public/hero/copper)
    film: "copper",
    sharedFilm: false,
    theme: "#0b0b0c",
    swatch: "linear-gradient(135deg,#0b0b0c 45%,#d07a43 45% 72%,#5a5a5f 72%)",
    effect: "fold",
    font: "var(--font-josefin)",
    desc: { de: "Stahlschwarz & Kupfer · Buchstaben falten sich", en: "Steel black & copper · folding letters" },
  },
  {
    id: "violet",
    n: "06",
    name: "Violet",
    // Zeitraffer CL-04: schwarzer Stand mit violetten LED-Linien und Lamellenturm (public/hero/violet)
    film: "violet",
    sharedFilm: false,
    theme: "#09080e",
    swatch: "linear-gradient(135deg,#09080e 45%,#9b7bff 45% 72%,#e9e6f7 72%)",
    effect: "neon",
    font: "var(--font-archivo)",
    desc: { de: "Schwarz & Violett · Neonlicht flackert", en: "Black & violet · flickering neon" },
  },
  {
    id: "canopy",
    n: "07",
    name: "Canopy",
    // Zeitraffer CL-05: Holzgitter, Naturstein und viel Grün (public/hero/canopy)
    film: "canopy",
    sharedFilm: false,
    theme: "#0d120d",
    swatch: "linear-gradient(135deg,#0d120d 45%,#a9c97a 45% 72%,#c99a62 72%)",
    effect: "sway",
    font: "var(--font-mulish)",
    desc: { de: "Blattgrün, Rattan & Stein · Buchstaben wiegen sich", en: "Leaf green, rattan & stone · swaying letters" },
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
  Object.fromEntries(LAYOUTS.map((l) => [l.id, l.film])),
)};var k=document.createElement("link");k.rel="preload";k.as="image";k.setAttribute("fetchpriority","high");k.href="/hero/"+m[l]+"/poster-"+(matchMedia(${JSON.stringify(HERO_PORTRAIT_QUERY)}).matches?"mobile":"desktop")+".webp";document.head.appendChild(k);}catch(e){}})();`;
