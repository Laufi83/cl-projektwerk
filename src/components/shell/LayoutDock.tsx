"use client";
/**
 * Layout-Auswahl am linken Rand: ab md senkrechte Lasche, auf kleinen Bildschirmen ein 48-px-Knopf unten links.
 * Fünf Layouts (01 Studio, 02 Wood, 03 Aurora, 04 Tide, 05 Monochrom); die Wahl bleibt gerätelokal gespeichert (localStorage, siehe lib/layout).
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LAYOUTS, layoutById } from "@/config/layouts";
import { setLayout, useLayout } from "@/lib/layout";

export function LayoutDock() {
  const t = useTranslations("layouts");
  const current = useLayout();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const cur = layoutById(current);

  // Farbe der Browserleiste passend zum Layout
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", cur.theme);
  }, [cur.theme]);

  // Außerhalb klicken, Esc oder Scrollen schließt
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    // Weiterscrollen schließt das Panel, damit es nicht über dem Inhalt stehen bleibt
    const startY = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - startY) > 80) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  const choose = (id: (typeof LAYOUTS)[number]["id"], el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setLayout(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  // Pfeiltasten wandern durch die Auswahl (Radiogruppe)
  const onKeyGroup = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const i = LAYOUTS.findIndex((l) => l.id === current);
    const next = LAYOUTS[(i + d + LAYOUTS.length) % LAYOUTS.length];
    const btn = e.currentTarget.querySelector<HTMLButtonElement>(`[data-layout-choice="${next.id}"]`);
    btn?.focus();
    if (btn) choose(next.id, btn);
  };

  return (
    <aside ref={root} aria-label={t("label")} className="layout-dock fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-40 flex flex-col-reverse items-start gap-2 md:bottom-auto md:left-0 md:top-1/2 md:-translate-y-1/2 md:flex-row md:items-center md:gap-0">
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="layout-options"
        onClick={() => setOpen((o) => !o)}
        data-cursor-label={t("toggle")}
        className="dock-toggle glass grid size-12 place-items-center gap-1 rounded-full shadow-[0_6px_24px_rgba(0,0,0,.35)] transition-[width,border-color,background-color] duration-500 ease-fluid hover:border-accent aria-expanded:border-accent md:h-28 md:w-10 md:rounded-l-none md:rounded-r-2xl md:border-l-0 md:py-3 md:shadow-[6px_0_24px_rgba(0,0,0,.25)] md:hover:w-12 md:aria-expanded:w-12"
      >
        <i aria-hidden className="block size-[18px] rounded-full border border-white/40" style={{ background: cur.swatch }} />
        <span aria-hidden className="tabular hidden text-[10px] font-semibold tracking-[0.12em] text-fg-muted [writing-mode:vertical-rl] md:block">
          {t("short")} {cur.n}
        </span>
        <span className="sr-only">{t("toggle")}: {cur.name}</span>
      </button>

      <div
        id="layout-options"
        role="radiogroup"
        aria-label={t("label")}
        hidden={!open}
        onKeyDown={onKeyGroup}
        className="layout-options md:ml-2 border border-line bg-bg/95 backdrop-blur-xl w-[min(340px,calc(100vw-72px))] rounded-2xl p-2 shadow-[0_18px_50px_-12px_rgba(0,0,0,.6)]"
      >
        <p className="eyebrow px-3 pb-2 pt-2">{t("label")}</p>
        <p className="px-3 pb-2 text-[11px] leading-snug text-fg-subtle">{t("hint")} {t("saved")}</p>
        {LAYOUTS.map((l) => {
          const on = l.id === current;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              data-layout-choice={l.id}
              onClick={(e) => choose(l.id, e.currentTarget)}
              className="group/opt flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors duration-300 ease-fluid hover:bg-white/5 aria-checked:border-accent aria-checked:bg-accent-soft"
            >
              <i aria-hidden className="block size-5 shrink-0 rounded-full border border-white/40" style={{ background: l.swatch }} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2 text-sm font-semibold">
                  <span className="tabular text-fg-subtle">{l.n}</span> {l.name}
                </span>
                <span className="block text-xs leading-snug text-fg-muted">{t(`items.${l.id}`)}</span>
                <span className="block text-[11px] text-fg-subtle">{t("film", { n: l.design })}{on ? ` · ${t("active")}` : ""}</span>
              </span>
              <span aria-hidden className="shrink-0 text-2xl leading-none text-fg transition-transform duration-500 ease-fluid group-hover/opt:scale-110" style={{ fontFamily: l.font }}>
                Aa
              </span>
            </button>
          );
        })}
        {current === "mono" && <MonoColourToggle />}
      </div>
    </aside>
  );
}

/** Monochrom: Medien sind in Graustufen; der Schalter zeigt die Originalfarben (data-mono-colour am <html>). */
function MonoColourToggle() {
  const t = useTranslations("layouts");
  const [on, setOn] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.monoColour === "on");
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        if (next) document.documentElement.dataset.monoColour = "on"; else delete document.documentElement.dataset.monoColour;
      }}
      className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-left text-xs font-semibold text-fg-muted hover:text-fg"
    >
      {on ? t("monoHideColour") : t("monoShowColour")}
    </button>
  );
}
