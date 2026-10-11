"use client";

// Beispielintegration für die vorhandene CL-Projektwerk-Galerie.
// Die echten Entwurfsdaten kommen aus content/designs.json über die Gallery.
import { Component } from "@/components/ui/image-auto-slider";
import type { GalleryItem } from "@/components/gallery/types";

export function DemoOne({ items, onOpen }: {
  items: GalleryItem[];
  onOpen: (slug: string, image: HTMLElement | null) => void;
}) {
  return <Component items={items} onOpen={onOpen} />;
}
