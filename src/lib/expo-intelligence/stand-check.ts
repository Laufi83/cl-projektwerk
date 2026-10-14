import type { Venue, StandCheckInput, StandCheckResult, StandCheckFinding } from "./types";

/**
 * Planungshinweise, keine Baugenehmigung. Nie "grün": es fehlen Hallen-, Event-
 * und standbezogene Freigaben selbst bei einem S3/S4-Datensatz.
 */
export function checkStand(venue: Venue, input: StandCheckInput): StandCheckResult {
  const findings: StandCheckFinding[] = [];
  const add = (severity: StandCheckFinding["severity"], message: string, source?: StandCheckFinding["source"]) =>
    findings.push({ severity, message, source });

  if (input.venueId !== venue.id) throw new Error("Venue ID mismatch");
  if (![input.widthM, input.depthM, input.heightM].every(v => Number.isFinite(v) && v > 0))
    throw new Error("Dimensions must be positive finite numbers");

  const area = input.widthM * input.depthM;
  add("information", `Standfläche: ${area.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m². Die Prüfung erfolgt nur anhand der im Guide hinterlegten Daten.`);

  const height = venue.technical.maximumConstructionHeight;
  // „Normalhöhe“ ist keine Obergrenze: darüber ist eine schriftliche Genehmigung nötig, kein Verbot
  const normalHeight = /normal/i.test(height?.scope ?? "");
  if (height?.value != null && normalHeight && input.heightM > height.value) {
    add("needs-review", `Die geplante Höhe von ${input.heightM} m liegt über der Normalhöhe von ${height.value} m – das ist genehmigungspflichtig, aber nicht automatisch unzulässig. Maximalhöhe der Veranstaltung erfragen.`, height.source);
  } else if (height?.value != null) {
    if (input.heightM > height.value) {
      if (height.status === "verified") {
        add("conflict", `Die geplante Höhe von ${input.heightM} m liegt über dem hinterlegten allgemeinen Grenzwert von ${height.value} m. Halle und Veranstaltung gesondert prüfen.`, height.source);
      } else {
        add("needs-review", `Möglicher Höhenkonflikt: ${input.heightM} m geplant, ${height.value} m als noch nicht verifizierter Richtwert hinterlegt.`, height.source);
      }
    } else {
      add("needs-review", `Die geplante Höhe liegt innerhalb des hinterlegten Richtwerts von ${height.value} m. Das bestätigt noch keine Zulässigkeit in der gewählten Halle oder Veranstaltung.`, height.source);
    }
  } else {
    add("needs-review", "Maximale Bauhöhe ist nicht verifiziert. Technische Richtlinien und Eventauflagen beim Betreiber anfordern.");
  }

  if (input.doubleDeck) {
    const deck = venue.technical.doubleDeckAllowed;
    if (deck?.status === "verified" && deck.value === false) {
      add("conflict", "Doppelstockbau widerspricht einer hinterlegten geprüften Regel.", deck.source);
    } else {
      add("needs-review", "Doppelstock: Statik, Treppen, Fluchtwege, Brandschutz und schriftliche Genehmigung separat prüfen.", deck?.source);
    }
  }
  add("needs-review", "Zusätzliche Prüfung: Hallenbelegung, Nachbarstände, Brandlasten, Materialien, Abhängungen, Elektro und veranstaltungsbezogene Fristen.");
  add("needs-review", "Dieses Ergebnis ist keine technische Freigabe oder Genehmigung. Verbindlich sind die aktuellen Betreiberunterlagen und schriftlichen Freigaben.");

  return { status: findings.some(f => f.severity === "conflict") ? "conflict" : "needs-review", findings };
}
