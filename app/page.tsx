import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, ClipboardCheck, Compass, GraduationCap, MessageSquareText, ShieldCheck, Target } from "lucide-react";
import AuthenticatedHomeRedirect from "@/components/AuthenticatedHomeRedirect";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import HomepageSectionTracker from "@/components/analytics/HomepageSectionTracker";
import HomepageSubjectChooser from "@/components/HomepageSubjectChooser";
import HomepageStoryCarousel from "@/components/HomepageStoryCarousel";
import JourneyCelebration from "@/components/JourneyCelebration";
import JsonLd from "@/components/JsonLd";
import UserAvatar from "@/components/UserAvatar";
import { REAL_TESTIMONIALS } from "@/components/Testimonials";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";
import { homeImages } from "@/lib/homeImages";
import { getPublicTutors } from "@/lib/public-tutors";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/seo";

const steps = [
  { number: "01", title: "Find the gaps", text: "We understand the student, their goals, and the topics that are getting in the way." },
  { number: "02", title: "Find the right tutor", text: "A tutor helps make difficult ideas clear, at a pace that suits the student." },
  { number: "03", title: "Practise with purpose", text: "PracticeDojo and personalised Missions give learning direction between lessons." },
  { number: "04", title: "See what changes", text: "Lesson records and next steps help families understand progress." },
];

async function TutorPreview() {
  const tutors = await getPublicTutors();
  const featured = tutors
    .filter((tutor) => tutor.is_verified)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .slice(0, 3);

  return (
    <section className="bg-[#f5f9ff] px-4 py-16 md:px-8 md:py-20" aria-labelledby="tutors-heading">
      <HomepageSectionTracker eventName="homepage_tutor_marketplace_visible" />
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-primary">The people behind the progress</p>
            <h2 id="tutors-heading" className="mt-2 max-w-2xl text-3xl font-black tracking-tight text-secondary md:text-4xl">A tutor who makes it click.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-secondary/70">Explore subject specialists and find someone your child can feel comfortable learning with.</p>
          </div>
          <Link href="/find-tutors" className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            View all tutors <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {featured.length === 1 && (
          <Link href={`/tutor/${featured[0].id}`} className="group mt-8 grid overflow-hidden rounded-3xl border border-secondary/10 bg-white shadow-sm transition hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:grid-cols-[minmax(12rem,18rem)_1fr]">
            <div className="flex min-h-56 items-center justify-center bg-[linear-gradient(135deg,#e8f4ff,#d6edff)] p-7">
              <div className="h-40 w-40 overflow-hidden rounded-3xl bg-white shadow-md sm:h-48 sm:w-48"><UserAvatar src={featured[0].avatar_url} alt={featured[0].full_name} width={192} height={192} className="h-full w-full object-cover" /></div>
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-9">
              <p className="text-sm font-bold text-primary">Meet a verified tutor</p>
              <h3 className="mt-2 text-2xl font-black text-secondary">{featured[0].full_name}</h3>
              <p className="mt-2 text-base font-semibold text-primary">{featured[0].subjects.slice(0, 3).join(" · ")}</p>
              <p className="mt-4 max-w-xl text-base leading-7 text-secondary/70">Explore {featured[0].full_name.split(" ")[0]}&apos;s teaching approach, experience and subject support, and see if they&apos;re the right fit for your child.</p>
              <span className="mt-5 inline-flex items-center gap-2 font-bold text-primary">Meet {featured[0].full_name.split(" ")[0]} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
            </div>
          </Link>
        )}
        {featured.length > 1 && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featured.map((tutor) => (
              <Link key={tutor.id} href={`/tutor/${tutor.id}`} className="group rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl"><UserAvatar src={tutor.avatar_url} alt={tutor.full_name} width={56} height={56} className="h-full w-full object-cover" /></div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black text-secondary">{tutor.full_name}</h3>
                    <p className="mt-0.5 text-sm font-semibold text-primary">{tutor.subjects.slice(0, 2).join(" · ")}</p>
                  </div>
                </div>
                {tutor.education_level && <p className="mt-5 text-sm font-semibold text-secondary/70">{tutor.education_level}</p>}
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary/65">{tutor.bio || "Learn more about this tutor’s approach and subject support."}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">View profile <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

async function HomeContent() {
  const flags = await getPublicFeatureFlagMap();
  const showPractice = flags.practice_dojo_enabled;
  const showAssessment = flags.free_assessment_enabled;

  return (
    <main className="min-w-0 flex-1 bg-white">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />

      <section id="hero" className="relative overflow-hidden bg-[linear-gradient(130deg,#071a35_0%,#073a72_58%,#075dab_100%)] px-4 py-10 text-white md:px-8 md:py-14" aria-labelledby="home-heading">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(100,226,241,.19),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.12fr_.88fr] lg:gap-12">
          <div>
            <p className="text-sm font-bold text-cyan-200">Online tutoring for international learners</p>
            <h1 id="home-heading" className="mt-4 max-w-3xl text-[clamp(2.55rem,4.6vw,4.5rem)] font-black leading-[1.05] tracking-tight">Expert tutoring that turns confusion into confidence.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 md:text-lg md:leading-8">One-to-one support in Maths, Science, English, Computer Science and more, shaped around what your child needs next.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {showAssessment && <BookAssessmentLink source="homepage_hero" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-center text-sm font-extrabold text-[#073a72] shadow-lg transition hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Book a free assessment <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></BookAssessmentLink>}
              {showPractice && <Link href="/ai-practice-studio#studio" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Try free practice questions</Link>}
            </div>
            {showPractice && <HomepageSubjectChooser assessmentEnabled={showAssessment} />}
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl lg:block">
            <Image src={homeImages.teenStudy.src} alt={homeImages.teenStudy.alt} width={920} height={620} sizes="(max-width: 1024px) 100vw, 43vw" priority className="aspect-[16/9] w-full object-cover object-center lg:aspect-[4/3]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071a35]/90 to-transparent px-7 pb-7 pt-20">
              <p className="text-sm font-semibold text-white">Space to ask questions. Support to keep going.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-secondary/10 bg-[#f5f9ff] px-4 py-5 md:px-8" aria-label="ScienceDojo at a glance">
        <div className="mx-auto grid max-w-6xl gap-4 text-sm font-semibold text-secondary sm:grid-cols-2 lg:grid-cols-4">
          <span className="flex items-center gap-2"><GraduationCap className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> GCSE, IGCSE, IB &amp; A-Level</span>
          <Link href="/how-we-verify" className="flex items-center gap-2 hover:text-primary"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> How tutors are verified</Link>
          <Link href="/safeguarding" className="flex items-center gap-2 hover:text-primary"><ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> Safeguarding policy</Link>
          <Link href="/about#stories" className="flex items-center gap-2 hover:text-primary"><Compass className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> Real student stories</Link>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20" aria-labelledby="system-heading">
        <HomepageSectionTracker eventName="homepage_method_visible" />
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-primary">How learning moves forward</p>
            <h2 id="system-heading" className="mt-2 text-3xl font-black tracking-tight text-secondary md:text-4xl">More than a weekly lesson.</h2>
            <p className="mt-3 text-base leading-7 text-secondary/70">One connected approach helps students understand, practise, and make progress they can see.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => <div key={step.number} className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-sm"><span className="text-sm font-black text-primary">{step.number}</span><h3 className="mt-4 text-lg font-black text-secondary">{step.title}</h3><p className="mt-2 text-sm leading-6 text-secondary/70">{step.text}</p></div>)}
          </div>
          <Link href="/how-it-works" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">Explore how ScienceDojo works <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="bg-[#071a35] px-4 py-16 text-white md:px-8 md:py-20" aria-labelledby="experience-heading">
        <HomepageSectionTracker eventName="homepage_practice_dojo_visible" />
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold text-cyan-200">Tutoring + practice + follow-through</p>
            <h2 id="experience-heading" className="mt-3 text-3xl font-black tracking-tight md:text-4xl">The lesson is only the beginning.</h2>
            <p className="mt-4 text-base leading-7 text-white/80">A lesson helps make the difficult part click. Focused practice gives students something useful to do next, while learning records keep families in the loop.</p>
            {showPractice && <Link href="/ai-practice-studio#studio" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-cyan-200 underline-offset-4 hover:underline">Explore free practice <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl">
            <div className="relative">
              <Image src={homeImages.modernTutoring.src} alt={homeImages.modernTutoring.alt} width={960} height={540} sizes="(max-width: 1024px) 100vw, 54vw" className="aspect-[16/8] w-full object-cover object-center" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071a35]/90 to-transparent px-5 pb-5 pt-14 text-sm font-bold text-white sm:px-7">Live support when a topic feels difficult</div>
            </div>
            <div className="p-5 text-secondary sm:p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">An illustrative learning journey</p>
              <ol className="mt-5 grid gap-5 sm:grid-cols-3 sm:gap-3">
                <li className="relative border-l-2 border-cyan-200 pl-5 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-5"><span className="absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-primary sm:-top-[11px] sm:left-0"><ClipboardCheck className="h-3 w-3" aria-hidden="true" /></span><h3 className="text-sm font-black">Check understanding</h3><p className="mt-1 text-sm leading-5 text-secondary/65">Try focused practice questions.</p></li>
                <li className="relative border-l-2 border-cyan-200 pl-5 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-5"><span className="absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-primary sm:-top-[11px] sm:left-0"><Target className="h-3 w-3" aria-hidden="true" /></span><h3 className="text-sm font-black">Practise the next step</h3><p className="mt-1 text-sm leading-5 text-secondary/65">Keep building between lessons.</p></li>
                <li className="relative border-l-2 border-cyan-200 pl-5 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-5"><span className="absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-primary sm:-top-[11px] sm:left-0"><MessageSquareText className="h-3 w-3" aria-hidden="true" /></span><h3 className="text-sm font-black">Share progress</h3><p className="mt-1 text-sm leading-5 text-secondary/65">Help parents see what comes next.</p></li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20" aria-labelledby="stories-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-primary">Learning journeys</p>
          <JourneyCelebration />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <article className="rounded-3xl bg-[#eaf4ff] p-6 lg:col-span-2 lg:p-8">
              <p className="text-sm font-bold text-primary">Physics · long-term support</p>
              <blockquote className="mt-4 text-xl font-bold leading-8 text-secondary">“We received Pawan&apos;s grade today and he received an A* for Physics. Thank you so much for your immense support and for guiding him over the past 1.5 years.”</blockquote>
              <p className="mt-4 text-sm font-semibold text-secondary/70">Pawan&apos;s parent · Individual outcomes vary</p>
              <Link href="/about#stories" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Read the full story <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </article>
            <HomepageStoryCarousel stories={[REAL_TESTIMONIALS[0], REAL_TESTIMONIALS[4], REAL_TESTIMONIALS[3]]} />
          </div>
        </div>
      </section>

      {flags.tutor_marketplace_enabled && <Suspense fallback={<div className="h-48 bg-[#f5f9ff]" />}><TutorPreview /></Suspense>}

      <section className="bg-[linear-gradient(125deg,#073a72,#0066cc)] px-4 py-14 text-white md:px-8 md:py-16" aria-labelledby="next-step-heading">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div><h2 id="next-step-heading" className="text-3xl font-black tracking-tight">A clearer next step starts here.</h2><p className="mt-2 max-w-xl leading-7 text-white/85">Talk with us about your child&apos;s goals, or let them try free practice questions first.</p></div>
          <div className="flex flex-wrap gap-3">{showAssessment && <BookAssessmentLink source="homepage_final" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] hover:bg-cyan-50">Book a free assessment</BookAssessmentLink>}{showPractice && <Link href="/ai-practice-studio#studio" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 px-5 py-3 text-sm font-extrabold hover:bg-white/10">Try free practice</Link>}</div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return <><AuthenticatedHomeRedirect /><Suspense fallback={<main className="min-h-[70vh] flex-1 bg-[#071a35]" />}><HomeContent /></Suspense></>;
}
