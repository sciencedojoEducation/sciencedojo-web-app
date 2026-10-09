"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  BUSINESS_ENQUIRY_LIMITS,
  EMPTY_BUSINESS_ENQUIRY_STATE,
  type BusinessEnquiryFieldErrors,
  type BusinessEnquiryValues,
} from "@/lib/business-enquiry-validation";
import { submitBusinessEnquiry } from "./actions";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]";
const inputClass = `mt-2 min-h-12 w-full rounded-md border border-[#a9b6c4] bg-white px-3 py-3 text-base text-[#12243A] placeholder:text-[#667487] disabled:opacity-70 ${focus}`;
const fieldLabels: Record<keyof BusinessEnquiryValues, string> = {
  name: "Name",
  email: "Email",
  organisation: "Organisation",
  goal: "What should your people be able to do?",
  timing: "Timing",
};

function FieldError({ field, errors }: { field: keyof BusinessEnquiryValues; errors: BusinessEnquiryFieldErrors }) {
  if (!errors[field]) return null;
  return <p id={`business-${field}-error`} className="mt-2 text-sm font-medium leading-6 text-[#a12e25]">{errors[field]}</p>;
}

export default function BusinessEnquiryForm({ initialSubmissionToken }: { initialSubmissionToken: string }) {
  const [state, formAction, pending] = useActionState(submitBusinessEnquiry, {
    ...EMPTY_BUSINESS_ENQUIRY_STATE,
    submissionToken: initialSubmissionToken,
  });
  // Controlled fields preserve the draft when React resets a completed action's form.
  const [draft, setDraft] = useState<BusinessEnquiryValues>(() => ({ ...state.values }));
  const outcome = useRef<HTMLDivElement>(null);
  const tokenInput = useRef<HTMLInputElement>(null);
  const submissionToken = useRef(state.submissionToken);

  useEffect(() => {
    if (state.submissionToken) submissionToken.current = state.submissionToken;
    if (tokenInput.current) tokenInput.current.value = submissionToken.current;
    if (state.status !== "idle") outcome.current?.focus();
  }, [state]);

  function change(field: keyof BusinessEnquiryValues, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  if (state.status === "success") {
    return (
      <div ref={outcome} tabIndex={-1} role="status" className={`self-start rounded-lg border border-[#b6d5d6] bg-white p-6 ${focus}`}>
        <h3 className="text-xl font-bold">Enquiry received</h3>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#526071]">{state.message}</p>
      </div>
    );
  }

  const errors = state.fieldErrors;
  const errorFields = (Object.keys(fieldLabels) as (keyof BusinessEnquiryValues)[]).filter((field) => errors[field]);

  return (
    <form action={formAction} noValidate aria-busy={pending} className="min-w-0">
      <input ref={tokenInput} type="hidden" name="submissionToken" defaultValue={state.submissionToken} />
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="business-website">Leave this field empty</label>
        <input id="business-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && (
        <div ref={outcome} tabIndex={-1} role="alert" className={`mb-6 rounded-md border border-[#dfbab6] bg-white p-4 ${focus}`}>
          <p className="font-semibold text-[#12243A]">{state.message}</p>
          {errorFields.length > 0 && <ul className="mt-3 space-y-2 text-sm text-[#a12e25]">{errorFields.map((field) => <li key={field}><a href={`#business-${field}`} className={`underline underline-offset-4 ${focus}`}>{fieldLabels[field]}: {errors[field]}</a></li>)}</ul>}
        </div>
      )}

      <fieldset disabled={pending} className="min-w-0 space-y-5">
        <legend className="mb-5 text-sm leading-6 text-[#526071]">All fields are required except timing.</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="business-name" className="text-sm font-semibold">Name</label>
            <input id="business-name" name="name" type="text" autoComplete="name" required maxLength={BUSINESS_ENQUIRY_LIMITS.name} value={draft.name} onChange={(event) => change("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "business-name-error" : undefined} className={inputClass} />
            <FieldError field="name" errors={errors} />
          </div>
          <div>
            <label htmlFor="business-email" className="text-sm font-semibold">Email</label>
            <input id="business-email" name="email" type="email" autoComplete="email" required maxLength={BUSINESS_ENQUIRY_LIMITS.email} value={draft.email} onChange={(event) => change("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "business-email-error" : undefined} className={inputClass} />
            <FieldError field="email" errors={errors} />
          </div>
        </div>
        <div>
          <label htmlFor="business-organisation" className="text-sm font-semibold">Organisation</label>
          <input id="business-organisation" name="organisation" type="text" autoComplete="organization" required maxLength={BUSINESS_ENQUIRY_LIMITS.organisation} value={draft.organisation} onChange={(event) => change("organisation", event.target.value)} aria-invalid={Boolean(errors.organisation)} aria-describedby={errors.organisation ? "business-organisation-error" : undefined} className={inputClass} />
          <FieldError field="organisation" errors={errors} />
        </div>
        <div>
          <label htmlFor="business-goal" className="text-sm font-semibold">What should your people be able to do?</label>
          <p id="business-goal-hint" className="mt-1 text-sm leading-6 text-[#526071]">Describe the workplace task or process you want them to practise.</p>
          <textarea id="business-goal" name="goal" rows={5} required maxLength={BUSINESS_ENQUIRY_LIMITS.goal} value={draft.goal} onChange={(event) => change("goal", event.target.value)} aria-invalid={Boolean(errors.goal)} aria-describedby={`business-goal-hint${errors.goal ? " business-goal-error" : ""}`} className={`${inputClass} resize-y`} />
          <FieldError field="goal" errors={errors} />
        </div>
        <div>
          <label htmlFor="business-timing" className="text-sm font-semibold">Timing <span className="font-normal text-[#526071]">(optional)</span></label>
          <input id="business-timing" name="timing" type="text" maxLength={BUSINESS_ENQUIRY_LIMITS.timing} value={draft.timing} onChange={(event) => change("timing", event.target.value)} aria-invalid={Boolean(errors.timing)} aria-describedby={errors.timing ? "business-timing-error" : undefined} className={inputClass} />
          <FieldError field="timing" errors={errors} />
        </div>
        <button type="submit" disabled={pending} className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#006B70] px-6 py-3 text-sm font-bold text-white hover:bg-[#00565B] disabled:cursor-wait disabled:opacity-70 ${focus}`}>
          {pending ? "Sending…" : "Send enquiry"}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </fieldset>
      <p className="mt-4 text-xs leading-6 text-[#526071]">We use these details to respond to your enquiry and discuss the project. Read our <Link href="/privacy" className={`font-semibold text-[#006B70] underline underline-offset-4 ${focus}`}>privacy notice</Link>.</p>
      <p role="status" aria-live="polite" className="sr-only">{pending ? "Sending your enquiry. Please wait." : ""}</p>
    </form>
  );
}
