"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, MagnifyingGlass, Shuffle, SquaresFour, Sun } from "@phosphor-icons/react";
import { FILTERS, pad3, thumbUrl, type FilterKey, type GalleryItem } from "./types";
import { GridView } from "./GridView";
import { favorites, useFavorites } from "@/lib/favorites";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";
import { localePrefix } from "@/i18n/locales";

const BATCH = 16;
export function Gallery({ items, dayPick }: { items: GalleryItem[]; dayPick: string }) {
  const t = useTranslations("gallery"), locale = useLocale(), de = locale === "de";
  const overlay = useDesignOverlay(), favs = useFavorites();
  const [filter,setFilter] = useState<FilterKey>("all"), [query,setQuery] = useState("");
  const [index,setIndex] = useState(0), [grid,setGrid] = useState(false), [batch,setBatch] = useState(BATCH);
  const wheel = useRef(0), touch = useRef<{x:number;y:number}|null>(null);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f=>[f.key,items.filter(x=>f.test(x)).length])),[items]);
  const list = useMemo(() => {
    const test = FILTERS.find(f=>f.key===filter)?.test ?? (()=>true);
    const q=query.trim().toLowerCase();
    return items.filter(d=>test(d)&&(!q||[d.title,pad3(d.n),d.size??"",...d.tags].some(s=>s.toLowerCase().includes(q))));
  },[items,filter,query]);
  const idx=Math.min(index,Math.max(0,list.length-1));
  const active=list[idx];
  const change=(delta:number)=>{if(list.length)setIndex(i=>(i+delta+list.length)%list.length);};
  const chooseFilter=(value:FilterKey)=>{setFilter(value);setIndex(0);setBatch(BATCH);};
  const search=(value:string)=>{setQuery(value);setIndex(0);setBatch(BATCH);};
  const open=useCallback((d:GalleryItem,el:HTMLElement|null)=>{
    overlay.open(d.slug,{fullscreen:false,rect:el?.getBoundingClientRect(),image:thumbUrl(d.id,"render-1",1280),tone:d.tone,
      getReturnRect:(slug)=>document.querySelector<HTMLElement>('[data-cinematic-card="'+slug+'"] img, [data-grid-card="'+slug+'"] img')?.getBoundingClientRect()??null});
  },[overlay]);
  const jump=()=>{const d=items.find(x=>x.slug===dayPick);if(!d)return;const i=list.findIndex(x=>x.id===d.id);if(i<0)open(d,null);else setIndex(i);};
  const random=()=>{if(list.length>1)setIndex(i=>(i+1+Math.floor(Math.random()*(list.length-1)))%list.length);};
  const art=(d:GalleryItem,focus:boolean)=>(
    <picture>
      <source type="image/avif" srcSet={thumbUrl(d.id,"render-1",640).replace(".webp",".avif")+" 640w, "+thumbUrl(d.id,"render-1",1280).replace(".webp",".avif")+" 1280w"} sizes={focus?"(min-width:1024px) 62vw, 82vw":"(min-width:1024px) 23vw, 60vw"}/>
      <img src={thumbUrl(d.id,"render-1",focus?1280:640)} srcSet={thumbUrl(d.id,"render-1",640)+" 640w, "+thumbUrl(d.id,"render-1",1280)+" 1280w"}
        sizes={focus?"(min-width:1024px) 62vw, 82vw":"(min-width:1024px) 23vw, 60vw"} alt={pad3(d.n)+" "+d.title}
        width={focus?1280:640} height={focus?720:360} decoding="async" loading={focus?"eager":"lazy"}
        className="h-full w-full object-cover transition-transform duration-700 ease-fluid group-hover:scale-[1.05] motion-reduce:transition-none" draggable={false}/>
    </picture>
  );
  const card=(d:GalleryItem,side:-1|0|1)=>{
    const focus=side===0;
    return <div key={side} data-cinematic-card={d.slug} style={{backgroundColor:d.tone}}
      className={"group absolute inset-y-4 overflow-hidden rounded-[1.4rem] border border-white/15 bg-bg-raised shadow-[0_30px_90px_rgba(0,0,0,.7)] transition-[transform,opacity] duration-700 ease-fluid motion-reduce:transition-none sm:inset-y-7 "+
      (focus?"left-[10%] z-20 w-[80%] opacity-100 lg:left-[19%] lg:w-[62%]":side<0?"-left-[56%] z-10 w-[70%] -rotate-3 scale-[.82] opacity-55 lg:-left-[44%] lg:w-[57%]":"left-[82%] z-10 w-[70%] rotate-3 scale-[.82] opacity-55 lg:left-[87%] lg:w-[57%]")}>
      <a href={localePrefix(locale)+"/designs/"+d.slug} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();if(focus)open(d,e.currentTarget.querySelector("img"));else change(side);}}
        className="absolute inset-0 block focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent"
        aria-label={(focus?(de?"Entwurf öffnen: ":"Open design: "):(de?"Entwurf auswählen: ":"Select design: "))+d.title}>
        {art(d,focus)}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"/>
        <span className="pointer-events-none absolute inset-x-5 bottom-5 text-white sm:inset-x-9 sm:bottom-9">
          <span className="block font-mono text-xs font-semibold tracking-[.19em] text-[#ffab77]">CONCEPT / {pad3(d.n)}</span>
          <span className="mt-2 block font-display text-[clamp(1.6rem,3.8vw,3.5rem)] font-semibold leading-[1.05]">{d.title}</span>
          <span className="mt-2 block text-sm text-white/70">{d.size}</span>
          {focus&&<span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">{de?"Entwurf entdecken":"Explore design"} <ArrowUpRight size={16} aria-hidden/></span>}
        </span>
      </a>
      {focus&&<button type="button" aria-pressed={favs.includes(d.id)} onClick={()=>favorites.toggle(d.id)}
        aria-label={favs.includes(d.id)?(de?"Aus Auswahl entfernen":"Remove favorite"):(de?"Entwurf merken":"Save design")}
        className="absolute right-5 top-5 z-30 grid size-11 place-items-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur hover:border-accent aria-pressed:text-[#ffae78]"><Heart size={20} weight={favs.includes(d.id)?"fill":"regular"} aria-hidden/></button>}
    </div>;
  };
  return <div>
    <div className="container-x">
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line-strong pt-5">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-accent">CL / CINEMATIC PORTFOLIO EXPLORER</p>
        <span className="font-mono text-xs text-fg-muted">{items.length} {de?"ENTWÜRFE":"DESIGNS"}</span>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={()=>setGrid(false)} aria-pressed={!grid} className="rounded-full border border-line-strong px-4 py-2 text-xs font-semibold aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">{de?"Erlebnis":"Experience"}</button>
          <button type="button" onClick={()=>setGrid(true)} aria-pressed={grid} className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-xs font-semibold aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast"><SquaresFour size={16} aria-hidden/>{t("grid")}</button>
          <button type="button" onClick={random} className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-xs font-semibold hover:border-accent"><Shuffle size={16} aria-hidden/>{t("random")}</button>
          <button type="button" onClick={jump} className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-xs font-semibold hover:border-accent"><Sun size={16} aria-hidden/>{t("dayPick")}</button>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-line-strong bg-bg-raised px-4 py-2 text-sm focus-within:border-accent">
          <MagnifyingGlass size={17} className="text-accent" aria-hidden/><span className="sr-only">{de?"Entwürfe suchen":"Search projects"}</span>
          <input value={query} onChange={e=>search(e.target.value)} placeholder={de?"Projekt suchen":"Search designs"} className="w-36 bg-transparent text-fg outline-none placeholder:text-fg-subtle sm:w-48"/>
        </label>
      </div>
      <div role="group" aria-label={t("filters")} className="no-scrollbar -mx-[var(--gutter)] mt-4 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2">
        {FILTERS.filter(f=>counts[f.key]>0).map(f=><button key={f.key} type="button" aria-pressed={filter===f.key} onClick={()=>chooseFilter(f.key)}
          className="shrink-0 rounded-full border border-line-strong px-4 py-2 text-xs font-semibold text-fg-muted hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-fg">
          {t("filter."+f.key as "filter.all")} <span className="ml-1 font-mono opacity-60">{counts[f.key]}</span></button>)}
      </div>
    </div>
    {!list.length?<div className="container-x py-20 text-center"><p className="text-fg-muted">{t("empty")}</p><button type="button" className="mt-4 rounded-full border border-line px-4 py-2" onClick={()=>{chooseFilter("all");search("");}}>{t("reset")}</button></div>:
      grid?<div className="container-x mt-7"><GridView items={list.slice(0,batch)} onOpen={(slug,el)=>{const d=list.find(x=>x.slug===slug);if(d)open(d,el);}}/>
        {batch<list.length&&<div className="mt-10 text-center"><button type="button" onClick={()=>setBatch(n=>n+BATCH)} className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold hover:border-accent">{de?"Weitere Entwürfe laden":"Load more designs"} ({Math.min(batch,list.length)}/{list.length})</button></div>}
      </div>:
      <>
        <div tabIndex={0} role="region" aria-label={t("sliderLabel")} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==="ArrowRight"){e.preventDefault();change(1);}if(e.key==="ArrowLeft"){e.preventDefault();change(-1);}if(e.key==="Enter"&&active){e.preventDefault();open(active,e.currentTarget.querySelector('[data-cinematic-card="'+active.slug+'"] img'));}}}
          onWheel={e=>{const now=performance.now();if(now-wheel.current<450||Math.abs(e.deltaY)+Math.abs(e.deltaX)<8)return;wheel.current=now;change(Math.abs(e.deltaX)>Math.abs(e.deltaY)?Math.sign(e.deltaX):Math.sign(e.deltaY));}}
          onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}}
          onTouchEnd={e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.35)change(dx>0?-1:1);}}
          className="relative mx-auto mt-6 h-[350px] max-w-[1800px] overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_50%_60%,#2b3541,#131920_64%,#0c1117)] outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-[475px] lg:h-[620px]">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#ffffff0a_1px,transparent_1px),linear-gradient(90deg,#ffffff0a_1px,transparent_1px)] [background-size:70px_70px] [mask-image:linear-gradient(transparent,black_50%,transparent)]"/>
          <span className="pointer-events-none absolute left-6 top-5 z-30 font-mono text-xs tracking-[.18em] text-white/65">ARCHIVE / {String(list.length).padStart(3,"0")}</span>
          {list.length>1&&card(list[(idx-1+list.length)%list.length],-1)}
          {card(active,0)}
          {list.length>2&&card(list[(idx+1)%list.length],1)}
        </div>
        <div className="container-x mt-5">
          <div className="flex items-center justify-between gap-5">
            <div className="flex gap-2">
              <button type="button" aria-label={de?"Vorheriger Entwurf":"Previous project"} onClick={()=>change(-1)} className="grid size-12 place-items-center rounded-full border border-line-strong bg-bg-raised hover:border-accent"><ArrowLeft size={21} aria-hidden/></button>
              <button type="button" aria-label={de?"Nächster Entwurf":"Next project"} onClick={()=>change(1)} className="grid size-12 place-items-center rounded-full border border-line-strong bg-bg-raised hover:border-accent"><ArrowRight size={21} aria-hidden/></button>
            </div>
            <p className="font-mono text-sm tabular text-fg-muted"><strong className="text-2xl text-fg">{String(idx+1).padStart(3,"0")}</strong> / {String(list.length).padStart(3,"0")}</p>
          </div>
          <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-line" role="progressbar" aria-label={de?"Fortschritt":"Progress"} aria-valuemin={1} aria-valuemax={list.length} aria-valuenow={idx+1}><div className="h-full bg-accent transition-[width] duration-500" style={{width:((idx+1)/list.length*100)+"%"}}/></div>
          <p className="mt-3 text-xs text-fg-muted">{de?"Mit Mausrad, Touchpad, Wischen oder Pfeiltasten stöbern · Fokuskarte zum Öffnen anklicken.":"Browse with mouse wheel, trackpad, swipe or arrow keys · Click focus card to open."}</p>
        </div>
      </>}
  </div>;
}
