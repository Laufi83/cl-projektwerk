import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Design-Bilder sind vorab als AVIF/WebP-Varianten erzeugt (scripts/build-designs.mts) und
      // werden bewusst per <picture>/<img> ausgeliefert, um die Vercel-Bildoptimierung nicht zu belasten.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Imperatives WebGL/three.js: Uniforms und Objekte werden pro Frame mutiert (R3F-Muster).
    files: ["src/components/gallery/StripCanvas.tsx", "src/components/globe/GlobeCanvas.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // lokale Sicherungen (nicht im Repository)
    "BACKUP/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
