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
  exclude: [] as readonly number[],
} as const;
