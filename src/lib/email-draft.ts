export const EMAIL_DRAFT_MODE = process.env.NEXT_PUBLIC_CONTACT_MODE !== "smtp";

export type EmailDraft = { to: string; subject: string; body: string };

export function emailDraftUrl(draft: EmailDraft) {
  const subject = draft.subject.replace(/[\r\n]+/g, " ");
  return `mailto:${encodeURIComponent(draft.to).replace(/%40/g, "@")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft.body)}`;
}
