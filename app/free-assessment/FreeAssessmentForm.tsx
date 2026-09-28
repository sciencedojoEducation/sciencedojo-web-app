"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { getDeviceCategory, trackEvent } from "@/lib/analytics";
import {
  awardingBodies,
  curriculumPathways,
  getAwardingBodiesForSelection,
  getDerivedAwardingBody,
  getLevelsForEducationSelection,
  getStagesForCurriculum,
  getSubjectVariants,
  getSubjectsForEducationSelection,
  getTopicsForSubject,
  uncertainEducationOption,
} from "@/lib/educationTaxonomy";
import { requestFreeAssessment, type AssessmentFormState } from "./actions";

const initialState: AssessmentFormState = { status: "idle", message: "" };
const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-secondary/15 bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10";
const subjectOptions = getSubjectsForEducationSelection(uncertainEducationOption, uncertainEducationOption);

type Values = {
  studentName: string;
  studentYear: string;
  subject: string;
  challenge: string;
  parentName: string;
  email: string;
  whatsapp: string;
  preferredTime: string;
  curriculumKey: string;
  stage: string;
  awardingBodyKey: string;
  subjectVariant: string;
  level: string;
  topic: string;
  goalsTimeline: string;
};

const initialValues: Values = {
  studentName: "",
  studentYear: "",
  subject: "",
  challenge: "",
  parentName: "",
  email: "",
  whatsapp: "",
  preferredTime: "",
  curriculumKey: uncertainEducationOption,
  stage: uncertainEducationOption,
  awardingBodyKey: "",
  subjectVariant: "",
  level: "",
  topic: "",
  goalsTimeline: "",
};

type FieldKey = keyof Values;
type FieldErrors = Partial<Record<FieldKey, string>>;

export default function FreeAssessmentForm() {
  const [state, formAction, isPending] = useActionState(requestFreeAssessment, initialState);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const lastTrackedMessageRef = useRef("");
  const startedRef = useRef(false);

  const stages = getStagesForCurriculum(values.curriculumKey);
  const boards = getAwardingBodiesForSelection(values.curriculumKey, values.stage);
  const variants = getSubjectVariants(values.subject, values.curriculumKey, values.stage);
  const levels = getLevelsForEducationSelection(values.curriculumKey, values.stage, values.subject);
  const topics = values.subject ? getTopicsForSubject(values.subject) : [];

  useEffect(() => {
    trackEvent("free_assessment_step_view", { step: step + 1, total_steps: 2, device_category: getDeviceCategory() });
  }, [step]);

  useEffect(() => {
    if (!state.message || state.message === lastTrackedMessageRef.current) return;
    lastTrackedMessageRef.current = state.message;
    trackEvent(state.status === "success" ? "free_assessment_submit_success" : "free_assessment_submit_error", {
      source: "free_assessment_page",
      device_category: getDeviceCategory(),
    });
    if (state.status === "error") errorRef.current?.focus();
  }, [state.message, state.status]);

  function start() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("free_assessment_start", { source: "free_assessment_page", device_category: getDeviceCategory() });
  }

  function update<K extends FieldKey>(key: K, value: Values[K]) {
    start();
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function changeSubject(subject: string) {
    start();
    setValues((current) => ({
      ...current,
      subject,
      topic: "",
      subjectVariant: getSubjectVariants(subject, current.curriculumKey, current.stage)[0]?.key || "",
      level: getLevelsForEducationSelection(current.curriculumKey, current.stage, subject)[0]?.key || "",
    }));
    setErrors((current) => ({ ...current, subject: undefined }));
  }

  function changeCurriculum(curriculumKey: string) {
    start();
    const stage = uncertainEducationOption;
    setValues((current) => ({
      ...current,
      curriculumKey,
      stage,
      awardingBodyKey: "",
      subjectVariant: getSubjectVariants(current.subject, curriculumKey, stage)[0]?.key || "",
      level: "",
    }));
    setErrors((current) => ({ ...current, stage: undefined }));
  }

  function changeStage(stage: string) {
    start();
    const board = getDerivedAwardingBody(values.curriculumKey, stage);
    setValues((current) => ({
      ...current,
      stage,
      awardingBodyKey: board || (getAwardingBodiesForSelection(current.curriculumKey, stage).length ? uncertainEducationOption : ""),
      subjectVariant: getSubjectVariants(current.subject, current.curriculumKey, stage)[0]?.key || "",
      level: getLevelsForEducationSelection(current.curriculumKey, stage, current.subject)[0]?.key || "",
    }));
    setErrors((current) => ({ ...current, stage: undefined }));
  }

  function validateCurrentStep(): FieldErrors {
    const next: FieldErrors = {};
    if (step === 0) {
      if (!values.studentName.trim()) next.studentName = "Enter your child's first name.";
      if (!values.studentYear.trim()) next.studentYear = "Enter your child's year or grade.";
      if (!values.subject) next.subject = "Choose a subject.";
      if (!values.challenge.trim()) next.challenge = "Tell us briefly what feels difficult.";
      if (values.subject && values.stage !== uncertainEducationOption && values.curriculumKey !== uncertainEducationOption) {
        const choices = getSubjectsForEducationSelection(values.curriculumKey, values.stage, values.awardingBodyKey);
        if (!choices.includes(values.subject)) next.subject = "Choose a subject available for this curriculum route, or select “I’m not sure” for curriculum.";
      }
    } else {
      if (!values.parentName.trim()) next.parentName = "Enter your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Enter a valid email address.";
    }
    return next;
  }

  function focusFirstError(next: FieldErrors) {
    const first = Object.keys(next)[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(`assessment-${first}`)?.focus());
  }

  function continueToContact(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const next = validateCurrentStep();
    setErrors(next);
    if (Object.keys(next).length) {
      focusFirstError(next);
      return;
    }
    trackEvent("free_assessment_step_complete", { step: 1, total_steps: 2, device_category: getDeviceCategory() });
    setErrors({});
    setStep(1);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    formRef.current?.scrollIntoView({ behavior, block: "start" });
    window.requestAnimationFrame(() => document.getElementById("assessment-parentName")?.focus());
  }

  function backToStudent() {
    setErrors({});
    setStep(0);
    window.requestAnimationFrame(() => document.getElementById("assessment-studentName")?.focus());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const next = validateCurrentStep();
    setErrors(next);
    if (Object.keys(next).length) {
      event.preventDefault();
      focusFirstError(next);
      return;
    }
    trackEvent("free_assessment_step_complete", { step: 2, total_steps: 2, device_category: getDeviceCategory() });
    trackEvent("free_assessment_submit_attempt", { source: "free_assessment_page", device_category: getDeviceCategory() });
  }

  if (state.status === "success") {
    return (
      <section className="rounded-[1.75rem] border border-primary/10 bg-white p-7 shadow-[0_24px_70px_rgba(18,59,95,.09)] md:p-10" aria-live="polite">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5f5ee] text-[#16734c]" aria-hidden="true"><Check className="h-7 w-7" /></div>
        <p className="mt-5 text-sm font-bold text-primary">Assessment request received</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-secondary">Thank you. We&apos;ll take it from here.</h2>
        <p className="mt-4 max-w-2xl leading-7 text-secondary/70">We&apos;ll review what you shared and contact you by email to arrange a free assessment conversation. You can tell us more about curriculum details and goals when we talk.</p>
      </section>
    );
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} onChange={start} onFocus={start} noValidate className="scroll-mt-28 rounded-[1.75rem] border border-[#dce8f2] bg-white p-5 shadow-[0_24px_70px_rgba(18,59,95,.09)] sm:p-7 md:p-9">
      <div className="mb-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Your request</p>
          <p className="rounded-full bg-[#edf6ff] px-3 py-1 text-xs font-bold text-primary">Step {step + 1} of 2</p>
        </div>
        <ol className="mt-5 grid grid-cols-2 gap-2" aria-label="Assessment request progress">
          <li aria-current={step === 0 ? "step" : undefined} className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold sm:text-sm ${step === 0 ? "bg-primary text-white" : "bg-[#e7f4ee] text-[#176447]"}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${step === 0 ? "bg-white/20" : "bg-white"}`} aria-hidden="true">{step === 0 ? "1" : <Check className="h-3.5 w-3.5" />}</span>
            <span>Child&apos;s needs</span>
          </li>
          <li aria-current={step === 1 ? "step" : undefined} className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold sm:text-sm ${step === 1 ? "bg-primary text-white" : "bg-[#f0f5f9] text-secondary/55"}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${step === 1 ? "bg-white/20" : "bg-white"}`} aria-hidden="true">2</span>
            <span>Contact details</span>
          </li>
        </ol>
        <h2 className="mt-7 text-2xl font-black tracking-tight text-secondary md:text-3xl">{step === 0 ? "What does your child need help with?" : "How can we reach you?"}</h2>
        <p className="mt-2 text-sm leading-6 text-secondary/65">{step === 0 ? "Just the basics for now. Extra detail is optional." : "We'll email you to arrange the free conversation. WhatsApp and a preferred time are optional."}</p>
      </div>

      <input type="hidden" name="studentName" value={values.studentName} />
      <input type="hidden" name="studentYear" value={values.studentYear} />
      <input type="hidden" name="subject" value={values.subject} />
      <input type="hidden" name="challenge" value={values.challenge} />
      <input type="hidden" name="parentName" value={values.parentName} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="whatsapp" value={values.whatsapp} />
      <input type="hidden" name="preferredTime" value={values.preferredTime} />
      <input type="hidden" name="curriculumKey" value={values.curriculumKey} />
      <input type="hidden" name="stage" value={values.stage} />
      <input type="hidden" name="awardingBodyKey" value={values.awardingBodyKey} />
      <input type="hidden" name="subjectVariant" value={values.subjectVariant} />
      <input type="hidden" name="level" value={values.level} />
      <input type="hidden" name="topic" value={values.topic} />
      <input type="hidden" name="goalsTimeline" value={values.goalsTimeline} />

      {state.status === "error" && state.message && <div ref={errorRef} tabIndex={-1} role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{state.message}</div>}

      {step === 0 ? (
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-secondary" htmlFor="assessment-studentName">Child&apos;s first name <span aria-hidden="true">*</span>
              <input id="assessment-studentName" required value={values.studentName} onChange={(event) => update("studentName", event.target.value)} aria-invalid={Boolean(errors.studentName)} aria-describedby={errors.studentName ? "assessment-studentName-error" : undefined} className={fieldClass} autoComplete="off" />
              {errors.studentName && <span id="assessment-studentName-error" className="mt-1 block text-xs text-red-700">{errors.studentName}</span>}
            </label>
            <label className="block text-sm font-bold text-secondary" htmlFor="assessment-studentYear">School year or grade <span aria-hidden="true">*</span>
              <input id="assessment-studentYear" required value={values.studentYear} onChange={(event) => update("studentYear", event.target.value)} aria-invalid={Boolean(errors.studentYear)} aria-describedby={errors.studentYear ? "assessment-studentYear-error" : undefined} placeholder="Year 10, Grade 11, IB Year 1..." className={fieldClass} />
              {errors.studentYear && <span id="assessment-studentYear-error" className="mt-1 block text-xs text-red-700">{errors.studentYear}</span>}
            </label>
          </div>
          <label className="block text-sm font-bold text-secondary" htmlFor="assessment-subject">Subject <span aria-hidden="true">*</span>
            <select id="assessment-subject" required value={values.subject} onChange={(event) => changeSubject(event.target.value)} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "assessment-subject-error" : undefined} className={fieldClass}>
              <option value="">Choose a subject</option>
              {subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            {errors.subject && <span id="assessment-subject-error" className="mt-1 block text-xs text-red-700">{errors.subject}</span>}
          </label>
          <label className="block text-sm font-bold text-secondary" htmlFor="assessment-challenge">What feels difficult right now? <span aria-hidden="true">*</span>
            <textarea id="assessment-challenge" required value={values.challenge} onChange={(event) => update("challenge", event.target.value)} aria-invalid={Boolean(errors.challenge)} aria-describedby={errors.challenge ? "assessment-challenge-error" : undefined} rows={3} placeholder="A few words about the topic, confidence, or an upcoming exam are enough." className={fieldClass} />
            {errors.challenge && <span id="assessment-challenge-error" className="mt-1 block text-xs text-red-700">{errors.challenge}</span>}
          </label>
          <details className="rounded-xl border border-secondary/10 bg-[#f8fbff] p-4">
            <summary className="cursor-pointer text-sm font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Add curriculum, topic or goals (optional)</summary>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-secondary" htmlFor="assessment-curriculumKey">Curriculum
                <select id="assessment-curriculumKey" value={values.curriculumKey} onChange={(event) => changeCurriculum(event.target.value)} className={fieldClass}>
                  {curriculumPathways.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-secondary" htmlFor="assessment-stage">Stage or qualification
                <select id="assessment-stage" value={values.stage} onChange={(event) => changeStage(event.target.value)} aria-invalid={Boolean(errors.stage)} className={fieldClass}>
                  {values.curriculumKey !== uncertainEducationOption && <option value={uncertainEducationOption}>I&apos;m not sure</option>}
                  {stages.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
                {errors.stage && <span className="mt-1 block text-xs text-red-700">{errors.stage}</span>}
              </label>
              {boards.length > 1 && <label className="block text-sm font-bold text-secondary" htmlFor="assessment-awardingBodyKey">Exam board
                <select id="assessment-awardingBodyKey" value={values.awardingBodyKey} onChange={(event) => update("awardingBodyKey", event.target.value)} className={fieldClass}>
                  <option value={uncertainEducationOption}>I&apos;m not sure</option>
                  {boards.map((item) => <option key={item.key} value={item.key}>{awardingBodies.find((board) => board.key === item.key)?.label || item.label}</option>)}
                </select>
              </label>}
              {variants.length > 0 && <label className="block text-sm font-bold text-secondary" htmlFor="assessment-subjectVariant">Subject route
                <select id="assessment-subjectVariant" value={values.subjectVariant} onChange={(event) => update("subjectVariant", event.target.value)} className={fieldClass}>
                  {variants.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </label>}
              {levels.length > 0 && <label className="block text-sm font-bold text-secondary" htmlFor="assessment-level">Tier or course level
                <select id="assessment-level" value={values.level} onChange={(event) => update("level", event.target.value)} className={fieldClass}>
                  {levels.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </label>}
              <label className="block text-sm font-bold text-secondary" htmlFor="assessment-topic">Topic
                <select id="assessment-topic" value={values.topic} onChange={(event) => update("topic", event.target.value)} className={fieldClass}>
                  <option value="">Not sure yet</option>
                  {topics.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-secondary sm:col-span-2" htmlFor="assessment-goalsTimeline">What would you like to change?
                <input id="assessment-goalsTimeline" value={values.goalsTimeline} onChange={(event) => update("goalsTimeline", event.target.value)} placeholder="Confidence, exam readiness, a particular topic..." className={fieldClass} />
              </label>
            </div>
          </details>
        </div>
      ) : (
        <div className="grid gap-5">
          <label className="block text-sm font-bold text-secondary" htmlFor="assessment-parentName">Your name <span aria-hidden="true">*</span>
            <input id="assessment-parentName" required value={values.parentName} onChange={(event) => update("parentName", event.target.value)} aria-invalid={Boolean(errors.parentName)} aria-describedby={errors.parentName ? "assessment-parentName-error" : undefined} autoComplete="name" className={fieldClass} />
            {errors.parentName && <span id="assessment-parentName-error" className="mt-1 block text-xs text-red-700">{errors.parentName}</span>}
          </label>
          <label className="block text-sm font-bold text-secondary" htmlFor="assessment-email">Email <span aria-hidden="true">*</span>
            <input id="assessment-email" required value={values.email} onChange={(event) => update("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "assessment-email-error" : undefined} autoComplete="email" inputMode="email" type="email" className={fieldClass} />
            {errors.email && <span id="assessment-email-error" className="mt-1 block text-xs text-red-700">{errors.email}</span>}
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-secondary" htmlFor="assessment-whatsapp">WhatsApp number <span className="font-normal text-secondary/55">(optional)</span>
              <input id="assessment-whatsapp" value={values.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} autoComplete="tel" inputMode="tel" type="tel" className={fieldClass} />
            </label>
            <label className="block text-sm font-bold text-secondary" htmlFor="assessment-preferredTime">Preferred time <span className="font-normal text-secondary/55">(optional)</span>
              <input id="assessment-preferredTime" value={values.preferredTime} onChange={(event) => update("preferredTime", event.target.value)} placeholder="Weekday evenings, Saturday..." className={fieldClass} />
            </label>
          </div>
          <p className="rounded-xl bg-[#f4f9ff] p-4 text-sm leading-6 text-secondary/70">The assessment conversation is free and there is no pressure to continue. We&apos;ll contact you by email to arrange it.</p>
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-secondary/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        {step === 1 ? <button type="button" onClick={backToStudent} disabled={isPending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-secondary/15 px-5 py-3 text-sm font-bold text-secondary hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button> : <span />}
        {step === 0 ? <button type="button" onClick={continueToContact} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Continue to contact details <ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : <button type="submit" disabled={isPending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">{isPending ? "Sending request..." : "Request my free assessment"}{!isPending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}</button>}
      </div>
      {state.status === "error" && (state.mailtoHref || state.whatsappHref) && <div className="mt-6 rounded-xl border border-secondary/10 bg-[#f8fbff] p-4">
        <p className="text-sm font-semibold text-secondary">You can still send your request directly:</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {state.mailtoHref && <a href={state.mailtoHref} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Email ScienceDojo</a>}
          {state.whatsappHref && <a href={state.whatsappHref} className="inline-flex min-h-11 items-center rounded-xl border border-primary px-4 text-sm font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Send by WhatsApp</a>}
        </div>
      </div>}
    </form>
  );
}
