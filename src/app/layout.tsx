import type { ReactNode } from "react";
import "./globals.css";
import "./layouts.css";

// Das eigentliche <html> rendert app/[locale]/layout.tsx (Sprache je Route).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
