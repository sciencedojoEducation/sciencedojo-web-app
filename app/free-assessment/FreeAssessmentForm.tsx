"use client";

import { type FormEvent, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { requestFreeAssessment, type AssessmentFormState } from "./actions";

const initialState: AssessmentFormState = {
  status: "idle",
  message: "",
};

const steps = [
  {
    title: "Student Profile",
    eyebrow: "Step 1 of 6",
    microcopy: "Start with the essentials. There are no perfect answers here.",
  },
  {
    title: "Subject & Goals",
    eyebrow: "Step 2 of 6",
    microcopy: "This helps us understand the academic route and the result your child is working toward.",
  },
  {
    title: "Confidence & Gaps",
    eyebrow: "Step 3 of 6",
    microcopy: "Confidence often tells us more than a mark on a test.",
  },
  {
    title: "Study Habits & Concerns",
    eyebrow: "Step 4 of 6",
    microcopy: "Tell us what you are noticing at home, not just what appears on reports.",
  },
  {
    title: "Support Style",
    eyebrow: "Step 5 of 6",
    microcopy: "A good tutor fit is about temperament as much as subject knowledge.",
  },
  {
    title: "Contact & Assessment Time",
    eyebrow: "Step 6 of 6",
    microcopy: "We will use this only to arrange the assessment and next step.",
  },
] as const;

type IntakeValues = {
  parentName: string;
  email: string;
  whatsapp: string;
  studentName: string;
  studentYear: string;
  curriculum: string;
  subject: string;
  weakTopics: string;
  targetGrade: string;
  upcomingExams: string;
  hardestAreas: string[];
  challenge: string;
  studyConcerns: string[];
  goalsTimeline: string;
  supportStyle: string;
  preferredTime: string;
  message: string;
};

const defaultValues: IntakeValues = {
  parentName: "",
  email: "",
  whatsapp: "",
  studentName: "",
  studentYear: "",
  curriculum: "",
  subject: "",
  weakTopics: "",
  targetGrade: "",
  upcomingExams: "",
  hardestAreas: [],
  challenge: "",
  studyConcerns: [],
  goalsTimeline: "",
  supportStyle: "",
  preferredTime: "",
  message: "",
};

const curriculumOptions = ["GCSE", "IGCSE", "IB", "A-Level", "KS3", "Other international curriculum"];
const hardestAreaOptions = ["Understanding concepts", "Applying ideas in exam questions", "Remembering content", "Exam timing", "Explaining answers clearly", "Staying consistent"];
const studyConcernOptions = ["Loses motivation", "Revises but forgets", "Avoids difficult topics", "Panics before tests", "Lacks structure", "Needs accountability"];
const supportStyleOptions = ["Calm explanation and confidence rebuilding", "Exam-focused practice", "Structured weekly accountability", "Topic-by-topic catch-up", "Stretch and challenge", "Not sure yet"];

function updateArrayValue(current: string[], value: string) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-black text-secondary">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        className="rounded-2xl border border-secondary/10 bg-surface px-4 py-3.5 font-bold outline-none transition-colors placeholder:text-secondary/25 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-black text-secondary">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={placeholder}
        className="resize-none rounded-2xl border border-secondary/10 bg-surface px-4 py-3.5 font-bold leading-7 outline-none transition-colors placeholder:text-secondary/25 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function OptionGrid({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: string[];
  selected: string | string[];
  onToggle: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const isSelected = Array.isArray(selected) ? selected.includes(option) : selected === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm font-black leading-6 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
              isSelected
                ? "border-primary/35 bg-primary/10 text-primary shadow-sm"
                : "border-secondary/10 bg-white text-secondary/65 hover:border-primary/20 hover:text-secondary"
            }`}
          >
            {multi && <span className="mr-2 text-primary">{isSelected ? "✓" : "+"}</span>}
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function FreeAssessmentForm() {
  const [state, formAction, isPending] = useActionState(requestFreeAssessment, initialState);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<IntakeValues>(defaultValues);
  const hasStartedRef = useRef(false);
  const lastTrackedMessageRef = useRef("");
  const currentStep = steps[step];

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  useEffect(() => {
    if (!state.message || state.message === lastTrackedMessageRef.current) {
      return;
    }

    lastTrackedMessageRef.current = state.message;
    trackEvent(state.status === "success" ? "free_assessment_submit_success" : "free_assessment_submit_error", {
      source: "free_assessment_page",
      subject: values.subject,
      curriculum: values.curriculum,
    });
  }, [state.message, state.status, values.curriculum, values.subject]);

  const updateValue = <K extends keyof IntakeValues>(key: K, value: IntakeValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    handleStart();
  };

  const handleStart = () => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    trackEvent("free_assessment_start", {
      source: "free_assessment_page",
    });
  };

  const handleSubmitCapture = (_event: FormEvent<HTMLFormElement>) => {
    trackEvent("free_assessment_submit_attempt", {
      source: "free_assessment_page",
      subject: values.subject,
      curriculum: values.curriculum,
    });
  };

  if (state.status === "success") {
    return (
      <section className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-xl shadow-secondary/5 md:p-9">
        <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#06172f,#0a4d95)] p-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">Assessment request received</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">We have enough to begin thoughtfully.</h2>
          <p className="mt-4 leading-7 text-white/70">
            {state.message}
          </p>
        </div>

        {state.summary && (
          <div className="mt-7 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-secondary/10 bg-surface p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Recommended support direction</p>
              <h3 className="mt-3 text-2xl font-black leading-tight text-secondary">{state.summary.recommendedDirection}</h3>
              <p className="mt-4 text-sm font-bold leading-7 text-secondary/58">
                This is not a final diagnosis. It gives the assessment call a clearer starting point.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl border border-secondary/10 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary/35">Support areas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {state.summary.supportAreas.map((area) => (
                    <span key={area} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-secondary/10 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary/35">Likely next steps</p>
                <ul className="mt-3 grid gap-2">
                  {state.summary.nextSteps.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-bold leading-6 text-secondary/60">
                      <span className="text-primary">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <form action={formAction} onSubmitCapture={handleSubmitCapture} onChange={handleStart} onFocus={handleStart} className="rounded-[2rem] border border-secondary/10 bg-white p-6 shadow-xl shadow-secondary/5 md:p-9">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{currentStep.eyebrow}</p>
          <p className="text-xs font-black text-secondary/35">{progress}%</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight text-secondary">{currentStep.title}</h2>
        <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-secondary/52">{currentStep.microcopy}</p>
      </div>

      <input type="hidden" name="parentName" value={values.parentName} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="whatsapp" value={values.whatsapp} />
      <input type="hidden" name="studentName" value={values.studentName} />
      <input type="hidden" name="studentYear" value={values.studentYear} />
      <input type="hidden" name="curriculum" value={values.curriculum} />
      <input type="hidden" name="subject" value={values.subject} />
      <input type="hidden" name="weakTopics" value={values.weakTopics} />
      <input type="hidden" name="targetGrade" value={values.targetGrade} />
      <input type="hidden" name="upcomingExams" value={values.upcomingExams} />
      <input type="hidden" name="hardestAreas" value={values.hardestAreas.join(", ")} />
      <input type="hidden" name="challenge" value={values.challenge} />
      <input type="hidden" name="studyConcerns" value={values.studyConcerns.join(", ")} />
      <input type="hidden" name="goalsTimeline" value={values.goalsTimeline} />
      <input type="hidden" name="supportStyle" value={values.supportStyle} />
      <input type="hidden" name="preferredTime" value={values.preferredTime} />
      <input type="hidden" name="message" value={values.message} />

      {state.status === "error" && state.message && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {state.message}
        </div>
      )}

      <div className="min-h-[27rem]">
        {step === 0 && (
          <div className="grid gap-6">
            <TextField label="Student name" value={values.studentName} onChange={(value) => updateValue("studentName", value)} />
            <TextField label="Student year/grade" value={values.studentYear} onChange={(value) => updateValue("studentYear", value)} placeholder="Year 10, Grade 11, IB Year 1..." />
            <div>
              <p className="mb-3 text-sm font-black text-secondary">Curriculum</p>
              <OptionGrid options={curriculumOptions} selected={values.curriculum} multi={false} onToggle={(value) => updateValue("curriculum", value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="Subject support needed" value={values.subject} onChange={(value) => updateValue("subject", value)} placeholder="Physics, Chemistry, Maths..." />
              <TextField label="Target grade or goal" value={values.targetGrade} onChange={(value) => updateValue("targetGrade", value)} placeholder="A*, 7, improve confidence..." />
            </div>
            <TextAreaField label="Weak topics or recent difficulty" value={values.weakTopics} onChange={(value) => updateValue("weakTopics", value)} placeholder="Forces, organic chemistry, exam questions, practical writeups..." />
            <TextField label="Upcoming exams or important dates" value={values.upcomingExams} onChange={(value) => updateValue("upcomingExams", value)} placeholder="Mocks in March, IB exams, GCSE summer..." />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-7">
            <div>
              <p className="mb-3 text-sm font-black text-secondary">What feels hardest for your child right now?</p>
              <OptionGrid options={hardestAreaOptions} selected={values.hardestAreas} onToggle={(value) => updateValue("hardestAreas", updateArrayValue(values.hardestAreas, value))} />
            </div>
            <TextAreaField label="What made you feel support may be needed now?" value={values.challenge} onChange={(value) => updateValue("challenge", value)} placeholder="Tell us what you have noticed recently, in schoolwork, revision, tests, or confidence." />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-7">
            <div>
              <p className="mb-3 text-sm font-black text-secondary">Which study habits or concerns sound familiar?</p>
              <OptionGrid options={studyConcernOptions} selected={values.studyConcerns} onToggle={(value) => updateValue("studyConcerns", updateArrayValue(values.studyConcerns, value))} />
            </div>
            <p className="rounded-3xl border border-primary/10 bg-primary/5 p-5 text-sm font-bold leading-7 text-secondary/60">
              These choices help us understand whether the main barrier is confidence, routine, exam pressure, or accountability.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-7">
            <div>
              <p className="mb-3 text-sm font-black text-secondary">What kind of support would fit best?</p>
              <OptionGrid options={supportStyleOptions} selected={values.supportStyle} multi={false} onToggle={(value) => updateValue("supportStyle", value)} />
            </div>
            <TextAreaField label="What would a successful next few months look like?" value={values.goalsTimeline} onChange={(value) => updateValue("goalsTimeline", value)} placeholder="Confidence, exam readiness, consistency, better topic understanding..." />
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="Parent name" value={values.parentName} onChange={(value) => updateValue("parentName", value)} />
              <TextField label="Email" value={values.email} onChange={(value) => updateValue("email", value)} type="email" />
              <TextField label="WhatsApp number" value={values.whatsapp} onChange={(value) => updateValue("whatsapp", value)} type="tel" />
              <TextField label="Preferred assessment time" value={values.preferredTime} onChange={(value) => updateValue("preferredTime", value)} placeholder="Weekday evenings, Saturday mornings..." />
            </div>
            <TextAreaField label="Anything else we should know? (optional)" value={values.message} onChange={(value) => updateValue("message", value)} placeholder="Tutor preference, school context, wellbeing notes, previous tutoring experience..." />
            <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5">
              <p className="text-sm font-black text-secondary">What happens next?</p>
              <p className="mt-2 text-sm font-bold leading-7 text-secondary/58">
                We review the intake before the assessment call, then discuss confidence, subject gaps, tutor fit, and a realistic support plan.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-secondary/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || isPending}
          className="rounded-2xl border border-secondary/10 bg-white px-5 py-3 text-sm font-black text-secondary/60 transition-colors hover:border-secondary/20 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              handleStart();
              setStep((current) => Math.min(steps.length - 1, current + 1));
            }}
            className="rounded-2xl bg-secondary px-7 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-secondary/10 transition-all hover:-translate-y-0.5 hover:bg-secondary/90"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-primary px-7 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Sending Intake..." : "Request Assessment"}
          </button>
        )}
      </div>

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
