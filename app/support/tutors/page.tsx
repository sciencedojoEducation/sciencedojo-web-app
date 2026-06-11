import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tutor Success Center | ScienceDojo",
  description:
    "A task-oriented tutor success center for launching your ScienceDojo profile, preparing for students, teaching lessons, and understanding payments and platform policies.",
  alternates: {
    canonical: `${siteUrl}/support/tutors`,
  },
};

const launchSteps = [
  "Add profile photo",
  "Complete your bio",
  "Upload introduction video",
  "Set availability",
  "Connect payouts",
  "Review public profile",
];

const quickActions = [
  {
    label: "Start here",
    title: "Build Your Profile",
    body: "Photo, bio, subjects, hourly rate, and the basics families look for first.",
    href: "/dashboard/tutor/settings",
    cta: "Complete Profile",
    icon: "👤",
  },
  {
    label: "Before your first lesson",
    title: "Introduction Video",
    body: "Learn how to record a short, clear intro that shows how you teach.",
    href: "#introduction-video",
    cta: "View Guide",
    icon: "🎥",
  },
  {
    label: "Start here",
    title: "Availability",
    body: "Set teaching hours students can request, and keep them realistic.",
    href: "/dashboard/tutor",
    cta: "Set Times",
    icon: "📅",
  },
  {
    label: "Before paid lessons",
    title: "Payments",
    body: "Connect payouts and understand how earnings are handled.",
    href: "/dashboard/tutor/earnings",
    cta: "Open Payments",
    icon: "💳",
  },
];

const guideCards = [
  {
    title: "How bookings work",
    label: "60-second walkthrough",
    body: "Students or parents send requests. You review the context, accept lessons you can teach well, and keep scheduling inside ScienceDojo.",
  },
  {
    title: "How lesson records work",
    label: "Before your first lesson",
    body: "After a lesson, write what happened, why it matters, and what should happen next. This creates parent confidence and student continuity.",
  },
  {
    title: "How homework and Missions connect",
    label: "Teaching workflow",
    body: "Use practice tasks and Missions when a student needs structure between sessions. Keep it focused, achievable, and linked to the lesson goal.",
  },
  {
    title: "How reviews build trust",
    label: "Helpful later",
    body: "ScienceDojo reviews student feedback before it appears publicly. Strong reviews come from clear teaching and consistent follow-through.",
  },
  {
    title: "How payouts work",
    label: "Before paid lessons",
    body: "Connect Stripe, complete lesson records, and keep platform payments on ScienceDojo so payouts stay organized and transparent.",
  },
];

const knowledgeGroups = [
  {
    title: "Getting Started",
    items: [
      "Complete the launch checklist before your first student enquiry.",
      "Use your first week to refine your profile, availability, and intro video.",
      "Keep all tutor setup steps inside the ScienceDojo dashboard.",
    ],
  },
  {
    title: "Teaching Workflow",
    items: [
      "Respond to booking requests promptly and only accept lessons you can reliably deliver.",
      "Use lesson records to explain what was covered and what happens next.",
      "Assign homework or Missions when they support real progress between sessions.",
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      "Keep communication supportive, professional, and inside ScienceDojo.",
      "Follow safeguarding expectations for all student interactions.",
      "Do not arrange private payments or lessons with families introduced through ScienceDojo.",
    ],
  },
  {
    title: "Payments",
    items: [
      "Connect Stripe before paid lessons begin.",
      "Payout timing can depend on payment processing and completed lesson records.",
      "Handle payment disputes, refunds, and booking questions through ScienceDojo support.",
    ],
  },
];

export default function TutorSupportPage() {
  return (
    <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_42%,#ffffff_100%)] text-secondary">
      <section className="relative overflow-hidden border-b border-secondary/10 px-4 py-10 md:px-8 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(0,102,255,0.09),transparent_30%),radial-gradient(circle_at_82%_24%,rgba(0,245,212,0.07),transparent_30%)]" />
        <div className="pointer-events-none absolute right-8 top-12 hidden h-40 w-40 rounded-full border border-primary/10 md:block" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs font-black uppercase tracking-[0.16em] text-secondary/40">
              <Link href="/" className="transition-colors hover:text-primary">Home</Link>
              <span className="mx-2" aria-hidden="true">&gt;</span>
              <span className="text-primary">Tutor Success Center</span>
            </nav>
            <div className="mt-8 inline-flex rounded-full border border-primary/10 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary shadow-sm">
              Start here
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-secondary md:text-6xl">
              Tutor Success Center
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-secondary/65">
              Welcome. Let&apos;s get you ready to teach on ScienceDojo.
            </p>
            <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-secondary/50">
              Complete the launch steps, learn the teaching workflow, and know where to go next without reading a wall of documentation.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/tutor/settings" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-black text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-hover">
                Complete Profile
              </Link>
              <Link href="#quick-actions" className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/10 bg-white px-6 text-sm font-black text-secondary/65 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary">
                See Next Steps
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-secondary/10 bg-white/90 p-5 shadow-2xl shadow-secondary/8 backdrop-blur md:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-secondary/8 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Tutor launch progress</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">What should I do next?</h2>
              </div>
              <Logo className="text-xl" dotClassName="h-1.5 w-1.5" />
            </div>
            <div className="mt-5 grid gap-2">
              {launchSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-primary ring-1 ring-primary/10">
                    {index + 1}
                  </span>
                  <span className="text-sm font-black text-secondary">{step}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-2xl bg-primary/5 px-4 py-3 text-sm font-semibold leading-6 text-secondary/60">
              These are the same actions that help your profile feel ready, trustworthy, and easy for families to understand.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <section id="quick-actions" className="scroll-mt-24">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Quick actions</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Start with the work that moves you forward.</h2>
            </div>
            <p className="max-w-lg text-sm font-semibold leading-6 text-secondary/55">
              These cards are ordered around tutor goals, not documentation categories.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/8"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/5 text-xl">{action.icon}</span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-secondary/40">
                    {action.label}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-black tracking-tight text-secondary">{action.title}</h3>
                <p className="mt-2 min-h-16 text-sm font-medium leading-6 text-secondary/55">{action.body}</p>
                <span className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.12em] text-primary transition-transform group-hover:translate-x-1">
                  {action.cta} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="introduction-video" className="mt-14 scroll-mt-24 rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,#06172f_0%,#0b4b93_64%,#0066ff_100%)] p-6 text-white shadow-2xl shadow-secondary/15 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">Before your first lesson</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Record a clear introduction video.</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-white/68">
                Keep it short: introduce yourself, name the subjects you teach, and explain one concept calmly. Parents are looking for clarity, not production value.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Introduce yourself", "Explain one concept", "Keep it calm"].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-2xl font-black text-cyan-100">0{index + 1}</p>
                  <p className="mt-3 text-sm font-black">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Short guides</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Learn the platform in small pieces.</h2>
            </div>
            <p className="max-w-lg text-sm font-semibold leading-6 text-secondary/55">
              Short written walkthroughs for now; these slots can become 60-second videos later.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guideCards.map((guide) => (
              <article key={guide.title} className="rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">{guide.label}</p>
                <h3 className="mt-3 text-xl font-black tracking-tight text-secondary">{guide.title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-secondary/58">{guide.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Knowledge base</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Helpful later, grouped by task.</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {knowledgeGroups.map((group) => (
              <article key={group.title} className="rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm md:p-6">
                <h3 className="text-xl font-black tracking-tight text-secondary">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm font-medium leading-6 text-secondary/58">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-secondary/8 bg-white p-6 text-center shadow-xl shadow-secondary/5 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary/35">Need help?</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-secondary">Return to your tutor workspace when you are ready.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-secondary/55">
            Your dashboard is where you complete profile setup, manage requests, set availability, and prepare for student enquiries.
          </p>
          <Link href="/dashboard/tutor" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-black text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-hover">
            Open Tutor Workspace
          </Link>
        </section>
      </main>
    </div>
  );
}
