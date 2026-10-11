"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, X } from "@phosphor-icons/react";
import { Link, useRouter } from "@/i18n/navigation";
import { favorites, useFavorites } from "@/lib/favorites";
import { BUDGET_KEYS, DOCUMENT_KEYS, PROJECT_TYPES, SCOPE_KEYS, SERVICE_KEYS, STAND_TYPES } from "@/lib/inquiry-options";
import { site } from "@/config/site";
import { EMAIL_DRAFT_MODE, type EmailDraft } from "@/lib/email-draft";
import { EmailDraftPanel } from "./EmailDraftPanel";
import { designAsset } from "@/lib/media";
import { PREFILL_EVENT, type PrefillDetail } from "@/components/ui/InquireLink";

export type FavRef = { id: string; slug: string; n: number; title: string };
type Props = { items: FavRef[] };

const STEP_KEYS = ["fair", "stand", "services", "contact"] as const;
type Errors = Partial<Record<string, string>>;

const input =
  "w-full rounded-xl border border-line bg-white/[0.04] px-4 py-3 text-base text-fg placeholder:text-fg-subtle transition-colors duration-300 ease-fluid hover:border-line-strong focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

export function InquiryForm({ items }: Props) {
  const t = useTranslations("contact");
  const tf = useTranslations("contact.fields");
  const ts = useTranslations("services.items");
  const td = useTranslations("detail.standTypes");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const favs = useFavorites();
  const uid = useId();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  const panel = useRef<HTMLDivElement>(null);
  const [f, setF] = useState({
    fair: "", projectType: "open" as (typeof PROJECT_TYPES)[number], documents: [] as (typeof DOCUMENT_KEYS)[number][], scope: "open" as (typeof SCOPE_KEYS)[number], city: "", dateFrom: "", dateTo: "", dateUnknown: false,
    width: "", depth: "", standType: "open" as (typeof STAND_TYPES)[number], floors: "open" as "1" | "2" | "open",
    services: [] as (typeof SERVICE_KEYS)[number][], budget: "open" as (typeof BUDGET_KEYS)[number],
    name: "", company: "", email: "", phone: "", message: "", consent: false, website: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setDraft(null); setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  // Design aus „Anfrage zu diesem Design“ (?design=slug) automatisch merken – im Browser gelesen,
  // damit die Anfrageseite statisch bleiben kann
  useEffect(() => {
    const preselect = new URLSearchParams(location.search).get("design");
    const d = items.find((x) => x.slug === preselect);
    if (d && !favorites.has(d.id)) favorites.toggle(d.id);
  }, [items]);

  // Vorauswahl aus den Leistungskarten („Anfragen“) und dem Messekalender (Messe, Stadt, Termin)
  useEffect(() => {
    const onPrefill = (e: Event) => {
      setDraft(null);
      const d = (e as CustomEvent<PrefillDetail>).detail;
      if (d?.fair) {
        const { name, city, from, to } = d.fair;
        setF((s) => ({ ...s, fair: name, city, dateFrom: from, dateTo: to, dateUnknown: false }));
        setErrors((x) => ({ ...x, fair: undefined, dateTo: undefined }));
        setStep(0);
      }
      const k = d?.service as (typeof SERVICE_KEYS)[number] | undefined;
      if (!k || !SERVICE_KEYS.includes(k)) return;
      setF((s) => (s.services.includes(k) ? s : { ...s, services: [...s.services, k] }));
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  const attached = useMemo(() => favs.map((id) => items.find((d) => d.id === id)).filter(Boolean) as FavRef[], [favs, items]);
  const area = Number(f.width.replace(",", ".")) * Number(f.depth.replace(",", "."));

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0) {
      if (!f.fair.trim()) e.fair = t("errors.required");
      if (!f.dateUnknown && f.dateFrom && f.dateTo && f.dateTo < f.dateFrom) e.dateTo = t("errors.dates");
    }
    if (s === 3) {
      if (f.name.trim().length < 2) e.name = t("errors.required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = t("errors.email");
      if (!f.consent) e.consent = t("errors.consent");
    }
    return e;
  };

  const focusFirstError = (e: Errors) => {
    const k = Object.keys(e).find((x) => e[x]);
    if (k) requestAnimationFrame(() => document.getElementById(`${uid}-${k}`)?.focus());
  };

  const goto = (s: number) => {
    setStep(s);
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll: true }));
  };
  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.values(e).some(Boolean)) return focusFirstError(e);
    goto(step + 1);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (step < 3) return next();
    const e = { ...validate(0), ...validate(3) };
    setErrors(e);
    if (Object.values(e).some(Boolean)) { if (e.fair) setStep(0); return focusFirstError(e); }
    setStatus("sending"); setServerError(""); setDraft(null);
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "inquiry", ...f, favorites: favs, locale, startedAt: startedAt.current }),
      });
      const result = await res.json();
      if (res.ok && result.delivery === "draft" && result.draft) {
        setDraft(result.draft); setStatus("idle"); return;
      }
      if (res.ok && !EMAIL_DRAFT_MODE) { router.push("/anfrage/danke"); return; }
      setServerError(res.status === 429 ? t("errors.rate") : t("errors.server", { email: site.email }));
    } catch {
      setServerError(t("errors.server", { email: site.email }));
    }
    setStatus("error");
  };

  const err = (k: string) => (errors[k] ? <p id={`${uid}-${k}-err`} className="mt-2 text-sm text-danger">{errors[k]}</p> : null);
  const aria = (k: string) => ({ id: `${uid}-${k}`, "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined });

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl border border-line bg-bg-raised p-5 md:p-8" aria-labelledby={`${uid}-legend`}>
      {/* Fortschritt */}
      <ol className="grid grid-cols-4 gap-2" aria-label={t("stepOf", { current: step + 1, total: 4 })}>
        {STEP_KEYS.map((k, i) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => i < step && goto(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
              className="group w-full text-left disabled:cursor-default"
            >
              <span className={`block h-1 rounded-full transition-colors duration-700 ease-fluid ${i <= step ? "bg-accent" : "bg-white/10"}`} />
              <span className={`mt-2 block text-xs font-semibold uppercase tracking-[0.14em] ${i === step ? "text-fg" : "text-fg-subtle"}`}>
                <span className="tabular">0{i + 1}</span> <span className="hidden sm:inline">{t(`steps.${k}`)}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p id={`${uid}-legend`} className="sr-only" aria-live="polite">{t("stepOf", { current: step + 1, total: 4 })}: {t(`steps.${STEP_KEYS[step]}`)}</p>

      {/* Honeypot (für Menschen unsichtbar) */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} /></label>
      </div>

      {step < 2 && f.services.length > 0 && (
        <p className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm">
          <Check size={14} weight="bold" className="text-accent" aria-hidden />
          {t("prefilled", { list: f.services.map((k) => ts(`${k}.title`)).join(", ") })}
        </p>
      )}

      <div ref={panel} className="mt-8 min-h-[320px]">
        {step === 0 && (
          <fieldset className="grid gap-5">
            <legend className="sr-only">{t("steps.fair")}</legend>
            <div>
              <label htmlFor={`${uid}-fair`} className="text-sm font-semibold">{tf("fair")} *</label>
              <input {...aria("fair")} className={`${input} mt-2`} value={f.fair} onChange={(e) => set("fair", e.target.value)} placeholder={tf("fairPlaceholder")} autoComplete="off" required />
              {err("fair")}
            </div>
            <div>
              <p className="text-sm font-semibold">{tf("projectType")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PROJECT_TYPES.map((k) => (
                  <Chip key={k} on={f.projectType === k} onClick={() => set("projectType", k)}>{tf(`projectTypes.${k}`)}</Chip>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor={`${uid}-city`} className="text-sm font-semibold">{tf("city")}</label>
              <input {...aria("city")} className={`${input} mt-2`} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder={tf("cityPlaceholder")} autoComplete="address-level2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${uid}-dateFrom`} className="text-sm font-semibold">{tf("dateFrom")}</label>
                <input {...aria("dateFrom")} type="date" disabled={f.dateUnknown} className={`${input} mt-2 [color-scheme:dark] disabled:opacity-40`} value={f.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} />
              </div>
              <div>
                <label htmlFor={`${uid}-dateTo`} className="text-sm font-semibold">{tf("dateTo")}</label>
                <input {...aria("dateTo")} type="date" disabled={f.dateUnknown} min={f.dateFrom || undefined} className={`${input} mt-2 [color-scheme:dark] disabled:opacity-40`} value={f.dateTo} onChange={(e) => set("dateTo", e.target.value)} />
                {err("dateTo")}
              </div>
            </div>
            <Check2 label={tf("dateUnknown")} checked={f.dateUnknown} onChange={(v) => set("dateUnknown", v)} />
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="grid gap-5">
            <legend className="text-sm font-semibold">{tf("size")}</legend>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div>
                <label htmlFor={`${uid}-width`} className="text-xs text-fg-muted">{tf("width")}</label>
                <input {...aria("width")} inputMode="decimal" className={`${input} mt-1`} value={f.width} onChange={(e) => set("width", e.target.value.replace(/[^\d.,]/g, ""))} placeholder="12" />
              </div>
              <span className="pb-3 text-fg-subtle">×</span>
              <div>
                <label htmlFor={`${uid}-depth`} className="text-xs text-fg-muted">{tf("depth")}</label>
                <input {...aria("depth")} inputMode="decimal" className={`${input} mt-1`} value={f.depth} onChange={(e) => set("depth", e.target.value.replace(/[^\d.,]/g, ""))} placeholder="8" />
              </div>
            </div>
            {area > 0 && <p className="tabular -mt-2 text-sm text-fg-muted">{tf("area")}: {area.toLocaleString(locale)} m²</p>}
            <div>
              <p className="text-sm font-semibold">{tf("standType")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STAND_TYPES.map((k) => (
                  <Chip key={k} on={f.standType === k} onClick={() => set("standType", k)}>{k === "open" ? tf("standTypeUnknown") : td(k)}</Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">{tf("floors")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["1", "2", "open"] as const).map((k) => (
                  <Chip key={k} on={f.floors === k} onClick={() => set("floors", k)}>{k === "open" ? tf("standTypeUnknown") : k}</Chip>
                ))}
              </div>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="grid gap-6">
            <legend className="sr-only">{t("steps.services")}</legend>
            <div>
              <p className="text-sm font-semibold">{tf("services")}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SERVICE_KEYS.map((k) => (
                  <Check2
                    key={k}
                    boxed
                    label={ts(`${k}.title`)}
                    checked={f.services.includes(k)}
                    onChange={(v) => set("services", v ? [...f.services, k] : f.services.filter((x) => x !== k))}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">{tf("scope")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SCOPE_KEYS.map((k) => (
                  <Chip key={k} on={f.scope === k} onClick={() => set("scope", k)}>{tf(`scopes.${k}`)}</Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">{tf("documents")}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {DOCUMENT_KEYS.map((k) => (
                  <Check2
                    key={k}
                    boxed
                    label={tf(`documentOptions.${k}`)}
                    checked={f.documents.includes(k)}
                    onChange={(v) => set("documents", v ? [...f.documents, k] : f.documents.filter((x) => x !== k))}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">{tf("budget")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BUDGET_KEYS.map((k) => (
                  <Chip key={k} on={f.budget === k} onClick={() => set("budget", k)}>
                    {tf(`budgets.${k}`)}
                  </Chip>
                ))}
              </div>
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="grid gap-5">
            <legend className="sr-only">{t("steps.contact")}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${uid}-name`} className="text-sm font-semibold">{tf("name")} *</label>
                <input {...aria("name")} className={`${input} mt-2`} value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" required />
                {err("name")}
              </div>
              <div>
                <label htmlFor={`${uid}-company`} className="text-sm font-semibold">{tf("company")}</label>
                <input {...aria("company")} className={`${input} mt-2`} value={f.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" />
              </div>
              <div>
                <label htmlFor={`${uid}-email`} className="text-sm font-semibold">{tf("email")} *</label>
                <input {...aria("email")} type="email" className={`${input} mt-2`} value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" required />
                {err("email")}
              </div>
              <div>
                <label htmlFor={`${uid}-phone`} className="text-sm font-semibold">{tf("phone")}</label>
                <input {...aria("phone")} type="tel" className={`${input} mt-2`} value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
              </div>
            </div>
            <div>
              <label htmlFor={`${uid}-message`} className="text-sm font-semibold">{tf("message")}</label>
              <textarea {...aria("message")} rows={4} className={`${input} mt-2 resize-y`} value={f.message} onChange={(e) => set("message", e.target.value)} placeholder={tf("messagePlaceholder")} />
            </div>
            <div>
              <p className="text-sm font-semibold">{tf("favorites")} <span className="tabular text-fg-subtle">({attached.length})</span></p>
              {attached.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {attached.map((d) => (
                    <li key={d.id} className="inline-flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2 text-sm">
                      <img src={designAsset(d.id, "render-1-640.webp")} alt="" width={40} height={24} className="h-6 w-10 rounded-full object-cover" />
                      <span className="tabular text-fg-subtle">{String(d.n).padStart(3, "0")}</span> {d.title}
                      <button type="button" onClick={() => { setDraft(null); favorites.remove(d.id); }} aria-label={`${d.title}: ${tc("close")}`} className="grid size-6 place-items-center rounded-full hover:bg-white/10"><X size={12} /></button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-fg-muted">{tf("favoritesEmpty")}</p>
              )}
            </div>
            <div>
              <Check2
                id={`${uid}-consent`}
                invalid={!!errors.consent}
                describedBy={errors.consent ? `${uid}-consent-err` : undefined}
                checked={f.consent}
                onChange={(v) => set("consent", v)}
                label={tf.rich("consent", { privacy: (c) => <Link href="/datenschutz" className="underline decoration-accent underline-offset-4">{c}</Link> })}
              />
              {err("consent")}
            </div>
          </fieldset>
        )}
      </div>

      {serverError && <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{serverError}</p>}
      {step === 3 && EMAIL_DRAFT_MODE && <p className="mt-4 text-sm text-fg-muted">{t("emailDraft.notice")}</p>}
      {draft && step === 3 && <EmailDraftPanel draft={draft} />}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => goto(step - 1)} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-base font-semibold text-fg-muted hover:text-fg">
            <ArrowLeft size={18} /> {tc("back")}
          </button>
        ) : <span />}
        {step < 3 ? (
          <button key="next" type="button" onClick={next} data-magnetic className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-base font-semibold text-bg transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98]">
            {tc("next")} <ArrowRight size={18} />
          </button>
        ) : (
          <button key="submit" type="submit" disabled={status === "sending"} data-magnetic className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-accent-contrast transition-transform duration-500 ease-fluid hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60">
            {status === "sending" ? t("sending") : EMAIL_DRAFT_MODE ? t("emailDraft.prepare") : t("submit")} <Check size={18} weight="bold" />
          </button>
        )}
      </div>
    </form>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-fg-muted transition-colors duration-500 ease-fluid hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-fg">
      {children}
    </button>
  );
}

function Check2({ label, checked, onChange, boxed, id, invalid, describedBy }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; boxed?: boolean; id?: string; invalid?: boolean; describedBy?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 text-sm ${boxed ? "rounded-xl border border-line p-3 hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft" : ""}`}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={invalid} aria-describedby={describedBy} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
      <span>{label}</span>
    </label>
  );
}
