"use client";
/**
 * Leitsatz im „Stomp“-Stil (angelehnt an die Motion-Vorlage „Simple Creative Stomp“, eigene Umsetzung mit GSAP):
 * Beim Hereinscrollen schlagen die vier Arbeitsschritte nacheinander groß auf, danach setzt sich der Leitsatz
 * Wort für Wort zusammen. Spielt bei jedem erneuten Hereinscrollen von oben neu; bei reduzierter Bewegung statisch.
 */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function StompTagline({ text, beats }: { text: string; beats: string[] }) {
  const root = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = root.current!;
    const big = [...el.querySelectorAll<HTMLElement>("[data-beat]")];
    const row = el.querySelector<HTMLElement>("[data-beat-row]")!;
    const parts = [...el.querySelectorAll<HTMLElement>("[data-word]")];
    const stage = el.querySelector<HTMLElement>("[data-stage]")!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(row, { opacity: 1 });
      return;
    }
    gsap.set(big, { opacity: 0 });
    gsap.set(row, { opacity: 0 });
    gsap.set(parts, { opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    big.forEach((b, i) => {
      const at = i * 0.42;
      tl.fromTo(b, { opacity: 0, scale: 1.9, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.24, ease: "power4.out" }, at)
        // kurzer „Aufprall“: die Bühne ruckt nach unten und federt zurück
        .fromTo(stage, { y: 0 }, { y: 7, duration: 0.05, ease: "none", yoyo: true, repeat: 1 }, at + 0.2)
        .to(b, { opacity: 0, scale: 0.94, duration: 0.12, ease: "power2.in" }, at + 0.36);
    });
    const end = big.length * 0.42;
    tl.to(row, { opacity: 1, duration: 0.4, ease: "power2.out" }, end)
      .fromTo(parts, { opacity: 0, scale: 1.25, y: 6 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power4.out", stagger: 0.07 }, end);

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
            <span key={b} data-beat className="absolute whitespace-nowrap text-accent opacity-0">{b}</span>
          ))}
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
