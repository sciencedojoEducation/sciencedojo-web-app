import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import SearchFilterBar from "@/components/SearchFilterBar";
import PublicTutorCard from "@/components/PublicTutorCard";
import { getPublicTutors } from "@/lib/public-tutors";

type HomeSearchParams = Promise<{ query?: string; subject?: string }>;

type DirectoryOptions = {
  profilesEnabled: boolean;
  bookingEnabled: boolean;
  assessmentEnabled: boolean;
  reviewsEnabled: boolean;
};

export function HomeTutorDirectorySkeleton() {
  return (
    <section aria-label="Loading tutor profiles" className="min-h-screen bg-[#f5f9fc] px-4 py-12 md:px-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-12 w-80 max-w-full rounded-xl bg-secondary/10" />
        <div className="mt-6 h-20 max-w-xl rounded-xl bg-secondary/5" />
        <div className="mt-12 h-28 rounded-3xl bg-white" />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-72 rounded-3xl bg-white" />)}
        </div>
      </div>
    </section>
  );
}

export default async function HomeTutorDirectory({ searchParams, profilesEnabled, bookingEnabled, assessmentEnabled, reviewsEnabled }: {
  searchParams: HomeSearchParams;
} & DirectoryOptions) {
  const params = await searchParams;
  const searchTerm = typeof params.query === "string" ? params.query.trim() : "";
  const selectedSubject = typeof params.subject === "string" ? params.subject : "All";
  const tutors = (await getPublicTutors(searchTerm, selectedSubject)).sort((a, b) =>
    Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) ||
    Number(b.is_verified) - Number(a.is_verified) ||
    Number(Boolean(b.bio)) - Number(Boolean(a.bio)) ||
    a.full_name.localeCompare(b.full_name)
  );
  const hasFilters = Boolean(searchTerm || selectedSubject !== "All");

  return (
    <>
      <section id="hero" className="relative overflow-hidden bg-[#eef7ff] px-4 py-12 md:px-8 md:py-16" aria-labelledby="tutor-directory-heading">
        <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-[#d7f7ed] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#d7ebff] blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-extrabold text-primary">Find a tutor</p>
          <h1 id="tutor-directory-heading" className="mt-3 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-secondary sm:text-5xl">Find the right support for your child.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-secondary/70 sm:text-lg sm:leading-8">Explore tutors by subject. Read about their teaching approach and experience, then decide on a good next step together.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link href="#directory" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,102,255,.18)] transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              Browse tutors <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {assessmentEnabled && <BookAssessmentLink source="find_tutors_hero" className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Get help choosing a tutor <ArrowRight className="h-4 w-4" aria-hidden="true" /></BookAssessmentLink>}
          </div>
        </div>
      </section>

      <section id="directory" aria-label="ScienceDojo tutors" className="scroll-mt-20 bg-[#f5f9fc] px-4 pb-16 pt-8 md:px-8 md:pb-20 md:pt-10">
        <div className="mx-auto max-w-6xl">
          <SearchFilterBar />

          <div id="tutor-results" className="mb-5 mt-8 flex flex-wrap items-end justify-between gap-2 scroll-mt-28">
            <div>
              <p className="text-sm font-bold text-primary">Tutor profiles</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-secondary sm:text-3xl">{selectedSubject === "All" ? "Explore our tutors" : `${selectedSubject} tutors`}</h2>
            </div>
            <p role="status" className="text-sm font-semibold text-secondary/60">{tutors.length} {tutors.length === 1 ? "tutor" : "tutors"} {hasFilters ? (tutors.length === 1 ? "matches your search" : "match your search") : "available to explore"}</p>
          </div>

          {tutors.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              {tutors.map((tutor) => (
                <PublicTutorCard key={tutor.id} tutor={tutor} profilesEnabled={profilesEnabled} bookingEnabled={bookingEnabled} assessmentEnabled={assessmentEnabled} reviewsEnabled={reviewsEnabled} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#dce8f2] bg-white px-6 py-12 text-center shadow-sm sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4ff] text-primary"><Search className="h-6 w-6" aria-hidden="true" /></div>
              <h3 className="mt-5 text-xl font-black text-secondary">{hasFilters ? "No tutors match those filters" : "Tutor profiles are being prepared"}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary/65">{hasFilters ? "Try another subject or a shorter search term." : "Check back soon, or tell us what kind of support you need."}</p>
              {hasFilters ? <Link href="/find-tutors#directory" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-primary/20 px-5 py-2 text-sm font-bold text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link> : assessmentEnabled ? <BookAssessmentLink source="find_tutors_empty" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-hover">Request a free assessment</BookAssessmentLink> : <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-primary/20 px-5 py-2 text-sm font-bold text-primary hover:bg-primary/5">Contact us</Link>}
            </div>
          )}

          {tutors.length > 0 && <div className="mt-10 flex flex-col gap-5 rounded-3xl bg-[#08284d] p-6 text-white sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black sm:text-2xl">Not sure which tutor to choose?</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Tell us what your child is finding difficult. We can help you decide where to start.</p>
            </div>
            {assessmentEnabled ? <BookAssessmentLink source="find_tutors_footer" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Request a free assessment <ArrowRight className="h-4 w-4" aria-hidden="true" /></BookAssessmentLink> : <Link href="/contact" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] hover:bg-cyan-50">Contact ScienceDojo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
          </div>}
        </div>
      </section>
    </>
  );
}
