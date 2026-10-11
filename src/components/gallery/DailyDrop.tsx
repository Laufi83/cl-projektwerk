"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";
import { nextDropAt } from "@/lib/release";
import type { ReleaseInfo } from "@/lib/designs";

const two = (n: number) => String(n).padStart(2, "0");

/** Restzeit bis zur nächsten Veröffentlichung; erst nach dem Laden im Browser (kein Hydration-Versatz). */
function useCountdown(active: boolean) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    // Ziel im Browser berechnen: die ausgelieferte Seite kann aus dem Cache stammen
    let target = nextDropAt().getTime();
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    const onVisible = () => { if (document.visibilityState === "visible") { if (Date.now() > target + 60_000) target = nextDropAt().getTime(); tick(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [active]);
  return left;
}

/**
 * Hinweis auf die tägliche Veröffentlichung: „Neu heute“ (öffnet das Design) und Countdown
 * bis 5:00 Uhr. Sind alle Designs online, bleibt nur der Hinweis „Alle … online“.
 */
export function DailyDrop({ info, className = "" }: { info: ReleaseInfo; className?: string }) {
  const t = useTranslations("drops");
  const overlay = useDesignOverlay();
  const pending = info.nextAt !== null;
  const left = useCountdown(pending);
  const n = String(info.latest.n).padStart(3, "0");

  let clock = "--:--:--";
  if (left !== null && left > 0) {
    const s = Math.floor(left / 1000);
    clock = `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 rounded-3xl border border-line bg-bg-raised/70 px-4 py-3 text-sm backdrop-blur md:rounded-full md:px-5 ${className}`}>
      <p className="inline-flex items-center gap-2 font-semibold">
        <span aria-hidden className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
        </span>
        {pending ? t("rule") : t("complete", { total: info.total })}
      </p>
      <Link
        href={{ pathname: "/designs/[slug]", params: { slug: info.latest.slug } }}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          overlay.open(info.latest.slug, { fullscreen: false });
        }}
        className="group inline-flex items-center gap-2 text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg"
      >
        <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-accent-contrast">{t("today")}</span>
        <span className="tabular text-fg-subtle">{n}</span>
        <span className="font-semibold text-fg">{info.latest.title}</span>
        <ArrowUpRight size={14} className="text-accent transition-transform duration-500 ease-fluid group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
      {pending && (
        <p className="inline-flex items-center gap-2 text-fg-muted md:ml-auto" aria-live="off">
          {left !== null && left <= 0 ? (
            <>
              {t("soon")}
              <button type="button" onClick={() => location.reload()} className="font-semibold text-accent underline-offset-4 hover:underline">{t("reload")}</button>
            </>
          ) : (
            <>
              {t("next")} <span className="tabular font-semibold text-fg" suppressHydrationWarning>{clock}</span>
            </>
          )}
          <span aria-hidden className="text-fg-subtle">·</span>
          <span className="tabular text-fg-subtle">{t("count", { released: info.released, total: info.total })}</span>
        </p>
      )}
    </div>
  );
}
