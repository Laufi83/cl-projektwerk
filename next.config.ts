import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Früher angebotene Sprachen: Adressen dauerhaft auf die englische Fassung umleiten (Pfade sind dort identisch) */
const RETIRED_LOCALES = "fr|es|it|nl|pl|cs|pt|zh|hi|ru";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // eigenständiges Server-Paket (server.js) für den Betrieb auf dem VPS ohne node_modules-Installation
  output: "standalone",
  // Vorschau auf dem Handy im Heimnetz (z. B. http://192.168.178.36:3100)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  turbopack: { root: path.resolve(".") },
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/[locale]/designs/[slug]/opengraph-image": ["./assets/og/**"],
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 82],
  },
  async redirects() {
    return [
      { source: `/:lang(${RETIRED_LOCALES})`, destination: "/en", permanent: true },
      { source: `/:lang(${RETIRED_LOCALES})/:path*`, destination: "/en/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Vorab erzeugte Medien: Dateinamen bleiben bei neuen Fassungen gleich (z. B. Hero-Frames nach der
        // Logo-Retusche), deshalb nicht „immutable“, sondern 7 Tage + Hintergrund-Aktualisierung
        source: "/:dir(hero|led|globe)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
