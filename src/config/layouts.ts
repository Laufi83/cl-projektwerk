/**
 * Vier Layouts (01 Studio, 02 Lumen, 03 Copper, 04 Violet – Wood, Atrium, Canopy seit 22.10.2026 entfernt),
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
    id: "lumen",
    n: "02",
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
    id: "copper",
    n: "03",
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
    n: "04",
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
/**
 * Layout-Umschalter (LayoutDock): bei false zeigt die Seite nur das Standard-Layout und ignoriert eine gespeicherte Wahl
 * (dann auch <LayoutDock /> in app/[locale]/layout.tsx entfernen).
 */
export const LAYOUT_SWITCH = true;

export const layoutInitScript = `(function(){var d=document.documentElement,l=${JSON.stringify(DEFAULT_LAYOUT)};try{if(!${JSON.stringify(LAYOUT_SWITCH)})throw 0;var v=localStorage.getItem(${JSON.stringify(LAYOUT_STORAGE_KEY)});if(${JSON.stringify(
  LAYOUTS.map((l) => l.id),
)}.indexOf(v)>-1){d.setAttribute("data-layout",v);l=v;}}catch(e){}try{var m=${JSON.stringify(
  Object.fromEntries(LAYOUTS.map((l) => [l.id, l.film])),
)};var k=document.createElement("link");k.rel="preload";k.as="image";k.setAttribute("fetchpriority","high");k.href="/hero/"+m[l]+"/poster-"+(matchMedia(${JSON.stringify(HERO_PORTRAIT_QUERY)}).matches?"mobile":"desktop")+".webp";document.head.appendChild(k);}catch(e){}})();`;
