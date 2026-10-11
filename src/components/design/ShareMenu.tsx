"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ShareNetwork, WhatsappLogo, LinkedinLogo, LinkSimple, Check } from "@phosphor-icons/react";

export function ShareMenu({ url, title }: { url: string; title: string }) {
  const t = useTranslations("detail");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("pointerdown", close);
    ref.current?.addEventListener("keydown", esc);
    const el = ref.current;
    return () => { document.removeEventListener("pointerdown", close); el?.removeEventListener("keydown", esc); };
  }, [open]);

  const abs = typeof window !== "undefined" ? new URL(url, location.origin).toString() : url;
  const share = async () => {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ title, url: abs }); return; } catch { /* abgebrochen */ }
    }
    setOpen((o) => !o);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(abs); } catch {
      const ta = document.createElement("textarea"); ta.value = abs; document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={share} aria-expanded={open} className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold transition-colors duration-500 ease-fluid hover:border-accent">
        <ShareNetwork size={16} /> {t("share")}
      </button>
      {open && (
        <ul className="glass absolute right-0 top-full z-20 mt-2 grid w-60 gap-1 rounded-2xl p-2 text-sm shadow-2xl">
          <li>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${abs}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
              <WhatsappLogo size={18} /> {t("shareWhatsapp")}
            </a>
          </li>
          <li>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(abs)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
              <LinkedinLogo size={18} /> {t("shareLinkedin")}
            </a>
          </li>
          <li>
            <button type="button" onClick={copy} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/5">
              {copied ? <Check size={18} className="text-ok" /> : <LinkSimple size={18} />} {copied ? t("copied") : t("copyLink")}
            </button>
          </li>
        </ul>
      )}
      <span className="sr-only" aria-live="polite">{copied ? t("copied") : ""}</span>
    </div>
  );
}
