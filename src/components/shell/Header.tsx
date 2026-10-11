"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Heart } from "@phosphor-icons/react";
import { Link, usePathname } from "@/i18n/navigation";
import { useFavorites } from "@/lib/favorites";
import { lockScroll, scrollToTarget } from "@/lib/scroll";
import { site } from "@/config/site";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitch } from "@/components/shell/LanguageCarousel";
import { Kinetic } from "@/components/kinetic/Kinetic";

const SECTIONS = [
  { id: "leistungen", key: "services" },
  { id: "designs", key: "designs" },
  { id: "grafik", key: "graphics" },
  { id: "weltweit", key: "world" },
  { id: "messegelande", key: "venues" },
  { id: "ueber", key: "about" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const sectionLabel = (s: typeof SECTIONS[number] | {id:string;key:string}) => s.id === "messegelande" ? (locale === "de" ? "Messegelände" : "Venues") : t(s.key as "services" | "designs" | "process" | "graphics" | "world" | "about" | "contact");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const isHome = pathname === "/";
  const favs = useFavorites();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const lastY = useRef(0);

  // Ein- und Ausblenden je Scrollrichtung (rAF-gedrosselt)
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setHidden(y > 240 && y > lastY.current + 4);
        if (y < lastY.current - 4 || y < 240) setHidden(false);
        lastY.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Aktive Sektion markieren
  useEffect(() => {
    if (!isHome) return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = isHome ? active : null;

  const go = (id: string) => (e: React.MouseEvent) => {
    if (!isHome) return; // normale Navigation zur Startseite mit Anker
    e.preventDefault();
    setOpen(false);
    scrollToTarget(`#${id}`, id === "designs" ? 0 : -24);
    history.replaceState(history.state, "", `#${id}`);
  };

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-[env(safe-area-inset-top)] transition-transform duration-700 ease-fluid"
      style={{ transform: hidden && !open ? "translateY(-120%)" : "none" }}
    >
      <nav
        aria-label={t("main")}
        className="glass pointer-events-auto mx-auto mt-4 flex w-max max-w-[calc(100vw-24px)] items-center gap-1 rounded-[1.6rem] border border-white/15 bg-[#12161c]/80 p-2 shadow-[0_24px_85px_-28px_rgba(0,0,0,.85),inset_0_1px_0_rgba(255,255,255,.1)] backdrop-blur-2xl md:mt-6"
      >
        <Link
          href="/"
          onClick={(e) => {
            if (!isHome) return; // von anderen Seiten: normale Navigation zur Startseite
            e.preventDefault();
            setOpen(false);
            scrollToTarget(0);
            history.replaceState(history.state, "", location.pathname + location.search);
          }}
          className="group/logo grid h-10 place-items-center rounded-full px-3"
          aria-label={`${site.brand} · ${t("home")}`}
          data-cursor-label={t("home")}
        >
          <Logo className="h-5 w-auto text-fg transition-colors duration-500 ease-fluid group-hover/logo:text-accent" />
        </Link>

        <ul className="hidden items-center gap-0.5 xl:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                href={{ pathname: "/", hash: s.id }}
                onClick={go(s.id)}
                aria-current={current === s.id ? "true" : undefined}
                className="group/nav relative inline-flex items-center rounded-2xl px-2.5 py-2.5 text-xs font-semibold text-fg-muted transition-[color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-fg aria-[current]:bg-white/10 aria-[current]:text-fg 2xl:px-3 2xl:text-sm"
              >
                <Kinetic text={sectionLabel(s)} />
                <span
                  aria-hidden
                  className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-700 ease-fluid [[aria-current]>&]:scale-x-100"
                />
              </Link>
            </li>
          ))}
        </ul>

        <FavoritesLink count={favs.length} label={t("selection")} />
        <LanguageSwitch label={tc("language")} />

        <Link
          href={{ pathname: "/", hash: "kontakt" }}
          onClick={go("kontakt")}
          data-magnetic
          className="ml-1 hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98] sm:inline-flex"
        >
          {t("cta")}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={tc("menu")}
          className="relative ml-1 grid size-10 place-items-center rounded-full xl:hidden"
        >
          <span aria-hidden className="relative block h-3 w-5">
            <span className={`absolute left-0 h-[1.5px] w-5 bg-fg transition-all duration-700 ease-fluid ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 h-[1.5px] w-5 bg-fg transition-all duration-700 ease-fluid ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </nav>

      {/* Mobiles Menü: Vollbild-Glas, Links gestaffelt */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="pointer-events-auto fixed inset-0 -z-10 bg-[#080b10]/95 backdrop-blur-3xl xl:hidden"
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <ul className="flex h-full flex-col justify-center gap-2 px-8">
          {[...SECTIONS, { id: "kontakt", key: "contact" } as const].map((s, i) => (
            <li key={s.id} className="overflow-hidden">
              <Link
                href={{ pathname: "/", hash: s.id }}
                onClick={(e) => { go(s.id)(e); setOpen(false); }}
                className="font-display block py-2 text-[clamp(1.75rem,5.5vh,3rem)] font-semibold tracking-tight transition-[transform,opacity,color] duration-500 ease-fluid hover:text-accent"
                style={{
                  transform: open ? "none" : "translateY(48px)",
                  opacity: open ? 1 : 0,
                  transitionDelay: `${100 + i * 50}ms`,
                }}
              >
                {s.id === "messegelande" ? (locale === "de" ? "Messegelände" : "Venues") : t(s.key)}
              </Link>
            </li>
          ))}
          <li className="mt-8 flex gap-3">
            <Link
              href="/auswahl"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold"
            >
              {t("selection")} ({favs.length})
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

function FavoritesLink({ count, label }: { count: number; label: string }) {
  return (
    <Link
      href="/auswahl"
      className="relative grid size-10 place-items-center rounded-full text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg"
      aria-label={`${label} (${count})`}
      data-cursor-label={label}
    >
      <Heart size={20} weight={count ? "fill" : "regular"} className={count ? "text-accent" : ""} />
      {count > 0 && (
        <span className="tabular absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.6875rem] font-semibold leading-5 text-accent-contrast">
          {count}
        </span>
      )}
    </Link>
  );
}

