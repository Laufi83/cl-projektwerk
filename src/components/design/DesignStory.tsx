"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Blueprint, Image as ImageIcon, Ruler } from "@phosphor-icons/react";
import { DesignImage } from "./DesignImage";
import type { Design, ImageInfo } from "@/lib/design-types";
import { contentLocale, pick } from "@/i18n/locales";

type Step = 0 | 1 | 2;
export function DesignStory({ design: d }: { design: Design }) {
  const lang = contentLocale(useLocale());
  const ui = useLocale();
  const L = (o: { de: string; en: string } & Partial<Record<string, string>>) => pick(o, ui);
  const [active,setActive] = useState<Step>(0);
  const plan = [d.floorplan,d.elevation,...d.extraPlans].find(p=>p&&!p.placeholder) ?? null;
  const image = d.renderings[0];
  const final = d.renderings.find((r,i)=>i>0&&!r.placeholder) ?? image;
  if (!image) return null;
  const specs = [
    d.size ? L({de:"Standfläche: ",en:"Stand area: ",fr:"Surface du stand : ",es:"Superficie del stand: ",it:"Superficie dello stand: ",nl:"Standoppervlakte: "})+d.size.width+" × "+d.size.depth+" m ("+d.size.area+" m²)" : null,
    d.floors ? L({de:"Geschosse: ",en:"Levels: ",fr:"Niveaux : ",es:"Plantas: ",it:"Piani: ",nl:"Verdiepingen: "})+d.floors : null,
    d.materials?.[lang] ? L({de:"Materialien: ",en:"Materials: ",fr:"Matériaux : ",es:"Materiales: ",it:"Materiali: ",nl:"Materialen: "})+d.materials[lang] : null,
  ].filter(Boolean);
  const labels = pick({ de: ["Ausgangslage","Entwurf","Visualisiertes Ergebnis"], en: ["Project brief","Design","Visualised result"], fr: ["Point de départ","Conception","Résultat visualisé"], es: ["Punto de partida","Diseño","Resultado visualizado"], it: ["Situazione di partenza","Progetto","Risultato visualizzato"], nl: ["Uitgangssituatie","Ontwerp","Gevisualiseerd resultaat"] }, ui);
  const body = [
    d.description[lang] || d.description.de,
    plan
      ? L({de:"Die vorhandene Planzeichnung zeigt die räumliche Anordnung und den konstruktiven Entwurfsstand.",en:"The existing technical drawing shows the layout and planned spatial arrangement.",fr:"Le plan existant montre l’agencement et la disposition spatiale prévue.",es:"El plano existente muestra la distribución y la disposición espacial prevista.",it:"La tavola esistente mostra la disposizione e l’organizzazione spaziale prevista.",nl:"De bestaande tekening toont de indeling en de geplande ruimtelijke opbouw."})
      : L({de:"Die Perspektivansicht vermittelt das räumliche Konzept. Für dieses Projekt ist kein eigener Plan hinterlegt.",en:"The perspective view illustrates the spatial concept. No separate drawing is available for this design.",fr:"La vue en perspective illustre le concept spatial. Aucun plan distinct n’est disponible pour ce projet.",es:"La vista en perspectiva muestra el concepto espacial. Para este diseño no hay un plano propio.",it:"La vista prospettica illustra il concetto spaziale. Per questo progetto non è disponibile una tavola separata.",nl:"Het perspectief laat het ruimtelijke concept zien. Voor dit ontwerp is geen aparte tekening beschikbaar."}),L({de:"Das Ergebnis dieser Präsentation ist die dokumentierte Entwurfsvisualisierung, keine Behauptung über eine tatsächlich ausgeführte Realisierung.",en:"This stage shows the documented design visualisation; it does not claim that the project was built.",fr:"Cette étape montre la visualisation documentée du projet ; elle n’affirme pas que le stand a été réalisé.",es:"Esta etapa muestra la visualización documentada del diseño; no afirma que el proyecto se haya construido.",it:"Questa fase mostra la visualizzazione documentata del progetto; non afferma che sia stato realizzato.",nl:"Deze stap toont de gedocumenteerde ontwerpvisualisatie; er wordt niet beweerd dat het project is gebouwd."}),
  ];
  const selectedImage:ImageInfo = active===1&&plan ? plan : active===2 ? final : image;
  return <section className="mt-16" aria-labelledby={"story-"+d.id}>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">CL / PROJECT STORY</p>
        <h2 id={"story-"+d.id} className="font-display mt-3 text-3xl font-semibold md:text-5xl">{L({de:"Von der Idee zur Gestaltung.",en:"From brief to design.",fr:"De l’idée à la conception.",es:"De la idea al diseño.",it:"Dall’idea al progetto.",nl:"Van idee tot ontwerp."})}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">{L({de:"Eine Geschichte in drei Schritten – mit vorhandenen Projektdaten und echten Entwurfsbildern.",en:"A three-stage story using the available project facts and original design imagery.",fr:"Une histoire en trois étapes – avec les données disponibles et les images originales du projet.",es:"Una historia en tres pasos, con los datos disponibles y las imágenes originales del diseño.",it:"Una storia in tre passi, con i dati disponibili e le immagini originali del progetto.",nl:"Een verhaal in drie stappen – met de beschikbare projectgegevens en de originele ontwerpbeelden."})}</p>
      </div>
      <span className="font-mono text-sm tabular text-fg-muted"><strong className="text-xl text-accent">0{active+1}</strong> / 03</span>
    </div>
    <div role="tablist" aria-label={L({de:"Projektgeschichte",en:"Project story",fr:"Histoire du projet",es:"Historia del proyecto",it:"Storia del progetto",nl:"Projectverhaal"})} className="no-scrollbar mt-6 grid grid-cols-3 gap-2 overflow-x-auto">
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
          <span className="vis-note absolute left-4 top-4">{L({de:"Visualisierung / Projektunterlage",en:"Visualisation / design document",fr:"Visualisation / document de projet",es:"Visualización / documento del proyecto",it:"Visualizzazione / documento di progetto",nl:"Visualisatie / ontwerpdocument"})}</span>
        </div>
        <div className="flex flex-col p-6 md:p-9">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-accent">
            {active===1?<Blueprint size={19} aria-hidden="true"/>:active===2?<ImageIcon size={19} aria-hidden="true"/>:<Ruler size={19} aria-hidden="true"/>}
            {L({de:"Kapitel ",en:"Chapter ",fr:"Chapitre ",es:"Capítulo ",it:"Capitolo ",nl:"Hoofdstuk "})}{active+1}
          </div>
          <h3 className="font-display mt-5 text-3xl font-semibold leading-tight md:text-4xl">{labels[active]}</h3>
          <p className="mt-5 max-w-[60ch] text-sm leading-relaxed text-fg-muted md:text-base">{body[active]}</p>
          {active===0 && specs.length>0 && <ul className="mt-5 grid gap-2 border-t border-line pt-5 text-xs text-fg-muted">
            {specs.map(s=><li key={s}>{s}</li>)}
          </ul>}
          {active===1 && <p className="mt-5 text-xs text-fg-subtle">{plan?L({de:"Planausschnitt aus den vorhandenen Projektunterlagen.",en:"Drawing from existing project documentation.",fr:"Extrait de plan issu de la documentation du projet.",es:"Extracto de plano de la documentación del proyecto.",it:"Estratto di tavola dalla documentazione di progetto.",nl:"Tekeningfragment uit de projectdocumentatie."}):L({de:"Kein Plan vorhanden – Originalrendering als Ersatz.",en:"No drawing available; original rendering shown instead.",fr:"Aucun plan disponible – le rendu original est affiché à la place.",es:"No hay plano disponible; se muestra el render original.",it:"Nessuna tavola disponibile: al suo posto il rendering originale.",nl:"Geen tekening beschikbaar – in plaats daarvan het originele beeld."})}</p>}
          {active===2 && <p className="mt-5 text-xs text-fg-subtle">{L({de:"Keine Aussage über Bauausführung, Projektabschluss oder Kundenerfolg.",en:"No claim about actual construction, completion or client outcomes.",fr:"Aucune affirmation sur une réalisation, un achèvement ou un résultat client.",es:"Sin afirmaciones sobre construcción real, finalización o resultados para clientes.",it:"Nessuna affermazione su realizzazione, completamento o risultati per il cliente.",nl:"Geen uitspraak over daadwerkelijke bouw, oplevering of klantresultaten."})}</p>}
          <div className="mt-auto flex justify-between gap-4 border-t border-line pt-5">
            <span className="font-mono text-xs text-fg-subtle">{String(d.number).padStart(3,"0")} / {d.title}</span>
            <button type="button" onClick={()=>setActive(((active+1)%3) as Step)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">
              {active===2?L({de:"Neu starten",en:"Restart",fr:"Recommencer",es:"Volver a empezar",it:"Ricomincia",nl:"Opnieuw"}):L({de:"Weiter",en:"Next",fr:"Suivant",es:"Siguiente",it:"Avanti",nl:"Verder"})} <ArrowRight size={17} aria-hidden="true"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
