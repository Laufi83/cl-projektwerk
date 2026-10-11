"use client";
import { useTranslations } from "next-intl";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { favorites, useFavorites } from "@/lib/favorites";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";
import type { GalleryItem } from "@/components/gallery/types";
import { designAsset } from "@/lib/media";

/** „Meine Auswahl“ – Moodboard der Favoriten, Anfrage per Klick. */
export function SelectionBoard({ items }: { items: GalleryItem[] }) {
  const t = useTranslations("selection");
  const overlay = useDesignOverlay();
  const favs = useFavorites();
  const list = favs.map((id) => items.find((d) => d.id === id)).filter(Boolean) as GalleryItem[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg text-fg-muted" aria-live="polite">{t("count", { count: list.length })}</p>
        {list.length > 0 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => favorites.clear()} className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:border-danger hover:text-danger">{t("clear")}</button>
            <Link href="/anfrage" data-magnetic className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast">{t("inquire")} <ArrowUpRight size={16} /></Link>
          </div>
        )}
      </div>
      {list.length === 0 ? (
        <div className="mt-10 grid place-items-center gap-4 rounded-3xl border border-dashed border-line-strong px-6 py-24 text-center">
          <p className="max-w-md text-fg-muted">{t("empty")}</p>
          <Link href={{ pathname: "/", hash: "designs" }} className="rounded-full bg-fg px-5 py-3 text-base font-semibold text-bg">{t("toGallery")}</Link>
        </div>
      ) : (
        <ul className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
          {list.map((d, i) => (
            <li key={d.id} className="group relative break-inside-avoid overflow-hidden rounded-2xl" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 3) * 80}ms` }}>
              <button
                type="button"
                onClick={(e) => overlay.open(d.slug, { rect: e.currentTarget.querySelector("img")?.getBoundingClientRect(), image: designAsset(d.id, "render-1-640.webp"), tone: d.tone, getReturnRect: () => e.currentTarget?.querySelector("img")?.getBoundingClientRect() ?? null })}
                className="block w-full text-left"
              >
                <img src={designAsset(d.id, `render-${(i % 3) + 1}-1280.webp`)} alt={`${String(d.n).padStart(3, "0")} ${d.title}`} loading="lazy" decoding="async" className={`w-full object-cover transition-transform duration-[1200ms] ease-fluid group-hover:scale-[1.03] ${i % 3 === 1 ? "aspect-[4/5]" : "aspect-[16/10]"}`} style={{ background: d.tone }} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                  <p className="tabular text-xs font-semibold text-accent">{String(d.n).padStart(3, "0")}</p>
                  <p className="font-semibold">{d.title}</p>
                  {d.size && <p className="tabular text-xs text-fg-muted">{d.size}</p>}
                </div>
              </button>
              <button type="button" onClick={() => favorites.remove(d.id)} aria-label={`${t("remove")}: ${d.title}`} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70"><X size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
