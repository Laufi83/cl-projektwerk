"use client";
import type { AnchorHTMLAttributes } from "react";
import { scrollToTarget } from "@/lib/scroll";

/** Name des Ereignisses, mit dem Leistungskarten eine Leistung im Anfrageformular vorauswählen */
export const PREFILL_EVENT = "inquiry:prefill";
/** Messe aus dem Messekalender: Name, Stadt und Termin übernehmen */
export type PrefillFair = { name: string; city: string; from: string; to: string };
export type PrefillConfiguration = { width: string; depth: string; style: string };
export type PrefillDetail = { service?: string; fair?: PrefillFair; configuration?: PrefillConfiguration };

/**
 * Sprung zum Anfrageformular (#kontakt) und – mit `service` – Vorauswahl der Leistung,
 * mit `fair` – Messe, Stadt und Termin vorausgefüllt.
 * Ohne JavaScript ein normaler Anker.
 */
export function InquireLink({ service, fair, configuration, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { service?: string; fair?: PrefillFair; configuration?: PrefillConfiguration }) {
  return (
    <a
      href="#kontakt"
      {...rest}
      onClick={(e) => {
        if (!document.getElementById("kontakt")) return;
        e.preventDefault();
        if (service || fair || configuration) window.dispatchEvent(new CustomEvent<PrefillDetail>(PREFILL_EVENT, { detail: { service, fair, configuration } }));
        scrollToTarget("#kontakt", -24);
        history.replaceState(history.state, "", "#kontakt");
      }}
    >
      {children}
    </a>
  );
}
