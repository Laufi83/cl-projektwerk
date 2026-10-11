"use client";
import { useEffect, useRef, type VideoHTMLAttributes } from "react";
import { useNear } from "@/hooks/useNear";

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  /** Anteil, ab dem das Video als sichtbar gilt */
  threshold?: number;
  /** Download-Knopf, Bild-im-Bild und Kontextmenü ausblenden (Urheberrechtshinweis) */
  protect?: boolean;
};

/**
 * Video, das nur im sichtbaren Bereich läuft. Quelle und Vorschaubild werden erst geladen,
 * wenn das Video in die Nähe kommt (nicht schon beim Seitenstart).
 * Pausiert jemand selbst (Steuerleiste), startet es beim erneuten Hineinscrollen nicht wieder von allein.
 * Reduzierte Bewegung: kein Autoplay, Poster bleibt stehen.
 */
export function InViewVideo({ threshold = 0.35, protect = false, src, poster, preload, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const near = useNear(ref);

  useEffect(() => {
    const v = ref.current;
    if (!v || !near || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let selfPause = false, userPaused = false;
    const onPause = () => { if (selfPause) { selfPause = false; return; } if (!v.ended) userPaused = true; };
    const onPlay = () => { userPaused = false; };
    v.addEventListener("pause", onPause);
    v.addEventListener("play", onPlay);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!userPaused) v.play().catch(() => {}); }
      else if (!v.paused) { selfPause = true; v.pause(); }
    }, { threshold });
    io.observe(v);
    return () => { io.disconnect(); v.removeEventListener("pause", onPause); v.removeEventListener("play", onPlay); };
  }, [threshold, near]);

  return (
    <video
      ref={ref}
      {...rest}
      src={near ? src : undefined}
      poster={near ? poster : undefined}
      preload={near ? preload : "none"}
      {...(protect
        ? { controlsList: "nodownload noplaybackrate", disablePictureInPicture: true, onContextMenu: (e: React.MouseEvent) => e.preventDefault() }
        : {})}
    />
  );
}
