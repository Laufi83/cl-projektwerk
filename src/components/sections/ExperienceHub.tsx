"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useReducedMotion } from "@/hooks/useMedia";
import { ArrowLeft, ArrowRight, CalendarBlank } from "@phosphor-icons/react";
import { Kinetic } from "@/components/kinetic/Kinetic";
import { FxWords } from "@/components/kinetic/FxWords";

type Career = { years: string; role: string; org: string };
type Project = { year: string; client: string; event: string; size?: string; note?: string };
/**
 * Jahreszahl wird wie in einer Dokumentar-Zeitleiste eingetippt, mit blinkendem Cursor
 * (angelehnt an die Motion-Vorlage „Documentary Style Timeline Overlay“). Screenreader lesen den vollen Text.
 */
function TypedYear({text}:{text:string}){
  // Die Bühne wird je Eintrag neu eingehängt (key), daher beginnt n immer bei 0
  const reduce=useReducedMotion();
  const [n,setN]=useState(0);
  useEffect(()=>{
    if(reduce)return;
    let i=0;const id=window.setInterval(()=>{i++;setN(i);if(i>=text.length)clearInterval(id);},55);
    return ()=>clearInterval(id);
  },[text,reduce]);
  return <span className="relative inline-flex items-center">
    <span className="sr-only">{text}</span>
    <span aria-hidden="true">{reduce?text:text.slice(0,n)}</span>
    <span aria-hidden="true" className="ml-1 inline-block h-[1.1em] w-px bg-current motion-safe:animate-[typed-cursor_1s_steps(1)_infinite]"/>
    <style>{"@keyframes typed-cursor{50%{opacity:0}}"}</style>
  </span>;
}

/** Consistent animated rail+stage for BOTH professional experience and career. */
export function ExperienceHub({career,projects,careerTitle,projectsTitle,projectsNote}:{
  career:Career[]; projects:Project[]; careerTitle:string;projectsTitle:string;projectsNote:string
}){
  const de=useLocale()==="de";
  const [mode,setMode]=useState<"career"|"projects">("career");
  const [index,setIndex]=useState(0);
  const entries=mode==="career"?career:projects;
  const entry=entries[Math.min(index,Math.max(0,entries.length-1))];
  const careerEntry=mode==="career"?entry as Career:null;
  const projectEntry=mode==="projects"?entry as Project:null;
  const select=(type:"career"|"projects")=>{setMode(type);setIndex(0);};
  const shift=(n:number)=>setIndex(p=>(p+n+entries.length)%entries.length);
  if(!entry)return null;
  return (
    <section aria-label={de?"Werdegang und Projekterfahrung":"Career and project experience"} className="mt-16" data-experience-hub>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CL / PROFESSIONAL EXPERIENCE</p>
          <h3 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl"><Kinetic text={de?"Erfahrung, die Projekte trägt.":"Experience that shapes projects."} stomp /></h3>
        </div>
        <div role="tablist" aria-label={de?"Erfahrungsansicht wählen":"Choose experience view"} className="flex flex-wrap gap-2">
          <button type="button" role="tab" aria-selected={mode==="career"} onClick={()=>select("career")} aria-controls="experience-stage"
            className="rounded-full border border-line-strong px-4 py-2.5 text-xs font-semibold transition-colors hover:border-accent aria-selected:border-accent aria-selected:bg-accent aria-selected:text-accent-contrast">{careerTitle}</button>
          <button type="button" role="tab" aria-selected={mode==="projects"} onClick={()=>select("projects")} aria-controls="experience-stage"
            className="rounded-full border border-line-strong px-4 py-2.5 text-xs font-semibold transition-colors hover:border-accent aria-selected:border-accent aria-selected:bg-accent aria-selected:text-accent-contrast">{projectsTitle}</button>
        </div>
      </div>
      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-fg-muted"><FxWords text={projectsNote} delay={200} /></p>
      <div className="mt-7 grid gap-4 lg:grid-cols-[.82fr_1.18fr]">
        <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-2xl border border-line-strong bg-bg-raised/60 p-3 sm:p-4" role="tablist" aria-label={mode==="career"?careerTitle:projectsTitle}>
          {entries.map((item,i)=>{
            const isCareer=mode==="career",c=isCareer?item as Career:null,p=!isCareer?item as Project:null;
            return <button key={isCareer?c!.years+c!.org:p!.year+p!.client} type="button" role="tab" aria-selected={index===i} aria-controls="experience-stage"
              onClick={()=>setIndex(i)} className="group flex w-full items-center gap-3 rounded-xl border border-line-strong bg-bg p-3 text-left transition-[transform,border-color,background-color] duration-300 hover:translate-x-1 hover:border-accent aria-selected:border-accent aria-selected:bg-accent-soft motion-reduce:transition-none sm:p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft font-mono text-xs font-bold text-accent">{String(i+1).padStart(2,"0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] font-semibold tracking-wide text-accent">{isCareer?c!.years:p!.year}</span>
                <span className="mt-1 block text-sm font-semibold leading-snug">{isCareer?c!.role:p!.client}</span>
                <span className="mt-1 block truncate text-xs text-fg-muted">{isCareer?c!.org:p!.event}</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-fg-subtle group-aria-selected:text-accent" aria-hidden="true"/>
            </button>;
          })}
        </div>
        <div id="experience-stage" role="tabpanel" className="relative isolate min-h-[430px] overflow-hidden rounded-[1.6rem] border border-line-strong bg-[#101820] text-white lg:sticky lg:top-28 lg:self-start">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(#ffffff16_1px,transparent_1px),linear-gradient(90deg,#ffffff16_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]"/>
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-accent/15 blur-3xl"/>
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-5 md:px-8">
            <span className="font-mono text-[10px] font-bold tracking-[.19em] text-accent">{mode==="career"?"CL / CAREER":"CL / PROJECT EXPERIENCE"}</span>
            <span className="font-mono text-xs tabular text-accent">{String(index+1).padStart(2,"0")} / {String(entries.length).padStart(2,"0")}</span>
          </div>
          <div key={mode+"-"+index} className="p-6 motion-safe:animate-[career-enter_500ms_cubic-bezier(0.2,0.8,0.2,1)_both] md:p-9">
            <p className="inline-flex items-center gap-3 font-mono text-2xl font-semibold tracking-tight text-accent md:text-3xl"><CalendarBlank size={22} aria-hidden="true"/><TypedYear text={careerEntry?.years??projectEntry?.year??""}/></p>
            <h4 className="mt-6 font-display text-[clamp(2rem,4.3vw,3.7rem)] font-semibold leading-tight tracking-tight"><FxWords text={careerEntry?.role??projectEntry?.client??""} immediate delay={300} /></h4>
            <p className="mt-4 text-base leading-relaxed text-[#c1ccd4]"><FxWords text={careerEntry?.org??projectEntry?.event??""} immediate delay={650} /></p>
            {projectEntry?.size&&<p className="mt-4 inline-flex rounded-full border border-white/20 px-3 py-1.5 font-mono text-xs text-accent">{projectEntry.size}</p>}
            {projectEntry?.note&&<p className="mt-5 max-w-lg text-sm leading-relaxed text-[#9eacba]">{projectEntry.note}</p>}
            {mode==="projects"&&<p className="mt-8 border-t border-white/15 pt-5 text-xs text-[#9daeb9]">{de?"Persönliche Projekterfahrung aus früheren Anstellungen – keine Kundenreferenzen von CL Projektwerk.":"Project experience from previous employment – not client work of CL Projektwerk."}</p>}
          </div>
          <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/15 px-6 py-4 md:px-9">
            <button type="button" onClick={()=>shift(-1)} aria-label={de?"Vorheriger Eintrag":"Previous entry"} className="grid size-10 place-items-center rounded-full border border-white/25 hover:border-accent"><ArrowLeft size={19} aria-hidden="true"/></button>
            <div role="progressbar" aria-label={de?"Position":"Position"} aria-valuemin={1} aria-valuemax={entries.length} aria-valuenow={index+1} className="h-[3px] w-2/3 overflow-hidden rounded-full bg-white/15">
              <div className="h-full bg-accent transition-[width] duration-500 motion-reduce:transition-none" style={{width:((index+1)/entries.length*100)+"%"}}/>
            </div>
            <button type="button" onClick={()=>shift(1)} aria-label={de?"Nächster Eintrag":"Next entry"} className="grid size-10 place-items-center rounded-full border border-white/25 hover:border-accent"><ArrowRight size={19} aria-hidden="true"/></button>
          </div>
        </div>
      </div>
    </section>
  );
}
