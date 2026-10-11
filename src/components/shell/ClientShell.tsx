"use client";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { SmoothScroll } from "./SmoothScroll";
import { RevealObserver } from "./RevealObserver";
import { DesignOverlayProvider } from "@/components/overlay/DesignOverlay";
import { useFinePointer, useReducedMotion } from "@/hooks/useMedia";
import { PerformanceModeSync, useLiteMode } from "@/lib/performance";

const MeshCursor = dynamic(() => import("@/components/cursor/MeshCursor"), { ssr: false });

export function ClientShell({ children }: { children: ReactNode }) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const lite = useLiteMode();
  return (
    <DesignOverlayProvider>
      <PerformanceModeSync />
      <SmoothScroll />
      <RevealObserver />
      {fine && !reduced && !lite ? <MeshCursor /> : <StaticGrid />}
      {children}
    </DesignOverlayProvider>
  );
}

/** Ruhiges Raster ohne Effekt (Touch, reduzierte Bewegung). */
function StaticGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.035) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 75%)",
      }}
    />
  );
}
