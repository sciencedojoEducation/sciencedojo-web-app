import { getTutors } from "@/lib/supabase-queries";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";

export default async function ParentTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.query || "";
  const selectedSubject = params.subject || "All";

  const tutors = await getTutors(searchTerm, selectedSubject);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-4 md:space-y-8 md:p-8">
      <div className="rounded-[1.5rem] border border-secondary/5 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Guided academic support</p>
        <h1 className="mb-2 text-3xl font-black tracking-tight text-secondary">Tutor support</h1>
        <p className="max-w-2xl text-sm font-bold leading-relaxed text-secondary/60 md:text-base">
          Find verified mentor support for your child’s subject, confidence needs, and next learning step.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Verified mentors</p>
            <p className="mt-1 text-xs font-bold text-secondary/60">Reviewed before appearing here</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Learning fit</p>
            <p className="mt-1 text-xs font-bold text-secondary/60">Subject and confidence support</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Next step</p>
            <p className="mt-1 text-xs font-bold text-secondary/60">Meet a tutor before booking</p>
          </div>
        </div>
      </div>

      <SearchFilterBar variant="compact" />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-secondary/40">
          {selectedSubject === "All" ? "Available tutor support" : `${selectedSubject} support`}
        </h2>
        <span className="text-xs font-bold text-secondary/40">
          {tutors.length} support options match your search
        </span>
      </div>

      {tutors.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 pb-12 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor as any} currentUserRole="parent" variant="dashboard" />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-secondary/10 bg-slate-50 px-5 py-10 text-center md:rounded-[2.5rem] md:border-2 md:py-20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/5 text-secondary/30 md:h-16 md:w-16">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-secondary mb-2">No tutor support found</h3>
          <p className="text-secondary/60 max-w-sm mx-auto">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}
