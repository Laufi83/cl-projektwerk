"use client";
/**
 * Lichtreflex über Pillen-Buttons und Karten (AmbientGlareShader), nur mit voller Darstellung:
 * nicht bei reduzierter Bewegung, im Schonmodus (iPhone-Automatik) oder vor der Hydrierung.
 * Das Elternelement braucht `relative overflow-hidden` und denselben Eckenradius wie `radius`.
 */
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/useMedia";
import { useLiteMode } from "@/lib/performance";

const Shader = dynamic(() => import("./ambient-glare-shader"), { ssr: false });
const noop = () => () => {};

export function Glare({ radius = Infinity, className = "", direction }: { radius?: number; className?: string; direction?: "rtl" | "ltr" }) {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const reduce = useReducedMotion();
  const lite = useLiteMode();
  if (!hydrated || reduce || lite) return null;
  return <Shader radius={radius} direction={direction} className={`absolute inset-0 mix-blend-screen ${className}`} />;
}
