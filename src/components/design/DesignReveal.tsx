"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowsLeftRight, Ruler, Image as ImageIcon } from "@phosphor-icons/react";
import type { Design, ImageInfo } from "@/lib/design-types";
import { DesignImage } from "./DesignImage";

/** Comparison of existing real plan files with the first genuine project rendering.
 * The two perspectives are intentionally NOT geometrically registered. */
export function DesignReveal({ design }: { design: Design }) {
  const de = useLocale() === "de";
  const plans = [design.floorplan, design.elevation].filter((p): p is ImageInfo => !!p && !p.placeholder);
  const [planIndex, setPlanIndex] = useState(0);
  const [split, setSplit] = useState(50);
  if (!plans.length || !design.renderings.length || design.renderings[0].placeholder) return null;
  const plan = plans[Math.min(planIndex, plans.length - 1)];
  return (
    <section className="mt-14" aria-labelledby={"reveal-"+design.id}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CL / DESIGN TO REALITY</p>
          <h2 id={"reveal-"+design.id} className="font-display mt-3 text-3xl font-semibold md:text-5xl">
            {de ? "Von der Planung zur Vision." : "From plans to vision."}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
            {de ? "Vergleiche die vorhandenen technischen Projektunterlagen mit der Visualisierung." : "Compare the project's available technical drawings with the rendering."}
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label={de?"Planansicht wählen":"Choose drawing"}>
          {plans.map((p,i) => <button key={p.base} type="button" aria-pressed={i===planIndex} onClick={()=>setPlanIndex(i)}
            className="rounded-full border border-line-strong px-4 py-2 text-xs font-semibold transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast">
            {p.label[de?"de":"en"]}
          </button>)}
        </div>
      </div>
      <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-line-strong bg-bg-raised">
        <div className="absolute inset-0">
          <DesignImage id={design.id} img={design.renderings[0]} alt={design.title+" – Rendering"}
            sizes="(min-width:1024px) 1200px, 100vw" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-white" style={{clipPath:"inset(0 "+(100-split)+"% 0 0)"}} aria-hidden="true">
          <DesignImage id={design.id} img={plan} alt="" sizes="(min-width:1024px) 1200px, 100vw" className="h-full w-full object-contain" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 z-10 w-0 border-l-2 border-white drop-shadow-[0_0_8px_#fff]" style={{left:split+"%"}} aria-hidden="true">
          <span className="absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-fg text-bg shadow-xl"><ArrowsLeftRight size={21}/></span>
        </div>
        <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
          <Ruler size={15} aria-hidden="true"/> {de?"Planung":"Drawing"}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
          <ImageIcon size={15} aria-hidden="true"/> Rendering
        </span>
      </div>
      <label className="mt-4 flex items-center gap-4">
        <span className="shrink-0 text-xs font-semibold text-fg-muted">{de?"Planung":"Plan"}</span>
        <input type="range" min={0} max={100} value={split} onChange={e=>setSplit(Number(e.target.value))}
          aria-label={de?"Planungszeichnung und Rendering vergleichen":"Compare drawing and rendering"} className="min-w-0 flex-1 accent-accent"/>
        <output className="w-10 text-right font-mono text-xs tabular text-accent">{split}%</output>
      </label>
      <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
        {de ? "Hinweis: Grundriss bzw. Höhenansicht und Rendering zeigen unterschiedliche Perspektiven. Der Vergleich ist illustrativ, keine maßgenaue Überlagerung." : "Note: Technical drawings and renders are different viewpoints. The comparison illustrates the concept; they are not spatially aligned."}
      </p>
    </section>
  );
}
