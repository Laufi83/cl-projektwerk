"use client";
/**
 * Perspektiv-Tunnel (Vorlage 21st.dev, angepasst): eigene Entwurfsbilder fliegen beim Scrollen aus der Tiefe auf
 * den Betrachter zu. Anders als die Vorlage steuert der normale Seiten-Scroll den Flug (Sticky-Bühne, auch per Touch),
 * die Seite wird nie blockiert. Karten verlinken auf den Entwurf. Reduzierte Bewegung: ruhiges Raster.
 */
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export type TunnelItem = { src: string; title: string; slug: string; n: string };
type Stage = { width: number; height: number; isMobile: boolean };
type Card = { item: TunnelItem; cos: number; sin: number; rx: number; ry: number; rot: number; index: number };

const SPRING = { stiffness: 60, damping: 25, mass: 0.5 };

function useParallax(enabled: boolean) {
  const rawX = useMotionValue(0), rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING), y = useSpring(rawY, SPRING);
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);
  return { x, y };
}

function TunnelCard({ card, progress, pointer, total, stage }: { card: Card; progress: MotionValue<number>; pointer: { x: MotionValue<number>; y: MotionValue<number> }; total: number; stage: Stage }) {
  const span = 0.55;
  const start = (card.index / total) * (1 - span);
  const local = useTransform(progress, [start, start + span], [0, 1]);
  const z = useTransform(local, [0, 1], [stage.isMobile ? -1200 : -1700, stage.isMobile ? 350 : 500]);
  const opacity = useTransform(local, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);
  const width = stage.isMobile ? Math.max(130, Math.min(180, stage.width * 0.4)) : Math.max(200, Math.min(300, stage.width * 0.19));
  const bx = card.cos * stage.width * card.rx, by = card.sin * stage.height * card.ry;
  const pan = stage.isMobile ? 18 : 45;
  const transform = useTransform([z, pointer.x, pointer.y], ([cz, px, py]: number[]) =>
    `translate3d(calc(-50% + ${bx - px * pan}px), calc(-50% + ${by - py * pan}px), ${cz}px) rotateZ(${card.rot}deg)`);
  // nur Karten im Vordergrund sind klickbar
  const pe = useTransform(local, (v) => (v > 0.25 && v < 0.9 ? "auto" : "none"));
  return (
    <motion.div style={{ width, transform, opacity, zIndex: card.index + 1, pointerEvents: pe }} className="absolute left-1/2 top-1/2 aspect-[4/5] will-change-transform">
      <Link href={{ pathname: "/designs/[slug]", params: { slug: card.item.slug } }}
        className="group relative block h-full w-full overflow-hidden rounded-2xl bg-bg-raised shadow-2xl shadow-black/70 ring-1 ring-white/15 transition-shadow duration-500 hover:ring-accent/80">
        <img src={card.item.src} alt={card.item.title} draggable={false} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4">
          <span className="font-mono text-xs uppercase tracking-widest text-white/95">{card.item.n} · {card.item.title}</span>
        </span>
      </Link>
    </motion.div>
  );
}

export default function PerspectiveTunnelHero({ items, eyebrow, title, lead, hint }: { items: TunnelItem[]; eyebrow: string; title: string; lead: string; hint: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>({ width: 1440, height: 900, isMobile: false });
  useEffect(() => {
    const upd = () => setStage({ width: window.innerWidth, height: window.innerHeight, isMobile: window.innerWidth < 768 });
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 30, restDelta: 0.0001 });
  const pointer = useParallax(!reduce);
  const titleScale = useTransform(progress, [0, 0.5, 1], [0.8, 1, 1.25]);
  const titleOpacity = useTransform(progress, [0, 0.1, 0.85, 1], [1, 1, 1, 0]);
  const promptOpacity = useTransform(progress, [0, 0.1], [1, 0]);

  const cards: Card[] = items.map((item, i) => {
    const a = i * 137.5 * (Math.PI / 180);
    return { item, cos: Math.cos(a), sin: Math.sin(a), rx: 0.28 + (i % 3) * 0.08, ry: 0.26 + (i % 2) * 0.09, rot: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2), index: i };
  });

  const head = (
    <div className="flex max-w-xl flex-col items-center px-6 text-center">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">{title}</h1>
      <p className="mt-5 max-w-[36ch] text-sm text-fg-muted sm:text-base">{lead}</p>
    </div>
  );

  if (reduce) {
    return (
      <section className="pt-32 md:pt-40">
        <div className="container-x flex justify-center">{head}</div>
        <ul className="container-x mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.slice(0, 8).map((it) => (
            <li key={it.slug}><Link href={{ pathname: "/designs/[slug]", params: { slug: it.slug } }} className="block overflow-hidden rounded-2xl ring-1 ring-white/10"><img src={it.src} alt={it.title} loading="lazy" className="aspect-[4/5] w-full object-cover" /></Link></li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[280svh]">
      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden" style={{ perspective: stage.isMobile ? "900px" : "1200px", transformStyle: "preserve-3d" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(color-mix(in_oklab,var(--accent)_35%,transparent)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_55%,transparent_100%)] opacity-40" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--accent)_16%,transparent)_0%,transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-accent/20" />
        <div aria-hidden className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-white/10" />
        <motion.div style={{ scale: titleScale, opacity: titleOpacity }} className="pointer-events-none z-0">{head}</motion.div>
        <motion.p style={{ opacity: promptOpacity }} className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-fg-muted">
          <span>{hint}</span><span className="h-6 w-px bg-gradient-to-b from-accent to-transparent" />
        </motion.p>
        <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {cards.map((c) => <TunnelCard key={c.item.slug} card={c} progress={progress} pointer={pointer} total={cards.length} stage={stage} />)}
        </div>
      </div>
    </section>
  );
}
