"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowUpRight, Buildings, CalendarBlank } from "@phosphor-icons/react";
type Entry={years:string;role:string;org:string};
export function CareerTimeline({entries}:{entries:Entry[]}) {
  const de=useLocale()==="de";
  const [active,setActive]=useState(0);
  const selected=entries[active];
  if(!selected)return null;
  return <div className="mt-5 grid gap-5 lg:grid-cols-[.95fr_1.05fr]">
    <ol className="relative grid gap-2 border-l border-line pl-5">
      {entries.map((c,i)=><li key={c.years+c.org} className="relative">
        <span aria-hidden="true" className={"absolute -left-[25px] top-5 size-2 rounded-full transition-[background-color,box-shadow] duration-500 "+(active===i?"bg-accent shadow-[0_0_0_5px_rgba(242,106,27,.16)]":"bg-fg-subtle")}/>
        <button type="button" aria-current={active===i?"step":undefined} onClick={()=>setActive(i)}
          className="group w-full rounded-2xl border border-line-strong bg-bg-raised p-4 text-left transition-[border-color,transform,background-color] duration-300 hover:-translate-y-0.5 hover:border-accent aria-[current=step]:border-accent aria-[current=step]:bg-accent-soft motion-reduce:transition-none">
          <span className="block font-mono text-xs font-semibold tabular tracking-wide text-accent">{c.years}</span>
          <span className="mt-2 block text-sm font-semibold leading-snug md:text-base">{c.role}</span>
          <span className="mt-1 block text-xs leading-relaxed text-fg-muted">{c.org}</span>
        </button>
      </li>)}
    </ol>
    <div className="h-max overflow-hidden rounded-[1.7rem] border border-line-strong bg-[#101720] text-[#f4f0e9] lg:sticky lg:top-28">
      <div className="relative min-h-[320px] p-6 md:p-9">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#ffffff0d_1px,transparent_1px),linear-gradient(90deg,#ffffff0d_1px,transparent_1px)] [background-size:48px_48px]"/>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#f26a1b]/15 blur-3xl"/>
        <div className="relative flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] font-bold tracking-[.2em] text-[#ffac78]">CL / CAREER TIMELINE</p>
          <span className="font-mono text-xs text-[#a5b5c5]">{String(active+1).padStart(2,"0")} / {String(entries.length).padStart(2,"0")}</span>
        </div>
        <div key={active} className="relative mt-10 motion-safe:animate-[career-enter_500ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
          <p className="font-display break-words text-[clamp(2rem,4.5vw,3.8rem)] font-semibold leading-tight tracking-tight text-[#ffab7b] tabular">{selected.years}</p>
          <h4 className="mt-6 font-display text-2xl font-semibold leading-tight md:text-3xl">{selected.role}</h4>
          <p className="mt-4 inline-flex items-start gap-2 text-sm leading-relaxed text-[#bac6cf]"><Buildings size={18} className="mt-0.5 shrink-0 text-[#ff9a62]" aria-hidden="true"/>{selected.org}</p>
        </div>
        <div className="relative mt-8 border-t border-white/15 pt-5">
          <p className="inline-flex items-center gap-2 text-xs text-[#a5b4c0]"><CalendarBlank size={16} aria-hidden="true"/>{de?"Station auswählen, um den Zeitraum anzuzeigen.":"Select a career entry to view its date range."}</p>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-1.5 border-t border-white/10 px-6 py-5" aria-hidden="true">
        {entries.map((c,i)=><span key={c.years} className={"h-1 rounded-full transition-colors duration-300 "+(i<=active?"bg-[#f26a1b]":"bg-white/15")}/>)}
      </div>
    </div>
  </div>;
}
