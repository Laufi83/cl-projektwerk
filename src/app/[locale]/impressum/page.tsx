import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = { title: "Impressum · Imprint", robots: { index: true, follow: true } };

export default async function ImprintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage kind="imprint" />;
}
