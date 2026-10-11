"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Phone, WhatsappLogo, EnvelopeSimple, Check } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { site, isPlaceholder } from "@/config/site";
import { EMAIL_DRAFT_MODE, type EmailDraft } from "@/lib/email-draft";
import { EmailDraftPanel } from "./EmailDraftPanel";

/** WhatsApp, Rückruf und direkter Kontakt neben dem Formular. */
export function ContactAside() {
  const t = useTranslations("contact");
  const tf = useTranslations("contact.fields");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  const waReady = !isPlaceholder(site.whatsapp);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!fd.get("consent")) { setError(t("errors.consent")); return; }
    if (String(fd.get("phone") ?? "").trim().length < 5 || String(fd.get("name") ?? "").trim().length < 2) { setError(t("errors.required")); return; }
    setError(""); setDraft(null);
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "callback", name: fd.get("name"), phone: fd.get("phone"), time: fd.get("time"), consent: true, website: fd.get("website") ?? "", startedAt: startedAt.current, locale }),
    }).catch(() => null);
    const result = await res?.json().catch(() => null);
    if (res?.ok && result?.delivery === "draft" && result.draft) setDraft(result.draft);
    else if (res?.ok && !EMAIL_DRAFT_MODE) setDone(true);
    else setError(res?.status === 429 ? t("errors.rate") : t("errors.server", { email: site.email }));
  };

  const field = "w-full rounded-xl border border-line bg-white/[0.04] px-4 py-3 text-base placeholder:text-fg-subtle focus:border-accent focus:outline-none";

  return (
    <aside className="grid content-start gap-3">
      <a
        href={waReady ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}` : undefined}
        aria-disabled={!waReady}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-4 rounded-2xl border border-line bg-bg-raised p-5 transition-colors duration-500 ease-fluid ${waReady ? "hover:border-accent" : "cursor-not-allowed opacity-70"}`}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#25d366]/15 text-[#25d366]"><WhatsappLogo size={22} weight="fill" /></span>
        <span>
          <span className="block font-semibold">{t("whatsapp")}</span>
          <span className={`block text-sm ${waReady ? "text-fg-muted" : "ph w-max"}`}>{waReady ? site.whatsapp : site.whatsapp}</span>
        </span>
      </a>

      <div className="rounded-2xl border border-line bg-bg-raised p-5">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-4 text-left">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Phone size={22} weight="fill" /></span>
          <span className="font-semibold">{t("callback")}</span>
        </button>
        {open && (done ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-ok" role="status"><Check size={16} /> {t("callbackDone")}</p>
        ) : (
          <form onSubmit={submit} onChange={() => setDraft(null)} className="mt-4 grid gap-3" noValidate>
            <input name="name" aria-label={tf("name")} placeholder={tf("name")} autoComplete="name" className={field} required />
            <input name="phone" type="tel" aria-label={tf("phone").replace(/ \(.*\)/, "")} placeholder={tf("phone").replace(/ \(.*\)/, "")} autoComplete="tel" className={field} required />
            <input name="time" aria-label={t("callbackTime")} placeholder={t("callbackTimePlaceholder")} className={field} />
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0" />
            <label className="flex items-start gap-3 text-xs text-fg-muted">
              <input name="consent" type="checkbox" className="mt-0.5 size-4 accent-[var(--accent)]" />
              <span>{tf.rich("consent", { privacy: (c) => <Link href="/datenschutz" className="underline decoration-accent underline-offset-4">{c}</Link> })}</span>
            </label>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            {EMAIL_DRAFT_MODE && <p className="text-xs text-fg-muted">{t("emailDraft.notice")}</p>}
            <button type="submit" className="rounded-full bg-fg px-4 py-3 text-base font-semibold text-bg active:scale-[0.98]">{EMAIL_DRAFT_MODE ? t("emailDraft.prepare") : t("callbackSubmit")}</button>
            {draft && <EmailDraftPanel draft={draft} />}
          </form>
        ))}
      </div>

      <div className="rounded-2xl border border-line p-5 text-sm">
        <p className="eyebrow">{t("direct")}</p>
        <p className="mt-3 flex items-center gap-2"><EnvelopeSimple size={16} className="text-accent" /> {isPlaceholder(site.email) ? <span className="ph">{site.email}</span> : <a href={`mailto:${site.email}`} className="underline underline-offset-4">{site.email}</a>}</p>
        <p className="mt-2 flex items-center gap-2"><Phone size={16} className="text-accent" /> {isPlaceholder(site.phone) ? <span className="ph">{site.phone}</span> : <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>}</p>
        <p className="mt-2 text-fg-muted"><span className={isPlaceholder(site.address) ? "ph" : ""}>{site.address}</span></p>
      </div>
    </aside>
  );
}
