/**
 * Zugriff auf die kanonische Messebau-Datenquelle (ohne Zod – auch im Browser-Bundle).
 * Geprüft wird die Datei vor jedem Build mit `npm run guide:validate`.
 */
import data from "@/data/messebau/venues.global.v1.json";
import type { GlobalVenue, GuideDataset, VerificationStatus } from "./schema";

export const guide = data as unknown as GuideDataset;
export const globalVenues: GlobalVenue[] = guide.venues;
export const venueBySlug = (slug: string) => globalVenues.find((v) => v.slug === slug);
export const venueByIndex = (index: number) => globalVenues.find((v) => v.index === index);

/** Anzeige der Prüfstufen (Badge, Farbe, Bedeutung) */
export const STATUS_INFO: Record<VerificationStatus, { short: string; de: string; en: string; tone: string }> = {
  S0_SCOPE_ONLY: { short: "S0", de: "Nur vorgemerkt – Recherche ausstehend", en: "Scoped only – research pending", tone: "border-rose-400/60 text-rose-300" },
  S1_LEGACY_RESEARCH_TO_MIGRATE: { short: "S1", de: "Bestehende Recherche – Prüfung gegen Primärquellen offen", en: "Existing research – primary-source check pending", tone: "border-amber-400/60 text-amber-300" },
  S2_PRIMARY_PARTIAL: { short: "S2", de: "Teilweise aus Primärquellen geprüft", en: "Partly verified from primary sources", tone: "border-sky-400/60 text-sky-300" },
  S3_PRIMARY_VERIFIED: { short: "S3", de: "Kerndaten aus Primärquellen geprüft", en: "Core data verified from primary sources", tone: "border-emerald-400/50 text-emerald-300" },
  S4_RELEASE_READY: { short: "S4", de: "Vollständig geprüft", en: "Fully verified", tone: "border-emerald-400 text-emerald-300" },
};
