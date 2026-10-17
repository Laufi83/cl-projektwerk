/**
 * Kompakte Geländeliste für die Projektleiter-Werkzeuge (vom Server aus der kanonischen Datenquelle
 * src/data/messebau/venues.global.v1.json gebaut, damit die große Datei nicht in den Browser muss).
 * Unbekannte Werte bleiben null – die Werkzeuge zeigen sie als „prüfen“, nie geschätzt.
 */
import { globalVenues } from "@/lib/messebau/venues";
import type { VenueBuilder } from "@/config/messe-builder";

export type PmVenue = {
  index: number;
  slug: string;
  name: string;
  city: string;
  country: string;
  lat: number | null;
  lon: number | null;
  url: string | null;
  address: string | null;
  rules: { title: string; url: string }[];
  hallPlan: string | null;
  builder: null | {
    height: VenueBuilder["height"];
    wall: VenueBuilder["wall"];
    rigging: VenueBuilder["rigging"];
    ceiling: VenueBuilder["ceiling"];
    stairs: VenueBuilder["stairs"];
    hours: string;
    servicePoints: string[];
    contacts: { trade: string; partner: string; phone: string; email?: string }[];
  };
};

export function pmVenues(): PmVenue[] {
  return globalVenues.map((v) => {
    const b = v.legacy.builder as unknown as VenueBuilder | null;
    return {
      index: v.index, slug: v.slug, name: v.official_name, city: v.city, country: v.country,
      lat: v.coordinates.lat, lon: v.coordinates.lon, url: v.official_website_url, address: v.postal_address ?? b?.address ?? null,
      rules: v.technical_rules.map((r) => ({ title: r.title, url: r.url })), hallPlan: v.hall_plan.url,
      builder: b ? {
        height: b.height, wall: b.wall, rigging: b.rigging, ceiling: b.ceiling, stairs: b.stairs, hours: b.hours, servicePoints: b.servicePoints,
        contacts: b.contacts.map((c) => ({ trade: c.trade, partner: c.partner, phone: c.phone, email: c.email })),
      } : null,
    };
  });
}
