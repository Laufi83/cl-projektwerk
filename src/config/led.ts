/**
 * LED-Wand-Showreel. Solange `clips` leer ist, zeigt die Sektion beschriftete Platzhalter.
 * Clips stumm, als MP4 (H.264, +faststart) + Poster in public/led/ ablegen und hier eintragen.
 * Anordnung (Desktop): Querformate links untereinander, Hochformat rechts über die ganze Höhe.
 * Quelle: Adobe Stock (Lizenz beachten), fürs Web auf 1600 px bzw. 900 × 1600 px verkleinert.
 */
export type LedClip = { src: string; poster: string; title: { de: string; en: string }; ratio: string; format?: string };

export const ledClips: LedClip[] = [
  { src: "/led/led-nachhaltigkeit-16x9.mp4", poster: "/led/led-nachhaltigkeit-16x9.webp", title: { de: "Nachhaltigkeit", en: "Sustainability" }, ratio: "16 / 9", format: "16:9 · 3840 × 2160 px" },
  { src: "/led/led-automotive-16x9.mp4", poster: "/led/led-automotive-16x9.webp", title: { de: "Automotive · AR-Design", en: "Automotive · AR design" }, ratio: "16 / 9", format: "16:9 · 3840 × 2160 px" },
  { src: "/led/led-ki-9x16.mp4", poster: "/led/led-ki-9x16.webp", title: { de: "Künstliche Intelligenz", en: "Artificial intelligence" }, ratio: "9 / 16", format: "9:16 · 2160 × 3840 px" },
];
