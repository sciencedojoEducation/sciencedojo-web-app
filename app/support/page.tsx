import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Parent & Student Success Center | ScienceDojo",
  description:
    "A public learning guide for families and students using ScienceDojo to understand lessons, progress, practice, dashboards, and support.",
  alternates: {
    canonical: `${siteUrl}/support`,
  },
};

const journey = [
  "Start Learning",
  "Meet Your Tutor",
  "Learn",
  "Practice",
  "Grow",
];

const orientationCards = [
  {
    eyebrow: "New here?",
    title: "Book First Lesson",
    body: "Start with a tutor profile, a question, or a first lesson request.",
    href: "/dashboard/parent/tutors",
  },
  {
    eyebrow: "Need help choosing?",
    title: "Browse Tutors",
    body: "Compare subject fit, teaching style, and availability before deciding.",
    href: "/dashboard/parent/tutors",
  },
  {
    eyebrow: "Not sure where to start?",
    title: "Free Assessment",
    body: "Tell us what feels difficult and use that to choose the next step.",
    href: "/free-assessment",
  },
];

const chapters = [
  {
    label: "Chapter 1",
    title: "Start Learning",
    intro:
      "Begin with the support need, not the platform. ScienceDojo helps families move from uncertainty to a clear first learning step.",
    takeaway: "Start with one clear need: a subject, a confidence gap, or a question you want help answering.",
    topics: [
      {
        title: "Find the right tutor",
        body: "Browse verified tutor profiles and look for subject fit, teaching style, availability, and the kind of support your child needs now.",
      },
      {
        title: "Book your first lesson",
        body: "Request a lesson time that works for your family. Once the tutor accepts, you can confirm the booking and prepare for the session.",
      },
      {
        title: "Take a free assessment",
        body: "If you are not sure where to begin, use the assessment to describe strengths, worries, goals, and the support areas that feel unclear.",
      },
    ],
  },
  {
    label: "Chapter 2",
    title: "What Happens After Booking",
    intro:
      "After booking, the journey becomes simple: meet the tutor, focus the lesson, record what happened, and keep learning moving between sessions.",
    takeaway: "A good first lesson should leave everyone clearer about the next useful step.",
    topics: [
      {
        title: "Tutor match",
        body: "The tutor brings subject knowledge and teaching experience. Families bring context about confidence, goals, schoolwork, and what has felt difficult.",
      },
      {
        title: "Lesson",
        body: "Lessons work best when they focus on one clear goal. That might be understanding a topic, preparing for an exam, or rebuilding confidence.",
      },
      {
        title: "Learning record",
        body: "After lessons, records and notes help explain what was covered, why it mattered, and what should happen next.",
      },
      {
        title: "Practice and Missions",
        body: "Practice helps learning stay active after the lesson ends. Missions can turn tutor guidance into a structured pathway when available.",
      },
      {
        title: "Progress over time",
        body: "Progress often appears through steadier confidence, clearer explanations, stronger practice habits, and fewer repeated gaps.",
      },
    ],
  },
  {
    label: "Chapter 3",
    title: "Understanding Progress",
    intro:
      "Progress is not just a score. It is the growing picture of what your child understands, where they need support, and what should happen next.",
    takeaway: "Look for patterns in notes, focus areas, practice, and confidence rather than one single metric.",
    topics: [
      {
        title: "Lesson records",
        body: "Lesson records help families see what happened in plain language: what was taught, what was practised, and what the tutor noticed.",
      },
      {
        title: "Tutor feedback",
        body: "Tutor feedback can highlight strengths, areas to revisit, and practical recommendations for the next lesson or practice task.",
      },
      {
        title: "Current focus",
        body: "The current focus is the topic or skill that needs attention now. It may come from lesson notes, homework, Missions, or tutor observations.",
      },
      {
        title: "My child is struggling. What should I expect?",
        body: "Struggling does not mean failing. It often means the learning gap has become visible. The first goal is usually clarity, then confidence, then stronger independent practice.",
      },
      {
        title: "Progress over time",
        body: "Improvement becomes easier to see when lessons, notes, and practice connect over several weeks instead of being treated as separate events.",
      },
    ],
  },
  {
    label: "Chapter 4",
    title: "Learning Between Lessons",
    intro:
      "Progress grows between lessons, not only during lessons. Small, purposeful practice helps students hold on to what they learned.",
    takeaway: "Between-lesson work should feel useful and focused, not like extra noise.",
    topics: [
      {
        title: "Homework",
        body: "Homework gives the student a clear next activity from the tutor. It should connect to the lesson and help reinforce understanding.",
      },
      {
        title: "Missions",
        body: "Missions are structured practice pathways when available. They help students revisit ideas and turn weak spots into visible next steps.",
      },
      {
        title: "Practice",
        body: "Practice is most helpful when it is short, focused, and connected to a goal. Consistency matters more than doing too much at once.",
      },
      {
        title: "Independent learning",
        body: "As confidence grows, students should start recognising what they understand, what they need to ask, and what they can practise next.",
      },
    ],
  },
  {
    label: "Chapter 5",
    title: "Managing Your Learning Journey",
    intro:
      "Your dashboard is there to make learning easier to follow. It brings bookings, messages, classes, payments, and learning updates into one place.",
    takeaway: "Use the dashboard to stay oriented, not to manage every detail at once.",
    topics: [
      {
        title: "Dashboard",
        body: "The parent dashboard shows the learning status, support team, recent activity, next steps, and between-lesson work.",
      },
      {
        title: "Messages",
        body: "Use messages to keep learning questions inside ScienceDojo so support stays visible and easy to follow.",
      },
      {
        title: "Classes",
        body: "Class spaces help organise lesson context, homework, Missions, and learning records where available.",
      },
      {
        title: "Bookings and payments",
        body: "Bookings show requested, confirmed, and completed lessons. Payment prompts appear when a tutor has accepted a lesson that needs confirmation.",
      },
      {
        title: "Working with your tutor",
        body: "Share useful context, ask questions early, and agree on a rhythm that fits your child. Some students need weekly support; others need targeted help before exams.",
      },
      {
        title: "Settings",
        body: "Settings help keep account and learner details up to date so communication and learning records stay accurate.",
      },
    ],
  },
  {
    label: "Chapter 6",
    title: "When You Need Help",
    intro:
      "Questions are normal. ScienceDojo support is here when scheduling, payments, technology, tutor fit, or safety concerns feel unclear.",
    takeaway: "When something blocks learning, ask for help early so the next step stays calm.",
    topics: [
      {
        title: "Scheduling help",
        body: "If a lesson time, request, or booking status is confusing, contact support with the lesson details and account email.",
      },
      {
        title: "Payment questions",
        body: "For invoices, checkout, refunds, or payment confirmation questions, include the booking details so the team can investigate quickly.",
      },
      {
        title: "Technical support",
        body: "If the classroom, dashboard, messages, or account access does not work as expected, tell us what device and browser you are using.",
      },
      {
        title: "General enquiries",
        body: "If you are unsure which route to take, ask. ScienceDojo can help you understand whether the next step is a tutor, assessment, lesson, or support conversation.",
      },
      {
        title: "Safeguarding and trust",
        body: "Keep communication and payments inside ScienceDojo. If anything feels uncomfortable or unsafe, contact ScienceDojo support immediately.",
      },
    ],
  },
];

const expectations = [
  {
    title: "Expert guidance",
    body: "Tutors are selected for subject knowledge, teaching judgement, and the ability to support students clearly.",
  },
  {
    title: "Personalised support",
    body: "Learning support should respond to the student’s goals, confidence, curriculum, and current focus.",
  },
  {
    title: "Learning between lessons",
    body: "Homework, Missions, and practice help make lessons part of a wider learning journey.",
  },
  {
    title: "Progress visibility",
    body: "Lesson records and tutor feedback help families understand what happened and what should happen next.",
  },
  {
    title: "A human support team",
    body: "When something is unclear, ScienceDojo support helps families find the next calm step.",
  },
];

export default function ParentSupportPage() {
  return (
    <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_48%,#ffffff_100%)] text-secondary">
      <section className="relative overflow-hidden border-b border-secondary/10 px-4 py-14 md:px-8 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,102,255,0.08),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(0,245,212,0.05),transparent_28%)]" />
        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-xs font-black uppercase tracking-[0.18em] text-secondary/40">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <span className="mx-2" aria-hidden="true">&gt;</span>
            <span className="text-primary">Parent &amp; Student Success Center</span>
          </nav>
          <div className="mt-8 inline-flex rounded-full border border-primary/10 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary shadow-sm">
            Learning guide
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Parent &amp; Student Success Center
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-secondary/65">
            Everything you need to understand how ScienceDojo supports learning, progress, and confidence.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/parent/tutors" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-black text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-hover">
              Browse Tutors
            </Link>
            <Link href="/free-assessment" className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/10 bg-white px-6 text-sm font-black text-secondary/65 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary">
              Free Assessment
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <section aria-label="Learning journey" className="rounded-[1.5rem] border border-primary/10 bg-white p-4 shadow-xl shadow-secondary/5 md:rounded-[2rem] md:p-5">
          <div className="grid gap-3 md:grid-cols-5 md:items-center">
            {journey.map((step, index) => (
              <div key={step} className="relative">
                {index > 0 && (
                  <span className="absolute -left-1.5 top-5 hidden h-px w-3 bg-secondary/10 md:block" aria-hidden="true" />
                )}
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-secondary/5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-primary shadow-sm">
                    {index + 1}
                  </span>
                  <span className="text-sm font-black text-secondary">{step}</span>
                </div>
                {index < journey.length - 1 && (
                  <div className="mx-6 h-4 border-l border-secondary/10 md:hidden" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {orientationCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/8"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">{card.eyebrow}</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-secondary">{card.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-secondary/55">{card.body}</p>
              <span className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.12em] text-primary">
                Open →
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-12 grid gap-5">
          {chapters.map((chapter) => (
            <article key={chapter.title} className="rounded-[1.75rem] border border-secondary/8 bg-white p-5 shadow-sm md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary/65">{chapter.label}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{chapter.title}</h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-secondary/60">{chapter.intro}</p>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {chapter.topics.map((topic) => (
                  <details key={topic.title} className="group rounded-[1.25rem] border border-secondary/8 bg-slate-50/70 p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="text-sm font-black text-secondary">{topic.title}</span>
                      <span className="text-primary transition-transform group-open:rotate-180">⌄</span>
                    </summary>
                    <p className="mt-3 text-sm font-medium leading-7 text-secondary/58">{topic.body}</p>
                  </details>
                ))}
              </div>
              <p className="mt-5 rounded-2xl bg-primary/5 px-4 py-3 text-sm font-bold leading-6 text-secondary/58">
                Next step: {chapter.takeaway}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,#ffffff_0%,#f4fbff_100%)] p-6 shadow-xl shadow-secondary/5 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary/65">What families can expect</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-secondary md:text-4xl">
            What Families Can Expect From ScienceDojo
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {expectations.map((item) => (
              <article key={item.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-secondary/5">
                <h3 className="text-sm font-black text-secondary">{item.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-secondary/52">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] bg-[linear-gradient(135deg,#06172f_0%,#0a4d95_58%,#0066ff_100%)] p-8 text-center shadow-2xl shadow-secondary/15 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/75">A calm first step</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Not sure where to begin?</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/65">
            Tell us what support feels unclear and use the free assessment to choose the next learning step with more confidence.
          </p>
          <Link
            href="/free-assessment"
            className="mt-7 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-black text-primary shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Free Assessment
          </Link>
        </section>
      </main>
    </div>
  );
}
