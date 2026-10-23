"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Blueprint, Image as ImageIcon, Ruler } from "@phosphor-icons/react";
import { DesignImage } from "./DesignImage";
import type { Design, ImageInfo } from "@/lib/design-types";
import { contentLocale } from "@/i18n/locales";

type Step = 0 | 1 | 2;
export function DesignStory({ design: d }: { design: Design }) {
  const lang = contentLocale(useLocale());
  const de = lang === "de";
  const [active,setActive] = useState<Step>(0);
  const plan = [d.floorplan,d.elevation,...d.extraPlans].find(p=>p&&!p.placeholder) ?? null;
  const image = d.renderings[0];
  const final = d.renderings.find((r,i)=>i>0&&!r.placeholder) ?? image;
  if (!image) return null;
  const specs = [
    d.size ? (de?"Standfläche: ":"Stand area: ")+d.size.width+" × "+d.size.depth+" m ("+d.size.area+" m²)" : null,
    d.floors ? (de?"Geschosse: ":"Levels: ")+d.floors : null,
    d.materials?.[lang] ? (de?"Materialien: ":"Materials: ")+d.materials[lang] : null,
  ].filter(Boolean);
  const labels = de?["Ausgangslage","Entwurf","Visualisiertes Ergebnis"]:["Project brief","Design","Visualised result"];
  const body = [
    d.description[lang] || d.description.de,
    plan
      ? (de?"Die vorhandene Planzeichnung zeigt die räumliche Anordnung und den konstruktiven Entwurfsstand.":"The existing technical drawing shows the layout and planned spatial arrangement.")
      : (de?"Die Perspektivansicht vermittelt das räumliche Konzept. Für dieses Projekt ist kein eigener Plan hinterlegt.":"The perspective view illustrates the spatial concept. No separate drawing is available for this design."),
    de?"Das Ergebnis dieser Präsentation ist die dokumentierte Entwurfsvisualisierung, keine Behauptung über eine tatsächlich ausgeführte Realisierung.":"This stage shows the documented design visualisation; it does not claim that the project was built.",
  ];
  const selectedImage:ImageInfo = active===1&&plan ? plan : active===2 ? final : image;
  return <section className="mt-16" aria-labelledby={"story-"+d.id}>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">CL / PROJECT STORY</p>
        <h2 id={"story-"+d.id} className="font-display mt-3 text-3xl font-semibold md:text-5xl">{de?"Von der Idee zur Gestaltung.":"From brief to design."}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">{de?"Eine Geschichte in drei Schritten – mit vorhandenen Projektdaten und echten Entwurfsbildern.":"A three-stage story using the available project facts and original design imagery."}</p>
      </div>
      <span className="font-mono text-sm tabular text-fg-muted"><strong className="text-xl text-accent">0{active+1}</strong> / 03</span>
    </div>
    <div role="tablist" aria-label={de?"Projektgeschichte":"Project story"} className="no-scrollbar mt-6 grid grid-cols-3 gap-2 overflow-x-auto">
      {labels.map((label,i)=><button key={label} type="button" role="tab"
        id={"story-tab-"+d.id+"-"+i} aria-selected={active===i} aria-controls={"story-panel-"+d.id}
        onClick={()=>setActive(i as Step)} className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-line-strong bg-bg-raised p-3 text-left transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent aria-selected:border-accent aria-selected:bg-accent-soft motion-reduce:transition-none sm:p-5">
        <span className="font-mono text-xs font-bold text-accent">0{i+1}</span>
        <span className="text-xs font-semibold leading-tight sm:text-base">{label}</span>
      </button>)}
    </div>
    <div id={"story-panel-"+d.id} role="tabpanel" aria-labelledby={"story-tab-"+d.id+"-"+active} className="mt-3 overflow-hidden rounded-[1.6rem] border border-line-strong bg-bg-raised">
      <div className="grid lg:grid-cols-[1.18fr_.82fr]">
        <div className="relative aspect-[16/9] overflow-hidden bg-bg-sunken lg:aspect-auto lg:min-h-[390px]" key={selectedImage.base+"-"+active}>
          <DesignImage id={d.id} img={selectedImage} alt={d.title+" – "+labels[active]+" – "+selectedImage.label[lang]}
            sizes="(min-width: 1024px) 58vw, 100vw" className={"h-full w-full "+(active===1&&plan?"bg-white object-contain":"object-cover")} />
          <span className="vis-note absolute left-4 top-4">{de?"Visualisierung / Projektunterlage":"Visualisation / design document"}</span>
        </div>
        <div className="flex flex-col p-6 md:p-9">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-accent">
            {active===1?<Blueprint size={19} aria-hidden="true"/>:active===2?<ImageIcon size={19} aria-hidden="true"/>:<Ruler size={19} aria-hidden="true"/>}
            {de?"Kapitel ":"Chapter "}{active+1}
          </div>
          <h3 className="font-display mt-5 text-3xl font-semibold leading-tight md:text-4xl">{labels[active]}</h3>
          <p className="mt-5 max-w-[60ch] text-sm leading-relaxed text-fg-muted md:text-base">{body[active]}</p>
          {active===0 && specs.length>0 && <ul className="mt-5 grid gap-2 border-t border-line pt-5 text-xs text-fg-muted">
            {specs.map(s=><li key={s}>{s}</li>)}
          </ul>}
          {active===1 && <p className="mt-5 text-xs text-fg-subtle">{plan?(de?"Planausschnitt aus den vorhandenen Projektunterlagen.":"Drawing from existing project documentation."):(de?"Kein Plan vorhanden – Originalrendering als Ersatz.":"No drawing available; original rendering shown instead.")}</p>}
          {active===2 && <p className="mt-5 text-xs text-fg-subtle">{de?"Keine Aussage über Bauausführung, Projektabschluss oder Kundenerfolg.":"No claim about actual construction, completion or client outcomes."}</p>}
          <div className="mt-auto flex justify-between gap-4 border-t border-line pt-5">
            <span className="font-mono text-xs text-fg-subtle">{String(d.number).padStart(3,"0")} / {d.title}</span>
            <button type="button" onClick={()=>setActive(((active+1)%3) as Step)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">
              {active===2?(de?"Neu starten":"Restart"):(de?"Weiter":"Next")} <ArrowRight size={17} aria-hidden="true"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
