import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileQuestion,
  Layers3,
  Pencil,
  Users,
} from "lucide-react";
import { getAcademyCourseDraft } from "@/lib/academy-courses";
import { validateAcademyCourse } from "@/lib/academy-course-validation";

export default async function AcademyCourseOverviewPage({
  params,
}: {
  params: Promise<{ courseKey: string }>;
}) {
  const { courseKey } = await params;
  const record = await getAcademyCourseDraft(courseKey);
  if (!record) notFound();
  const course = record.draft;
  const sections = course.sections?.length
    ? course.sections
    : Array.from(new Set(course.lessons.map((lesson) => lesson.section))).map(
        (title, index) => ({ id: `overview-section-${index}`, title }),
      );
  const blockCount = course.lessons.reduce(
    (total, lesson) => total + lesson.blocks.length,
    0,
  );
  const readiness = validateAcademyCourse(course);

  return (
    <main className="min-h-full bg-[#F4F3EF] pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/admin/academy" className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-secondary/60 hover:bg-white hover:text-secondary">
            <ArrowLeft size={16} /> Course library
          </Link>
          <div className="flex gap-2">
            <Link href={`/dashboard/admin/academy/${courseKey}/preview`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-secondary/15 bg-white px-4 text-xs font-semibold text-secondary"><Eye size={15} /> Preview</Link>
            <Link href={`/dashboard/admin/academy/${courseKey}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#18212B] px-5 text-xs font-semibold text-white hover:bg-primary"><Pencil size={15} /> Edit course</Link>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-3xl bg-[#18212B] text-white shadow-[0_18px_55px_rgba(22,31,42,0.16)]">
          <div className="grid lg:grid-cols-[1.08fr_.92fr]">
            <div className="flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-14">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${record.status === "published" ? "bg-emerald-400/15 text-emerald-200" : record.status === "draft" ? "bg-amber-300/15 text-amber-200" : "bg-white/10 text-white/60"}`}>{record.status}</span>
                <span className="text-[11px] font-semibold text-white/50">Course overview</span>
              </div>
              <h1 className="academy-studio-heading mt-6 max-w-3xl text-[42px] leading-[1.06] sm:text-[58px]">{course.title}</h1>
              <div className="mt-6 h-1 w-24 rounded-full bg-[var(--academy-accent,#5D9CFF)]" />
              <p className="academy-editorial-copy mt-7 max-w-2xl text-[17px] leading-8 text-white/70">{course.description}</p>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-semibold text-white/65">
                <span className="inline-flex items-center gap-2"><BookOpen size={15} />{course.lessons.length} lessons</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={15} />{course.estimatedMinutes} minutes</span>
                <span className="inline-flex items-center gap-2"><Layers3 size={15} />{blockCount} blocks</span>
                <span className="inline-flex items-center gap-2"><Users size={15} />{course.audienceRoles?.length || record.audienceRoles.length} audiences</span>
              </div>
            </div>
            <div className="relative min-h-72 lg:min-h-full">
              <Image src={course.heroImage || "/images/education-bg-minimal.png"} alt="" fill priority sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#18212B] via-[#18212B]/15 to-transparent lg:block" />
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section>
            <div className="flex items-end justify-between gap-4 border-b border-secondary/15 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Course structure</p>
                <h2 className="academy-studio-heading mt-2 text-3xl text-secondary">What learners will study</h2>
              </div>
              <Link href={`/dashboard/admin/academy/${courseKey}`} className="hidden min-h-10 items-center gap-2 rounded-full border border-secondary/15 bg-white px-4 text-xs font-semibold text-secondary sm:inline-flex">Edit structure <ArrowRight size={14} /></Link>
            </div>

            <div className="mt-6 space-y-8">
              {sections.map((section, sectionIndex) => {
                const lessons = course.lessons.filter(
                  (lesson) =>
                    lesson.sectionId === section.id ||
                    (!lesson.sectionId && lesson.section === section.title),
                );
                if (!lessons.length) return null;
                return (
                  <section key={section.id} className="overflow-hidden rounded-2xl border border-secondary/10 bg-white">
                    <div className="flex items-center gap-3 border-b border-secondary/10 bg-[#F8F8F6] px-5 py-4">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-white">{sectionIndex + 1}</span>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/40">Section {sectionIndex + 1}</p>
                        <h3 className="mt-0.5 text-base font-semibold text-secondary">{section.title}</h3>
                      </div>
                      <span className="ml-auto text-[11px] font-semibold text-secondary/40">{lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}</span>
                    </div>
                    <ol className="divide-y divide-secondary/8">
                      {lessons.map((lesson, lessonIndex) => (
                        <li key={lesson.id || lesson.slug} className="group grid gap-4 px-5 py-5 sm:grid-cols-[42px_1fr_auto] sm:items-center">
                          <span className="grid h-9 w-9 place-items-center rounded-full border border-secondary/15 text-xs font-semibold text-secondary/45">{lessonIndex + 1}</span>
                          <div className="min-w-0">
                            <h4 className="text-[17px] font-semibold text-secondary">{lesson.title}</h4>
                            <p className="academy-editorial-copy mt-1 line-clamp-2 text-[13px] leading-6 text-secondary/50">{lesson.summary}</p>
                            <div className="mt-2 flex flex-wrap gap-4 text-[10px] font-semibold text-secondary/40"><span>{lesson.durationMinutes} min</span><span>{lesson.blocks.length} blocks</span></div>
                          </div>
                          <Link href={`/dashboard/admin/academy/${courseKey}?lesson=${encodeURIComponent(lesson.id || lesson.slug)}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-secondary/15 px-4 text-xs font-semibold text-secondary hover:border-primary hover:text-primary"><Pencil size={13} /> Edit lesson</Link>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}

              <section className="grid gap-4 rounded-2xl border border-secondary/10 bg-white px-5 py-5 sm:grid-cols-[42px_1fr_auto] sm:items-center">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><FileQuestion size={17} /></span>
                <div>
                  <h3 className="text-[17px] font-semibold text-secondary">Final assessment</h3>
                  <p className="mt-1 text-[13px] text-secondary/50">{course.quiz.length} questions · {course.passMark}% pass mark</p>
                </div>
                <Link href={`/dashboard/admin/academy/${courseKey}?assessment=true`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-secondary/15 px-4 text-xs font-semibold text-secondary hover:border-primary hover:text-primary"><Pencil size={13} /> Edit assessment</Link>
              </section>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-secondary/10 bg-white p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary/40">Readiness</p>
              <div className={`mt-4 flex items-center gap-3 ${readiness.valid ? "text-emerald-700" : "text-amber-700"}`}>
                {readiness.valid ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                <strong className="text-sm">{readiness.valid ? "Ready to publish" : `${readiness.issues.length} issues to resolve`}</strong>
              </div>
              <p className="mt-3 text-xs leading-5 text-secondary/50">{readiness.valid ? "Accessibility, content, media, and assessment checks are clear." : "Open the editor to review the exact fields that need attention."}</p>
              {!readiness.valid ? <Link href={`/dashboard/admin/academy/${courseKey}`} className="mt-4 inline-flex text-xs font-semibold text-primary">Review issues <ArrowRight size={13} className="ml-1" /></Link> : null}
            </div>
            <div className="rounded-2xl border border-secondary/10 bg-white p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary/40">Audience</p>
              <div className="mt-3 flex flex-wrap gap-2">{(course.audienceRoles || record.audienceRoles).map((role) => <span key={role} className="rounded-full bg-primary/7 px-3 py-1.5 text-[10px] font-semibold capitalize text-primary">{role.replaceAll("_", " ")}</span>)}</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
