"use client";
/**
 * Sprachwahl im Kopf: kleiner Knopf (Flagge + Code), darunter ein dezentes Menü mit „Circular Split Roll“
 * (components/ui/RollPicker – gleiches Menü wie die Layoutwahl). Wechselt auf dieselbe Seite in der gewählten Sprache.
 */
import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { LOCALES, localeInfo, type AppLocale } from "@/i18n/locales";
import { RollPicker, type RollItem } from "@/components/ui/RollPicker";

const ITEMS: RollItem[] = LOCALES.map((l) => ({
  key: l.code,
  label: l.name,
  code: l.code,
  lang: l.code,
  visual: <img src={`/flags/${l.flag}.svg`} alt="" draggable={false} className="object-cover" />,
}));

/** Wechselt auf dieselbe Seite in einer anderen Sprache */
function useSwitchLocale() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() as AppPathname;
  const params = useParams() as Record<string, string>;
  return useCallback((code: AppLocale) => {
    if (code === locale) return;
    const { locale: _l, ...rest } = params;
    void _l;
    const href = (pathname.includes("[") ? { pathname, params: rest } : pathname) as Parameters<typeof router.replace>[0];
    router.replace(href, { locale: code, scroll: false });
  }, [locale, params, pathname, router]);
}

export function LanguageSwitch({ label }: { label: string }) {
  const t = useTranslations("lang");
  const locale = useLocale();
  const switchTo = useSwitchLocale();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const info = localeInfo(locale);
  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus({ preventScroll: true });
  }, []);
  const choose = useCallback((i: number) => switchTo(LOCALES[i].code), [switchTo]);
  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${info.name}`}
        className="group grid h-10 grid-flow-col items-center gap-2 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg aria-expanded:text-fg"
      >
        <span className="relative size-5 overflow-hidden rounded-full ring-1 ring-line transition-transform duration-700 ease-fluid group-hover:rotate-[20deg] group-aria-expanded:ring-accent">
          <img src={`/flags/${info.flag}.svg`} alt="" width={20} height={20} className="size-full object-cover" />
        </span>
        {info.code}
      </button>
      {open && (
        <RollPicker
          anchor={button}
          items={ITEMS}
          current={LOCALES.findIndex((l) => l.code === locale)}
          title={t("title")}
          hint={t("hint")}
          currentLabel={t("current")}
          onChoose={choose}
          onClose={close}
        />
      )}
    </>
  );
}
