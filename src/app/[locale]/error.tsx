"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Sicherheitsnetz: unerwarteter Fehler in einer Seite – statt weißer Seite eine Ausweichansicht. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("error");
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="container-x grid min-h-[80svh] place-items-center pb-24 pt-32 text-center">
      <div className="max-w-[680px]">
        <h1 className="font-display text-4xl font-semibold md:text-6xl">{t("title")}</h1>
        <p className="mt-6 text-lg text-fg-muted">{t("text")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className="rounded-full bg-fg px-5 py-3 text-base font-semibold text-bg">{t("retry")}</button>
          <Link href="/" className="rounded-full border border-line-strong px-5 py-3 text-base font-semibold hover:border-accent">{t("home")}</Link>
        </div>
      </div>
    </div>
  );
}
