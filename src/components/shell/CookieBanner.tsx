"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

/**
 * Einwilligung: Die Seite setzt keine Tracking-Dienste ein. Kategorien sind vorbereitet
 * (Statistik, externe Medien) und bleiben aus, bis zugestimmt wird.
 * Lesen: `getConsent()` – z. B. vor dem Laden eines Analyse-Skripts.
 */
type Consent = { necessary: true; stats: boolean; media: boolean; at: string };
const KEY = "consent:v1";
const EVT = "consent-change";
const OPEN_EVT = "consent-open";

export function getConsent(): Consent | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}
function saveConsent(c: Omit<Consent, "necessary" | "at">) {
  try { localStorage.setItem(KEY, JSON.stringify({ necessary: true, ...c, at: new Date().toISOString() })); } catch {}
  window.dispatchEvent(new Event(EVT));
}
const useConsent = () =>
  useSyncExternalStore(
    (cb) => { window.addEventListener(EVT, cb); return () => window.removeEventListener(EVT, cb); },
    // Speicher kann gesperrt sein (Cookies blockiert): dann wie „noch nicht gewählt“
    () => { try { return localStorage.getItem(KEY); } catch { return null; } },
    () => "server",
  );

export function CookieBanner() {
  const t = useTranslations("cookies");
  const stored = useConsent();
  const [forced, setForced] = useState(false);
  const [detail, setDetail] = useState(false);
  const [stats, setStats] = useState(false);
  const [media, setMedia] = useState(false);

  useEffect(() => {
    const open = () => {
      const c = getConsent();
      setStats(!!c?.stats); setMedia(!!c?.media); setDetail(true); setForced(true);
    };
    window.addEventListener(OPEN_EVT, open);
    return () => window.removeEventListener(OPEN_EVT, open);
  }, []);

  const visible = forced || (stored !== "server" && !stored);
  if (!visible) return null;
  const done = (c: { stats: boolean; media: boolean }) => { saveConsent(c); setForced(false); setDetail(false); };

  return (
    <section
      role="dialog"
      aria-labelledby="consent-title"
      className="glass fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-3xl p-6 shadow-2xl md:bottom-6"
    >
      <h2 id="consent-title" className="text-base font-semibold">{t("title")}</h2>
      <p className="mt-2 text-sm text-fg-muted">{t("text")}</p>
      {detail && (
        <ul className="mt-4 grid gap-3 text-sm">
          <Row label={t("categories.necessary")} text={t("categories.necessaryText")} checked disabled />
          <Row label={t("categories.stats")} text={t("categories.statsText")} checked={stats} onChange={setStats} />
          <Row label={t("categories.media")} text={t("categories.mediaText")} checked={media} onChange={setMedia} />
        </ul>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => done({ stats: false, media: false })} className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:bg-white/5">
          {t("necessary")}
        </button>
        {detail ? (
          <button type="button" onClick={() => done({ stats, media })} className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:bg-white/5">
            {t("save")}
          </button>
        ) : (
          <button type="button" onClick={() => setDetail(true)} className="rounded-full px-4 py-2 text-sm font-semibold text-fg-muted hover:text-fg">
            {t("settings")}
          </button>
        )}
        <button type="button" onClick={() => done({ stats: true, media: true })} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast">
          {t("acceptAll")}
        </button>
      </div>
    </section>
  );
}

function Row({ label, text, checked, disabled, onChange }: { label: string; text: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <li>
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} className="mt-1 size-4 accent-[var(--accent)]" />
        <span><span className="font-semibold">{label}</span><span className="block text-fg-muted">{text}</span></span>
      </label>
    </li>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVT))} className="w-max text-left text-fg-muted hover:text-fg">
      {label}
    </button>
  );
}
