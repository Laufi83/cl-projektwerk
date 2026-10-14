"use client";
/**
 * Bild einer Leistungskarte als Link zum abgebildeten Entwurf: öffnet ihn im Entwurfs-Overlay (wie in der Galerie).
 * Die Seite bleibt dabei stehen; beim Schließen fliegt das Bild zurück in die Karte und man ist wieder an derselben Stelle.
 * Ohne JavaScript bzw. mit Strg/⌘-Klick: normale Entwurfsseite.
 */
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDesignOverlay } from "@/components/overlay/DesignOverlay";
import { localePrefix } from "@/i18n/locales";

export function ServiceDesignLink({ slug, image, tone, label, className, children }: { slug: string; image: string; tone?: string; label: string; className?: string; children: ReactNode }) {
  const overlay = useDesignOverlay();
  const tc = useTranslations("common");
  const prefix = localePrefix(useLocale());
  return (
    <a
      href={`${prefix}/designs/${slug}`}
      data-service-design={slug}
      aria-label={label}
      data-cursor-label={tc("open")}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        overlay.open(slug, {
          rect: e.currentTarget.querySelector("img")?.getBoundingClientRect(),
          image,
          tone,
          getReturnRect: (s) => document.querySelector<HTMLElement>(`[data-service-design="${s}"] img`)?.getBoundingClientRect() ?? null,
        });
      }}
      className={className}
    >
      {children}
    </a>
  );
}
