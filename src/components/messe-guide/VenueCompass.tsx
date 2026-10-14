"use client";
/** Messebau-Kompass auf der Standort-Detailseite: Wechsel des Geländes führt zur Detailseite des anderen Standorts. */
import { useRouter } from "@/i18n/navigation";
import { MesseBuilderGuide } from "@/components/sections/MesseBuilderGuide";
import { venueByLegacyIndex } from "@/lib/messebau/venues";

export function VenueCompass({ index }: { index: number }) {
  const router = useRouter();
  return (
    <MesseBuilderGuide
      venueNumber={index}
      onPickVenue={(n) => {
        const v = venueByLegacyIndex(n);
        if (v) router.push({ pathname: "/messen/[slug]", params: { slug: v.slug } }, { scroll: false });
      }}
    />
  );
}
