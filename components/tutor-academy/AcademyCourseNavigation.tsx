"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronRight, Menu, X } from "lucide-react";
import type { AcademyLesson, AcademyProgress } from "@/lib/tutor-academy";

function NavigationContent({ lessons, progress }: { lessons: AcademyLesson[]; progress: AcademyProgress }) {
  const pathname = usePathname();
  const sections = Array.from(new Set(lessons.map((lesson) => lesson.section)));

  return (
    <nav aria-label="Tutor Academy lessons" className="space-y-6">
      {sections.map((section) => (
        <section key={section}>
          <h2 className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-secondary/35">{section}</h2>
          <ol className="mt-2 space-y-1">
            {lessons.filter((lesson) => lesson.section === section).map((lesson) => {
              const lessonIndex = lessons.findIndex((item) => item.slug === lesson.slug);
              const href = `/dashboard/tutor/academy/lessons/${lesson.slug}`;
              const active = pathname === href;
              const complete = progress.completedLessons.includes(lesson.slug);
              return (
                <li key={lesson.slug}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${active ? "bg-primary text-white shadow-lg shadow-primary/15" : "text-secondary/65 hover:bg-primary/5 hover:text-primary"}`}
                  >
                    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${active ? "bg-white/15 text-white" : complete ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-secondary/45"}`}>
                      {complete ? <Check size={15} strokeWidth={3} /> : lessonIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-black leading-5">{lesson.title}</span>
                    <ChevronRight size={15} className={active ? "text-white/70" : "text-secondary/20 group-hover:text-primary"} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <section>
        <h2 className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-secondary/35">Complete</h2>
        <Link
          href="/dashboard/tutor/academy/quiz"
          aria-current={pathname.endsWith("/quiz") ? "page" : undefined}
          className={`mt-2 flex items-center gap-3 rounded-2xl px-3 py-3 font-black transition-colors ${pathname.endsWith("/quiz") ? "bg-primary text-white" : "text-secondary/65 hover:bg-primary/5 hover:text-primary"}`}
        >
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs ${progress.completedAt ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-secondary/45"}`}>
            {progress.completedAt ? <Check size={15} strokeWidth={3} /> : "✓"}
          </span>
          <span className="text-sm">Final knowledge check</span>
        </Link>
      </section>
    </nav>
  );
}

export default function AcademyCourseNavigation({ lessons, progress }: { lessons: AcademyLesson[]; progress: AcademyProgress }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-secondary px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-xl lg:hidden"
        aria-label="Open course contents"
        aria-expanded={open}
      >
        <Menu size={18} /> Lessons
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button type="button" aria-label="Close course contents" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
          <aside className="relative h-full w-[min(23rem,calc(100vw-2rem))] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Tutor Academy</p>
                <p className="mt-1 font-black text-secondary">Course contents</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-secondary" aria-label="Close course contents">
                <X size={19} />
              </button>
            </div>
            <div onClick={() => setOpen(false)}><NavigationContent lessons={lessons} progress={progress} /></div>
          </aside>
        </div>
      )}

      <aside className="hidden w-72 shrink-0 border-r border-secondary/8 bg-white/80 p-5 lg:block">
        <div className="sticky top-6"><NavigationContent lessons={lessons} progress={progress} /></div>
      </aside>
    </>
  );
}
