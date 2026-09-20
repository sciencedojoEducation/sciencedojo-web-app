type AcademyProgressRow = {
  completed_lessons?: string[] | null;
  best_score?: number | null;
  completed_at?: string | null;
} | null | undefined;

export default function TutorAcademyStatusBadge({ progress }: { progress: AcademyProgressRow }) {
  const completedLessons = progress?.completed_lessons?.length || 0;
  const completed = Boolean(progress?.completed_at);
  const label = completed
    ? `Academy complete · ${progress?.best_score || 0}%`
    : completedLessons > 0
      ? `Academy ${completedLessons}/6`
      : "Academy not started";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${completed ? "border-teal-100 bg-teal-50 text-teal-700" : completedLessons > 0 ? "border-blue-100 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
      {label}
    </span>
  );
}
