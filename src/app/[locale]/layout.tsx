import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, DM_Sans, Geist, Instrument_Serif, Inter_Tight, Mona_Sans, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { site } from "@/config/site";
import { designAsset } from "@/lib/media";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { CookieBanner } from "@/components/shell/CookieBanner";
import { ClientShell } from "@/components/shell/ClientShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/lib/structured-data";
import { DEFAULT_LAYOUT, layoutInitScript } from "@/config/layouts";
import { LayoutDock } from "@/components/shell/LayoutDock";
import { RadioDock } from "@/components/shell/RadioDock";
import { isRtl, languageAlternates, localeInfo, localizedPath, LOCALES } from "@/i18n/locales";

const mona = Mona_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-mona",
  display: "swap",
});
const geist = Geist({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-geist",
  display: "swap",
});
// Schriften der übrigen Layouts: selbst gehostet, nicht vorgeladen – der Browser lädt nur, was das aktive Layout nutzt.
// (next/font verlangt wörtlich ausgeschriebene Optionen je Aufruf.)
const instrument = Instrument_Serif({ subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap", preload: false });
const interTight = Inter_Tight({ subsets: ["latin", "latin-ext"], variable: "--font-intertight", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-spacegrotesk", display: "swap", preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], axes: ["wdth", "opsz"], variable: "--font-bricolage", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-dmsans", display: "swap", preload: false });
const fontVars = [mona, geist, instrument, interTight, spaceGrotesk, bricolage, dmSans].map((f) => f.variable).join(" ");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("title", { brand: site.brand });
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: `%s · ${site.brand}` },
    description: t("description"),
    applicationName: site.brand,
    robots: site.indexing ? { index: true, follow: true } : { index: false, follow: false },
    alternates: {
      canonical: localizedPath(locale, "/", "/"),
      languages: languageAlternates("/", "/"),
    },
    openGraph: {
      type: "website",
      siteName: site.brand,
      title: t("ogTitle", { brand: site.brand }),
      description: t("ogDescription"),
      locale: localeInfo(locale).og,
      alternateLocale: LOCALES.filter((l) => l.code !== locale).map((l) => l.og),
      images: [{ url: designAsset("001", "og.jpg"), width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: t("ogTitle", { brand: site.brand }), description: t("socialDescription") },
    icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });
  const st = await getTranslations({ locale, namespace: "structured" });
  const org = { services: st.raw("services") as string[], keywords: st.raw("keywords") as string[], catalog: st("serviceCatalog") };

  return (
    <html lang={locale} dir="ltr" data-rtl={isRtl(locale) || undefined} className={fontVars} data-layout={DEFAULT_LAYOUT} suppressHydrationWarning>
      <head>
        {/* gespeichertes Layout vor dem ersten Zeichnen setzen (kein Aufblitzen) */}
        {/* bewusst kein next/script: „beforeInteractive“ läuft im App Router erst nach dem JS-Bundle */}
        <script dangerouslySetInnerHTML={{ __html: layoutInitScript }} />
        <JsonLd data={organizationJsonLd(locale, org)} />
      </head>
      <body className="grain">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-contrast"
          >
            {t("skip")}
          </a>
          <ClientShell>
            <Header />
            <main id="main" tabIndex={-1} className="relative z-10 outline-none">
              {children}
            </main>
            <Footer />
            <LayoutDock />
            <RadioDock />
            <CookieBanner />
          </ClientShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
