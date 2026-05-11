import { getTutors } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";
import Link from "next/link";

export default async function StudentTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.query || "";
  const selectedSubject = params.subject || "All";

  const supabase = await createClient();
  const tutors = await getTutors(searchTerm, selectedSubject);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-secondary tracking-tight mb-2">Tutor support</h1>
        <p className="text-secondary/60 font-bold">Find guided STEM support for difficult topics and your next learning step.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm">
        <SearchFilterBar />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end">
        <h2 className="text-xl font-black text-secondary uppercase tracking-widest text-[10px] opacity-40">
          {selectedSubject === "All" ? "Available tutor support" : `${selectedSubject} support`}
        </h2>
        <span className="text-xs font-bold text-secondary/40">
          {tutors.length} support options match your search
        </span>
      </div>

      {tutors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor as any} currentUserRole="student" variant="dashboard" />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-secondary/10">
          <div className="w-16 h-16 bg-secondary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary/30">
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
