"use client";
/**
 * Leitsatz im „Stomp“-Stil (angelehnt an die Motion-Vorlage „Simple Creative Stomp“, eigene Umsetzung mit GSAP):
 * Beim Hereinscrollen schlagen die vier Arbeitsschritte nacheinander groß auf – mit kurzem Nachfedern der Bühne
 * und einer Druckwelle –, danach setzt sich der Leitsatz Wort für Wort zusammen.
 * Spielt bei jedem erneuten Hereinscrollen von oben neu; bei reduzierter Bewegung statisch.
 */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Abstand zwischen zwei Schlägen in Sekunden */
const BEAT = 1.05;

export function StompTagline({ text, beats }: { text: string; beats: string[] }) {
  const root = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = root.current!;
    const big = [...el.querySelectorAll<HTMLElement>("[data-beat]")];
    const row = el.querySelector<HTMLElement>("[data-beat-row]")!;
    const parts = [...el.querySelectorAll<HTMLElement>("[data-word]")];
    const stage = el.querySelector<HTMLElement>("[data-stage]")!;
    const shock = el.querySelector<HTMLElement>("[data-shock]")!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(row, { opacity: 1 });
      return;
    }
    gsap.set([...big, row, ...parts, shock], { opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    big.forEach((b, i) => {
      const at = i * BEAT;
      const hit = at + 0.42;
      tl.fromTo(b, { opacity: 0, scale: 2.2, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.42, ease: "power4.in" }, at)
        // Aufprall: die Bühne ruckt nach unten und federt zweimal nach
        .fromTo(stage, { y: 0 }, { keyframes: [{ y: 11, duration: 0.06 }, { y: -4, duration: 0.12 }, { y: 1.5, duration: 0.1 }, { y: 0, duration: 0.12 }], ease: "power2.out" }, hit)
        .fromTo(b, { scale: 1 }, { keyframes: [{ scale: 0.95, duration: 0.07 }, { scale: 1.02, duration: 0.14 }, { scale: 1, duration: 0.16 }] }, hit)
        // Druckwelle unter dem Wort
        .fromTo(shock, { opacity: 0.9, scaleX: 0.15 }, { opacity: 0, scaleX: 1, duration: 0.6, ease: "power3.out" }, hit)
        .to(b, { opacity: 0, scale: 0.92, filter: "blur(6px)", duration: 0.24, ease: "power2.in" }, at + BEAT - 0.24);
    });
    const end = big.length * BEAT;
    tl.to(row, { opacity: 1, duration: 0.6, ease: "power2.out" }, end)
      .fromTo(parts, { opacity: 0, scale: 1.5, y: 10, filter: "blur(8px)" }, { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "back.out(2.2)", stagger: 0.13 }, end + 0.1);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 70%",
      onEnter: () => tl.restart(),
      onEnterBack: () => { if (!tl.progress()) tl.restart(); },
      onLeaveBack: () => tl.pause(0),
    });
    return () => { st.kill(); tl.kill(); };
  }, [text, beats]);

  return (
    <section ref={root} className="relative overflow-hidden py-24 md:py-36">
      <h2 className="sr-only">{text}</h2>
      <div data-stage className="container-x">
        <div aria-hidden className="relative grid h-[1.1em] place-items-center font-display text-[clamp(3.2rem,12vw,10rem)] font-semibold leading-none tracking-tight">
          {beats.map((b) => (
            <span key={b} data-beat className="absolute whitespace-nowrap text-accent opacity-0 [text-shadow:0_0_40px_color-mix(in_oklab,var(--accent)_35%,transparent)]">{b}</span>
          ))}
          <span data-shock className="absolute bottom-[-0.12em] h-[3px] w-[min(70vw,900px)] rounded-full bg-accent opacity-0 shadow-[0_0_24px_var(--accent)]" />
          <span data-beat-row className="absolute flex flex-wrap justify-center gap-x-4 font-mono text-xs font-semibold uppercase tracking-[.24em] text-accent md:text-sm">
            {beats.map((b, i) => <span key={b}>{i > 0 && <span className="mr-4 text-fg-subtle">/</span>}{b.replace(/\.$/, "")}</span>)}
          </span>
        </div>
        <p aria-hidden className="font-display mx-auto mt-8 max-w-[22ch] text-center text-4xl font-semibold leading-tight md:mt-10 md:text-6xl md:leading-[1.05]">
          {words.map((w, i) => (
            <span key={i} data-word className="inline-block will-change-transform">{w}&nbsp;</span>
          ))}
        </p>
      </div>
    </section>
  );
}
