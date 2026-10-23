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
   * Auf Wunsch des Inhabers seit 23.10.2026 nicht auf der Website: 149–164 (Alpine-Gear-Größenreihe 3×3 bis 8×7 m)
   * und 197–236 (CL32-Reihe bis Kopfstand 7×5 m · Variante B). 165 und 237 bleiben sichtbar.
   */
  exclude: [...Array.from({ length: 16 }, (_, i) => 149 + i), ...Array.from({ length: 40 }, (_, i) => 197 + i)] as readonly number[],
} as const;
