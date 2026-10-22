"use client";

import { useLocale } from "next-intl";
import { pick } from "@/i18n/locales";
import { Gauge, Leaf, Sparkle } from "@phosphor-icons/react";
import { setPerformancePreference, useLiteMode, usePerformancePreference, type PerformancePreference } from "@/lib/performance";

export function PerformanceSwitcher(){
  const locale=useLocale();
  const L=(o:{de:string;en:string}&Partial<Record<string,string>>)=>pick(o,locale);
  const selected=usePerformancePreference();
  const lite=useLiteMode();
  const choices:{value:PerformancePreference;de:string;en:string;fr:string;es:string;it:string;nl:string}[]=[
    {value:"auto",de:"Automatisch",en:"Auto",fr:"Automatique",es:"Automático",it:"Automatica",nl:"Automatisch"},
    {value:"lite",de:"Schonend",en:"Lite",fr:"Économe",es:"Ligero",it:"Leggera",nl:"Licht"},
    {value:"full",de:"Volle Effekte",en:"Full effects",fr:"Effets complets",es:"Efectos completos",it:"Effetti completi",nl:"Volle effecten"},
  ];
  return <div className="mt-6 rounded-2xl border border-white/15 bg-white/[.025] p-4" aria-label={L({de:"Animationsleistung",en:"Motion performance",fr:"Performance des animations",es:"Rendimiento de las animaciones",it:"Prestazioni delle animazioni",nl:"Animatieprestaties"})}>
    <div className="flex items-center gap-2 text-sm font-semibold"><Gauge size={18} className="text-accent" aria-hidden="true"/>{L({de:"Animationsmodus",en:"Motion mode",fr:"Mode d’animation",es:"Modo de animación",it:"Modalità animazioni",nl:"Animatiemodus"})}</div>
    <p className="mt-2 text-xs leading-relaxed text-fg-muted">{L({de:"Automatisch schont iPhones und kleine Touch-Geräte. Wähle alternativ weniger Animation oder die volle Darstellung.",en:"Auto saves resources on iPhones and small touch devices. Choose a lighter or full experience if preferred.",fr:"Le mode automatique ménage les iPhone et les petits appareils tactiles. Vous pouvez aussi choisir moins d’animation ou l’affichage complet.",es:"El modo automático ahorra recursos en iPhone y en dispositivos táctiles pequeños. También puede elegir menos animación o la vista completa.",it:"La modalità automatica risparmia risorse su iPhone e piccoli dispositivi touch. In alternativa puoi scegliere meno animazioni o la visualizzazione completa.",nl:"Automatisch spaart iPhones en kleine touchapparaten. Kies anders minder animatie of de volledige weergave."})}</p>
    <div role="group" aria-label={L({de:"Animationsmodus wählen",en:"Choose motion mode",fr:"Choisir le mode d’animation",es:"Elegir el modo de animación",it:"Scegli la modalità animazioni",nl:"Animatiemodus kiezen"})} className="mt-4 flex flex-wrap gap-2">
      {choices.map(choice=><button key={choice.value} type="button" aria-pressed={selected===choice.value} onClick={()=>setPerformancePreference(choice.value)}
        className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-fg-muted transition-colors hover:border-accent hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">
        {L(choice)}
      </button>)}
    </div>
    <p className="mt-3 inline-flex items-center gap-2 text-xs text-fg-subtle" aria-live="polite">
      {lite?<Leaf size={15} className="text-accent" aria-hidden="true"/>:<Sparkle size={15} className="text-accent" aria-hidden="true"/>}
      {lite?L({de:"Aktiv: energiesparende Darstellung",en:"Active: reduced graphics",fr:"Actif : affichage économe",es:"Activo: vista de bajo consumo",it:"Attiva: visualizzazione a basso consumo",nl:"Actief: energiezuinige weergave"}):L({de:"Aktiv: volle Darstellung",en:"Active: full graphics",fr:"Actif : affichage complet",es:"Activo: vista completa",it:"Attiva: visualizzazione completa",nl:"Actief: volledige weergave"})}
    </p>
  </div>;
}
