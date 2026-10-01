import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronDown, LockKeyhole } from "lucide-react";
import { academyCourseOutline } from "@/lib/academy-course-outline";
import { isGermanAcademyCourse } from "@/lib/german-academy-course";
import type { AcademyCourse, AcademyProgress } from "@/lib/tutor-academy";
import AcademyProgressRing from "./AcademyProgressRing";

export default function AcademyCourseOutline({ course, progress, activeLessonSlug, lessonHref, quizHref, preview = false }: {
  course: AcademyCourse;
  progress: AcademyProgress;
  activeLessonSlug: string;
  lessonHref: (slug: string) => string;
  quizHref: string;
  preview?: boolean;
}) {
  const german = isGermanAcademyCourse(course.key);
  const outline = academyCourseOutline(course, progress, preview);
  return <nav className="academy-course-outline" aria-label={german ? "Kursübersicht und Fortschritt" : "Course outline and progress"}>
    <div className="relative h-40 overflow-hidden bg-slate-800">
      <Image src={course.heroImage || "/images/home/8.professional-online-teacher.jpg"} alt="" fill sizes="280px" className="object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
      <p className="absolute inset-x-5 bottom-4 text-lg font-bold leading-6 text-white">{course.shortTitle || course.title}</p>
    </div>
    <div className="border-b border-[#DEDFE1] bg-white px-5 py-4">
      <div className="flex items-center justify-between text-[11px] font-bold text-[#717376]">
        <span>{german ? "Kursfortschritt" : "Course progress"}</span><span>{outline.percent}%</span>
      </div>
      <div role="progressbar" aria-label={german ? "Kursfortschritt" : "Course progress"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={outline.percent} className="mt-3 h-1 overflow-hidden bg-[#E6E7E9]">
        <div className="h-full bg-[var(--academy-accent)]" style={{ width: `${outline.percent}%` }} />
      </div>
      {preview ? <p className="mt-3 text-xs leading-5 text-[#64717B]">{german ? "Vorschau · kein gespeicherter Lernfortschritt" : "Preview · no saved learner progress"}</p> : null}
    </div>
    {outline.groups.map((group) => <details key={group.key} open={group.lessons.some(({ lesson }) => lesson.slug === activeLessonSlug)} className="group border-b border-[#DDE1E5]">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 bg-white px-5 py-3 text-sm font-semibold leading-5 text-[#27313B] focus-visible:outline-2 focus-visible:outline-[var(--academy-accent)]">
        {group.title}<ChevronDown size={15} className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      {group.lessons.map(({ lesson, state, locked }) => {
        const active = lesson.slug === activeLessonSlug;
        const contents = <><BookOpen size={15} className="shrink-0 text-[#717376]" aria-hidden="true" />
          <span className="min-w-0 flex-1">{lesson.title}</span>
          {locked ? <LockKeyhole size={12} className="shrink-0" aria-label={german ? "Vorherige Schritte abschließen" : "Complete previous steps"} /> : null}
          <AcademyProgressRing state={state} size={17} /></>;
        const style = `relative flex min-h-[52px] items-center gap-3 border-t border-[#ECEDEF] px-5 py-3 text-[13px] font-bold leading-4 ${active ? "border-l-4 border-l-[var(--academy-accent)] bg-[#F3F4F5]" : "bg-white"}`;
        return locked ? <div key={lesson.id || lesson.slug} aria-disabled="true" className={`${style} text-[#65717D]`}>{contents}</div>
          : <Link key={lesson.id || lesson.slug} href={lessonHref(lesson.slug)} aria-current={active ? "page" : undefined} className={`${style} text-[#202733] outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--academy-accent)]`}>{contents}</Link>;
      })}
    </details>)}
    {course.rules?.requireFinalAssessment !== false ? <Link href={quizHref} className="block border-b border-[#DDE1E5] bg-[#F5F6F7] px-4 py-4 text-sm text-[#202733] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--academy-accent)]">
      <span className="flex items-center justify-between"><BookOpen size={14} aria-hidden="true" /><AcademyProgressRing state={outline.quizState} size={17} /></span>
      <span className="mt-3 block">{german ? "Abschlusstest" : "Final assessment"}</span>
    </Link> : null}
  </nav>;
}
