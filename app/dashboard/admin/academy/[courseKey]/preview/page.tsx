import Image from "next/image";
import { Merriweather } from "next/font/google";
import { notFound } from "next/navigation";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { getAcademyCourseDraft } from "@/lib/academy-courses";
import { resolveAcademyTheme } from "@/lib/academy-theme";

const academySerif = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-academy-serif" });

export default async function AcademyDraftPreviewPage({ params, searchParams }: { params: Promise<{ courseKey: string }>; searchParams: Promise<{ view?: string; lesson?: string }> }) {
  const [{ courseKey }, query] = await Promise.all([params, searchParams]);
  const record = await getAcademyCourseDraft(courseKey);
  if (!record) notFound();
  const course = record.draft;
  const theme = resolveAcademyTheme(course);
  const view = query.view === "quiz" || query.view === "lesson" ? query.view : "cover";
  const lesson = course.lessons.find((item) => item.slug === query.lesson) || course.lessons[0];
  return <AcademyThemeScope course={course} className={`${academySerif.variable} min-h-screen bg-white text-[#101010]`}>
    <div className="sticky top-0 z-30 flex min-h-9 items-center justify-center border-b border-amber-200 bg-amber-50 px-4 text-[9px] font-black uppercase tracking-[0.14em] text-amber-900">Admin draft preview · not visible to learners</div>
    {view === "cover" ? <main><header className={`relative overflow-hidden ${theme.coverStyle === "split-image" ? "grid min-h-[calc(100vh-36px)] md:grid-cols-2" : theme.coverStyle === "minimal" ? "flex min-h-[70vh] items-center bg-[var(--academy-accent-soft)]" : "flex min-h-[calc(100vh-36px)] items-end bg-slate-900"}`}>
      {course.heroImage && theme.coverStyle !== "minimal" ? <div className={theme.coverStyle === "split-image" ? "relative min-h-[340px] md:order-2" : "absolute inset-0"}><Image src={course.heroImage} alt="" fill priority sizes="100vw" className="object-cover" /></div> : null}
      {theme.coverStyle === "full-image" ? <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" /> : null}
      <div className={`relative z-10 w-full px-7 py-16 sm:px-12 ${theme.coverStyle === "full-image" ? "mx-auto max-w-5xl text-white" : "flex flex-col justify-center md:px-16"}`}><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--academy-accent)]">{course.shortTitle}</p><h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">{course.title}</h1><p className={`academy-reading-copy mt-6 max-w-2xl text-[17px] leading-8 ${theme.coverStyle === "full-image" ? "text-white/80" : "text-secondary/65"}`}>{course.description}</p><div className="mt-8 h-1 w-16 bg-[var(--academy-accent)]" /></div>
    </header></main> : null}
    {view === "lesson" && lesson ? <main className="pb-20"><header className={`${theme.lessonHeaderStyle === "compact" ? "py-9" : "py-14 sm:py-20"} border-b border-[#DEDFE1] bg-[var(--academy-accent-soft)] px-6`}><div className="mx-auto max-w-[728px]"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--academy-accent)]">{lesson.section} · {lesson.durationMinutes} min</p><h1 className={`mt-3 font-black tracking-[-0.03em] ${theme.lessonHeaderStyle === "compact" ? "text-3xl" : "text-4xl sm:text-5xl"}`}>{lesson.title}</h1><p className="academy-reading-copy mt-5 text-[17px] leading-8 text-[#4A4B4E]">{lesson.summary}</p></div></header><div className="mx-auto max-w-[728px] px-6 py-14"><AcademyLessonBlocks blocks={lesson.blocks} /></div></main> : null}
    {view === "quiz" ? <main className="mx-auto max-w-[760px] px-6 py-14 sm:py-20"><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--academy-accent)]">Final assessment</p><h1 className="mt-3 text-4xl font-black">Knowledge check</h1><p className="academy-reading-copy mt-5 text-[17px] leading-8 text-secondary/65">Pass mark {course.passMark || 80}% · {course.quiz.length} questions</p><div className="mt-10 space-y-5">{course.quiz.map((question, index) => <section key={question.id} className="border border-[#DEDFE1] p-5 sm:p-7"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--academy-accent)]">Question {index + 1}</p><h2 className="mt-2 text-xl font-bold">{question.prompt}</h2><div className="mt-5 space-y-2">{question.options.map((option) => <div key={option.id} className="border border-[#DEDFE1] px-4 py-3 text-sm">{option.label}</div>)}</div></section>)}</div></main> : null}
  </AcademyThemeScope>;
}
