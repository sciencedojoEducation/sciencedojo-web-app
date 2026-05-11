"use client";

import { useState } from "react";

type FollowUpDraftsProps = {
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
};

async function copyText(value: string, onCopied: () => void) {
  await navigator.clipboard.writeText(value);
  onCopied();
}

export default function FollowUpDrafts({
  whatsappMessage,
  emailSubject,
  emailBody,
}: FollowUpDraftsProps) {
  const [whatsapp, setWhatsapp] = useState(whatsappMessage);
  const [subject, setSubject] = useState(emailSubject);
  const [body, setBody] = useState(emailBody);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (key: string, value: string) => {
    try {
      await copyText(value, () => setCopied(key));
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
    } catch {
      setCopied("error");
      window.setTimeout(() => setCopied(null), 1800);
    }
  };

  const copyButtonClass = "rounded-xl border border-secondary/10 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-secondary/55 transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15";
  const fieldClass = "w-full rounded-2xl border border-secondary/10 bg-white px-4 py-3 text-xs font-semibold leading-6 text-secondary/70 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <details className="mt-3 rounded-2xl border border-primary/10 bg-primary/5 p-3">
      <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-primary">
        Suggested Follow-Up
      </summary>
      <div className="mt-4 grid gap-4">
        <p className="text-xs font-bold leading-5 text-secondary/55">
          Review and personalize before sending. These are drafts only; nothing is sent automatically.
        </p>

        <section className="rounded-2xl border border-secondary/10 bg-white/75 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary/45">WhatsApp Message</h3>
            <button
              type="button"
              onClick={() => handleCopy("whatsapp", whatsapp)}
              className={copyButtonClass}
            >
              {copied === "whatsapp" ? "Copied" : "Copy WhatsApp"}
            </button>
          </div>
          <textarea
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            rows={8}
            className={`${fieldClass} mt-3 resize-y`}
          />
        </section>

        <section className="rounded-2xl border border-secondary/10 bg-white/75 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary/45">Email Draft</h3>
            <button
              type="button"
              onClick={() => handleCopy("full-email", `Subject: ${subject}\n\n${body}`)}
              className={copyButtonClass}
            >
              {copied === "full-email" ? "Copied" : "Copy Full Email"}
            </button>
          </div>

          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Subject</span>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => handleCopy("subject", subject)}
                className={copyButtonClass}
              >
                {copied === "subject" ? "Copied" : "Copy Subject"}
              </button>
            </div>
          </label>

          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Email body</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={12}
              className={`${fieldClass} mt-2 resize-y`}
            />
          </label>
          <button
            type="button"
            onClick={() => handleCopy("body", body)}
            className={`${copyButtonClass} mt-3`}
          >
            {copied === "body" ? "Copied" : "Copy Email Body"}
          </button>
        </section>

        {copied === "error" && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
            Copy failed. Select the draft text manually and copy it.
          </p>
        )}
      </div>
    </details>
  );
}
