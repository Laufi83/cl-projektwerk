"use client";
import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, ArrowUpRight, Compass, Heart } from "@phosphor-icons/react";
import type { GalleryItem } from "@/components/gallery/types";
import { pad3, thumbUrl } from "@/components/gallery/types";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";
import { favorites, useFavorites } from "@/lib/favorites";
import { InquireLink } from "@/components/ui/InquireLink";
import { localePrefix } from "@/i18n/locales";

type Style = "impact"|"nature"|"digital";
type Size = "small"|"medium"|"large";
const STYLES: Record<Style,{de:string;en:string;tags:string[]}> = {
  impact:{de:"Markenwirkung",en:"Brand impact",tags:["light","metal","product"]},
  nature:{de:"Natürlich",en:"Natural",tags:["wood","green"]},
  digital:{de:"Innovation",en:"Innovation",tags:["light","metal","product"]},
};
const SIZE: Record<Size,{de:string;en:string;min:number;max:number}> = {
  small:{de:"Bis 30 m²",en:"Up to 30 m²",min:0,max:30},
  medium:{de:"30–150 m²",en:"30–150 m²",min:30,max:150},
  large:{de:"Über 150 m²",en:"Over 150 m²",min:150,max:Infinity},
};
function rank(items:GalleryItem[],style:Style,targetArea:number,range?:Size) {
  const preferred=STYLES[style].tags;
  const matches=items.map(d=>{
    const tagHits=preferred.filter(tag=>d.tags.includes(tag)).length;
    const area=d.area;
    const areaDistance=area==null?1:Math.abs(Math.log((area+1)/(targetArea+1)));
    const rangeFit=!range||area==null?0:area>=SIZE[range].min&&area<=SIZE[range].max?1:0;
    return {d,tagHits,score:tagHits*4+rangeFit*3-Math.min(areaDistance,6)};
  });
  return matches.sort((a,b)=>b.score-a.score||a.d.n-b.d.n);
}
function ProjectPreview({d,tagHits,label}:{d:GalleryItem;tagHits:number;label:string}){
  const locale=useLocale(),de=locale==="de",overlay=useDesignOverlay(),favs=useFavorites();
  const open=(el:HTMLElement|null)=>overlay.open(d.slug,{fullscreen:false,rect:el?.getBoundingClientRect(),image:thumbUrl(d.id,"render-1",1280),tone:d.tone});
  return <div className="group overflow-hidden rounded-2xl border border-line-strong bg-bg-raised">
    <div className="relative aspect-[16/9] overflow-hidden" style={{backgroundColor:d.tone}}>
      <a href={localePrefix(locale)+"/designs/"+d.slug} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open(e.currentTarget.querySelector("img"));}}
        className="block h-full w-full" aria-label={d.title}>
        <img src={thumbUrl(d.id,"render-1",640)} srcSet={thumbUrl(d.id,"render-1",640)+" 640w, "+thumbUrl(d.id,"render-1",1280)+" 1280w"}
          sizes="(min-width:1024px) 42vw, 100vw" loading="lazy" decoding="async" alt={d.title}
          width={640} height={360} className="h-full w-full object-cover transition-transform duration-700 ease-fluid group-hover:scale-105 motion-reduce:transition-none"/>
      </a>
      <button type="button" onClick={()=>favorites.toggle(d.id)} aria-pressed={favs.includes(d.id)} aria-label={de?"Entwurf merken":"Save design"}
        className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur hover:border-accent aria-pressed:text-accent"><Heart size={19} weight={favs.includes(d.id)?"fill":"regular"} aria-hidden="true"/></button>
      <span className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1.5 font-mono text-xs text-white backdrop-blur">{pad3(d.n)} / {d.size??(de?"Maße nicht hinterlegt":"Size not listed")}</span>
    </div>
    <div className="p-5">
      <span className="text-[10px] font-bold uppercase tracking-[.15em] text-accent">{label}</span>
      <h4 className="mt-2 font-display text-2xl font-semibold">{d.title}</h4>
      <p className="mt-2 text-xs text-fg-muted">{tagHits} {de?"übereinstimmende Material-/Gestaltungsmerkmale":"matching design characteristics"} · {de?"Bestehender Archiv-Entwurf":"Existing archive design"}</p>
      <a href={localePrefix(locale)+"/designs/"+d.slug} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open(e.currentTarget.parentElement?.parentElement?.querySelector("img")??null);}}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:border-accent">{de?"Projekt ansehen":"View project"}<ArrowUpRight size={16} aria-hidden="true"/></a>
    </div>
  </div>;
}
function Options<T extends string>({value,onChange,choices,label}:{value:T;onChange:(v:T)=>void;choices:{value:T;label:string}[];label:string}){
  return <fieldset><legend className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">{label}</legend>
    <div className="flex flex-wrap gap-2">{choices.map(x=><button key={x.value} type="button" onClick={()=>onChange(x.value)} aria-pressed={value===x.value}
      className="rounded-full border border-line-strong bg-bg px-4 py-2.5 text-xs font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">{x.label}</button>)}</div>
  </fieldset>;
}
export function StandConfigurator({items}:{items:GalleryItem[]}){
  const de=useLocale()==="de";
  const [dims,setDims]=useState<"6x3"|"8x5"|"12x6">("8x5");
  const [style,setStyle]=useState<Style>("impact");
  const [width,depth]=dims.split("x").map(Number);
  const ranked=useMemo(()=>rank(items,style,width*depth),[items,style,width,depth]);
  const candidate=ranked[0];
  return <section id="stand-konfigurator" aria-labelledby="configurator-title" className="border-y border-line bg-bg-raised/40 py-20 md:py-28">
    <div className="container-x">
      <p className="eyebrow">CL / INTERACTIVE STAND CONFIGURATOR</p>
      <h2 id="configurator-title" className="font-display mt-3 text-4xl font-semibold leading-tight md:text-6xl">{de?"Dein Stand. Deine Richtung.":"Your space. Your direction."}</h2>
      <p className="mt-4 max-w-3xl text-base text-fg-muted">{de?"Wähle eine Beispielgröße und die gewünschte Wirkung. Wir zeigen dir einen ähnlichen, tatsächlich vorhandenen Entwurf aus dem Portfolio – keine automatisch erzeugte neue Planung.":"Choose a sample size and a design direction. We suggest an existing relevant design from the portfolio, not an automatically generated stand plan."}</p>
      <div className="mt-9 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="flex flex-col gap-9 rounded-3xl border border-line-strong bg-bg p-6 md:p-9">
          <Options value={dims} onChange={setDims} label={de?"01 / Beispiel-Standgröße":"01 / Sample stand size"} choices={([{value:"6x3",label:"6 × 3 m"},{value:"8x5",label:"8 × 5 m"},{value:"12x6",label:"12 × 6 m"}] as const).map(x=>x)}/>
          <Options value={style} onChange={setStyle} label={de?"02 / Gestaltungsrichtung":"02 / Style"} choices={(Object.keys(STYLES) as Style[]).map(value=>({value,label:STYLES[value][de?"de":"en"]}))}/>
          <div className="mt-auto border-t border-line pt-6">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">{de?"Deine Auswahl":"Your selection"}</p>
            <p className="mt-3 font-display text-3xl font-semibold tabular">{width*depth} m² <span className="text-accent">/</span> {STYLES[style][de?"de":"en"]}</p>
            <InquireLink configuration={{width:String(width),depth:String(depth),style:STYLES[style][de?"de":"en"]}}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-contrast transition-transform hover:scale-[1.02]">
              {de?"Diese Konfiguration anfragen":"Enquire about this configuration"} <ArrowRight size={17} aria-hidden="true"/>
            </InquireLink>
          </div>
        </div>
        {candidate?<ProjectPreview d={candidate.d} tagHits={candidate.tagHits} label={de?"INSPIRATION AUS ECHTEN PROJEKTEN":"INSPIRATION FROM REAL PROJECTS"}/>:<p className="p-10 text-fg-muted">{de?"Derzeit sind keine Entwürfe verfügbar.":"No published designs are currently available."}</p>}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-fg-subtle">{de?"Die Beispielabmessungen sind nur eine Vorauswahl. Der dargestellte Referenzentwurf besitzt eigene Maße und ist keine Vorschau der neu konfigurierten Standfläche. Verbindliche Planung und Kosten erfolgen erst nach Briefing.":"Sample dimensions are for enquiry only. The reference design has its own dimensions and is not a rendering of the selected configuration. Planning and pricing require a briefing."}</p>
    </div>
  </section>;
}
export function SmartProjectFinder({items}:{items:GalleryItem[]}){
  const de=useLocale()==="de";
  const [style,setStyle]=useState<Style>("nature");
  const [size,setSize]=useState<Size>("medium");
  const target=size==="small"?22:size==="medium"?85:220;
  const ranked=useMemo(()=>rank(items,style,target,size).slice(0,3),[items,style,target,size]);
  return <div className="container-x mb-12" aria-labelledby="finder-title">
    <div className="rounded-[2rem] border border-line-strong bg-bg-raised p-5 md:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="eyebrow">CL / SMART PROJECT FINDER</p>
          <h3 id="finder-title" className="font-display mt-3 text-3xl font-semibold md:text-5xl">{de?"100 Ideen. Dein Einstieg.":"Discover your next idea."}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">{de?"Filtere nach Wirkung und Größe. Die Vorschläge entstehen aus den tatsächlich hinterlegten Tags und Abmessungen der freigeschalteten Entwürfe.":"Find relevant projects using actual tags and dimensions from the published archive."}</p>
        </div>
        <Compass size={33} className="text-accent" aria-hidden="true"/>
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <div className="flex flex-col gap-6 rounded-2xl border border-line bg-bg p-5 md:p-6">
          <Options value={style} onChange={setStyle} label={de?"Gewünschte Wirkung":"Desired direction"} choices={(Object.keys(STYLES) as Style[]).map(value=>({value,label:STYLES[value][de?"de":"en"]}))}/>
          <Options value={size} onChange={setSize} label={de?"Standgröße":"Stand area"} choices={(Object.keys(SIZE) as Size[]).map(value=>({value,label:SIZE[value][de?"de":"en"]}))}/>
          <p className="mt-auto text-xs leading-relaxed text-fg-subtle">{de?"Reihenfolge nach nachvollziehbaren Kriterien: passende Tags, Größenbereich und Nähe zur Wunschfläche. Kein erfundener KI-Score.":"Ranking uses matching tags, size range, and distance from your requested area. No invented AI confidence scores."}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {ranked.map(({d,tagHits})=><ProjectPreview key={d.id} d={d} tagHits={tagHits} label={de?"PASSENDER ARCHIV-ENTWURF":"MATCHED PORTFOLIO DESIGN"}/>)}
        </div>
      </div>
    </div>
  </div>;
}
