import Link from "next/link";
import HomepageSectionTracker from "@/components/analytics/HomepageSectionTracker";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";
import { getPublicTutors } from "@/lib/public-tutors";

type HomeSearchParams = Promise<{ query?: string; subject?: string }>;

export function HomeTutorDirectorySkeleton() {
  return (
    <section aria-label="Loading tutor profiles" className="w-full bg-white px-4 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1360px] animate-pulse">
        <div className="h-10 w-72 rounded-xl bg-secondary/8" />
        <div className="mt-8 h-24 rounded-3xl bg-secondary/5" />
        <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-80 rounded-3xl bg-secondary/5" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HomeTutorDirectory({ searchParams }: { searchParams: HomeSearchParams }) {
  const params = await searchParams;
  const searchTerm = params.query || "";
  const selectedSubject = params.subject || "All";
  const tutors = await getPublicTutors(searchTerm, selectedSubject);

  return (
    <section id="directory" aria-label="ScienceDojo tutors" className="relative z-20 w-full bg-white px-4 py-16 md:px-10 md:py-24">
      <HomepageSectionTracker eventName="homepage_tutor_marketplace_visible" />
      <div className="mx-auto max-w-[1360px]">
        <div className="mb-11 grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-sm font-bold text-primary">Find a tutor</p>
            <h2 id="how-we-verify" className="mt-4 text-3xl font-black leading-[1.1] tracking-tight text-secondary md:mt-5 md:text-5xl">Meet tutors who teach like mentors.</h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-secondary/65 md:text-lg md:leading-8 lg:justify-self-end">
            Find educators who understand your child&apos;s curriculum, confidence level, and learning style. ScienceDojo profiles focus on educational fit before booking.
          </p>
        </div>

        <SearchFilterBar />

        <div className="mb-6 mt-8 flex items-end justify-between">
          <h3 className="text-2xl font-bold text-secondary">
            {selectedSubject === "All" ? "Mentor profiles" : `${selectedSubject} mentors`}
          </h3>
          <span className="text-sm font-medium text-secondary/60">
            Showing {tutors.length} {tutors.length === 1 ? "tutor" : "tutors"}
          </span>
        </div>

        {tutors.length > 0 ? (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} currentUserRole={null} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-secondary/10 bg-white py-20 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/5 text-secondary/30">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-secondary">No tutors found</h3>
            <p className="max-w-sm text-secondary/60">We could not find any tutors matching your search criteria. Try adjusting your filters.</p>
            <Link href="/find-tutors" className="mt-6 rounded-lg border border-primary/20 px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/5">
              Clear Filters
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
