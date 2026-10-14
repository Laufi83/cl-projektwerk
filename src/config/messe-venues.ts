/** Messegelände-Guide (Atlas). Adapter auf die kanonische Datenquelle src/data/messebau/venues.global.v1.json
 * (Schema: lib/messebau/schema.ts). Redaktionelle Steckbriefe des Auftraggebers (11.10.2026) unter legacy.guide;
 * Empfehlungen, Öffnungszeiten, Verkehrslinien und Größenangaben sind vor Nutzung vor Ort zu prüfen.
 * Stadtmittelpunkte markieren die Übersicht (coordinates.precision = "city"); sie sind keine Hallen-/Eingangskoordinaten. */
import { legacyEuropeanVenues } from "@/lib/messebau/venues";

export type MesseVenue = {id:string;number:number;city:string;venue:string;lat:number|null;lon:number|null;facts:{area?:string;insider?:string;cityInfo?:string;hotels?:string;dining?:string;travel?:string}};
export const messeVenues: MesseVenue[] = legacyEuropeanVenues.filter((v) => v.legacy.guide).map((v) => ({
  number: v.index,
  city: v.city,
  venue: v.official_name,
  facts: v.legacy.guide!.facts,
  id: `venue-${String(v.index).padStart(2, "0")}`,
  lat: v.coordinates.lat,
  lon: v.coordinates.lon,
}));
