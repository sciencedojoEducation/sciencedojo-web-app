import Link from "next/link";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import type { SeoPage } from "@/lib/seo";

const answerBlocks: Record<string, string> = {
  "online-math-tutor":
    "ScienceDojo provides online math tutoring for students who need clearer explanations, stronger practice, and better exam confidence. Tutors help learners rebuild foundations, understand methods, and use structured feedback so math becomes less stressful and more predictable.",
  "online-physics-tutor":
    "ScienceDojo online physics tutoring helps students connect concepts, equations, diagrams, and exam questions. Lessons focus on clear explanations, guided problem solving, and structured practice so students can apply physics ideas with more confidence.",
  "online-chemistry-tutor":
    "ScienceDojo online chemistry tutoring supports students with difficult concepts, calculations, reactions, and exam technique. Tutors use structured lessons, targeted practice, and active recall so chemistry feels more manageable before tests and final exams.",
  "gcse-math-tutor":
    "ScienceDojo GCSE math tutoring helps students repair topic gaps, practise exam questions, and build a calmer revision routine. Tutors focus on confidence, method selection, and feedback so students know exactly how to improve before mocks and GCSE exams.",
  "gcse-physics-tutor":
    "ScienceDojo GCSE physics tutoring helps students understand formulas, required practicals, graphs, and exam wording. Lessons combine concept repair, guided calculations, and exam-style practice so students can approach physics questions with more confidence.",
  "ib-physics-tutor":
    "ScienceDojo IB physics tutoring supports students with demanding concepts, data analysis, and multi-step problem solving. Tutors help learners turn abstract ideas into usable models while building the exam technique needed for HL and SL success.",
  "a-level-chemistry-tutor":
    "ScienceDojo A-Level chemistry tutoring helps students move from memorising content to applying it accurately. Tutors support organic, physical, and inorganic chemistry through clear teaching, recurring question patterns, and structured revision systems.",
  "online-math-tutor-germany":
    "ScienceDojo provides online math tutoring for families in Germany who want flexible English-language academic support. Students get clear explanations, structured practice, and tutor guidance without location limits or extra travel.",
  "online-math-tutor-berlin":
    "ScienceDojo online math tutoring helps Berlin students get specialist support from home. Lessons focus on confidence, school topics, exam preparation, and guided practice so families can access strong teaching without commuting.",
  "online-physics-tutor-uk":
    "ScienceDojo online physics tutoring supports UK students preparing for GCSE, IB, and advanced science study. Tutors focus on understanding, calculations, exam technique, and steady practice so students can build confidence from home.",
};

const struggleBlocks: Record<string, string[]> = {
  "online-math-tutor": ["Missing basics make new topics feel impossible.", "Students often copy methods without understanding why they work.", "Exam questions feel harder when practice is not targeted."],
  "online-physics-tutor": ["Abstract ideas can feel disconnected from equations.", "Students lose marks by choosing the wrong formula or units.", "Graphs, diagrams, and wording can hide what the question is asking."],
  "online-chemistry-tutor": ["Chemical ideas can feel like memorisation without meaning.", "Calculations become stressful when steps are unclear.", "Exam wording often requires precise scientific language."],
  "gcse-math-tutor": ["Small topic gaps build up across the GCSE course.", "Students may know a method but panic under timed conditions.", "Revision can become too broad without a clear error log."],
  "gcse-physics-tutor": ["Equations are often memorised without understanding.", "Required practical questions need specific exam language.", "Students struggle to connect theory with unfamiliar contexts."],
  "ib-physics-tutor": ["IB questions often combine several ideas at once.", "Data questions require careful interpretation, not just formulas.", "Students need deeper conceptual confidence for HL and SL problems."],
  "a-level-chemistry-tutor": ["Mechanisms and calculations demand accurate multi-step thinking.", "Students can lose marks through imprecise terminology.", "Long courses make revision hard without a structured plan."],
  "online-math-tutor-germany": ["International students may be balancing different school expectations.", "Math confidence can drop when explanations move too quickly.", "Families need flexible support that fits busy schedules."],
  "online-math-tutor-berlin": ["Travel time can make regular support harder to maintain.", "Students need consistent practice between lessons.", "Confidence drops when topic gaps are not repaired early."],
  "online-physics-tutor-uk": ["GCSE and advanced physics questions reward precise working.", "Students often need help applying ideas to new contexts.", "Revision can feel scattered without exam-style practice."],
};

const methodSteps = [
  "Start with a free 30-minute learning assessment.",
  "Create a personalized tutoring plan around goals and gaps.",
  "Run expert online lessons with clear explanations.",
  "Set structured practice so learning continues after class.",
  "Track progress through bookings, tasks, and lesson history.",
  "Use AI-supported study tools where they genuinely help practice.",
];

export function AssessmentCTA({ className = "" }: { className?: string }) {
  return (
    <BookAssessmentLink
      className={`inline-flex justify-center rounded-2xl bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-hover ${className}`}
      source="seo_page_cta"
    >
      Book Free Assessment
    </BookAssessmentLink>
  );
}

export function SeoAnswerBlock({ page }: { page: SeoPage }) {
  return (
    <aside className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-md">
      <h2 className="text-xl font-black">Quick answer</h2>
      <p className="mt-4 text-base leading-7 text-white/80">{answerBlocks[page.slug] || page.directAnswer}</p>
    </aside>
  );
}

export function StudentStrugglesSection({ page }: { page: SeoPage }) {
  const struggles = struggleBlocks[page.slug];

  if (!struggles) {
    return null;
  }

  return (
    <section className="border-y border-secondary/10 bg-white px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Why students struggle</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">The problem is usually not effort.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {struggles.map((struggle) => (
            <div key={struggle} className="rounded-2xl border border-secondary/10 bg-surface p-6 shadow-sm">
              <h3 className="font-black leading-7">{struggle}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ScienceDojoMethodSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">How ScienceDojo helps</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">A clear path from assessment to progress.</h2>
          <p className="mt-5 leading-7 text-secondary/65">
            Parents get a practical next step, students get focused teaching, and every lesson connects back to confidence, practice, and progress.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {methodSteps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">{index + 1}</div>
              <h3 className="font-black leading-7">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  const trustItems = [
    "10+ years teaching experience",
    "British and international curricula",
    "Personalized online tutoring",
    "Free 30-minute learning assessment",
  ];

  return (
    <section className="bg-secondary px-4 py-14 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* TODO: Insert real approved parent/student testimonials and case studies once ScienceDojo has permission to publish them. */}
        <div className="grid gap-4 md:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="font-black leading-7">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AiPracticeStudioSeoCta({ page }: { page: SeoPage }) {
  const subject = page.h1.includes("Physics")
    ? "Physics"
    : page.h1.includes("Chemistry")
      ? "Chemistry"
      : page.h1.includes("Math")
        ? "Maths"
        : "study";

  return (
    <section className="border-y border-secondary/10 bg-white px-4 py-12 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl bg-surface p-7 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">AI Practice Studio</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">
            {subject === "study" ? "Generate targeted practice questions by topic." : `Generate ${subject} practice questions by topic.`}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-secondary/60">
            Practicing after reading this page? Create curriculum-aligned revision support instantly.
          </p>
        </div>
        <AiPracticeStudioCtaLink
          href="/ai-practice-studio"
          cta="try_free_tool"
          source={`seo_${page.slug}`}
          className="inline-flex justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-primary-hover"
        >
          Try Free Tool
        </AiPracticeStudioCtaLink>
      </div>
    </section>
  );
}

export function InternalLinksSection({ pages }: { pages: SeoPage[] }) {
  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/50">Helpful next reads</h3>
      <div className="mt-4 flex flex-col gap-3">
        {pages.map((related) => (
          <Link key={related.slug} href={`/${related.slug}`} className="font-bold text-white/85 hover:text-white">
            {related.h1}
          </Link>
        ))}
        <Link href="/ai-practice-studio" className="font-bold text-white/85 hover:text-white">
          AI Practice Studio
        </Link>
        <BookAssessmentLink source="seo_internal_link" className="font-bold text-white/85 hover:text-white">
          Book Free Assessment
        </BookAssessmentLink>
      </div>
    </div>
  );
}
