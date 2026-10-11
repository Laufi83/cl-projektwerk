import "server-only";
import { z } from "zod";
import { BUDGET_KEYS, DOCUMENT_KEYS, PROJECT_TYPES, SCOPE_KEYS, SERVICE_KEYS, STAND_TYPES } from "./inquiry-options";
import { LOCALE_CODES } from "@/i18n/locales";

export { BUDGET_KEYS, DOCUMENT_KEYS, PROJECT_TYPES, SCOPE_KEYS, SERVICE_KEYS, STAND_TYPES };

const common = {
  locale: z.enum(LOCALE_CODES as [string, ...string[]]).default("de"),
  /** Honeypot: muss leer bleiben */
  website: z.string().max(0).optional().default(""),
  /** Zeitfalle: Formular-Start (ms) */
  startedAt: z.number().int().positive(),
  consent: z.literal(true),
};

export const inquirySchema = z.object({
  type: z.literal("inquiry"),
  fair: z.string().trim().min(1).max(160),
  projectType: z.enum(PROJECT_TYPES).default("open"),
  city: z.string().trim().max(120).default(""),
  dateFrom: z.string().max(10).default(""),
  dateTo: z.string().max(10).default(""),
  dateUnknown: z.boolean().default(false),
  width: z.string().trim().max(8).default(""),
  depth: z.string().trim().max(8).default(""),
  standType: z.enum(STAND_TYPES).default("open"),
  floors: z.enum(["1", "2", "open"]).default("open"),
  services: z.array(z.enum(SERVICE_KEYS)).max(5).default([]),
  documents: z.array(z.enum(DOCUMENT_KEYS)).max(6).default([]),
  scope: z.enum(SCOPE_KEYS).default("open"),
  budget: z.enum(BUDGET_KEYS).default("open"),
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).default(""),
  email: z.email().max(200),
  phone: z.string().trim().max(60).default(""),
  message: z.string().trim().max(4000).default(""),
  favorites: z.array(z.string().regex(/^\d{3}$/)).max(100).default([]),
  ...common,
});

export const callbackSchema = z.object({
  type: z.literal("callback"),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(60),
  time: z.string().trim().max(160).default(""),
  ...common,
});

export const requestSchema = z.discriminatedUnion("type", [inquirySchema, callbackSchema]);
export type InquiryInput = z.input<typeof inquirySchema>;
export type CallbackInput = z.input<typeof callbackSchema>;
