import Image from "next/image";
import { Clock } from "lucide-react";
import { resolveAcademyTheme } from "@/lib/academy-theme";
import type { AcademyCourse, AcademyLesson } from "@/lib/tutor-academy";

export default function AcademyLessonHeader({
  course,
  lesson,
  index,
}: {
  course: AcademyCourse;
  lesson: AcademyLesson;
  index: number;
}) {
  const theme = resolveAcademyTheme(course);
  const mediaLed = theme.lessonHeaderStyle === "media-led";
  return (
    <header
      className={`relative overflow-hidden border-b border-[#DEDFE1] px-6 sm:px-10 ${
        theme.lessonHeaderStyle === "compact"
          ? "pb-7 pt-8"
          : "pb-10 pt-12 sm:pt-16"
      } ${mediaLed ? "bg-slate-900 text-white" : "bg-white"}`}
    >
      {mediaLed ? (
        <>
          <Image
            src={
              course.heroImage ||
              "/images/home/8.professional-online-teacher.jpg"
            }
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        </>
      ) : null}
      <div className="relative mx-auto max-w-[728px]">
        <div
          className={`flex flex-wrap gap-3 text-[13px] font-semibold ${mediaLed ? "text-white/75" : "text-[#717376]"}`}
        >
          <span>{lesson.section}</span>
          <span>·</span>
          <span>
            Lesson {index + 1} of {course.lessons.length}
          </span>
          <span>·</span>
          <span className="inline-flex gap-1.5">
            <Clock size={14} aria-hidden="true" />
            {lesson.durationMinutes} min
          </span>
        </div>
        <h1 className="mt-5 text-[32px] font-bold leading-[1.2] sm:text-[40px] sm:leading-[48px]">
          {lesson.title}
        </h1>
        <div className="mt-5 h-1 w-12 bg-[var(--academy-accent)]" />
        <p
          className={`academy-reading-copy mt-6 text-[17px] leading-[33px] ${mediaLed ? "text-white/85" : "text-[#4A4B4E]"}`}
        >
          {lesson.summary}
        </p>
      </div>
    </header>
  );
}
