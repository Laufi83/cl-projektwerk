"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowSquareOut, CalendarBlank, Certificate, FilePdf, X } from "@phosphor-icons/react";

type Career = { years: string; role: string; org: string };
type Project = { year: string; client: string; event: string; size?: string; note?: string };
type Document = { id: string; kind: "certificate" | "reference"; de: string; en: string };
type Selected = { mode: "career" | "projects"; index: number };

const PAPERS: { match: (career: Career) => boolean; doc: Document }[] = [
  { match: c => /HEITEC|Heiser/i.test(c.org), doc: { id: "1g5EI7E9JMf8Ox30mE89qSlQkWobIQNZW", kind: "reference", de: "Arbeitszeugnis HEITEC Heiser · 2007", en: "HEITEC Heiser reference · 2007" } },
  { match: c => /MEPLAN/i.test(c.org), doc: { id: "1u7DvOWpaWccI8_5QjA_r2BNWiPbKteoY", kind: "reference", de: "Arbeitszeugnis MEPLAN · 2017", en: "MEPLAN reference · 2017" } },
  { match: c => /MS Internationaler/i.test(c.org), doc: { id: "1hPB-r-DtAEtTivOBZm2FgR0EyGgjEp9e", kind: "reference", de: "Arbeitszeugnis MS Internationaler Messebau · 2019", en: "MS Internationaler Messebau reference · 2019" } },
  { match: c => /IHK/i.test(c.org+" "+c.role), doc: { id: "1ogFD8V7awSGwr99dtoEguexYs-FBVAKB", kind: "certificate", de: "IHK-Zertifikat Projektleiter Messebau & Event · 2009", en: "IHK certificate: exhibition project manager · 2009" } },
];
const view=(id:string)=>"https://drive.google.com/file/d/"+encodeURIComponent(id)+"/view";
const download=(id:string)=>"https://drive.google.com/uc?export=download&id="+encodeURIComponent(id);

/** A real PDF preview, with a direct Drive fallback on mobile browsers. */
function DocumentViewer({doc,onClose}:{doc:Document;onClose:()=>void}){
  const de=useLocale()==="de";
  const close=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
    document.addEventListener("keydown",escape);
    close.current?.focus();
    return ()=>{document.removeEventListener("keydown",escape);previous?.focus();};
  },[onClose]);
  const title=doc[de?"de":"en"];
  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 p-2 sm:p-6" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title}
        onClick={e=>e.stopPropagation()}
        className="flex h-[min(94svh,950px)] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#111820] text-white shadow-[0_30px_150px_#000d]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 p-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2"><FilePdf size={21} className="shrink-0 text-[#fa8748]" aria-hidden="true"/><h3 className="min-w-0 truncate text-sm font-semibold" title={title}>{title}</h3></div>
          <div className="flex items-center gap-2">
            <a href={view(doc.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-xs hover:border-[#ff9756]">
              <ArrowSquareOut size={15} aria-hidden="true"/>{de?"Neuer Tab":"New tab"}
            </a>
            <a href={download(doc.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#f26a1b] px-3 py-2 text-xs font-semibold text-black">
              <ArrowDown size={15} aria-hidden="true"/>{de?"PDF laden":"Download"}
            </a>
            <button ref={close} type="button" onClick={onClose} aria-label={de?"Schließen":"Close"} className="grid size-9 place-items-center rounded-full border border-white/20 hover:border-[#ff9756]"><X size={19} aria-hidden="true"/></button>
          </div>
        </div>
        <iframe title={title} src={"https://drive.google.com/file/d/"+encodeURIComponent(doc.id)+"/preview"}
          className="min-h-0 w-full flex-1 bg-white" loading="lazy" referrerPolicy="no-referrer"/>
        <p className="border-t border-white/15 px-4 py-3 text-[11px] text-[#b5c0cb]">
          {de?"Bei Problemen mit der eingebetteten Vorschau die PDF über „Neuer Tab“ direkt in Google Drive öffnen.":"If the embedded PDF preview does not load, open the original in a new Google Drive tab."}
        </p>
      </section>
    </div>,document.body
  );
}

/** Consistent animated rail+stage for BOTH professional experience and career. */
export function ExperienceHub({career,projects,careerTitle,projectsTitle,projectsNote}:{
  career:Career[]; projects:Project[]; careerTitle:string;projectsTitle:string;projectsNote:string
}){
  const de=useLocale()==="de";
  const [mode,setMode]=useState<"career"|"projects">("career");
  const [index,setIndex]=useState(0);
  const [doc,setDoc]=useState<Document|null>(null);
  const entries=mode==="career"?career:projects;
  const entry=entries[Math.min(index,Math.max(0,entries.length-1))];
  const careerEntry=mode==="career"?entry as Career:null;
  const projectEntry=mode==="projects"?entry as Project:null;
  const document=careerEntry?PAPERS.find(p=>p.match(careerEntry))?.doc:null;
  const label=(d:Document)=>d[de?"de":"en"];
  const select=(type:"career"|"projects")=>{setMode(type);setIndex(0);};
  const shift=(n:number)=>setIndex(p=>(p+n+entries.length)%entries.length);
  if(!entry)return null;
  return (
    <section aria-label={de?"Werdegang und Projekterfahrung":"Career and project experience"} className="mt-16" data-experience-hub>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CL / PROFESSIONAL EXPERIENCE</p>
          <h3 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">{de?"Erfahrung, die Projekte trägt.":"Experience that shapes projects."}</h3>
        </div>
        <div role="tablist" aria-label={de?"Erfahrungsansicht wählen":"Choose experience view"} className="flex flex-wrap gap-2">
          <button type="button" role="tab" aria-selected={mode==="career"} onClick={()=>select("career")} aria-controls="experience-stage"
            className="rounded-full border border-line-strong px-4 py-2.5 text-xs font-semibold transition-colors hover:border-accent aria-selected:border-accent aria-selected:bg-accent aria-selected:text-accent-contrast">{careerTitle}</button>
          <button type="button" role="tab" aria-selected={mode==="projects"} onClick={()=>select("projects")} aria-controls="experience-stage"
            className="rounded-full border border-line-strong px-4 py-2.5 text-xs font-semibold transition-colors hover:border-accent aria-selected:border-accent aria-selected:bg-accent aria-selected:text-accent-contrast">{projectsTitle}</button>
        </div>
      </div>
      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-fg-muted">{projectsNote}</p>
      <div className="mt-7 grid gap-4 lg:grid-cols-[.82fr_1.18fr]">
        <div className="max-h-[660px] space-y-2 overflow-y-auto rounded-2xl border border-line-strong bg-bg-raised/60 p-3 sm:p-4" role="tablist" aria-label={mode==="career"?careerTitle:projectsTitle}>
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
              {c && PAPERS.some(doc=>doc.match(c))&&<FilePdf size={19} aria-label={de?"Dokument vorhanden":"Document available"} className="shrink-0 text-accent" />}
              <ArrowRight size={16} className="shrink-0 text-fg-subtle group-aria-selected:text-accent" aria-hidden="true"/>
            </button>;
          })}
        </div>
        <div id="experience-stage" role="tabpanel" className="relative isolate min-h-[430px] overflow-hidden rounded-[1.6rem] border border-line-strong bg-[#101820] text-white lg:sticky lg:top-28 lg:self-start">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(#ffffff16_1px,transparent_1px),linear-gradient(90deg,#ffffff16_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]"/>
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-[#f26a1b]/15 blur-3xl"/>
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-5 md:px-8">
            <span className="font-mono text-[10px] font-bold tracking-[.19em] text-[#ffab73]">{mode==="career"?"CL / CAREER":"CL / PROJECT EXPERIENCE"}</span>
            <span className="font-mono text-xs tabular text-[#abbac5]">{String(index+1).padStart(2,"0")} / {String(entries.length).padStart(2,"0")}</span>
          </div>
          <div key={mode+"-"+index} className="p-6 motion-safe:animate-[career-enter_500ms_cubic-bezier(0.2,0.8,0.2,1)_both] md:p-9">
            <p className="inline-flex items-center gap-2 font-mono text-xs tracking-wide text-[#ffac79]"><CalendarBlank size={16} aria-hidden="true"/>{careerEntry?.years??projectEntry?.year}</p>
            <h4 className="mt-6 font-display text-[clamp(2rem,4.3vw,3.7rem)] font-semibold leading-tight tracking-tight">{careerEntry?.role??projectEntry?.client}</h4>
            <p className="mt-4 text-base leading-relaxed text-[#c1ccd4]">{careerEntry?.org??projectEntry?.event}</p>
            {projectEntry?.size&&<p className="mt-4 inline-flex rounded-full border border-white/20 px-3 py-1.5 font-mono text-xs text-[#ffae7b]">{projectEntry.size}</p>}
            {projectEntry?.note&&<p className="mt-5 max-w-lg text-sm leading-relaxed text-[#9eacba]">{projectEntry.note}</p>}
            {document&&<div className="mt-9 border-t border-white/15 pt-6">
              <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold"><Certificate size={19} className="text-[#ff9e63]" aria-hidden="true"/>{label(document)}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={()=>setDoc(document)} className="inline-flex items-center gap-2 rounded-full border border-white/35 px-4 py-2.5 text-xs font-semibold transition-colors hover:border-[#ff9756]"><FilePdf size={17} aria-hidden="true"/>{document.kind==="certificate"?(de?"Zertifikat ansehen":"View certificate"):(de?"Arbeitszeugnis ansehen":"View employment reference")}</button>
                <a href={download(document.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#f26a1b] px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#ff9957]"><ArrowDown size={17} aria-hidden="true"/>{de?"PDF herunterladen":"Download PDF"}</a>
              </div>
            </div>}
            {!document&&mode==="career"&&<p className="mt-8 border-t border-white/15 pt-5 text-xs text-[#9daeb9]">{de?"Für diese Station liegt derzeit kein Arbeitszeugnis in den bereitgestellten Unterlagen vor.":"No supporting employment certificate was provided for this position."}</p>}
            {mode==="projects"&&<p className="mt-8 border-t border-white/15 pt-5 text-xs text-[#9daeb9]">{de?"Persönliche Projekterfahrung aus früheren Anstellungen – keine Kundenreferenzen von CL Projektwerk.":"Project experience from previous employment – not client work of CL Projektwerk."}</p>}
          </div>
          <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/15 px-6 py-4 md:px-9">
            <button type="button" onClick={()=>shift(-1)} aria-label={de?"Vorheriger Eintrag":"Previous entry"} className="grid size-10 place-items-center rounded-full border border-white/25 hover:border-[#ff9957]"><ArrowLeft size={19} aria-hidden="true"/></button>
            <div role="progressbar" aria-label={de?"Position":"Position"} aria-valuemin={1} aria-valuemax={entries.length} aria-valuenow={index+1} className="h-[3px] w-2/3 overflow-hidden rounded-full bg-white/15">
              <div className="h-full bg-[#f26a1b] transition-[width] duration-500 motion-reduce:transition-none" style={{width:((index+1)/entries.length*100)+"%"}}/>
            </div>
            <button type="button" onClick={()=>shift(1)} aria-label={de?"Nächster Eintrag":"Next entry"} className="grid size-10 place-items-center rounded-full border border-white/25 hover:border-[#ff9957]"><ArrowRight size={19} aria-hidden="true"/></button>
          </div>
        </div>
      </div>
      {doc&&<DocumentViewer doc={doc} onClose={()=>setDoc(null)}/>}
    </section>
  );
}
