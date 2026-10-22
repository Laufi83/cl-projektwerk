/**
 * Veröffentlichung der Designs: seit 14.10.2026 sind alle Entwürfe auf einmal online
 * (vorher kam jeden Morgen um 5:00 Uhr ein weiterer dazu).
 */
export const RELEASE = {
  /**
   * Nicht in Galerie, Detailseiten und Sitemap (Nummern eintragen, um ein Design zurückzuhalten).
   * Seit 14.10.2026 auf Wunsch des Inhabers leer: auch 009–018 (EXPO-REAL-Serie, mit Fremdlogos anderer Aussteller
   * in den Hallenhintergründen) sind sichtbar. Die Ordner 129–132 (Brillen-Stände mit Fremdlogos) sind nicht importiert.
   */
  /**
   * Auf Wunsch des Inhabers nicht auf der Website (Stand 22.10.2026): 149–165 (Alpine-Gear-Größenreihe) und
   * 197–237 (CL32-Reihe inkl. Varianten B). „79 Alpine Gear“ bleibt sichtbar. Alle übrigen Entwürfe werden gezeigt.
   */
  exclude: [...Array.from({ length: 17 }, (_, i) => 149 + i), ...Array.from({ length: 41 }, (_, i) => 197 + i)] as readonly number[],
  /** Optional: nur diese Nummern zeigen (leer = alle außer exclude). Seit 22.10.2026 leer – alle Entwürfe außer exclude. */
  show: [] as readonly number[],
} as const;
