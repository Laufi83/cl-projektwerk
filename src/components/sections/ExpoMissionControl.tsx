"use client";
import { useMemo } from "react";
import { useLocale } from "next-intl";
import { Compass, MapPin, NavigationArrow } from "@phosphor-icons/react";
import type { MesseVenue } from "@/config/messe-venues";
import { useReducedMotion } from "@/hooks/useMedia";
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
function distance(lat:number,lon:number){
  const p=Math.PI/180,a1=51.34*p,a2=lat*p,d1=(lat-51.34)*p,d2=(lon-12.37)*p;
  const h=Math.sin(d1/2)**2+Math.cos(a1)*Math.cos(a2)*Math.sin(d2/2)**2;
  return Math.round(6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)));
}
/** A stylised coordinate plot, not a street/venue map. Same verified-in-app source
 * venue profiles and selection state as the existing globe are reused. */
export function ExpoMissionControl({venues,selected,onSelect}:{venues:MesseVenue[];selected:MesseVenue;onSelect:(id:string)=>void}) {
  const de=useLocale()==="de",reduced=useReducedMotion();
  const marks=useMemo(()=>{
    const seen=new Set<string>(),chosen=[selected,...venues].filter(v=>{
      if(seen.has(v.id)||v.lat==null||v.lon==null)return false;
      seen.add(v.id);return true;
    }).slice(0,28);
    return chosen.map(v=>({v,x:clamp(((v.lon!+13)/78)*100,7,93),y:clamp(((72-v.lat!)/40)*100,9,91)}));
  },[venues,selected]);
  const km=selected.lat!=null&&selected.lon!=null?distance(selected.lat,selected.lon):null;
  return <div className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-line bg-[#0b1520] sm:min-h-[540px] lg:min-h-[680px]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(#84b6d526_1px,transparent_1px),linear-gradient(90deg,#84b6d526_1px,transparent_1px)] [background-size:42px_42px]"/>
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      {[82,61,41,20].map(size=><div key={size} className="absolute aspect-square rounded-full border border-[#7eabb546]" style={{width:size+"%"}} />)}
      <div className="absolute inset-x-0 top-1/2 h-px bg-[#80bac124]"/>
      <div className="absolute inset-y-0 left-1/2 w-px bg-[#80bac124]"/>
      {!reduced&&<div className="absolute aspect-square w-[82%] animate-[spin_19s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_285deg,rgba(247,119,43,0.14)_345deg,transparent_360deg)] motion-reduce:animate-none"/>}
    </div>
    <div className="absolute left-5 top-5 z-10 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#ffaf75]">
      <Compass size={18} aria-hidden="true"/> CL / EXPO MISSION CONTROL
    </div>
    <span className="pointer-events-none absolute right-5 top-6 z-10 text-[10px] font-mono uppercase tracking-widest text-white/50">CITY COORDINATES</span>
    <div aria-label={de?"Interaktive Messeort-Radardarstellung":"Interactive venue radar"} className="absolute inset-0">
      {marks.map(({v,x,y})=><button key={v.id} type="button" onClick={()=>onSelect(v.id)}
        style={{left:x+"%",top:y+"%"}} aria-label={(de?"Standort auswählen: ":"Select venue: ")+v.city+" – "+v.venue}
        aria-pressed={selected.id===v.id} title={v.city+" / "+v.venue}
        className="group absolute z-10 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-accent">
        <span className="absolute inset-0 rounded-full border border-[#ff9b59] bg-[#f4772e26] transition-transform group-hover:scale-[1.6] group-aria-pressed:scale-[1.65]"/>
        <span className="relative size-2.5 rounded-full bg-[#aac3cf] shadow-[0_0_12px_#a0dcee] group-hover:bg-[#ff9257] group-aria-pressed:bg-[#ff792d] group-aria-pressed:shadow-[0_0_16px_#f77]"/>
      </button>)}
    </div>
    <div className="pointer-events-none absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-4">
      <div className="rounded-xl border border-white/20 bg-[#0b1520]/85 px-4 py-3 backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#ffb184]">{de?"Aktiver Messeort":"Selected venue"}</p>
        <p className="mt-1 font-display text-xl font-semibold text-white">{selected.city}</p>
        <p className="mt-1 text-xs text-[#b4c0c9]">{selected.venue}</p>
      </div>
      {km!=null&&<div className="rounded-xl border border-white/20 bg-[#0b1520]/85 px-3 py-3 text-right backdrop-blur">
        <p className="text-[10px] uppercase text-[#9db0bf]">{de?"Luftlinie zu Leipzig":"Air distance to Leipzig"}</p>
        <p className="mt-1 font-mono text-lg font-semibold text-white">{km.toLocaleString(de?"de-DE":"en-GB")} km</p>
      </div>}
    </div>
    <p className="pointer-events-none absolute left-5 top-14 text-[10px] text-[#91a5b3]">{marks.length} {de?"anklickbare Standorte":"clickable locations"}</p>
  </div>;
}
