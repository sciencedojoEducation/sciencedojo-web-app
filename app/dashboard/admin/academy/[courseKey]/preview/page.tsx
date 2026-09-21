import Image from "next/image";
import { Merriweather } from "next/font/google";
import { notFound } from "next/navigation";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import { getAcademyCourseDraft } from "@/lib/academy-courses";

const academySerif = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-academy-serif" });

export default async function AcademyDraftPreviewPage({ params }: { params: Promise<{ courseKey: string }> }) {
  const { courseKey } = await params;
  const record = await getAcademyCourseDraft(courseKey);
  if (!record) notFound();
  const course = record.draft;
  return <main className={`${academySerif.variable} min-h-screen bg-white pb-20 text-[#101010]`}>
    <div className="sticky top-0 z-30 flex min-h-12 items-center justify-between border-b border-amber-200 bg-amber-50 px-5 text-xs font-black text-amber-900"><span>ADMIN DRAFT PREVIEW · NOT VISIBLE TO LEARNERS</span><a href={`/dashboard/admin/academy/${course.key}`} className="underline">Return to editor</a></div>
    <header className="relative flex min-h-[420px] items-end overflow-hidden bg-slate-900">{course.heroImage ? <Image src={course.heroImage} alt="" fill priority sizes="100vw" className="object-cover" /> : null}<div className="absolute inset-0 bg-black/60" /><div className="relative mx-auto w-full max-w-4xl px-6 py-16 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em]">{course.shortTitle}</p><h1 className="mt-4 text-5xl font-black">{course.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{course.description}</p></div></header>
    <div className="mx-auto max-w-[728px] px-6 py-16">{course.lessons.map((lesson, index) => <article key={lesson.slug} className={index ? "mt-20 border-t border-[#DEDFE1] pt-16" : ""}><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#717376]">{lesson.section} · {lesson.durationMinutes} min</p><h2 className="mt-3 text-4xl font-bold">{lesson.title}</h2><p className="mt-5 font-[family-name:var(--font-academy-serif)] text-[17px] leading-[33px] text-[#4A4B4E]">{lesson.summary}</p><div className="mt-10"><AcademyLessonBlocks blocks={lesson.blocks} /></div></article>)}</div>
  </main>;
}
