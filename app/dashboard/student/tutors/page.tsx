import { getTutors } from "@/lib/supabase-queries";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function StudentTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; subject?: string }>;
}) {
  const enabled = await isFeatureEnabled("tutor_marketplace_enabled");
  if (!enabled) {
    return (
      <FeatureUnavailable
        eyebrow="Tutor support"
        title="Tutor discovery is coming soon."
        message="We are preparing tutor discovery carefully before opening it to students and families."
      />
    );
  }

  const params = await searchParams;
  const searchTerm = params.query || "";
  const selectedSubject = params.subject || "All";

  const tutors = await getTutors(searchTerm, selectedSubject);

  return (
    <div data-role="student" className="dashboard-home mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-4 md:p-8">
      <div className="dashboard-hero p-4 md:p-6">
        <p className="dashboard-kicker">Guided academic support</p>
        <h1 className="dashboard-title mt-1 text-2xl md:text-3xl">Find a tutor</h1>
        <p className="dashboard-subtitle mt-2 max-w-2xl text-sm leading-6">
          Search by subject or topic, compare teaching styles, and choose support that fits your next step.
        </p>
      </div>

      <SearchFilterBar variant="compact" />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end">
        <h2 className="dashboard-title text-lg">
          {selectedSubject === "All" ? "Available tutor support" : `${selectedSubject} support`}
        </h2>
        <span className="text-sm text-slate-600" role="status">
          {tutors.length} support options match your search
        </span>
      </div>

      {tutors.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 pb-12 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} currentUserRole="student" variant="dashboard" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center md:py-14">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/5 text-secondary/30 md:h-16 md:w-16">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-secondary">No tutors match yet</h3>
          <p className="mx-auto max-w-sm text-sm text-slate-600">Try another subject or remove a search term.</p>
        </div>
      )}
    </div>
  );
}
