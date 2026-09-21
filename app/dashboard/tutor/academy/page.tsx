import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import AcademyProgressRing from "@/components/tutor-academy/AcademyProgressRing";
import {
  getAcademyLessonProgressState,
  getAcademyProgressPercent,
  getAcademyQuizProgressState,
  getAcademyResumeHref,
  isAcademyCourseComplete,
  tutorAcademyCourse,
} from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";
import { getEligibleAcademyCourses, getPublishedAcademyCourse } from "@/lib/academy-courses";

export default async function TutorAcademyWelcomePage() {
  const progress = await getTutorAcademyProgress();
  const course = await getPublishedAcademyCourse(tutorAcademyCourse.key) || tutorAcademyCourse;
  const additionalCourses = (await getEligibleAcademyCourses()).filter((item) => item.key !== course.key);
  const progressPercent = getAcademyProgressPercent(progress, course);
  const resumeHref = getAcademyResumeHref(progress, course);
  const courseCompleted = isAcademyCourseComplete(progress, course);
  const hasStarted = progress.startedLessons.length > 0 || progress.completedLessons.length > 0 || Boolean(progress.currentLesson);
  const sections = Array.from(new Set(course.lessons.map((lesson) => lesson.section)));

  return (
    <div className="min-h-full bg-white">
      <section className="relative flex min-h-[460px] items-end overflow-hidden bg-slate-900 sm:min-h-[550px]">
        <Image src={course.heroImage || "/images/home/8.professional-online-teacher.jpg"} alt="A professional online tutor teaching from her workspace" fill priority sizes="100vw" className="object-cover object-[58%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.54)_44%,rgba(0,0,0,0.14)_100%)]" />
        <div className="relative mx-auto w-full max-w-[1100px] px-6 pb-14 pt-24 sm:px-10 sm:pb-20">
          <div className="max-w-[650px] text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">ScienceDojo Tutor Academy</p>
            <h1 className="mt-5 max-w-[620px] text-[40px] font-black leading-[1.08] tracking-[-0.025em] sm:text-[50px] sm:leading-[1.04]">{course.title}</h1>
            <p className="mt-5 max-w-[540px] font-[family-name:var(--font-academy-serif)] text-[16px] leading-8 text-white/82 sm:text-[17px]">Teach with clarity, care, and confidence from your very first lesson.</p>
            <Link href={resumeHref} className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-7 text-[12px] font-black uppercase tracking-[0.12em] text-[#101010] outline-none transition-colors hover:bg-[#F1F2F3] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none">
              {courseCompleted ? "Review course" : hasStarted ? "Continue course" : "Start course"}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <main className="px-6 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[600px]">
          <p className="font-[family-name:var(--font-academy-serif)] text-[16px] leading-[33px] text-[#252629] sm:text-[17px]">
            {course.description} Work through the course at your own pace while your tutor application is reviewed, then return whenever you need a refresher.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-[#DEDFE1] py-4 text-[12px] font-bold text-[#717376]">
            <span className="inline-flex items-center gap-2"><BookOpen size={15} aria-hidden="true" /> {course.lessons.length} lessons</span>
            <span className="inline-flex items-center gap-2"><Clock size={15} aria-hidden="true" /> About {course.estimatedMinutes} minutes</span>
            <span>{course.passMark || 80}% final check</span>
          </div>

          <section className="mt-14" aria-labelledby="course-contents-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#717376]">Course contents</p>
                <h2 id="course-contents-heading" className="mt-2 text-[30px] font-bold leading-10 tracking-[-0.02em] text-[#101010]">What you will learn</h2>
              </div>
              <span className="pb-1 text-sm font-bold text-[#1E5AA8]">{progressPercent}%</span>
            </div>
            <div className="mt-4 h-1 bg-[#E6E7E9]" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
              <div className="h-full bg-[#1E5AA8]" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="mt-10">
              {sections.map((section) => (
                <section key={section} className="mb-9">
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#717376]">{section}</h3>
                  <ol className="border-b border-[#DEDFE1]">
                    {course.lessons.filter((lesson) => lesson.section === section).map((lesson) => (
                      <li key={lesson.slug}>
                        <Link href={`/dashboard/tutor/academy/lessons/${lesson.slug}`} className="group flex min-h-14 items-center gap-4 border-t border-[#DEDFE1] py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2">
                          <BookOpen size={16} strokeWidth={1.7} className="shrink-0 text-[#717376]" aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-bold leading-5 text-[#252629] transition-colors group-hover:text-[#1E5AA8]">{lesson.title}</span>
                            <span className="mt-0.5 block text-[11px] text-[#717376]">{lesson.durationMinutes} minutes</span>
                          </span>
                          <AcademyProgressRing state={getAcademyLessonProgressState(progress, lesson.slug)} size={20} />
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
              <section>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#717376]">Complete</h3>
                <Link href="/dashboard/tutor/academy/quiz" className="group flex min-h-14 items-center gap-4 border-y border-[#DEDFE1] py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2">
                  <BookOpen size={16} strokeWidth={1.7} className="shrink-0 text-[#717376]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-[14px] font-bold text-[#252629] transition-colors group-hover:text-[#1E5AA8]">Final knowledge check</span>
                  <AcademyProgressRing state={getAcademyQuizProgressState(progress, course)} size={20} />
                </Link>
              </section>
            </div>
          </section>

          {additionalCourses.length ? <section className="mt-16 border-t border-[#DEDFE1] pt-12"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#717376]">More Academy courses</p><h2 className="mt-2 text-[30px] font-bold leading-10 tracking-[-0.02em] text-[#101010]">Continue learning</h2><div className="mt-6 border-b border-[#DEDFE1]">{additionalCourses.map((item) => <Link key={item.key} href={`/dashboard/tutor/academy/courses/${item.key}`} className="group flex min-h-20 items-center gap-4 border-t border-[#DEDFE1] py-4"><BookOpen size={18} className="text-[#717376]" /><span className="flex-1"><strong className="block text-sm text-[#252629] group-hover:text-[#1E5AA8]">{item.title}</strong><span className="mt-1 block text-xs text-[#717376]">{item.lessons.length} lessons · {item.estimatedMinutes} minutes</span></span><ArrowRight size={17} className="text-[#717376]" /></Link>)}</div></section> : null}
        </div>
      </main>
    </div>
  );
}
