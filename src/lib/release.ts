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
  /** 227–236 auf Wunsch des Inhabers seit 22.10.2026 nicht auf der Website (alle übrigen Entwürfe werden gezeigt) */
  exclude: Array.from({ length: 10 }, (_, i) => 227 + i) as readonly number[],
  /** Optional: nur diese Nummern zeigen (leer = alle außer exclude). Seit 22.10.2026 leer – alle Entwürfe außer exclude. */
  show: [] as readonly number[],
} as const;
