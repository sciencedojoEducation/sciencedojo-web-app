"use client";

import { type FormEvent, useActionState, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { requestFreeAssessment, type AssessmentFormState } from "./actions";

const initialState: AssessmentFormState = {
  status: "idle",
  message: "",
};

const fields = [
  { name: "parentName", label: "Parent name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "whatsapp", label: "WhatsApp number", type: "tel", required: true },
  { name: "studentName", label: "Student name", type: "text", required: true },
  { name: "studentYear", label: "Student year/grade", type: "text", required: true },
  { name: "curriculum", label: "Curriculum", type: "text", required: true },
  { name: "subject", label: "Subject help needed", type: "text", required: true },
  { name: "challenge", label: "Main learning challenge", type: "text", required: true },
  { name: "preferredTime", label: "Preferred lesson time", type: "text", required: true },
];

export default function FreeAssessmentForm() {
  const [state, formAction, isPending] = useActionState(requestFreeAssessment, initialState);
  const hasStartedRef = useRef(false);
  const lastTrackedMessageRef = useRef("");
  const lastFormMetaRef = useRef<{ subject?: string; curriculum?: string }>({});

  useEffect(() => {
    if (!state.message || state.message === lastTrackedMessageRef.current) {
      return;
    }

    lastTrackedMessageRef.current = state.message;
    trackEvent(state.status === "success" ? "free_assessment_submit_success" : "free_assessment_submit_error", {
      source: "free_assessment_page",
      subject: lastFormMetaRef.current.subject,
      curriculum: lastFormMetaRef.current.curriculum,
    });
  }, [state.message, state.status]);

  const handleStart = () => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    trackEvent("free_assessment_start", {
      source: "free_assessment_page",
    });
  };

  const handleSubmitCapture = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    lastFormMetaRef.current = {
      subject: String(formData.get("subject") || "").trim(),
      curriculum: String(formData.get("curriculum") || "").trim(),
    };
  };

  return (
    <form action={formAction} onSubmit={handleSubmitCapture} onChange={handleStart} onFocus={handleStart} className="rounded-3xl border border-secondary/10 bg-white p-6 shadow-xl md:p-8">
      {/* TODO: Add dashboard analytics for lead source quality and lead-to-booking conversion. */}
      {state.message && (
        <div
          className={`mb-6 rounded-2xl border p-4 text-sm font-bold ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-2 text-sm font-black text-secondary">
            {field.label}
            <input
              name={field.name}
              type={field.type}
              required={field.required}
              className="rounded-2xl border border-secondary/10 bg-surface px-4 py-3 font-bold outline-none transition-colors focus:border-primary"
            />
          </label>
        ))}
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm font-black text-secondary">
        Message
        <textarea
          name="message"
          rows={5}
          className="resize-none rounded-2xl border border-secondary/10 bg-surface px-4 py-3 font-bold outline-none transition-colors focus:border-primary"
          placeholder="Tell us anything useful about goals, exams, confidence, or current support."
        />
      </label>

      <button
        type="submit"
        disabled={isPending || state.status === "success"}
        className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending Request..." : state.status === "success" ? "Request Received" : "Request Free Assessment"}
      </button>

      {state.status === "error" && (state.mailtoHref || state.whatsappHref) && (
        <div className="mt-6 rounded-2xl border border-secondary/10 bg-surface p-5">
          <p className="text-sm font-bold text-secondary/70">Fallback contact options:</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {state.mailtoHref && (
              <a href={state.mailtoHref} className="rounded-xl bg-secondary px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white">
                Email ScienceDojo
              </a>
            )}
            {state.whatsappHref && (
              <a
                href={state.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-emerald-500 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white"
              >
                Send WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
