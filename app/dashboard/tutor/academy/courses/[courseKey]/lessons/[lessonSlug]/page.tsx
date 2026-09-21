import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyLessonTracker from "@/components/tutor-academy/AcademyLessonTracker";
import { completeAcademyLesson } from "@/app/dashboard/tutor/academy/actions";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getAcademyLesson, getAcademyLessonIndex } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export async function renderAcademyCourseLessonPage(courseKey: string, lessonSlug: string, error: string | undefined, basePath: string) {
  const course = await getPublishedAcademyCourse(courseKey); if (!course) notFound();
  const lesson = getAcademyLesson(lessonSlug, course); if (!lesson) notFound();
  const progress = await getTutorAcademyProgress(course.key); const index = getAcademyLessonIndex(lesson.slug, course); const previousLesson = course.lessons[index - 1]; const nextLesson = course.lessons[index + 1]; const completed = progress.completedLessons.includes(lesson.slug); const completeAction = completeAcademyLesson.bind(null, course.key, lesson.slug);
  return <article><AcademyLessonTracker lessonSlug={lesson.slug} courseKey={course.key} /><header className="border-b border-[#DEDFE1] px-6 pb-10 pt-12 sm:px-10 sm:pt-16"><div className="mx-auto max-w-[728px]"><div className="flex flex-wrap gap-3 text-[13px] font-semibold text-[#717376]"><span>{lesson.section}</span><span>·</span><span>Lesson {index + 1} of {course.lessons.length}</span><span>·</span><span className="inline-flex gap-1.5"><Clock size={14} />{lesson.durationMinutes} min</span></div><h1 className="mt-5 text-[32px] font-bold leading-[1.2] sm:text-[40px] sm:leading-[48px]">{lesson.title}</h1><div className="mt-5 h-1 w-12 bg-[#1E5AA8]" /><p className="mt-6 font-[family-name:var(--font-academy-serif)] text-[17px] leading-[33px] text-[#4A4B4E]">{lesson.summary}</p></div></header><div className="px-6 py-12 sm:px-10 sm:py-16"><div className="mx-auto max-w-[728px]">{error === "progress" ? <div className="mb-8 border-l-4 border-red-700 bg-red-50 p-5 text-sm font-semibold text-red-900">Progress could not be saved. Please try again.</div> : null}<AcademyLessonBlocks blocks={lesson.blocks} /><footer className="mt-16 flex flex-col justify-between gap-3 border-t border-[#DEDFE1] pt-7 sm:flex-row">{previousLesson ? <Link href={`${basePath}/lessons/${previousLesson.slug}`} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#C9CDD2] px-6 text-xs font-bold uppercase"><ArrowLeft size={16} />Previous</Link> : <Link href={basePath} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#C9CDD2] px-6 text-xs font-bold uppercase"><ArrowLeft size={16} />Course home</Link>}<form action={completeAction}><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#1E5AA8] px-7 text-xs font-bold uppercase text-white">{completed ? <CheckCircle2 size={17} /> : null}{nextLesson ? completed ? "Continue" : "Complete and continue" : "Complete and take final check"}<ArrowRight size={16} /></button></form></footer></div></div></article>;
}

export default async function AcademyCourseLessonPage({ params, searchParams }: { params: Promise<{ courseKey: string; lessonSlug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { courseKey, lessonSlug } = await params; const { error } = await searchParams;
  return renderAcademyCourseLessonPage(courseKey, lessonSlug, error, `/dashboard/tutor/academy/courses/${courseKey}`);
}
