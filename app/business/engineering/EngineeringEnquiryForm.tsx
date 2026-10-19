"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BUSINESS_ENQUIRY_LIMITS, EMPTY_BUSINESS_ENQUIRY_STATE, type BusinessEnquiryValues } from "@/lib/business-enquiry-validation";
import { ENGINEERING_DESCRIPTION_LIMIT, type EngineeringEnquiryState } from "@/lib/engineering-enquiry";
import { engineeringInterests, type EngineeringInterest } from "@/lib/engineering-demo";
import { useEngineeringInterest } from "./EngineeringExperience";
import { submitEngineeringEnquiry } from "./actions";
import s from "./engineering.module.css";

const labels: Record<keyof BusinessEnquiryValues, string> = { name: "Name", email: "Email", organisation: "Organisation", goal: "What needs to work better?", timing: "Timing" };

export default function EngineeringEnquiryForm() {
  const [state, action, pending] = useActionState<EngineeringEnquiryState, FormData>(submitEngineeringEnquiry, EMPTY_BUSINESS_ENQUIRY_STATE);
  const tokenInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // A unique mounted-form token keeps the marketing page prerenderable. With
    // JavaScript disabled, the shared action generates and returns the token.
    if (tokenInput.current && !tokenInput.current.value) tokenInput.current.value = crypto.randomUUID();
  }, [state.submissionToken]);
  const [draft, setDraft] = useState(() => ({ ...state.values }));
  const { interest, choose } = useEngineeringInterest();
  const outcome = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.status !== "idle") outcome.current?.focus(); }, [state]);
  if (state.status === "success") return <div ref={outcome} tabIndex={-1} role="status" className={s.receipt}><span className={s.eyebrow}>Next / A conversation</span><h3>Thanks for the brief.</h3><p>{state.message}</p><p>Prefer to add something? Email <a href="mailto:hello@sciencedojo.co.uk">hello@sciencedojo.co.uk</a>.</p></div>;
  const fields = Object.keys(labels) as (keyof BusinessEnquiryValues)[];
  return <form className={s.form} action={action} noValidate aria-busy={pending}>
    <input ref={tokenInput} type="hidden" name="submissionToken" defaultValue={state.submissionToken} key={state.submissionToken} />
    <div className={s.honeypot} aria-hidden="true"><label htmlFor="engineering-website">Leave this field empty</label><input id="engineering-website" name="website" tabIndex={-1} autoComplete="off" /></div>
    {state.status === "error" && <div className={s.formError} ref={outcome} tabIndex={-1} role="alert"><p>{state.message}</p><ul>{fields.filter(key => state.fieldErrors[key]).map(key => <li key={key}><a href={`#engineering-${key}`}>{labels[key]}: {state.fieldErrors[key]}</a></li>)}{state.interestError && <li><a href="#engineering-interest">{state.interestError}</a></li>}</ul></div>}
    <fieldset disabled={pending}><legend>All fields required except interest and timing.</legend>
      <div className={s.formRow}>{(["name", "email"] as const).map(field => <div key={field}><label htmlFor={`engineering-${field}`}>{labels[field]}</label><input id={`engineering-${field}`} name={field} type={field === "email" ? "email" : "text"} autoComplete={field} required maxLength={BUSINESS_ENQUIRY_LIMITS[field]} value={draft[field]} onChange={e => setDraft({ ...draft, [field]: e.target.value })} aria-invalid={Boolean(state.fieldErrors[field])} aria-describedby={state.fieldErrors[field] ? `engineering-${field}-error` : undefined} />{state.fieldErrors[field] && <p className={s.fieldError} id={`engineering-${field}-error`}>{state.fieldErrors[field]}</p>}</div>)}</div>
      <div className={s.formRow}><div><label htmlFor="engineering-organisation">Organisation</label><input id="engineering-organisation" name="organisation" autoComplete="organization" required maxLength={BUSINESS_ENQUIRY_LIMITS.organisation} value={draft.organisation} onChange={e => setDraft({ ...draft, organisation: e.target.value })} aria-invalid={Boolean(state.fieldErrors.organisation)} aria-describedby={`engineering-organisation-hint${state.fieldErrors.organisation ? " engineering-organisation-error" : ""}`} /><p id="engineering-organisation-hint" className={s.fieldHint}>Your business, team or project name.</p>{state.fieldErrors.organisation && <p className={s.fieldError} id="engineering-organisation-error">{state.fieldErrors.organisation}</p>}</div><div><label htmlFor="engineering-interest">Interested in <span>(optional)</span></label><select id="engineering-interest" name="interest" value={interest} onChange={e => choose(e.target.value as EngineeringInterest)} aria-invalid={Boolean(state.interestError)} aria-describedby={state.interestError ? "engineering-interest-error" : undefined}>{Object.entries(engineeringInterests).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{state.interestError && <p className={s.fieldError} id="engineering-interest-error">{state.interestError}</p>}</div></div>
      <div><label htmlFor="engineering-goal">What needs to work better?</label><p id="engineering-goal-hint" className={s.fieldHint}>A few sentences are enough: what happens now, what should change and which tools you use. Please leave out passwords and confidential data.</p><details className={s.briefExample}><summary>Not sure what to write?</summary><p className={s.label}>Fictional example brief</p><p>We run professional training courses. People leave a course page to use a general enquiry form, so our team has to ask which course they meant. We would like the enquiry to keep that context. We can share our current website and an example of the journey.</p></details><textarea id="engineering-goal" name="goal" rows={4} required maxLength={ENGINEERING_DESCRIPTION_LIMIT} value={draft.goal} onChange={e => setDraft({ ...draft, goal: e.target.value })} aria-invalid={Boolean(state.fieldErrors.goal)} aria-describedby={`engineering-goal-hint${state.fieldErrors.goal ? " engineering-goal-error" : ""}`} />{state.fieldErrors.goal && <p className={s.fieldError} id="engineering-goal-error">{state.fieldErrors.goal}</p>}</div>
      <div><label htmlFor="engineering-timing">Timing <span>(optional)</span></label><input id="engineering-timing" name="timing" maxLength={BUSINESS_ENQUIRY_LIMITS.timing} value={draft.timing} onChange={e => setDraft({ ...draft, timing: e.target.value })} aria-invalid={Boolean(state.fieldErrors.timing)} aria-describedby={state.fieldErrors.timing ? "engineering-timing-error" : undefined} />{state.fieldErrors.timing && <p className={s.fieldError} id="engineering-timing-error">{state.fieldErrors.timing}</p>}</div>
      <div className={s.formBottom}><button type="submit" className={s.button} disabled={pending}>{pending ? "Recording your enquiry…" : "Send your brief"}<ArrowUpRight size={18} aria-hidden="true" /></button><p>Your details are used to respond to this enquiry. <Link href="/privacy">Privacy policy</Link>.</p></div>
    </fieldset>
    <noscript><p>Prefer to continue without JavaScript? <a href="mailto:hello@sciencedojo.co.uk?subject=ScienceDojo%20Engineering%20enquiry">Email your brief to hello@sciencedojo.co.uk</a>.</p></noscript>
  </form>;
}
