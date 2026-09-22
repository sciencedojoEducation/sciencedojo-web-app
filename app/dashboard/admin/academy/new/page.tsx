import AcademyCourseEditor from "@/components/admin/AcademyCourseEditor";
import AcademyCourseEditorLegacy from "@/components/admin/AcademyCourseEditorLegacy";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Clock3, Eye, Layers3, Search } from "lucide-react";
import type { AcademyCourse } from "@/lib/tutor-academy";
import { getAcademyMediaLibrary } from "@/lib/academy-courses";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { academyTemplates, filterAcademyTemplates, getAcademyTemplate } from "@/lib/academy-templates";

const blankCourse: AcademyCourse = {
  key: "new-course",
  title: "New Academy course",
  shortTitle: "New course",
  description:
    "Describe what learners will understand and be able to do after this course.",
  estimatedMinutes: 20,
  heroImage: "/images/home/8.professional-online-teacher.jpg",
  audienceRoles: ["tutor"],
  passMark: 80,
  quizRevision: 1,
  lessons: [
    {
      slug: "welcome",
      section: "Getting started",
      title: "Welcome",
      summary: "Introduce the course and its learning goals.",
      durationMinutes: 5,
      blocks: [
        {
          type: "text",
          heading: "Welcome",
          paragraphs: ["Add your lesson content here."],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "question-1",
      prompt: "What is the most important idea from this course?",
      options: [
        { id: "a", label: "First answer" },
        { id: "b", label: "Second answer" },
      ],
      correctOptionId: "a",
      explanation: "Explain why this answer is correct.",
    },
  ],
};

export default async function NewAcademyCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; q?: string; audience?: string; purpose?: string }>;
}) {
  const { template, q = "", audience = "all", purpose = "all" } = await searchParams;
  const [mediaLibrary, useV2] = await Promise.all([
    getAcademyMediaLibrary(),
    isFeatureEnabled("academy_builder_v2_enabled"),
  ]);
  if (!useV2)
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">
          Academy builder
        </p>
        <h1 className="mt-2 text-3xl font-black text-secondary">
          Create course
        </h1>
        <div className="mt-7">
          <AcademyCourseEditorLegacy
            initialCourse={blankCourse}
            status="draft"
            mediaLibrary={mediaLibrary}
          />
        </div>
      </main>
    );
  if (!template) {
    const categories = Array.from(new Set(academyTemplates.map((item) => item.category)));
    const visibleTemplates = filterAcademyTemplates({ search: q, audience, category: purpose });
    return (
      <main className="min-h-full bg-[#F3F1EC] px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#49627A]">
          Academy studio · New course
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-[1fr_340px] md:items-end">
          <h1 className="academy-studio-heading max-w-3xl text-[42px] leading-[1.08] text-[#18212B] sm:text-[54px]">
            Choose how you want to begin
          </h1>
          <p className="academy-editorial-copy text-[16px] leading-7 text-[#5D6670]">
            Start clean or use a considered learning pattern. Every lesson,
            interaction, and visual choice remains editable.
          </p>
        </div>
        <form action="/dashboard/admin/academy/new" className="mt-8 grid gap-3 border border-black/10 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_180px_190px_auto]">
          <label className="relative">
            <span className="sr-only">Search course templates</span>
            <Search size={17} className="absolute left-3.5 top-3.5 text-[#7A858E]" />
            <input name="q" defaultValue={q} placeholder="Search templates" className="min-h-11 w-full border border-black/10 bg-[#FAFAF8] pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </label>
          <label>
            <span className="sr-only">Filter templates by audience</span>
            <select name="audience" defaultValue={audience} className="min-h-11 w-full border border-black/10 bg-white px-3 text-sm outline-none focus:border-primary">
              <option value="all">Every audience</option>
              <option value="tutor_applicant">Tutor applicants</option>
              <option value="tutor">Tutors</option>
              <option value="parent">Parents</option>
              <option value="student">Students</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter templates by purpose</span>
            <select name="purpose" defaultValue={purpose} className="min-h-11 w-full border border-black/10 bg-white px-3 text-sm outline-none focus:border-primary">
              <option value="all">Every purpose</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <button type="submit" className="min-h-11 bg-[#18212B] px-5 text-sm font-semibold text-white hover:bg-primary">Filter</button>
        </form>
        <div className="mt-4 flex items-center justify-between text-xs text-[#68727C]">
          <span>{visibleTemplates.length} of {academyTemplates.length} templates</span>
          {(q || audience !== "all" || purpose !== "all") ? <Link href="/dashboard/admin/academy/new" className="font-semibold text-primary underline">Clear filters</Link> : null}
        </div>
        {visibleTemplates.length ? <div className="mt-5 grid gap-6 md:grid-cols-2">
          {visibleTemplates.map((item) => (
            <article
              key={item.key}
              className="group overflow-hidden border border-black/10 bg-white shadow-[0_12px_35px_rgba(37,42,48,0.06)]"
            >
              <div className="relative h-52 overflow-hidden bg-[#DDE2E6]">
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />
                <span className="absolute left-5 top-5 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#27313B] shadow-sm backdrop-blur">
                  {item.badge}
                </span>
                <span className="absolute bottom-5 left-5 rounded-full px-3 py-1.5 text-[10px] font-semibold text-white" style={{ backgroundColor: item.accent }}>
                  {item.course.lessons.length} {item.course.lessons.length === 1 ? "lesson" : "lessons"}
                </span>
              </div>
              <div className="p-6 sm:p-7">
                <h2 className="academy-studio-heading text-[28px] leading-tight text-[#18212B]">
                  {item.name}
                </h2>
                <p className="academy-editorial-copy mt-3 min-h-14 text-[15px] leading-7 text-[#59636E]">
                  {item.description}
                </p>
                <p className="mt-3 text-[11px] font-medium text-[#59636E]"><span className="font-semibold text-[#18212B]">Pattern:</span> {item.learningPattern}</p>
                {item.curriculumLabel ? <p className="mt-1 text-[11px] font-semibold text-primary">{item.curriculumLabel}</p> : null}
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-black/8 py-3 text-[11px] font-semibold text-[#68727C]">
                  <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {item.course.estimatedMinutes} min</span>
                  <span className="inline-flex items-center gap-1.5"><BookOpen size={14} /> {item.course.lessons.length} lessons</span>
                  <span className="inline-flex items-center gap-1.5"><Layers3 size={14} /> {item.course.lessons.reduce((total, lesson) => total + lesson.blocks.length, 0)} blocks</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/dashboard/admin/academy/new/preview?template=${item.key}`} className="inline-flex min-h-11 items-center gap-2 border border-black/15 px-4 text-xs font-semibold text-[#18212B] hover:border-primary hover:text-primary"><Eye size={16} /> Preview lessons</Link>
                  <Link href={`/dashboard/admin/academy/new?template=${item.key}`} className="inline-flex min-h-11 items-center gap-2 bg-[#18212B] px-4 text-xs font-semibold text-white hover:bg-primary">Use template <ArrowRight size={16} /></Link>
                </div>
              </div>
            </article>
          ))}
        </div> : <div className="mt-6 border border-dashed border-black/15 bg-white px-6 py-16 text-center"><h2 className="text-lg font-semibold text-[#18212B]">No matching templates</h2><p className="mt-2 text-sm text-[#68727C]">Try another audience, purpose, or search term.</p></div>}
        </div>
      </main>
    );
  }
  const selectedTemplate = academyTemplates.find((item) => item.key === template);
  if (!selectedTemplate) notFound();
  const selectedCourse = getAcademyTemplate(template).course;
  return (
    <AcademyCourseEditor
      initialCourse={selectedCourse}
      status="draft"
      mediaLibrary={mediaLibrary}
    />
  );
}
