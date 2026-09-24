"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, ExternalLink, Menu, X } from "lucide-react";
import {
  getAcademyLessonProgressState,
  getAcademyProgressPercent,
  getAcademyQuizProgressState,
  type AcademyLesson,
  type AcademyCourse,
  type AcademyProgress,
} from "@/lib/tutor-academy";
import AcademyProgressRing from "./AcademyProgressRing";
import { useDashboardRole } from "@/components/DashboardFrame";

type NavigationCourse = Pick<
  AcademyCourse,
  "key" | "shortTitle" | "heroImage" | "lessons" | "quizRevision" | "rules"
>;

function NavigationContent({
  lessons,
  progress,
  course,
  basePath,
  onNavigate,
  onLessonNavigate,
}: {
  lessons: AcademyLesson[];
  progress: AcademyProgress;
  course: NavigationCourse;
  basePath: string;
  onNavigate?: () => void;
  onLessonNavigate?: (lessonSlug: string) => void;
}) {
  const pathname = usePathname();
  const sections = Array.from(new Set(lessons.map((lesson) => lesson.section)));

  return (
    <nav aria-label="Tutor Academy course contents">
      {sections.map((section) => (
        <details key={section} open className="group border-b border-[#DEDFE1]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#717376] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--academy-accent)] [&::-webkit-details-marker]:hidden">
            {section}
            <ChevronDown
              size={14}
              className="transition-transform group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </summary>
          <ol>
            {lessons
              .filter((lesson) => lesson.section === section)
              .map((lesson) => {
                const href = `${basePath}/lessons/${lesson.slug}`;
                const active = pathname === href;
                const lessonIndex = lessons.findIndex(
                  (candidate) =>
                    candidate.id === lesson.id ||
                    candidate.slug === lesson.slug,
                );
                const previous =
                  lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
                const previousComplete =
                  !previous ||
                  getAcademyLessonProgressState(
                    progress,
                    previous.slug,
                    previous.id,
                  ) === "completed";
                const locked =
                  course.rules?.navigation === "linear" && !previousComplete;
                const content = (
                  <>
                    <BookOpen
                      size={15}
                      className="shrink-0 text-[#717376]"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">{lesson.title}</span>
                    <AcademyProgressRing
                      state={getAcademyLessonProgressState(
                        progress,
                        lesson.slug,
                        lesson.id,
                      )}
                      size={17}
                    />
                  </>
                );
                return (
                  <li key={lesson.slug}>
                    {locked ? (
                      <span
                        aria-disabled="true"
                        title="Complete the previous lesson first"
                        className="relative flex min-h-[52px] cursor-not-allowed items-center gap-3 border-t border-[#ECEDEF] px-5 py-3 text-[13px] font-bold leading-4 text-[#717376] opacity-55"
                      >
                        {content}
                      </span>
                    ) : (
                      <Link
                        href={href}
                        onClick={() => {
                          onLessonNavigate?.(lesson.slug);
                          onNavigate?.();
                        }}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex min-h-[52px] items-center gap-3 border-t border-[#ECEDEF] px-5 py-3 text-[13px] font-bold leading-4 text-[#252629] outline-none transition-colors hover:bg-[#F7F7F7] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--academy-accent)] motion-reduce:transition-none ${active ? "bg-[#F3F3F3] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--academy-accent)]" : ""}`}
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
          </ol>
        </details>
      ))}
      {course.rules?.requireFinalAssessment !== false ? (
        <section>
          <h2 className="flex min-h-11 items-center px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#717376]">
            Complete
          </h2>
          <Link
            href={`${basePath}/quiz`}
            onClick={onNavigate}
            aria-current={pathname.endsWith("/quiz") ? "page" : undefined}
            className={`relative flex min-h-[52px] items-center gap-3 border-y border-[#ECEDEF] px-5 py-3 text-[13px] font-bold leading-4 text-[#252629] outline-none hover:bg-[#F7F7F7] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--academy-accent)] ${pathname.endsWith("/quiz") ? "bg-[#F3F3F3] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--academy-accent)]" : ""}`}
          >
            <BookOpen
              size={15}
              className="shrink-0 text-[#717376]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">Final knowledge check</span>
            <AcademyProgressRing
              state={getAcademyQuizProgressState(progress, course)}
              size={17}
            />
          </Link>
        </section>
      ) : null}
    </nav>
  );
}

function CourseRail({
  course,
  progress,
  basePath,
  exitHref,
  onLessonNavigate,
}: {
  course: NavigationCourse;
  progress: AcademyProgress;
  basePath: string;
  exitHref: string;
  onLessonNavigate: (lessonSlug: string) => void;
}) {
  const progressPercent = getAcademyProgressPercent(progress, course);
  const lessons = course.lessons;

  return (
    <aside className="hidden h-full w-[280px] shrink-0 overflow-y-auto border-r border-[#DEDFE1] bg-white lg:block">
      <div className="relative h-40 overflow-hidden bg-slate-800">
        <Image
          src={
            course.heroImage || "/images/home/8.professional-online-teacher.jpg"
          }
          alt=""
          fill
          priority
          sizes="280px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
        <Link
          href={basePath}
          className="absolute inset-x-5 bottom-4 text-lg font-bold leading-6 text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {course.shortTitle}
        </Link>
      </div>
      <div className="border-b border-[#DEDFE1] px-5 py-4">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-[#717376]">
          <span>Course progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          className="mt-3 h-1 overflow-hidden bg-[#E6E7E9]"
          aria-label={`${progressPercent}% course progress`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className="h-full bg-[var(--academy-accent)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <NavigationContent
        lessons={lessons}
        progress={progress}
        course={course}
        basePath={basePath}
        onLessonNavigate={onLessonNavigate}
      />
      <div className="p-5">
        <Link
          href={exitHref}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#717376] hover:text-[var(--academy-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--academy-accent)]"
        >
          Exit to dashboard <ExternalLink size={14} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

export default function AcademyCourseNavigation({
  children,
  course,
  basePath,
  exitHref = "/dashboard/tutor",
  progress: initialProgress,
}: {
  children: React.ReactNode;
  course: NavigationCourse;
  basePath: string;
  exitHref?: string;
  progress: AcademyProgress;
}) {
  const lessons = course.lessons;
  const dashboardRole = useDashboardRole();
  const resolvedExitHref = exitHref === "/dashboard" && (dashboardRole === "student" || dashboardRole === "parent") ? `/dashboard/${dashboardRole}` : exitHref;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [startedLessons, setStartedLessons] = useState(
    initialProgress.startedLessons,
  );
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const isOverview = pathname === basePath;

  useEffect(() => {
    if (!open) return;
    const menuButton = menuButtonRef.current;
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [open]);

  const progress = useMemo(() => {
    const lessonPrefix = `${basePath}/lessons/`;
    const currentLesson = pathname.startsWith(lessonPrefix)
      ? pathname.slice(lessonPrefix.length).split("/")[0]
      : undefined;
    return {
      ...initialProgress,
      startedLessons:
        currentLesson && !startedLessons.includes(currentLesson)
          ? [...startedLessons, currentLesson]
          : startedLessons,
    };
  }, [basePath, initialProgress, pathname, startedLessons]);
  const progressPercent = getAcademyProgressPercent(progress, course);
  const markLessonStarted = (lessonSlug: string) => {
    setStartedLessons((current) =>
      current.includes(lessonSlug) ? current : [...current, lessonSlug],
    );
  };

  if (isOverview) {
    return (
      <div className="relative h-full overflow-y-auto bg-white">
        <Link
          href={resolvedExitHref}
          className="fixed right-4 top-4 z-40 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/35 bg-black/35 px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6 sm:top-6"
        >
          Exit to dashboard <ExternalLink size={14} aria-hidden="true" />
        </Link>
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-white">
      <CourseRail
        course={course}
        progress={progress}
        basePath={basePath}
        exitHref={resolvedExitHref}
        onLessonNavigate={markLessonStarted}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-[#DEDFE1] bg-white lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-14 w-14 items-center justify-center text-[#252629] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--academy-accent)]"
            aria-label="Open course contents"
            aria-expanded={open}
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <Link
            href={basePath}
            className="min-w-0 flex-1 truncate border-l border-[#DEDFE1] px-4 text-sm font-bold text-[#252629]"
          >
            {course.shortTitle}
          </Link>
          <span
            className="px-3 text-xs font-bold text-[#717376]"
            aria-label={`${progressPercent}% complete`}
          >
            {progressPercent}%
          </span>
          <Link
            href={resolvedExitHref}
            aria-label="Exit to dashboard"
            className="inline-flex h-14 w-12 items-center justify-center border-l border-[#DEDFE1] text-[#717376] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--academy-accent)]"
          >
            <ExternalLink size={17} aria-hidden="true" />
          </Link>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close course contents"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Course contents"
            className="relative h-full w-[min(22rem,calc(100vw-2rem))] overflow-y-auto bg-white shadow-2xl"
          >
            <div className="relative h-36 overflow-hidden bg-slate-800">
              <Image
                src={
                  course.heroImage ||
                  "/images/home/8.professional-online-teacher.jpg"
                }
                alt=""
                fill
                sizes="352px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />
              <div className="absolute inset-x-5 bottom-4 text-lg font-bold text-white">
                {course.shortTitle}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white focus-visible:outline-2 focus-visible:outline-white"
                aria-label="Close course contents"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <div className="border-b border-[#DEDFE1] px-5 py-4">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-[#717376]">
                <span>Course progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="mt-3 h-1 bg-[#E6E7E9]">
                <div
                  className="h-full bg-[var(--academy-accent)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <NavigationContent
              lessons={lessons}
              progress={progress}
              course={course}
              basePath={basePath}
              onNavigate={() => setOpen(false)}
              onLessonNavigate={markLessonStarted}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
