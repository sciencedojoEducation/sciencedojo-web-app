import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Eye,
  Layers3,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { getAdminAcademyCourses } from "@/lib/academy-courses";
import AcademyWelcomeGuide from "@/components/admin/academy-builder/AcademyWelcomeGuide";

export const metadata = { title: "Academy Courses | ScienceDojo Admin" };

function updatedLabel(value: string | null) {
  if (!value) return "Built into ScienceDojo";
  const date = new Date(value);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 14) return `Updated ${days} days ago`;
  return `Updated ${date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  })}`;
}

const statusStyle = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-amber-50 text-amber-700",
  archived: "bg-slate-100 text-slate-500",
};

export default async function AdminAcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const [{ courses, schemaReady }, query] = await Promise.all([
    getAdminAcademyCourses(),
    searchParams,
  ]);
  const term = (query.q || "").trim().toLowerCase();
  const status = new Set(["published", "draft", "archived"]).has(
    query.status || "",
  )
    ? query.status
    : "all";
  const visibleCourses = courses.filter(
    (course) =>
      (status === "all" || course.status === status) &&
      (!term ||
        `${course.title} ${course.courseKey} ${course.draft.description}`
          .toLowerCase()
          .includes(term)),
  );
  const totalLessons = courses.reduce(
    (total, course) => total + course.draft.lessons.length,
    0,
  );

  return (
    <main className="min-h-full bg-[#F4F3EF] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#49627A]">
              Academy studio
            </p>
            <h1 className="academy-studio-heading mt-3 text-[42px] leading-none text-[#18212B] sm:text-[54px]">
              Course library
            </h1>
            <p className="academy-editorial-copy mt-4 max-w-2xl text-[16px] leading-7 text-[#5D6670]">
              Find a course, understand its structure, and move from overview
              to lesson editing without losing context.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AcademyWelcomeGuide />
            <Link
              href="/dashboard/admin/academy/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#18212B] px-5 text-xs font-semibold text-white hover:bg-primary"
            >
              <Plus size={16} /> Create course
            </Link>
          </div>
        </div>

        {!schemaReady ? (
          <div
            role="alert"
            className="mt-7 border-l-4 border-amber-500 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900"
          >
            Run Academy migrations <strong>056</strong>, <strong>057</strong>,
            and <strong>058</strong> in Supabase. Tutor Foundations is shown
            from the code fallback and will be imported when you save it.
          </div>
        ) : null}

        <section className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-black/8 bg-black/8 sm:grid-cols-3">
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary/45">Courses</p>
            <p className="mt-1 text-2xl font-semibold text-secondary">{courses.length}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary/45">Lessons</p>
            <p className="mt-1 text-2xl font-semibold text-secondary">{totalLessons}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary/45">Published</p>
            <p className="mt-1 text-2xl font-semibold text-secondary">{courses.filter((course) => course.status === "published").length}</p>
          </div>
        </section>

        <form className="mt-7 flex flex-col gap-3 rounded-2xl border border-black/8 bg-white p-3 sm:flex-row" action="/dashboard/admin/academy">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search courses</span>
            <Search className="absolute left-3 top-3.5 text-secondary/35" size={17} />
            <input name="q" defaultValue={query.q || ""} placeholder="Search courses" className="min-h-11 w-full rounded-xl border border-secondary/10 bg-[#F8F8F6] pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select name="status" defaultValue={status} className="min-h-11 w-full rounded-xl border border-secondary/10 bg-white px-4 text-sm font-semibold outline-none focus:border-primary sm:w-44">
              <option value="all">All courses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white">Filter</button>
        </form>

        {visibleCourses.length ? (
          <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => (
              <article key={course.courseKey} className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(22,31,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(22,31,42,0.12)] motion-reduce:transition-none">
                <Link href={`/dashboard/admin/academy/${course.courseKey}/overview`} className="block">
                  <div className="relative h-44 overflow-hidden bg-slate-200">
                    <Image src={course.draft.heroImage || "/images/education-bg-minimal.png"} alt="" fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
                    <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${statusStyle[course.status]}`}>{course.status}</span>
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white"><BookOpen size={14} /> Course · {course.draft.lessons.length} lessons</span>
                  </div>
                  <div className="p-5">
                    <h2 className="academy-studio-heading text-[24px] leading-tight text-[#18212B]">{course.title}</h2>
                    <p className="academy-editorial-copy mt-2 line-clamp-2 min-h-12 text-[14px] leading-6 text-secondary/55">{course.draft.description}</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-secondary/8 pt-4 text-[11px] font-semibold text-secondary/45">
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={13} />{course.draft.estimatedMinutes} min</span>
                      <span className="inline-flex items-center gap-1.5"><Layers3 size={13} />{course.draft.sections?.length || 1} sections</span>
                      <span className="inline-flex items-center gap-1.5"><Users size={13} />{course.audienceRoles.length} audiences</span>
                    </div>
                    <p className="mt-4 text-[11px] text-secondary/40">{updatedLabel(course.updatedAt)}</p>
                  </div>
                </Link>
                <div className="flex border-t border-secondary/8">
                  <Link href={`/dashboard/admin/academy/${course.courseKey}/overview`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 text-xs font-semibold text-secondary hover:bg-slate-50">Overview <ArrowRight size={14} /></Link>
                  <Link href={`/dashboard/admin/academy/${course.courseKey}`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border-l border-secondary/8 text-xs font-semibold text-primary hover:bg-primary/5"><Pencil size={14} /> Edit</Link>
                  <Link href={`/dashboard/admin/academy/${course.courseKey}/preview`} className="inline-flex h-12 w-12 items-center justify-center border-l border-secondary/8 text-secondary/50 hover:bg-slate-50" aria-label={`Preview ${course.title}`}><Eye size={16} /></Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-secondary/15 bg-white px-6 py-16 text-center">
            <BookOpen className="mx-auto text-secondary/25" size={32} />
            <h2 className="mt-4 text-lg font-semibold text-secondary">No matching courses</h2>
            <p className="mt-1 text-sm text-secondary/50">Try a different search or status filter.</p>
          </div>
        )}
      </div>
    </main>
  );
}
