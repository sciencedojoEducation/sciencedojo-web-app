import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import AcademyProgressRing from "@/components/tutor-academy/AcademyProgressRing";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";
import { getAcademyLessonProgressState, getAcademyProgressPercent, getAcademyQuizProgressState, getAcademyResumeHref } from "@/lib/tutor-academy";
import { notFound } from "next/navigation";

export async function renderAcademyCoursePage(courseKey: string, basePath: string) {
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) notFound();
  const progress = await getTutorAcademyProgress(course.key);
  const progressPercent = getAcademyProgressPercent(progress, course);
  const sections = Array.from(new Set(course.lessons.map((lesson) => lesson.section)));
  return <div className="min-h-full bg-white">
    <section className="relative flex min-h-[460px] items-end overflow-hidden bg-slate-900 sm:min-h-[550px]">
      <Image src={course.heroImage || "/images/home/8.professional-online-teacher.jpg"} alt="" fill priority sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.12)_100%)]" />
      <div className="relative mx-auto w-full max-w-[1100px] px-6 pb-16 pt-24 sm:px-10"><div className="max-w-[650px] text-white"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">ScienceDojo Academy</p><h1 className="mt-5 text-[40px] font-black leading-[1.08] sm:text-[50px]">{course.title}</h1><p className="mt-5 max-w-xl font-[family-name:var(--font-academy-serif)] text-[17px] leading-8 text-white/80">{course.description}</p><Link href={getAcademyResumeHref(progress, course, basePath)} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-7 text-xs font-black uppercase tracking-[0.1em] text-[#101010]">{progress.startedLessons.length ? "Continue course" : "Start course"}<ArrowRight size={16} /></Link></div></div>
    </section>
    <main className="px-6 py-14 sm:py-20"><div className="mx-auto max-w-[600px]"><div className="flex flex-wrap gap-6 border-y border-[#DEDFE1] py-4 text-xs font-bold text-[#717376]"><span className="inline-flex gap-2"><BookOpen size={15} />{course.lessons.length} lessons</span><span className="inline-flex gap-2"><Clock size={15} />About {course.estimatedMinutes} minutes</span><span>{course.passMark || 80}% pass mark</span></div><div className="mt-12 flex items-end justify-between"><h2 className="text-3xl font-bold">Course contents</h2><strong className="text-sm text-[#1E5AA8]">{progressPercent}%</strong></div><div className="mt-4 h-1 bg-[#E6E7E9]"><div className="h-full bg-[#1E5AA8]" style={{ width: `${progressPercent}%` }} /></div>
      <div className="mt-10">{sections.map((section) => <section key={section} className="mb-9"><h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#717376]">{section}</h3><div className="border-b border-[#DEDFE1]">{course.lessons.filter((lesson) => lesson.section === section).map((lesson) => <Link key={lesson.slug} href={`${basePath}/lessons/${lesson.slug}`} className="flex min-h-14 items-center gap-4 border-t border-[#DEDFE1] py-3"><BookOpen size={16} className="text-[#717376]" /><span className="flex-1 text-sm font-bold text-[#252629]">{lesson.title}</span><AcademyProgressRing state={getAcademyLessonProgressState(progress, lesson.slug)} /></Link>)}</div></section>)}<Link href={`${basePath}/quiz`} className="flex min-h-14 items-center gap-4 border-y border-[#DEDFE1] py-3"><BookOpen size={16} className="text-[#717376]" /><span className="flex-1 text-sm font-bold">Final knowledge check</span><AcademyProgressRing state={getAcademyQuizProgressState(progress, course)} /></Link></div>
    </div></main>
  </div>;
}

export default async function AcademyCoursePage({ params }: { params: Promise<{ courseKey: string }> }) {
  const { courseKey } = await params;
  return renderAcademyCoursePage(courseKey, `/dashboard/tutor/academy/courses/${courseKey}`);
}
