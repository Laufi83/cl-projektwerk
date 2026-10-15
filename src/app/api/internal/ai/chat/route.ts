import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function equalSecret(actual: string, expected: string): boolean {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const json = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  if (process.env.CL_AI_ENABLED !== "true") return json({ error: "AI_DISABLED" }, 503);
  const accessToken = process.env.CL_AI_ACCESS_TOKEN;
  const apiKey = process.env.FREELLMAPI_API_KEY;
  const base = process.env.FREELLMAPI_BASE_URL;
  if (!accessToken || !apiKey || !base) return json({ error: "NOT_CONFIGURED" }, 503);

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!equalSecret(bearer, accessToken)) return json({ error: "UNAUTHORIZED" }, 401);
  if (Number(req.headers.get("content-length") || 0) > 12000) return json({ error: "TOO_LARGE" }, 413);

  let endpoint: URL;
  try {
    const url = new URL(base);
    if (url.username || url.password || url.search || url.hash) throw new Error("Invalid base URL");
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) {
      throw new Error("HTTPS required except local development");
    }
    endpoint = new URL(url.pathname.replace(/\/$/, "") + "/chat/completions", url);
    if (!url.pathname.endsWith("/v1") && !url.pathname.endsWith("/v1/")) throw new Error("Base URL must end with /v1");
  } catch {
    return json({ error: "INVALID_BASE_URL" }, 503);
  }

  let input: unknown;
  try { input = await req.json(); } catch { return json({ error: "INVALID_JSON" }, 400); }
  if (!input || typeof input !== "object") return json({ error: "INVALID_INPUT" }, 400);
  const data = input as Record<string, unknown>;
  const prompt = data.prompt;
  if (typeof prompt !== "string" || prompt.trim().length < 1 || prompt.length > 4000)
    return json({ error: "PROMPT_LENGTH", maxCharacters: 4000 }, 400);

  const model = process.env.FREELLMAPI_MODEL || "auto";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        max_tokens: 700,
        messages: [
          { role: "system", content: "You are CL-Projektwerk's internal technical assistant for trade fairs, exhibition stands and project planning. Reply in German. Do not invent venue technical rules; clearly distinguish verified facts from general advice." },
          { role: "user", content: prompt }
        ]
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return json({ error: "UPSTREAM_ERROR", upstreamStatus: response.status }, 502);
    const output = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const answer = output.choices?.[0]?.message?.content;
    if (typeof answer !== "string") return json({ error: "INVALID_UPSTREAM_RESPONSE" }, 502);
    return json({ answer, model }, 200);
  } catch {
    return json({ error: "UPSTREAM_UNAVAILABLE" }, 502);
  } finally {
    clearTimeout(timer);
  }
}
