/**
 * Auswahlwerte des Anfrageformulars – bewusst ohne Abhängigkeiten,
 * damit der Browser nicht die Validierungsbibliothek (zod) mitladen muss.
 */
export const SERVICE_KEYS = ["tech", "prep", "control", "concept", "reuse"] as const;
export const BUDGET_KEYS = ["a", "b", "c", "d", "open"] as const;
export const PROJECT_TYPES = ["fair", "brand", "interior", "event", "open"] as const;
export const DOCUMENT_KEYS = ["briefing", "cad", "sketches", "renders", "inventory", "none"] as const;
export const SCOPE_KEYS = ["single", "project", "quota", "open"] as const;
export const STAND_TYPES = ["corner", "head", "island", "row", "open"] as const;
