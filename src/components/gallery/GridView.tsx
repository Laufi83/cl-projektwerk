"use client";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Play } from "@phosphor-icons/react";
import { pad3, type GalleryItem } from "./types";
import { favorites, useFavorites } from "@/lib/favorites";
import { MEDIA_BASE as base } from "@/lib/media";
import { localePrefix } from "@/i18n/locales";

export function GridView({ items, onOpen }: { items: GalleryItem[]; onOpen: (slug: string, el: HTMLElement | null) => void }) {
  const t = useTranslations("gallery");
  const tc = useTranslations("common");
  const favs = useFavorites();
  const prefix = localePrefix(useLocale());
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((d, i) => (
        <li key={d.slug} data-grid-card={d.slug} className="group relative" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 4) * 60}ms` }}>
          <a
            href={`${prefix}/designs/${d.slug}`}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              onOpen(d.slug, e.currentTarget.querySelector("img"));
            }}
            data-cursor-label={tc("open")}
            className="block overflow-hidden rounded-2xl bg-bg-raised"
          >
            <div className="relative aspect-[16/9] overflow-hidden" style={{ background: d.tone }}>
              <picture>
                <source type="image/avif" srcSet={`${base}/designs/${d.id}/render-1-640.avif 640w, ${base}/designs/${d.id}/render-1-1280.avif 1280w`} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                <img
                  src={`${base}/designs/${d.id}/render-1-640.webp`}
                  srcSet={`${base}/designs/${d.id}/render-1-640.webp 640w, ${base}/designs/${d.id}/render-1-1280.webp 1280w`}
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  alt={`${pad3(d.n)} ${d.title}`}
                  width={640}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-fluid group-hover:scale-[1.04]"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-80 transition-opacity duration-700 ease-fluid group-hover:opacity-100" />
              {d.clip && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-accent-contrast">
                  <Play size={10} weight="fill" /> {t("filter.clip")}
                </span>
              )}
              <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                <div>
                  <p className="tabular text-xs font-semibold text-accent">{pad3(d.n)}</p>
                  <p className="font-display text-lg font-semibold leading-tight xl:text-xl">{d.title}</p>
                </div>
                {d.size && <p className="tabular text-xs text-fg-muted">{d.size}</p>}
              </div>
            </div>
          </a>
          <button
            type="button"
            onClick={() => favorites.toggle(d.id)}
            aria-pressed={favs.includes(d.id)}
            aria-label={`${d.title}: ${favs.includes(d.id) ? "♥" : "♡"}`}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/40 backdrop-blur transition-colors duration-500 ease-fluid hover:bg-black/60 aria-pressed:text-accent"
          >
            <Heart size={16} weight={favs.includes(d.id) ? "fill" : "regular"} />
          </button>
        </li>
      ))}
    </ul>
  );
}
