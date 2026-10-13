"use client";
/**
 * Layout-Auswahl am rechten Rand: senkrechte Lasche, daneben öffnet sich dasselbe dezente Rollmenü wie bei der
 * Sprachwahl (components/ui/RollPicker) – Namen in der Schrift des Layouts, rechts das Farbmuster.
 * Sieben Layouts (01 Studio, 02 Wood, 03 Lumen, 04 Atrium, 05 Copper, 06 Violet, 07 Canopy);
 * die Wahl bleibt gerätelokal gespeichert (localStorage, siehe lib/layout).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LAYOUTS, layoutById } from "@/config/layouts";
import { setLayout, useLayout } from "@/lib/layout";
import { RollPicker, type RollItem } from "@/components/ui/RollPicker";

const ITEMS: RollItem[] = LAYOUTS.map((l) => ({
  key: l.id,
  label: l.name,
  code: l.n,
  style: { fontFamily: l.font },
  visual: (
    <span className="grid place-items-end p-1.5 text-lg font-semibold leading-none text-white [text-shadow:0_1px_6px_rgba(0,0,0,.6)]" style={{ background: l.swatch, fontFamily: l.font }}>
      Aa
    </span>
  ),
}));

export function LayoutDock() {
  const t = useTranslations("layouts");
  const tl = useTranslations("lang");
  const current = useLayout();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const cur = layoutById(current);

  // Farbe der Browserleiste passend zum Layout
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", cur.theme);
  }, [cur.theme]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) toggle.current?.focus({ preventScroll: true });
  }, []);

  // Layoutwechsel: Kreis wächst vom gewählten Farbmuster aus (View Transition, layouts.css)
  const choose = useCallback((i: number, el: HTMLElement | null) => {
    const r = (el ?? toggle.current)?.getBoundingClientRect();
    setLayout(LAYOUTS[i].id, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
  }, []);

  const filmLabel = (l: (typeof LAYOUTS)[number]) => (/^\d+$/.test(l.film) ? t("film", { n: l.film }) : t(`films.${l.film}`));

  return (
    <aside aria-label={t("label")} className="layout-dock fixed right-0 top-1/2 z-40 -translate-y-1/2">
      <button
        ref={toggle}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        data-cursor-label={t("toggle")}
        className="dock-toggle glass grid h-24 w-9 place-items-center gap-1 rounded-l-2xl border-r-0 py-3 shadow-[-6px_0_24px_rgba(0,0,0,.25)] transition-[width,border-color,background-color] duration-500 ease-fluid hover:w-11 hover:border-accent aria-expanded:w-11 aria-expanded:border-accent md:h-28 md:w-10"
      >
        <i aria-hidden className="block size-[18px] rounded-full border border-white/40" style={{ background: cur.swatch }} />
        <span aria-hidden className="tabular text-[10px] font-semibold tracking-[0.12em] text-fg-muted [writing-mode:vertical-rl]">
          {t("short")} {cur.n}
        </span>
        <span className="sr-only">{t("toggle")}: {cur.name}</span>
      </button>
      {open && (
        <RollPicker
          anchor={toggle}
          items={ITEMS}
          current={LAYOUTS.findIndex((l) => l.id === current)}
          title={t("label")}
          hint={tl("hint")}
          currentLabel={t("active")}
          placement="left"
          detail={(i) => (
            <>
              {t(`items.${LAYOUTS[i].id}`)}
              <span className="block text-fg-subtle">{filmLabel(LAYOUTS[i])}</span>
            </>
          )}
          onChoose={choose}
          onClose={close}
        />
      )}
    </aside>
  );
}
