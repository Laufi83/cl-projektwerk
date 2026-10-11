"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Pause, Play } from "@phosphor-icons/react";
import { useNear } from "@/hooks/useNear";
import { useReducedMotion } from "@/hooks/useMedia";
import type { StepImage } from "@/components/sections/Process";

const STEPS = ["briefing","concept","planning","production","logistics","onsite"] as const;
/** Six interactive phases using the actual process footage already displayed on the website. */
export function ConstructionExperience({images,visualisationNote}:{images:StepImage[];visualisationNote:string}) {
  const de=useLocale()==="de",t=useTranslations("process");
  const [step,setStep]=useState(0),[tour,setTour]=useState(false);
  const host=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null);
  const near=useNear(host),reduced=useReducedMotion();
  const current=images[step];
  useEffect(()=>{
    if(!tour||!near||reduced)return;
    const id=window.setInterval(()=>setStep(s=>(s+1)%STEPS.length),5300);
    return ()=>window.clearInterval(id);
  },[tour,near,reduced]);
  useEffect(()=>{
    const node=video.current;
    if(!node||!near||reduced)return;
    node.play().catch(()=>{});
    return ()=>node.pause();
  },[step,near,reduced]);
  const advance=(index:number)=>{setStep(index);setTour(false);};
  return <section id="bauphasen" aria-labelledby="construction-title" className="relative border-y border-line py-20 md:py-28">
    <div className="container-x">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div><p className="eyebrow">CL / CONSTRUCTION EXPERIENCE</p>
          <h2 id="construction-title" className="font-display mt-3 text-4xl font-semibold md:text-6xl">{de?"Von der Idee zur Übergabe.":"From idea to handover."}</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted">
            {de?"Erlebe die sechs realen Arbeitsschritte anhand der vorhandenen Prozessvideos. Wähle eine Phase oder starte die geführte Tour.":"Explore six project workflow steps with existing process footage. Select a stage or start the guided tour."}
          </p>
        </div>
        <button type="button" disabled={reduced} onClick={()=>setTour(p=>!p)}
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-bg-raised px-5 py-3 text-sm font-semibold transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50">
          {tour?<Pause size={18} weight="fill" aria-hidden="true"/>:<Play size={18} weight="fill" aria-hidden="true"/>}
          {tour?(de?"Tour pausieren":"Pause tour"):(de?"Tour starten":"Start tour")}
        </button>
      </div>
      <div className="mt-9 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {STEPS.map((name,i)=><button key={name} type="button" onClick={()=>advance(i)} aria-pressed={step===i}
            className="group flex min-w-0 items-start gap-3 rounded-2xl border border-line-strong bg-bg-raised px-3 py-4 text-left transition-[background-color,border-color,transform] duration-300 hover:border-accent hover:-translate-y-0.5 aria-pressed:border-accent aria-pressed:bg-accent-soft motion-reduce:transition-none md:px-5">
            <span className="mt-0.5 shrink-0 font-mono text-sm font-semibold text-accent">0{i+1}</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-fg md:text-base">{t(("steps."+name+".title") as "steps.briefing.title")}</span>
              <span className="mt-1 hidden text-xs leading-relaxed text-fg-muted md:block">{t(("steps."+name+".text") as "steps.briefing.text")}</span>
            </span>
            {step===i&&<ArrowRight size={17} className="ml-auto hidden shrink-0 text-accent md:block" aria-hidden="true"/>}
          </button>)}
        </div>
        <div ref={host} className="overflow-hidden rounded-[1.6rem] border border-line-strong bg-bg-raised">
          <div className="relative aspect-[16/9] overflow-hidden bg-[#101820]">
            {current.video&&!reduced ? <video key={current.video} ref={video}
              src={near?current.video:undefined} poster={current.src}
              muted loop={!current.once} playsInline preload="metadata"
              aria-label={current.alt} className="h-full w-full object-cover" /> :
              <img key={current.src} src={current.src} alt={current.alt} width={1280} height={720} loading="lazy" decoding="async"
                className="h-full w-full object-cover"/>}
            <span className="vis-note absolute left-4 top-4">{visualisationNote}</span>
            <span className="pointer-events-none absolute bottom-3 right-5 font-display text-6xl font-semibold text-white/90 [text-shadow:0_2px_24px_#000c] md:text-8xl">
              0{step+1}
            </span>
          </div>
          <div className="p-5 md:p-8">
            <p className="font-mono text-xs font-semibold tracking-[.15em] text-accent">PHASE {String(step+1).padStart(2,"0")} / 06</p>
            <h3 className="font-display mt-2 text-2xl font-semibold md:text-3xl">{t(("steps."+STEPS[step]+".title") as "steps.briefing.title")}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">{t(("steps."+STEPS[step]+".text") as "steps.briefing.text")}</p>
            <div className="mt-6 grid grid-cols-6 gap-1.5" role="progressbar" aria-valuenow={step+1} aria-valuemin={1} aria-valuemax={6} aria-label={de?"Bauphasen-Fortschritt":"Construction progress"}>
              {STEPS.map((s,i)=><span key={s} aria-hidden="true" className={"h-1 rounded-full transition-colors duration-300 "+(i<=step?"bg-accent":"bg-line-strong")}/>)}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-fg-subtle">
        {de?"Die gezeigten Bilder und Filme illustrieren verschiedene reale Arbeitsschritte. Sie zeigen nicht durchgehend die Montage desselben Messestands.":"Existing footage illustrates real workflow stages; it does not document the continuous assembly of one identical stand."}
      </p>
    </div>
  </section>;
}
