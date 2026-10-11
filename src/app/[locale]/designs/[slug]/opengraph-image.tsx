import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getDesign } from "@/lib/designs";
import { site } from "@/config/site";
import { MEDIA_BASE } from "@/lib/media";
import { LOGO_PATH, LOGO_VIEWBOX } from "@/components/brand/Logo";

const logo = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}"><path fill="#f4efe6" fill-rule="evenodd" d="${LOGO_PATH}"/></svg>`).toString("base64")}`;

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Messestand-Design";
// Bei Bedarf erzeugen (und vom CDN cachen lassen) statt 200 PNGs beim Build
export const dynamic = "force-dynamic";

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/og/MonaSans-Bold.woff")),
  readFile(join(process.cwd(), "assets/og/Geist-Medium.woff")),
]);

async function background(id: string) {
  const local = join(process.cwd(), "public", "media", "designs", id, "og.jpg");
  const buf = existsSync(local)
    ? await readFile(local)
    : Buffer.from(await (await fetch(MEDIA_BASE.startsWith("http") ? `${MEDIA_BASE}/designs/${id}/og.jpg` : `${site.url}${MEDIA_BASE}/designs/${id}/og.jpg`)).arrayBuffer());
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const d = getDesign(slug);
  const [mona, geist] = await fonts;
  if (!d) return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#0a0a0b" }} />, size);
  const bg = await background(d.id);
  const number = String(d.number).padStart(3, "0");
  const note = site.visualisationNote[locale === "en" ? "en" : "de"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0a0a0b", fontFamily: "Geist" }}>
        <img src={bg} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, rgba(10,10,11,.92) 0%, rgba(10,10,11,.55) 45%, rgba(10,10,11,0) 75%)" }} />
        <div style={{ position: "absolute", left: 64, bottom: 64, display: "flex", flexDirection: "column", color: "#f4efe6" }}>
          <div style={{ fontFamily: "Mona", fontSize: 180, lineHeight: 1, color: "#f26a1b", letterSpacing: -6 }}>{number}</div>
          <div style={{ fontFamily: "Mona", fontSize: 64, lineHeight: 1.05, marginTop: 8, maxWidth: 760 }}>{d.title}</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 26, color: "rgba(244,239,230,.8)" }}>
            {[d.size ? `${d.size.width} × ${d.size.depth} m` : null, d.clip ? (locale === "en" ? "▶ Build film" : "▶ Aufbaufilm") : null, site.brand].filter(Boolean).join("   ·   ")}
          </div>
        </div>
        <img src={logo} width={120} height={62} style={{ position: "absolute", top: 44, left: 64 }} alt="" />
        <div style={{ position: "absolute", top: 40, right: 40, display: "flex", padding: "8px 14px", borderRadius: 999, background: "rgba(10,10,11,.6)", color: "#f4efe6", fontSize: 18, letterSpacing: 3, textTransform: "uppercase" }}>
          {note}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Mona", data: mona, weight: 700, style: "normal" },
        { name: "Geist", data: geist, weight: 500, style: "normal" },
      ],
    },
  );
}
