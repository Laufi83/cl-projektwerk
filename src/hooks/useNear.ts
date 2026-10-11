"use client";
import { useEffect, useState, type RefObject } from "react";

/**
 * true, sobald das Element in die Nähe des sichtbaren Bereichs kommt (Standard: eine Bildschirmhöhe vorher),
 * und bleibt danach true. Für verzögertes Laden von Videos und Vorschaubildern.
 */
export function useNear(ref: RefObject<Element | null>, rootMargin = "100% 0px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setNear(true); io.disconnect(); }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, near]);
  return near;
}
