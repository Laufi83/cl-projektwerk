import fs from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { requestSchema } from "@/lib/inquiry-schema";
import { getDesigns } from "@/lib/designs";
import { site } from "@/config/site";
import { EMAIL_DRAFT_MODE } from "@/lib/email-draft";

/**
 * Anfrage- und Rückruf-Route.
 * Versand per SMTP (Umgebungsvariablen SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO).
 * Ohne SMTP im Dev-Modus: Ablage als JSON in .inquiries/ (nicht im Repo).
 * Schutz: Honeypot, Zeitfalle (≥ 3 s), einfaches Rate-Limit je IP, serverseitige Validierung (Zod).
 */
export const runtime = "nodejs";

const hits = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000, MAX = 5;

function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch { return Response.json({ ok: false, error: "invalid" }, { status: 400 }); }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return Response.json({ ok: false, error: "invalid", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 422 });
  const data = parsed.data;

  // Bots: still verwerfen, aber Erfolg melden
  if (data.website || Date.now() - data.startedAt < 3000) return Response.json({ ok: true });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return Response.json({ ok: false, error: "rate" }, { status: 429 });

  const designs = getDesigns();
  const lines: [string, string][] = [];
  let subject: string;
  if (data.type === "inquiry") {
    const favs = data.favorites
      .map((id) => designs.find((d) => d.id === id))
      .filter(Boolean)
      .map((d) => `${d!.id} ${d!.title} – ${site.url}/designs/${d!.slug}`);
    const L = {
      fair: "Messe/Projekt", projectType: "Projektart", city: "Ort", date: "Termin", dateOpen: "noch offen", size: "Fläche", standType: "Standtyp",
      floors: "Geschosse", documents: "Vorhandene Unterlagen", services: "Benötigte Planungsleistung", scope: "Gewünschter Umfang",
      budget: "Budgetrahmen (Projekt)", name: "Name", company: "Firma", email: "E-Mail", phone: "Telefon", message: "Nachricht",
      favorites: "Gemerkte Entwürfe", locale: "Sprache",
    };
    const SERVICE_LABELS: Record<string, string> = {
      tech: "Technische Planung", prep: "Arbeitsvorbereitung", control: "Projektsteuerung", concept: "Entwurf und Präsentation", reuse: "Wiederverwendungsplanung",
    };
    subject = `Anfrage: ${data.fair}${data.company ? ` · ${data.company}` : ""}`;
    lines.push(
      [L.fair, data.fair], [L.projectType, data.projectType], [L.city, data.city || "–"],
      [L.date, data.dateUnknown ? L.dateOpen : `${data.dateFrom || "?"} bis ${data.dateTo || "?"}`],
      [L.size, data.width && data.depth ? `${data.width} × ${data.depth} m` : L.dateOpen],
      [L.standType, data.standType], [L.floors, data.floors],
      [L.documents, data.documents.join(", ") || "–"],
      [L.services, data.services.map((k) => SERVICE_LABELS[k] ?? k).join(", ") || "–"], [L.scope, data.scope], [L.budget, data.budget],
      [L.name, data.name], [L.company, data.company || "–"], [L.email, data.email], [L.phone, data.phone || "–"],
      [L.message, data.message || "–"], [L.favorites, favs.join("\n") || "–"], [L.locale, data.locale],
    );
  } else {
    subject = `Rückruf: ${data.name}`;
    lines.push(["Name", data.name], ["Telefon", data.phone], ["Wunschzeit", data.time || "–"], ["Sprache", data.locale]);
  }
  const text = lines.map(([k, v]) => `${k}: ${v}`).join("\n");
  if (EMAIL_DRAFT_MODE) {
    return Response.json({
      ok: true,
      delivery: "draft",
      draft: { to: site.email, subject: `[Website] ${subject}`.replace(/[\r\n]+/g, " "), body: text },
    }, { headers: { "Cache-Control": "no-store" } });
  }
  const html = `<table cellpadding="6" style="font-family:system-ui,sans-serif;font-size:14px">${lines
    .map(([k, v]) => `<tr><td style="color:#777;vertical-align:top">${esc(k)}</td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table>`;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO, INQUIRY_DRY_RUN } = process.env;
  // Testlauf (Playwright/CI): nichts versenden, Erfolg melden
  if (INQUIRY_DRY_RUN === "1") {
    console.info(`[inquiry] Testlauf: ${subject}`);
    return Response.json({ ok: true, dryRun: true });
  }
  if (!SMTP_HOST || !MAIL_TO) {
    if (process.env.NODE_ENV === "production") return Response.json({ ok: false, error: "not-configured" }, { status: 503 });
    const dir = path.join(process.cwd(), ".inquiries");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${Date.now()}-${data.type}.json`), JSON.stringify({ subject, ...data }, null, 2));
    console.info(`[inquiry] ${subject} (lokal gespeichert, SMTP nicht konfiguriert)`);
    return Response.json({ ok: true, dev: true });
  }

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    await transport.sendMail({
      from: MAIL_FROM ?? SMTP_USER,
      to: MAIL_TO,
      replyTo: data.type === "inquiry" ? data.email : undefined,
      subject: `[Website] ${subject}`,
      text,
      html,
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[inquiry] Versand fehlgeschlagen", e);
    return Response.json({ ok: false, error: "send" }, { status: 502 });
  }
}
