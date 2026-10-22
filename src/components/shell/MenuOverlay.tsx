"use client";
/**
 * Vollbild-Menü (unter xl): links nummerierte Einträge mit Kurzbeschreibung, rechts eine Vorschau, die beim Zeigen
 * wechselt, darunter der Anfrage-Button mit Lichtreflex, E-Mail und Merkliste. Einblenden gestaffelt (motion),
 * bei reduzierter Bewegung ohne Animation. Am Handy steht der Anfrage-Bereich unter der Liste.
 */
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight, Heart, EnvelopeSimple } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { site } from "@/config/site";
import { pick } from "@/i18n/locales";
import { mediaUrl } from "@/lib/media";
import { portrait } from "@/config/profile";
import { Glare } from "@/components/ui/Glare";

export type MenuItem = { id: string; key: string; page?: "/messen" | "/projektleitung" };
type L6 = { de: string; en: string; fr: string; es: string; it: string; nl: string };

const DESC: Record<string, L6> = {
  services: { de: "Planung, Arbeitsvorbereitung, Steuerung", en: "Planning, work preparation, control", fr: "Planification, préparation, pilotage", es: "Planificación, preparación, control", it: "Progettazione, preparazione, controllo", nl: "Planning, werkvoorbereiding, sturing" },
  designs: { de: "Freie Entwurfsstudien · Visualisierungen", en: "Independent design studies · visualisations", fr: "Études de design libres · visualisations", es: "Estudios de diseño libres · visualizaciones", it: "Studi di design liberi · visualizzazioni", nl: "Vrije designstudies · visualisaties" },
  about: { de: "Christof Laufersweiler · seit 2007 im Messebau", en: "Christof Laufersweiler · in exhibitions since 2007", fr: "Christof Laufersweiler · dans les salons depuis 2007", es: "Christof Laufersweiler · en ferias desde 2007", it: "Christof Laufersweiler · nelle fiere dal 2007", nl: "Christof Laufersweiler · sinds 2007 in de standbouw" },
  references: { de: "Amazon · BMW · ZDK · Merck · Bosch Rexroth", en: "Amazon · BMW · ZDK · Merck · Bosch Rexroth", fr: "Amazon · BMW · ZDK · Merck · Bosch Rexroth", es: "Amazon · BMW · ZDK · Merck · Bosch Rexroth", it: "Amazon · BMW · ZDK · Merck · Bosch Rexroth", nl: "Amazon · BMW · ZDK · Merck · Bosch Rexroth" },
  venues: { de: "101 Gelände · Messekalender · Kompass", en: "101 venues · trade fair calendar · compass", fr: "101 parcs · calendrier · boussole", es: "101 recintos · calendario · brújula", it: "101 quartieri · calendario · bussola", nl: "101 locaties · beurskalender · kompas" },
  pm: { de: "13 Werkzeuge für Projektleiter im Browser", en: "13 browser tools for project managers", fr: "13 outils pour chefs de projet", es: "13 herramientas para jefes de proyecto", it: "13 strumenti per project manager", nl: "13 tools voor projectleiders" },
  contact: { de: "Projekt in vier kurzen Schritten anfragen", en: "Request a project in four short steps", fr: "Demander un projet en quatre étapes", es: "Solicitar un proyecto en cuatro pasos", it: "Richiedi un progetto in quattro passi", nl: "Project aanvragen in vier stappen" },
};
const TX = {
  reply: { de: "Antwort in der Regel innerhalb eines Werktags", en: "Reply usually within one working day", fr: "Réponse en général sous un jour ouvré", es: "Respuesta normalmente en un día laborable", it: "Risposta di solito entro un giorno lavorativo", nl: "Antwoord meestal binnen één werkdag" },
  vis: { de: "Visualisierung", en: "Visualisation", fr: "Visualisation", es: "Visualización", it: "Visualizzazione", nl: "Visualisatie" },
} satisfies Record<string, L6>;

/** Vorschaubild je Eintrag (Visualisierungen bzw. Porträt); ohne Bild eine Typo-Kachel */
const PREVIEW: Record<string, string | null> = {
  services: mediaUrl("services/tech-640.webp"),
  designs: mediaUrl("designs/280/render-1-640.webp"),
  about: mediaUrl(`${portrait.base}-640.webp`),
  references: null,
  venues: "/hero/lumen/poster-mobile.webp",
  pm: null,
  contact: mediaUrl("services/concept-640.webp"),
};

export function MenuOverlay({ open, items, current, onPick, favCount }: {
  open: boolean; items: MenuItem[]; current: string | null; onPick: (item: MenuItem, e: React.MouseEvent) => void; favCount: number;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const L = (o: L6) => pick(o, locale);
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const shown = hover ?? current ?? items[0]?.key;
  const shownItem = items.find((i) => i.key === shown) ?? items[0];
  const img = shownItem ? PREVIEW[shownItem.key] : null;
  const fade = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.06 + i * 0.045, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <AnimatePresence>
      {open && (
        <motion.div id="mobile-menu" key="menu"
          initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="pointer-events-auto fixed inset-0 -z-10 overflow-y-auto bg-[#07090d]/[0.97] backdrop-blur-3xl xl:hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:26px_26px]" />
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_28%,transparent),transparent_65%)] blur-2xl" />

          <div className="container-x relative grid min-h-full gap-10 pb-10 pt-28 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-center md:gap-14 md:pt-32">
            <nav aria-label={t("main")}>
              <ol className="border-t border-white/10">
                {items.map((s, i) => {
                  const on = current === s.key || hover === s.key;
                  return (
                    <motion.li key={s.key} {...fade(i)} className="border-b border-white/10">
                      <Link href={s.page ?? { pathname: "/", hash: s.id }} onClick={(e) => onPick(s, e)}
                        onMouseEnter={() => setHover(s.key)} onFocus={() => setHover(s.key)} onMouseLeave={() => setHover(null)}
                        aria-current={current === s.key ? "true" : undefined}
                        className="group flex items-center gap-4 py-3.5 outline-none sm:gap-6 sm:py-4">
                        <span className={`tabular w-7 shrink-0 font-mono text-xs transition-colors duration-300 ${on ? "text-accent" : "text-fg-subtle"}`}>{String(i + 1).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1">
                          <span className={`font-display block text-[clamp(1.6rem,6.2vw,2.4rem)] md:text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-[1.02] tracking-tight transition-[color,transform] duration-500 ease-fluid group-hover:translate-x-2 group-focus-visible:translate-x-2 ${on ? "text-fg" : "text-fg/80"}`}>{t(s.key)}</span>
                          <span className="mt-1 block truncate text-xs text-fg-subtle sm:text-sm">{DESC[s.key] ? L(DESC[s.key]) : ""}</span>
                        </span>
                        <span className={`grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-fluid ${on ? "border-accent bg-accent text-accent-contrast" : "border-white/15 text-fg-muted group-hover:border-accent"}`}>
                          {s.page ? <ArrowUpRight size={18} /> : <ArrowRight size={18} />}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ol>
            </nav>

            <motion.aside {...fade(items.length)} className="grid content-start gap-4 md:sticky md:top-28">
              {/* Vorschau (ab Tablet) */}
              <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white/10 bg-bg-raised md:block">
                <AnimatePresence mode="popLayout">
                  <motion.div key={shownItem?.key} initial={reduce ? false : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="absolute inset-0">
                    {img ? (
                      <>
                        <img src={img} alt="" className={`h-full w-full ${shownItem?.key === "about" ? "object-contain object-bottom" : "object-cover"}`} />
                        {shownItem?.key !== "about" && <span className="vis-note absolute left-4 top-4">{L(TX.vis)}</span>}
                      </>
                    ) : (
                      <div className="flex h-full flex-col justify-end bg-[linear-gradient(135deg,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_60%)] p-6">
                        <p className="font-display text-3xl font-semibold leading-tight">{shownItem ? t(shownItem.key) : ""}</p>
                        <p className="mt-2 text-sm text-fg-muted">{shownItem && DESC[shownItem.key] ? L(DESC[shownItem.key]) : ""}</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              <Link href={{ pathname: "/", hash: "kontakt" }} onClick={(e) => onPick({ id: "kontakt", key: "contact" }, e)}
                className="relative flex items-center justify-between gap-3 overflow-hidden rounded-full bg-accent px-6 py-4 text-base font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.02] active:scale-[0.98]">
                <Glare />
                <span className="relative">{t("cta")}</span>
                <ArrowUpRight size={20} className="relative" />
              </Link>
              <p className="text-center text-xs text-fg-subtle">{L(TX.reply)}</p>
              <div className="grid grid-cols-2 gap-2">
                <a href={`mailto:${site.email}`} className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-fg-muted transition-colors hover:border-accent hover:text-fg">
                  <EnvelopeSimple size={18} className="shrink-0 text-accent" /><span className="truncate">{site.email}</span>
                </a>
                <Link href="/auswahl" onClick={(e) => onPick({ id: "auswahl", key: "selection" }, e)} className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-fg-muted transition-colors hover:border-accent hover:text-fg">
                  <Heart size={18} weight={favCount ? "fill" : "regular"} className="shrink-0 text-accent" />{t("selection")} ({favCount})
                </Link>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
