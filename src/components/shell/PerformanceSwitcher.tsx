"use client";

import { useLocale } from "next-intl";
import { Gauge, Leaf, Sparkle } from "@phosphor-icons/react";
import { setPerformancePreference, useLiteMode, usePerformancePreference, type PerformancePreference } from "@/lib/performance";

export function PerformanceSwitcher(){
  const de=useLocale()==="de";
  const selected=usePerformancePreference();
  const lite=useLiteMode();
  const choices:{value:PerformancePreference;de:string;en:string}[]=[
    {value:"auto",de:"Automatisch",en:"Auto"},
    {value:"lite",de:"Schonend",en:"Lite"},
    {value:"full",de:"Volle Effekte",en:"Full effects"},
  ];
  return <div className="mt-6 rounded-2xl border border-white/15 bg-white/[.025] p-4" aria-label={de?"Animationsleistung":"Motion performance"}>
    <div className="flex items-center gap-2 text-sm font-semibold"><Gauge size={18} className="text-accent" aria-hidden="true"/>{de?"Animationsmodus":"Motion mode"}</div>
    <p className="mt-2 text-xs leading-relaxed text-fg-muted">{de
      ?"Automatisch schont iPhones und kleine Touch-Geräte. Wähle alternativ weniger Animation oder die volle Darstellung."
      :"Auto saves resources on iPhones and small touch devices. Choose a lighter or full experience if preferred."}</p>
    <div role="group" aria-label={de?"Animationsmodus wählen":"Choose motion mode"} className="mt-4 flex flex-wrap gap-2">
      {choices.map(choice=><button key={choice.value} type="button" aria-pressed={selected===choice.value} onClick={()=>setPerformancePreference(choice.value)}
        className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-fg-muted transition-colors hover:border-accent hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">
        {de?choice.de:choice.en}
      </button>)}
    </div>
    <p className="mt-3 inline-flex items-center gap-2 text-xs text-fg-subtle" aria-live="polite">
      {lite?<Leaf size={15} className="text-accent" aria-hidden="true"/>:<Sparkle size={15} className="text-accent" aria-hidden="true"/>}
      {lite?(de?"Aktiv: energiesparende Darstellung":"Active: reduced graphics"):(de?"Aktiv: volle Darstellung":"Active: full graphics")}
    </p>
  </div>;
}
