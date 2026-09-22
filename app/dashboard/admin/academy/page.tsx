import Link from "next/link";
import { BookOpen, Clock, Plus, Users } from "lucide-react";
import { getAdminAcademyCourses } from "@/lib/academy-courses";

export const metadata = { title: "Academy Courses | ScienceDojo Admin" };

export default async function AdminAcademyPage() {
  const { courses, schemaReady } = await getAdminAcademyCourses();
  const groups = ["published", "draft", "archived"] as const;

  return <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">ScienceDojo admin</p><h1 className="mt-2 text-4xl font-black tracking-tight text-secondary">Academy courses</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-secondary/55">Create structured learning experiences, preview drafts, and publish safely without changing application code.</p></div>
      <Link href="/dashboard/admin/academy/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-black uppercase tracking-[0.1em] text-white"><Plus size={16} /> New course</Link>
    </div>

    {!schemaReady ? <div role="alert" className="mt-7 border-l-4 border-amber-500 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900">Run Academy migrations <strong>056</strong>, <strong>057</strong>, and <strong>058</strong> in Supabase. Tutor Foundations is shown from the code fallback and will be imported when you save it.</div> : null}

    <div className="mt-9 space-y-10">{groups.map((status) => {
      const matching = courses.filter((course) => course.status === status);
      if (!matching.length) return null;
      return <section key={status}><div className="mb-4 flex items-center gap-3"><h2 className="text-xl font-black capitalize text-secondary">{status}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-secondary/45">{matching.length}</span></div><div className="grid gap-4 md:grid-cols-2">{matching.map((course) => <article key={course.courseKey} className="rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${course.status === "published" ? "bg-emerald-50 text-emerald-700" : course.status === "archived" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{course.status}</span><h3 className="mt-3 text-xl font-black text-secondary">{course.title}</h3><p className="mt-1 text-xs font-semibold text-secondary/40">{course.courseKey}</p></div><BookOpen className="text-primary/40" /></div>
        <div className="mt-5 flex flex-wrap gap-4 border-y border-secondary/8 py-3 text-xs font-bold text-secondary/45"><span className="inline-flex items-center gap-1.5"><BookOpen size={14} />{course.draft.lessons.length} lessons</span><span className="inline-flex items-center gap-1.5"><Clock size={14} />{course.draft.estimatedMinutes} min</span><span className="inline-flex items-center gap-1.5"><Users size={14} />{course.audienceRoles.length} audiences</span></div>
        <div className="mt-5 flex gap-3"><Link href={`/dashboard/admin/academy/${course.courseKey}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-secondary px-4 text-xs font-black text-white">Edit course</Link><Link href={`/dashboard/admin/academy/${course.courseKey}/preview`} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-secondary/10 px-4 text-xs font-black text-secondary/60">Preview</Link></div>
      </article>)}</div></section>;
    })}</div>
  </main>;
}
