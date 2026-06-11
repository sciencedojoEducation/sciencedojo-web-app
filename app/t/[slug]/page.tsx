import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTutorBySlug } from "@/lib/supabase-queries";
import { siteUrl } from "@/lib/seo";
import MentorAttributionTracker from "@/components/MentorAttributionTracker";
import MentorActionLink from "@/components/MentorActionLink";
import MessageTutorButton from "@/components/MessageTutorButton";
import YouTubeLite from "@/components/YouTubeLite";
import { getRatingSummary, RatingTrustTooltip, StarRating } from "@/components/ReviewTrustUI";

type MentorProfilePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ r?: string; ask?: string }>;
};

type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

const scienceDojoReasons = [
  {
    title: "Personalised Support",
    body: "Every student receives guidance shaped around their learning needs, confidence, and goals.",
  },
  {
    title: "Verified Tutors",
    body: "ScienceDojo tutors are reviewed for subject strength, teaching approach, and student safety.",
  },
  {
    title: "Visible Progress",
    body: "Structured learning journeys help families understand the next step, not just the next lesson.",
  },
];

const learningFlow = [
  "Assessment",
  "Personalised Plan",
  "Weekly Lessons",
  "Practice & Missions",
  "Visible Progress",
];

const reassurance = [
  "No long-term commitment",
  "Online lessons from anywhere",
  "Verified ScienceDojo tutors",
  "Personalised learning support",
];

function getPrimarySubject(subjects: string[]) {
  return subjects?.[0] || "STEM";
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "your mentor";
}

function buildConfidenceAreas(subjects: string[]) {
  const primarySubject = getPrimarySubject(subjects);
  return [
    "Building confidence",
    "Exam preparation",
    "Structured learning",
    "High achievers",
    `${primarySubject} support`,
  ];
}

async function getApprovedReviews(tutorId: string) {
  const supabase = await createClient();
  const reviewSelect = "id, rating, comment, created_at, profiles(full_name, avatar_url)";
  const { data, error } = await supabase
    .from("reviews")
    .select(reviewSelect)
    .eq("tutor_id", tutorId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    if (error.code === "42703" || error.message?.includes("reviews.status")) {
      const fallback = await supabase
        .from("reviews")
        .select(reviewSelect)
        .eq("tutor_id", tutorId)
        .order("created_at", { ascending: false })
        .limit(6);
      return (fallback.data || []) as PublicReview[];
    }

    console.error("Mentor profile review fetch failed:", error.message);
    return [];
  }

  return (data || []) as PublicReview[];
}

export async function generateMetadata({ params }: MentorProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await getTutorBySlug(slug);

  if (!tutor) {
    return {
      title: "ScienceDojo Mentor Profile",
    };
  }

  const primarySubject = getPrimarySubject(tutor.subjects);
  const title = `${tutor.full_name} | ScienceDojo Mentor Profile`;
  const description = `Helping students gain confidence in ${primarySubject}. Meet ${tutor.full_name}, a verified ScienceDojo mentor.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/t/${tutor.slug || slug}`,
    },
    openGraph: {
      title: `Helping students gain confidence in ${primarySubject}.`,
      description,
      url: `${siteUrl}/t/${tutor.slug || slug}`,
      type: "profile",
      images: [
        {
          url: `/t/${tutor.slug || slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `ScienceDojo mentor profile for ${tutor.full_name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Need support with ${primarySubject}?`,
      description,
      images: [`/t/${tutor.slug || slug}/opengraph-image`],
    },
  };
}

export default async function MentorProfilePage({ params, searchParams }: MentorProfilePageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const tutor = await getTutorBySlug(slug);

  if (!tutor) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let viewerRole: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    viewerRole = profile?.role ?? null;
  }

  const reviews = await getApprovedReviews(tutor.id);
  const ratingSummary = getRatingSummary(Number(tutor.rating || 0), tutor.review_count || 0);
  const firstName = getFirstName(tutor.full_name);
  const primarySubject = getPrimarySubject(tutor.subjects);
  const confidenceAreas = buildConfidenceAreas(tutor.subjects);
  const mentorPath = `/t/${tutor.slug || slug}`;
  const askReturnPath = `${mentorPath}?ask=1`;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f6fbff_100%)]">
      <MentorAttributionTracker landingSlug={tutor.slug || slug} referrerSlug={query.r} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary shadow-sm">
              ScienceDojo Mentor Profile
            </div>
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-secondary sm:text-5xl lg:text-6xl">
                Your child understands more than their grades show.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-secondary/60 sm:text-lg">
                Every student learns differently. ScienceDojo tutors provide personalised support that builds confidence, understanding, and exam readiness.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <MentorActionLink
                href={`/tutor/${tutor.id}/book`}
                eventName="trial_lesson_clicked"
                eventParams={{ tutor_id: tutor.id, source: "mentor_profile_hero", subject: primarySubject }}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-black text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Book a Trial Lesson
              </MentorActionLink>
              <MessageTutorButton
                tutorId={tutor.id}
                tutorName={firstName}
                viewerRole={viewerRole}
                isAuthenticated={!!user}
                returnPath={askReturnPath}
                autoOpen={query.ask === "1"}
                label="Ask Before You Book"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/10 bg-white px-6 text-sm font-black text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary"
              />
              <MentorActionLink
                href={`/free-assessment?source=mentor_profile&tutor=${encodeURIComponent(tutor.slug || slug)}`}
                eventName="learning_check_started"
                eventParams={{ tutor_id: tutor.id, source: "mentor_profile_hero", subject: primarySubject }}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/10 bg-white px-6 text-sm font-black text-secondary/60 shadow-sm transition-all hover:-translate-y-0.5 hover:text-primary"
              >
                Take Learning Check
              </MentorActionLink>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-secondary/50">
              Meet your mentor, discuss learning goals, and see if ScienceDojo is the right fit.
            </p>
          </div>

          <div className="rounded-[2rem] border border-secondary/10 bg-white p-5 shadow-xl shadow-primary/5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[1.75rem] border-4 border-white bg-slate-100 shadow-lg">
                <Image
                  src={tutor.avatar_url || "/tutor_placeholder.webp"}
                  alt={tutor.full_name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Meet your mentor</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-secondary">{tutor.full_name}</h2>
                <p className="mt-2 text-sm font-bold text-secondary/55">
                  Helping students gain confidence in {primarySubject}.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StarRating rating={Number(tutor.rating || 0)} size="sm" muted={tutor.review_count <= 0} />
                  <span className="text-sm font-black text-secondary">{ratingSummary.title}</span>
                  <span className="text-xs font-semibold text-secondary/40">{ratingSummary.detail}</span>
                  <RatingTrustTooltip />
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {tutor.subjects.slice(0, 6).map((subject) => (
                <span key={subject} className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs font-black text-primary/70">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {scienceDojoReasons.map((reason) => (
            <article key={reason.title} className="rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-secondary">{reason.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-secondary/55">{reason.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,#ffffff_0%,#eff8ff_100%)] p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">How ScienceDojo supports learning</p>
              <h2 className="mt-2 text-2xl font-black text-secondary">A structured path, not just another lesson.</h2>
            </div>
            <div className="grid flex-1 gap-2 sm:grid-cols-5">
              {learningFlow.map((step, index) => (
                <div key={step} className="rounded-2xl border border-white bg-white/80 px-3 py-3 text-center shadow-sm">
                  <p className="text-[10px] font-black text-primary/50">{index + 1}</p>
                  <p className="mt-1 text-xs font-black leading-5 text-secondary">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-8">
            {tutor.youtube_intro_url && (
              <section className="rounded-[2rem] border border-secondary/8 bg-white p-4 shadow-sm">
                <YouTubeLite url={tutor.youtube_intro_url} />
              </section>
            )}

            <section className="rounded-[2rem] border border-secondary/8 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Meet {firstName}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-secondary">A verified ScienceDojo mentor for {primarySubject} support.</h2>
              <p className="mt-4 text-base font-semibold leading-8 text-secondary/60">{tutor.bio}</p>
            </section>

            <section className="rounded-[2rem] border border-secondary/8 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-secondary">What Parents Value</h2>
              {reviews.length > 0 ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {reviews.slice(0, 4).map((review) => (
                    <article key={review.id} className="rounded-2xl border border-secondary/8 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-secondary">{review.profiles?.full_name || "ScienceDojo parent"}</p>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-secondary/60">
                        {review.comment || "This verified lesson review helped build confidence in the learning journey."}
                      </p>
                      <span className="mt-3 inline-flex rounded-full border border-primary/10 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-primary/60">
                        Verified lesson review
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-secondary/10 bg-slate-50/70 p-5">
                  <h3 className="font-black text-secondary">No public parent stories yet</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-secondary/50">
                    {firstName} is still building their ScienceDojo public review profile. Every published review is checked before appearing publicly.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-[2rem] border border-secondary/10 bg-secondary p-6 text-white shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100/60">Parent Confidence Areas</p>
              <div className="mt-5 grid gap-2">
                {confidenceAreas.map((area) => (
                  <div key={area} className="flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-black text-secondary">✓</span>
                    <span className="text-sm font-bold text-white/85">{area}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-lg shadow-primary/5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-secondary">£{tutor.hourly_rate}</span>
                <span className="text-sm font-black uppercase tracking-[0.12em] text-secondary/35">/hr</span>
              </div>
              <div className="mt-5 grid gap-2">
                {reassurance.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-bold text-secondary/60">
                    <span className="text-primary">✓</span>
                    {item}
                  </div>
                ))}
              </div>
              <MentorActionLink
                href={`/tutor/${tutor.id}/book`}
                eventName="trial_lesson_clicked"
                eventParams={{ tutor_id: tutor.id, source: "mentor_profile_sidebar", subject: primarySubject }}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Book a Trial Lesson
              </MentorActionLink>
              <p className="mt-3 text-center text-xs font-semibold leading-5 text-secondary/45">
                Meet your mentor, discuss learning goals, and see if ScienceDojo is the right fit.
              </p>
            </section>

            <section className="rounded-[2rem] border border-secondary/8 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-secondary">Have a question before booking?</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-secondary/55">
                Ask {firstName} about GCSE, IB, exam preparation, lesson availability, or how they support confidence.
              </p>
              <MessageTutorButton
                tutorId={tutor.id}
                tutorName={firstName}
                viewerRole={viewerRole}
                isAuthenticated={!!user}
                returnPath={askReturnPath}
                label={`Ask ${firstName}`}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-primary/15 bg-primary/5 px-5 text-sm font-black text-primary transition-all hover:bg-primary hover:text-white"
              />
            </section>
          </aside>
        </section>

        <section className="mt-12 grid gap-4 rounded-[2rem] border border-secondary/8 bg-white p-6 shadow-sm md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-black text-secondary">Not Sure Which Tutor Is Best?</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-secondary/55">
              Let ScienceDojo recommend the right tutor for your child based on subject, confidence, goals, and curriculum.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <MentorActionLink
              href="/free-assessment?source=mentor_profile_recommendation"
              eventName="learning_check_started"
              eventParams={{ tutor_id: tutor.id, source: "mentor_profile_recommendation", subject: primarySubject }}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-secondary px-6 text-sm font-black text-white transition-all hover:-translate-y-0.5"
            >
              Get a Recommendation
            </MentorActionLink>
            <Link
              href="/#tutors"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/10 bg-white px-6 text-sm font-black text-secondary/60 transition-all hover:text-primary"
            >
              Need a Different Subject? Explore ScienceDojo Tutors
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
