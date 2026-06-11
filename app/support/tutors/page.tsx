import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import CopyCaptionButton from "@/components/CopyCaptionButton";
import { siteUrl } from "@/lib/seo";
import { buildTutorReadiness, type TutorReadinessResult } from "@/lib/tutor-readiness";
import { getAvailabilityByTutorId, getBookingsByUserId, getTutorById } from "@/lib/supabase-queries";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

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

const firstStudentActions = [
  {
    label: "Step 1",
    title: "Complete Profile",
    body: "Make your photo, bio, subjects, video, availability, and payout setup feel ready for families.",
    href: "/dashboard/tutor/settings",
    cta: "Complete Profile",
  },
  {
    label: "Step 2",
    title: "Share Mentor Profile",
    body: "Download your ScienceDojo mentor card and share it with parents, students, and local groups.",
    href: "/dashboard/tutor/settings",
    cta: "Open Share Tools",
  },
  {
    label: "Step 3",
    title: "Receive Enquiries",
    body: "Parents can visit your mentor profile, ask before booking, or request a trial lesson.",
    href: "/dashboard/tutor/schedule?tab=requests",
    cta: "Review Requests",
  },
];

const teachingTimeline = [
  {
    icon: "📅",
    title: "Booking",
    body: "Accept a lesson request.",
  },
  {
    icon: "🎓",
    title: "Lesson",
    body: "Teach the agreed goal.",
  },
  {
    icon: "📝",
    title: "Record",
    body: "Summarize learning.",
  },
  {
    icon: "🎯",
    title: "Practice",
    body: "Assign Missions when useful.",
  },
  {
    icon: "📈",
    title: "Progress",
    body: "Help families see growth.",
  },
];

const paymentTimeline = [
  "Connect Payouts",
  "Teach Lessons",
  "Complete Records",
  "Receive Payout",
];

const reputationTimeline = [
  "First Lesson",
  "Student Success",
  "Review",
  "More Profile Visits",
  "More Bookings",
];

const sharingFlow = [
  "Complete your profile",
  "Download your mentor card",
  "Share it with your network",
  "Parents visit your mentor profile",
  "Parents ask a question or book a trial lesson",
];

const shareGroups = [
  {
    title: "WhatsApp",
    items: ["WhatsApp Status", "Family chats", "Local parent groups"],
  },
  {
    title: "Facebook",
    items: ["Timeline", "Parent Groups", "Community Groups"],
  },
  {
    title: "Instagram",
    items: ["Story", "Feed", "Highlights"],
  },
  {
    title: "LinkedIn",
    items: ["Profile post", "Professional network", "Alumni groups"],
  },
  {
    title: "Parent/community groups",
    items: ["School alumni groups", "Neighborhood groups", "Subject communities"],
  },
];

const suggestedShareCaption =
  "If your child needs support with Physics, Mathematics, or exam preparation, you can view my ScienceDojo mentor profile below. Feel free to ask a question before booking a lesson.";

type TutorSuccessPersonalization = {
  name: string;
  readiness: TutorReadinessResult;
};

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Tutor";
}

async function getTutorSuccessPersonalization(): Promise<TutorSuccessPersonalization | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "tutor") return null;

  const [tutorData, slots, bookings] = await Promise.all([
    getTutorById(user.id),
    getAvailabilityByTutorId(user.id),
    getBookingsByUserId(user.id),
  ]);

  const { data: application } = await supabase
    .from("applications")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: tutorStripe } = await supabase
    .from("tutors")
    .select("stripe_onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  const adminClient = createAdminClient();
  let { data: reviewRows, error: reviewError } = await adminClient
    .from("reviews")
    .select("status")
    .eq("tutor_id", user.id);

  if (
    reviewError?.code === "42703" ||
    reviewError?.message?.includes("reviews.status")
  ) {
    const fallbackReviews = await adminClient
      .from("reviews")
      .select("id")
      .eq("tutor_id", user.id);

    reviewRows = (fallbackReviews.data || []).map(() => ({ status: "approved" }));
  }

  const publicReviewCount =
    reviewRows?.filter((review: any) => review.status === "approved").length || 0;
  const completedLessonCount = bookings.filter((booking) => booking.status === "completed").length;
  const readiness = buildTutorReadiness({
    tutor: tutorData,
    applicationData: asRecord(application?.data),
    availabilitySlots: slots,
    stripeOnboardingComplete: Boolean((tutorStripe as any)?.stripe_onboarding_complete),
    publicReviewCount,
    bookingRequestCount: bookings.length,
    completedLessonCount,
  });

  return {
    name: tutorData?.full_name || profile?.full_name || user.user_metadata?.full_name || "Tutor",
    readiness,
  };
}

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

export default async function TutorSupportPage() {
  const personalization = await getTutorSuccessPersonalization();
  const readiness = personalization?.readiness;
  const recommendedAction = readiness?.recommendedNextAction;
  const nextActionHref =
    recommendedAction?.cta.href ||
    (recommendedAction?.cta.action === "availability" ? "/dashboard/tutor" : "/dashboard/tutor/settings");
  const personalizedLaunchSteps = readiness?.items.map((item) => ({
    label: item.label,
    completed: item.completed,
    helper: item.helper,
  }));

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
              {personalization ? `Welcome, ${firstName(personalization.name)}` : "Tutor Success Center"}
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-secondary/65">
              {readiness
                ? `Your tutor profile is ${readiness.percent}% ready. Complete the next step before students can confidently book lessons.`
                : "Welcome. Let's get you ready to teach on ScienceDojo."}
            </p>
            <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-secondary/50">
              {recommendedAction
                ? `${recommendedAction.title}: ${recommendedAction.body}`
                : "Complete the launch steps, learn the teaching workflow, and know where to go next without reading a wall of documentation."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={readiness ? nextActionHref : "/dashboard/tutor/settings"} className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-black text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-hover">
                {recommendedAction?.cta.label || "Complete Profile"}
              </Link>
              <Link href="#get-first-student" className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/10 bg-white px-6 text-sm font-black text-secondary/65 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary">
                Get First Student
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-secondary/10 bg-white/90 p-5 shadow-2xl shadow-secondary/8 backdrop-blur md:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-secondary/8 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">
                  Launch Status
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  {readiness ? `${readiness.percent}% Ready` : "What should I do next?"}
                </h2>
              </div>
              <Logo className="text-xl" dotClassName="h-1.5 w-1.5" />
            </div>
            {readiness && (
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-700"
                  style={{ width: `${readiness.percent}%` }}
                />
              </div>
            )}
            <div className="mt-5 rounded-2xl bg-primary/5 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/60">Next Goal</p>
              <p className="mt-1 text-lg font-black tracking-tight text-secondary">🎯 Get Your First Student</p>
            </div>
            <div className="mt-5 grid gap-2">
              {(personalizedLaunchSteps || launchSteps.map((step) => ({ label: step, completed: false }))).map((step, index) => (
                <div key={step.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ring-1 ${
                    step.completed
                      ? "bg-primary text-white ring-primary"
                      : "bg-white text-primary ring-primary/10"
                  }`}>
                    {step.completed ? "✓" : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-secondary">{step.label}</span>
                    {"helper" in step && step.helper ? (
                      <span className="mt-0.5 block text-xs font-semibold leading-5 text-secondary/45">{step.helper}</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
            {readiness ? (
              <div className="mt-4 rounded-2xl bg-primary/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/60">Recommended next step</p>
                <p className="mt-1 text-sm font-black text-secondary">{readiness.recommendedNextAction.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-secondary/52">{readiness.recommendedNextAction.body}</p>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-primary/5 px-4 py-3 text-sm font-semibold leading-6 text-secondary/60">
                These are the same actions that help your profile feel ready, trustworthy, and easy for families to understand.
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <section id="get-first-student" className="scroll-mt-24">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">STEP 1</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Prepare, share, then receive enquiries.</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-secondary/55">
              Parents discover tutors through mentor profiles. Complete the basics, share your ScienceDojo card, and guide families toward a question or trial lesson.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {firstStudentActions.map((action, index) => (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/8 md:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/6 text-sm font-black text-primary">
                    {index + 1}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-secondary/42">
                    {action.label}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-black tracking-tight text-secondary">{action.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-secondary/55">{action.body}</p>
                <span className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.12em] text-primary transition-transform group-hover:translate-x-1">
                  {action.cta} →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-primary/10 bg-primary/5 p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/70">Why share?</p>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-secondary/60">
              Parents often discover tutors through mentor profiles, WhatsApp recommendations, social media, and local community groups. Sharing your mentor profile helps families learn about your teaching style and contact you before booking.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-[1.75rem] border border-primary/10 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-2xl">📣</span>
                  <h3 className="mt-5 text-2xl font-black tracking-tight text-secondary">Share Your Mentor Profile</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-secondary/58">
                    Download your ScienceDojo share card and post it on WhatsApp, Facebook, Instagram, LinkedIn, or local parent groups.
                  </p>
                </div>
                <Link href="/dashboard/tutor/settings" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5">
                  Open Share Tools →
                </Link>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">How tutors get bookings</p>
                <div className="mt-4 grid gap-2">
                  {sharingFlow.map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-xl bg-white px-3 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/8 text-xs font-black text-primary">{index + 1}</span>
                      <span className="text-sm font-black text-secondary">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-secondary/8 bg-white p-5 shadow-sm md:p-6">
              <div className="rounded-2xl border border-secondary/8 bg-slate-50/70 p-4">
                <p className="text-sm font-black text-secondary">Where to share</p>
                <div className="mt-3 grid gap-2">
                  {shareGroups.map((group) => (
                    <details key={group.title} className="group rounded-xl bg-white px-3 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-black text-secondary/70">
                        {group.title}
                        <span className="text-primary transition-transform group-open:rotate-180">⌄</span>
                      </summary>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <span key={item} className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-secondary/50">
                            {item}
                          </span>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/60">Suggested caption</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-secondary/62">{suggestedShareCaption}</p>
                <div className="mt-4">
                  <CopyCaptionButton caption={suggestedShareCaption} />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,#06172f_0%,#0b4b93_64%,#0066ff_100%)] p-6 text-white shadow-2xl shadow-secondary/15 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">STEP 2</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Deliver Great Lessons</h2>
              <h3 className="mt-4 text-lg font-black text-cyan-100">The ScienceDojo Lesson Flow</h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-white/68">
                ScienceDojo lessons work best when each session connects to a clear goal, a helpful record, and visible next steps for the family.
              </p>
            </div>
            <div className="grid gap-3">
              {teachingTimeline.map((step, index) => (
                <details key={step.title} className="group rounded-2xl border border-white/10 bg-white/10 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12 text-lg">{step.icon}</span>
                      <span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100/70">Step {index + 1}</span>
                        <span className="block text-base font-black">{step.title}</span>
                      </span>
                    </span>
                    <span className="text-cyan-100 transition-transform group-open:rotate-180">⌄</span>
                  </summary>
                  <p className="mt-3 pl-12 text-sm font-semibold leading-6 text-white/68">{step.body}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.75rem] border border-secondary/8 bg-white p-5 shadow-sm md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">STEP 3</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Grow Your Reputation</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-secondary/58">
              Strong reviews come from clear lessons, steady follow-through, and families knowing what progress looks like.
            </p>
            <div className="mt-5 grid gap-2">
              {reputationTimeline.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/8 text-xs font-black text-primary">{index + 1}</span>
                  <span className="text-sm font-black text-secondary">{step}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-secondary/8 bg-white p-5 shadow-sm md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">STEP 4</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Get Paid</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-secondary/58">
              Keep paid teaching organized by connecting payouts and completing the records that support transparent payments.
            </p>
            <div className="mt-5 grid gap-2">
              {paymentTimeline.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/8 text-xs font-black text-primary">{index + 1}</span>
                  <span className="text-sm font-black text-secondary">{step}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/tutor/earnings" className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.12em] text-primary transition-transform hover:translate-x-1">
              Open Earnings →
            </Link>
          </article>
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Resources &amp; Help</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Reference material when you need it.</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-secondary/55">
              Use the steps above to launch and grow. Use these guides whenever you need more detail.
            </p>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {guideCards.map((guide) => (
              <details key={guide.title} className="group rounded-[1.25rem] border border-secondary/8 bg-white p-4 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-primary/60">{guide.label}</span>
                    <span className="mt-1 block text-base font-black text-secondary">{guide.title}</span>
                  </span>
                  <span className="text-primary transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <p className="mt-3 text-sm font-medium leading-7 text-secondary/58">{guide.body}</p>
              </details>
            ))}
            {knowledgeGroups.map((group) => (
              <details key={group.title} className="group rounded-[1.25rem] border border-secondary/8 bg-white p-4 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-secondary">
                  {group.title}
                  <span className="text-primary transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm font-medium leading-6 text-secondary/58">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </details>
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
