"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowUpRight, Buildings, CalendarBlank, MapPin } from "@phosphor-icons/react";

type Experience = { year: string; client: string; event: string; note?: string };
type Career = { years: string; role: string; org: string };

export function CareerSpotlight({ career, projects }: { career: Career; projects: Experience[] }) {
  const [selected, setSelected] = useState(0);
  const de = useLocale() === "de";
  const active = projects[selected];
  if (!active || projects.length === 0) return null;

  return (
    <section aria-label={de ? "Ausgewählte Projekterfahrung bei C3 EXPO" : "Selected experience at C3 EXPO"}
      className="mt-9 overflow-hidden rounded-[1.8rem] border border-line-strong bg-[#10161e] text-[#f5f2ec]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-5 md:px-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[.18em] text-[#ff985d]">
          CL / SELECTED EXPERIENCE
        </p>
        <span className="rounded-full border border-white/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#b7c0c8]">
          {career.years}
        </span>
      </div>
      <div className="grid lg:grid-cols-[.76fr_1.24fr]">
        <div className="flex flex-col gap-5 border-b border-white/10 p-5 md:p-8 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a8b3be]">{de ? "Berufliche Station" : "Professional position"}</p>
            <h4 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">{career.role}</h4>
            <p className="mt-2 text-sm text-[#c6cbd0]">{career.org}</p>
          </div>
          <div role="tablist" aria-label={de ? "Projektreferenz wählen" : "Choose project experience"} className="mt-auto grid gap-2">
            {projects.map((p,i) => (
              <button key={p.client} type="button" role="tab" aria-selected={selected===i}
                aria-controls="c3-project-spotlight" onClick={()=>setSelected(i)}
                className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[.035] px-4 py-4 text-left transition-[background-color,border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-[#f77a2f] aria-selected:border-[#f77a2f] aria-selected:bg-[#f77a2f]/15 motion-reduce:transition-none">
                <span>
                  <span className="block font-mono text-[10px] tracking-widest text-[#ffae7c]">0{i+1} / 0{projects.length}</span>
                  <span className="mt-1 block text-lg font-bold">{p.client}</span>
                </span>
                <ArrowUpRight size={20} aria-hidden="true" className="shrink-0 text-[#ff9b64] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none" />
              </button>
            ))}
          </div>
        </div>
        <div id="c3-project-spotlight" role="tabpanel" className="relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden p-6 md:min-h-[420px] md:p-10" aria-live="polite">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-50"
            style={{ background: selected === 0 ? "radial-gradient(ellipse at 75% 15%, rgba(242,106,27,.34), transparent 65%)" : "radial-gradient(ellipse at 75% 15%, rgba(79,151,188,.32), transparent 65%)" }} />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(#ffffff22_1px,transparent_1px),linear-gradient(90deg,#ffffff22_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <span aria-hidden="true" className="pointer-events-none absolute right-4 top-4 font-display text-[8rem] font-black leading-none tracking-[-.1em] text-white/[.05] md:right-8 md:top-6 md:text-[14rem]">{String(selected+1).padStart(2,"0")}</span>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[.14em] text-[#ffae7c]">
              {de ? "Projektmitarbeit im Angestelltenverhältnis" : "Project work during employment"}
            </p>
            <h5 key={active.client} className="mt-3 font-display text-5xl font-semibold leading-none tracking-tight md:text-7xl">{active.client}</h5>
            <p className="mt-5 max-w-lg text-lg leading-snug text-[#e5e8eb] md:text-xl">{active.event}</p>
            {active.note && <p className="mt-4 text-sm leading-relaxed text-[#b7c2ce]">{active.note}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-5 text-xs text-[#b1bec8]">
              <span className="inline-flex items-center gap-2"><CalendarBlank size={17} className="text-[#ff975e]" aria-hidden="true" />{active.year}</span>
              <span className="inline-flex items-center gap-2"><Buildings size={17} className="text-[#ff975e]" aria-hidden="true" />C3 EXPO GmbH</span>
              <span className="inline-flex items-center gap-2"><MapPin size={17} className="text-[#ff975e]" aria-hidden="true" />{active.client === "Amazon" ? "Cannes" : "München"}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-[#b6c0c9] md:px-8">
        {de
          ? "Persönliche Projekterfahrung aus der Anstellung bei C3 EXPO GmbH. Diese Beispiele sind keine Referenzprojekte oder Auftraggeber von CL Projektwerk."
          : "Personal project experience gained while employed at C3 EXPO GmbH. These projects are not projects or client references of CL Projektwerk."}
      </p>
    </section>
  );
}
