import type { Venue, StandCheckInput, StandCheckResult, StandCheckFinding } from "./types";
export function checkStand(venue: Venue, input: StandCheckInput): StandCheckResult {
 const findings: StandCheckFinding[] = [];
 const add = (severity: StandCheckFinding["severity"], message: string, source?: StandCheckFinding["source"]) => findings.push({ severity, message, source });
 if (input.venueId !== venue.id) throw new Error("Venue ID mismatch");
 if (![input.widthM,input.depthM,input.heightM].every(v => Number.isFinite(v) && v > 0)) throw new Error("Dimensions must be positive finite numbers");
 const height = venue.technical.maximumConstructionHeight;
 if (height?.status === "verified" && height.value !== null && input.heightM > height.value) add("conflict", "Geplante Höhe überschreitet den hinterlegten verifizierten Grenzwert.", height.source);
 else if (!height || height.status !== "verified" || height.value === null) add("needs-review", "Maximale Bauhöhe nicht verifiziert; Veranstaltungs- und Hallenvorgaben prüfen.");
 const deck = venue.technical.doubleDeckAllowed;
 if (input.doubleDeck) {
  if (deck?.status === "verified" && deck.value === false) add("conflict", "Doppelstockbau laut hinterlegter Regel nicht erlaubt.", deck.source);
  else add("needs-review", "Doppelstock benötigt Prüfung von Genehmigungen, Statik, Brandschutz und Fluchtwegen.", deck?.source);
 }
 add("needs-review", "Weitere veranstaltungs-, hallen- und projektspezifische Regeln sowie Genehmigungen sind gesondert zu prüfen.");
 return { status: findings.some(f => f.severity === "conflict") ? "conflict" : "needs-review", findings };
}
