"use client";
import { useTranslations } from "next-intl";
import { Heart } from "@phosphor-icons/react";
import { favorites, useFavorites } from "@/lib/favorites";

export function FavoriteButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const t = useTranslations("detail");
  const on = useFavorites().includes(id);
  return (
    <button
      type="button"
      onClick={() => favorites.toggle(id)}
      aria-pressed={on}
      aria-label={compact ? (on ? t("favorited") : t("favorite")) : undefined}
      className={`inline-flex items-center gap-2 rounded-full border text-sm font-semibold transition-all duration-500 ease-fluid active:scale-[0.98] ${on ? "border-accent bg-accent-soft text-fg" : "border-line-strong hover:border-accent"} ${compact ? "size-10 justify-center" : "px-4 py-2"}`}
    >
      <Heart size={16} weight={on ? "fill" : "regular"} className={`shrink-0 ${on ? "text-accent" : ""}`} />
      {!compact && (on ? t("favorited") : t("favorite"))}
    </button>
  );
}
