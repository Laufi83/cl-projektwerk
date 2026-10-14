/**
 * Zugriff auf die kanonische Messebau-Datenquelle (ohne Zod – auch im Browser-Bundle).
 * Geprüft wird die Datei vor jedem Build mit `npm run guide:validate`.
 */
import data from "@/data/messebau/venues.global.v2.json";
import type { GlobalVenue, GuideDataset, VerificationStatus } from "./schema";

export const guide = data as unknown as GuideDataset;
export const globalVenues: GlobalVenue[] = guide.venues;
export const venueBySlug = (slug: string) => globalVenues.find((v) => v.slug === slug);

/**
 * Zuordnung der alten 50er-Europa-Atlas-Nummern zur neuen 101er-Reihenfolge.
 * Nicht übernommene Altstandorte bleiben im v1-Datensatz erhalten.
 */
const LEGACY_TO_GLOBAL: Record<number, number> = {
  1:1,2:5,3:2,4:3,5:4,6:7,7:6,8:8,9:9,10:10,
  11:21,12:25,13:26,14:28,15:29,16:30,17:22,18:23,19:31,20:32,
  21:38,22:39,23:36,24:34,25:35,28:27,29:40,30:48,31:47,32:46,33:45,35:50,43:44,
};
export const venueByLegacyIndex = (legacyIndex: number) => venueByIndex(LEGACY_TO_GLOBAL[legacyIndex] ?? -1);
export const legacyIndexForVenue = (index: number) => Object.entries(LEGACY_TO_GLOBAL).find(([, global]) => global === index)?.[0];

export const venueByIndex = (index: number) => globalVenues.find((v) => v.index === index);

/** Anzeige der Prüfstufen (Badge, Farbe, Bedeutung) */
export const STATUS_INFO: Record<VerificationStatus, { short: string; de: string; en: string; tone: string }> = {
  S0_SCOPE_ONLY: { short: "S0", de: "Nur vorgemerkt – Recherche ausstehend", en: "Scoped only – research pending", tone: "border-rose-400/60 text-rose-300" },
  S1_LEGACY_RESEARCH_TO_MIGRATE: { short: "S1", de: "Bestehende Recherche – Prüfung gegen Primärquellen offen", en: "Existing research – primary-source check pending", tone: "border-amber-400/60 text-amber-300" },
  S2_PRIMARY_PARTIAL: { short: "S2", de: "Teilweise aus Primärquellen geprüft", en: "Partly verified from primary sources", tone: "border-sky-400/60 text-sky-300" },
  S3_PRIMARY_VERIFIED: { short: "S3", de: "Kerndaten aus Primärquellen geprüft", en: "Core data verified from primary sources", tone: "border-emerald-400/50 text-emerald-300" },
  S4_RELEASE_READY: { short: "S4", de: "Vollständig geprüft", en: "Fully verified", tone: "border-emerald-400 text-emerald-300" },
};
