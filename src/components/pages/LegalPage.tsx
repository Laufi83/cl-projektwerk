import { getTranslations } from "next-intl/server";
import { site } from "@/config/site";
import legal from "@/config/legal-de.json";
import { Kinetic } from "@/components/kinetic/Kinetic";

/**
 * Impressum (§ 5 DDG, § 18 MStV) und Datenschutzerklärung (Art. 13 DSGVO), zugeschnitten auf diese Website:
 * keine Cookies, kein Tracking, Schriften lokal, Formular per E-Mail, Radio-Stream erst auf Klick.
 * Texte: src/config/legal-de.json (Entwurf, nur Deutsch, maßgeblich; rechtlich noch zu prüfen).
 * Variablen: {brand}, {person}, {address}, {email}, {hosting}, {mailHosting}. Hoster: `site.hosting`.
 */
type Row = { title: string; body: string };

const STAND = "Oktober 2026";

export async function LegalPage({ kind }: { kind: "imprint" | "privacy" }) {
  const t = await getTranslations("legal");
  const title = kind === "imprint" ? t("imprintTitle") : t("privacyTitle");

  const vars: Record<string, string> = {
    brand: site.brand,
    person: site.person,
    address: site.address.replace(", ", "\n"),
    addressInline: site.address,
    email: site.email,
    hosting: site.hosting
      ? `Diese Website wird bei ${site.hosting.name}, ${site.hosting.address} gehostet.`
      : "Diese Website wird bei einem externen Hosting-Dienstleister betrieben.",
    mailHosting: "der jeweils genutzte E-Mail-Dienstleister",
  };
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);

  const rows: Row[] = (kind === "imprint" ? legal.imprint : legal.privacy).map((r) => ({ title: fill(r.title), body: fill(r.body) }));
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <h1 className="font-display text-5xl font-semibold leading-none md:text-7xl"><Kinetic text={title} /></h1>
      <p className="mt-6 text-sm text-fg-subtle">{t("updated", { date: STAND })}</p>
      <p className="mt-2 text-sm text-fg-subtle">{t("notice")}</p>
      <dl className="mt-10 grid max-w-3xl gap-8">
        {rows.map((r) => (
          <div key={r.title}>
            <dt className="text-lg font-semibold">{r.title}</dt>
            <dd className="mt-2 whitespace-pre-line text-fg-muted">{r.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
