import Link from "next/link";
import { notFound } from "next/navigation";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyStoryPractice from "@/components/tutor-academy/AcademyStoryPractice";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { germanB2StoryCourse as course } from "@/lib/german-b2-story";
import type { LessonBlock } from "@/lib/tutor-academy";

export const metadata = {
  title: "Ankommen · German B2 Story Pilot",
  description: "Try three original German B2 story episodes with voiced dialogues and interactive practice.",
  robots: { index: false, follow: false },
};
const base = "/academy/deutsch-b2-story";
const href = (slug: string) => `${base}?episode=${encodeURIComponent(slug)}`;

export default async function GermanB2StoryPage({ searchParams }: { searchParams: Promise<{ episode?: string }> }) {
  const { episode } = await searchParams;
  const lesson = episode ? course.lessons.find(item => item.slug === episode) : undefined;
  if (episode && !lesson) notFound();
  const index = lesson ? course.lessons.indexOf(lesson) : -1;
  const practice = lesson?.blocks.filter((block): block is Extract<LessonBlock, { type: "writing-practice" | "speaking-practice" }> => block.type === "writing-practice" || block.type === "speaking-practice") || [];
  return (
    <AcademyThemeScope course={course} lang="de" className="min-h-screen bg-[#faf9f6] text-slate-900">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <Link href={base} className="py-2 font-bold tracking-wide text-[#31594e]">ANKOMMEN <span className="ml-2 font-normal text-slate-500">Deutsch B2</span></Link>
          <span className="rounded-full bg-[#edf0e9] px-3 py-1 text-xs text-[#31594e]">Story pilot · 3 Folgen · kostenlos ausprobieren</span>
        </div>
      </div>
      {!lesson ? <main>
        <section className="relative overflow-hidden bg-[#173d35] px-6 py-16 text-white sm:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-96 w-96 rounded-full border-[50px] border-white/5" />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c9d9a9]">Eine Geschichte. Drei Perspektiven. Ihr nächster Schritt.</p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">Ein Haus,<br />viele Stimmen.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/80">Ein Gemeinschaftsraum soll verschwinden. Mira, Jonas und Leyla haben einen anderen Plan. Hören Sie zu, lesen Sie zwischen den Zeilen und finden Sie Ihre eigenen Worte.</p>
            <Link href={href(course.lessons[0].slug)} className="mt-9 inline-flex min-h-12 items-center rounded-full bg-[#d6e6b5] px-6 py-3 font-semibold text-[#173d35] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Mit Folge 1 beginnen →</Link>
            <p className="mt-5 text-sm text-white/65">Für sicheres B1 auf dem Weg zu B2 · etwa 35 Minuten pro Folge · deutsche Dialoge, englische Sprachhilfen</p>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-bold">Lernen Sie die Hausgemeinschaft kennen</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">{[
            ["Mira", "Die neue Perspektive", "Neu im Haus. Sie fragt nach, bevor sie urteilt, und sucht eine gemeinsame Lösung."],
            ["Jonas", "Der engagierte Nachbar", "Er hat den Reparaturtreff aufgebaut. Er will handeln – und fürchtet leere Versprechen."],
            ["Leyla", "Die Vermittlerin", "Sie bringt Menschen zusammen und achtet darauf, dass gute Ideen auch im Alltag funktionieren."],
          ].map(([name, role, description]) => <article key={name} className="rounded-2xl border border-[#dedfd7] bg-white p-6"><p className="text-xs font-semibold uppercase tracking-widest text-[#627652]">{role}</p><h3 className="mt-2 text-2xl font-semibold">{name}</h3><p className="mt-3 leading-7 text-slate-600">{description}</p></article>)}</div>
          <h2 className="mt-12 text-2xl font-bold">Ihre drei Folgen</h2>
          <div className="mt-6 space-y-4">{course.lessons.map(item => <Link key={item.slug} href={href(item.slug)} className="group flex min-h-24 items-center justify-between gap-5 rounded-2xl border border-[#dedfd7] bg-white p-6 transition hover:border-[#31594e] focus-visible:outline-2 focus-visible:outline-[#31594e]"><div><h3 className="text-xl font-semibold">{item.title}</h3><p className="mt-2 leading-6 text-slate-600">{item.summary}</p><p className="mt-2 text-xs text-[#627652]">Hörszene · 8 Wortkarten · Grammatik · Schreiben · Sprechen</p></div><span aria-hidden="true" className="text-2xl text-[#31594e]">→</span></Link>)}</div>
          <p className="mt-8 max-w-3xl text-sm leading-6 text-slate-600">Dies ist ein originaler dreiteiliger Pilot mit synthetischen Stimmen, kein vollständiger B2-Kurs. Die Geschichte und Dialoge sind eigenständig; es besteht keine Verbindung zu Deutsche Welle oder Nico’s Weg. Sie üben ohne Anmeldung. Antworten auf Wissensfragen werden nicht dauerhaft gespeichert; Ihre Schreibtexte bleiben nur in diesem Browser.</p>
        </section>
      </main> : <main>
        <nav aria-label="Folgen" className="mx-auto flex max-w-6xl flex-wrap gap-2 px-6 py-5">
          <Link href={base} className="inline-flex min-h-11 items-center rounded-full border border-slate-300 px-4 text-sm">Übersicht</Link>
          {course.lessons.map(item => <Link key={item.slug} href={href(item.slug)} aria-current={item.slug === lesson.slug ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${item.slug === lesson.slug ? "bg-[#173d35] text-white" : "border border-slate-300 bg-white"}`}>{item.title}</Link>)}
        </nav>
        <header className="border-y border-[#d9dfd5] bg-[#edf0e9] px-6 py-10">
          <div className="mx-auto max-w-[900px]"><p className="text-xs font-semibold uppercase tracking-widest text-[#627652]">Staffel 1 · Folge {index + 1} von 3 · 35 Minuten</p><h1 className="mt-4 text-3xl font-bold sm:text-5xl">{lesson.title}</h1><p className="mt-5 text-lg leading-8 text-slate-600">{lesson.summary}</p></div>
        </header>
        <div className="mx-auto max-w-[900px] px-6 py-10">
          <AcademyLessonBlocks key={lesson.slug} continuous blocks={lesson.blocks.slice(0, 8)} presentationCourseKey={course.key} uiLanguage="de" />
          <div className="my-10"><AcademyStoryPractice key={`practice-${lesson.slug}`} blocks={practice} /></div>
          <AcademyLessonBlocks continuous blocks={lesson.blocks.slice(10)} presentationCourseKey={course.key} uiLanguage="de" />
          <nav aria-label="Weiterlernen" className="mt-12 flex flex-wrap justify-between gap-4 border-t border-slate-200 pt-6">
            <Link href={index > 0 ? href(course.lessons[index - 1].slug) : base} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#31594e]">← {index > 0 ? "Vorherige Folge" : "Zur Übersicht"}</Link>
            <Link href={index < 2 ? href(course.lessons[index + 1].slug) : base} className="inline-flex min-h-11 items-center rounded-full bg-[#173d35] px-5 text-sm font-semibold text-white">{index < 2 ? "Nächste Folge →" : "Pilot beendet · Zur Übersicht"}</Link>
          </nav>
        </div>
      </main>}
    </AcademyThemeScope>
  );
}
