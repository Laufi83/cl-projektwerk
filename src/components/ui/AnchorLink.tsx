"use client";
import type { AnchorHTMLAttributes } from "react";
import { scrollToTarget } from "@/lib/scroll";

/** Sprungmarke auf der Startseite mit weichem Scrollen (Lenis); ohne JavaScript ein normaler Anker. */
export function AnchorLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: `#${string}` }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        scrollToTarget(href, href === "#designs" ? 0 : -24);
        history.replaceState(history.state, "", href);
      }}
    >
      {children}
    </a>
  );
}
