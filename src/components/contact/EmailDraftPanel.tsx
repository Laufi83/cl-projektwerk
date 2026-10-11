"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { emailDraftUrl, type EmailDraft } from "@/lib/email-draft";

export function EmailDraftPanel({ draft }: { draft: EmailDraft }) {
  const t = useTranslations("contact.emailDraft");
  const field = useRef<HTMLTextAreaElement>(null);
  const heading = useRef<HTMLParagraphElement>(null);
  const [copied, setCopied] = useState(false);
  const fullText = `${draft.to}\n${draft.subject}\n\n${draft.body}`;

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [draft]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
    } catch {
      field.current?.focus();
      field.current?.select();
    }
  }

  return (
    <section aria-label={t("title")} className="mt-5 rounded-2xl border border-accent/40 bg-accent-soft p-4">
      <p ref={heading} tabIndex={-1} className="font-semibold outline-none">{t("title")}</p>
      <p className="mt-2 text-sm text-fg-muted">{t("notice")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={emailDraftUrl(draft)} className="rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast">{t("open")}</a>
        <button type="button" onClick={copy} className="rounded-full border border-line px-4 py-3 text-sm font-semibold">{t("copy")}</button>
      </div>
      <p className="mt-3 text-xs text-fg-muted">{t("fallback")}</p>
      <textarea ref={field} readOnly value={fullText} aria-label={t("title")} rows={6} className="mt-2 w-full resize-y rounded-xl border border-line bg-bg p-3 text-sm text-fg" />
      {copied && <p role="status" className="mt-2 text-sm text-ok">{t("copied")}</p>}
    </section>
  );
}
