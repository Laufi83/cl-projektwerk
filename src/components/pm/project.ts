/** Gemeinsame Projektdaten aller Projektleiter-Werkzeuge (Projektleiste oben) und Datumshelfer. */
import { usePm } from "./store";

export type Project = {
  name: string;
  /** Standort-Nummer der Datenquelle (1–101) */
  venue: number;
  /** Eröffnungstag der Messe (JJJJ-MM-TT) */
  opening: string;
  /** Messetage */
  days: number;
  /** Aufbautage vor der Eröffnung */
  buildDays: number;
  width: number;
  depth: number;
  height: number;
  doubleDeck: boolean;
  rigging: boolean;
  /** Podestboden */
  floor: boolean;
};

export const DEFAULT_PROJECT: Project = {
  name: "Messestand 2027", venue: 2, opening: "2027-03-02", days: 4, buildDays: 3,
  width: 8, depth: 6, height: 4, doubleDeck: false, rigging: true, floor: true,
};

export const useProject = () => usePm<Project>("project", DEFAULT_PROJECT);

const DAY = 86_400_000;
/** Datum aus JJJJ-MM-TT als lokaler Mittag (keine Zeitzonen-Sprünge) */
export const parseDay = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1, 12); };
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);
export const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12); };
export const fmtDay = (d: Date, de: boolean, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) => d.toLocaleDateString(de ? "de-DE" : "en-GB", opts);
export const fmtNum = (n: number, de: boolean, digits = 0) => n.toLocaleString(de ? "de-DE" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const fmtEur = (n: number, de: boolean) => n.toLocaleString(de ? "de-DE" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Datei im Browser speichern (ICS, CSV …) */
export function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** nur den Bereich `el` drucken bzw. als PDF speichern (Druckdialog des Browsers) */
export function printArea(el: HTMLElement | null) {
  if (!el) return;
  el.classList.add("pm-print");
  document.body.classList.add("pm-printing");
  const done = () => { el.classList.remove("pm-print"); document.body.classList.remove("pm-printing"); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  window.print();
  setTimeout(done, 1500);
}
