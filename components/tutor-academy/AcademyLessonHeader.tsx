import { formatCourseDuration } from "@/lib/formatTime";
import Image from "next/image";
import { Clock } from "lucide-react";
import { resolveAcademyTheme } from "@/lib/academy-theme";
import { isGermanAcademyCourse } from "@/lib/german-academy-course";
import { germanB2HeroImage, germanB2SectionScenes } from "@/lib/german-b2-visuals";
import { nicosLessonBanner } from "@/lib/nicos-weg-a1-visuals";
import type { AcademyCourse, AcademyLesson } from "@/lib/tutor-academy";

export default function AcademyLessonHeader({
  course,
  lesson,
  index,
  sequence,
  nextStepLabel,
  contentWidthClass = "max-w-[728px] lg:max-w-[1080px] xl:max-w-[1200px]",
}: {
  course: AcademyCourse;
  lesson: AcademyLesson;
  index: number;
  sequence?: AcademyLesson[];
  nextStepLabel?: string;
  contentWidthClass?: string;
}) {
  const theme = resolveAcademyTheme(course);
  const b2 = course.key === "german-b2-complete";
  const nicosBanner = nicosLessonBanner(course.key, lesson);
  const mediaLed = Boolean(nicosBanner) || theme.lessonHeaderStyle === "media-led" ||
    (b2 && theme.lessonHeaderStyle === "editorial");
  const german = isGermanAcademyCourse(course.key);
  const scene = b2 ? germanB2SectionScenes[lesson.sectionId || ""] : undefined;
  const headerImage = nicosBanner?.src || (b2
    ? scene?.src || germanB2HeroImage
    : course.heroImage || "/images/home/8.professional-online-teacher.jpg");
  const journey = sequence || course.lessons;
  const sectionStart = index === 0 || journey[index - 1]?.sectionId !== lesson.sectionId;
  const hasSceneBlock = lesson.blocks.some((item) => item.type === "image" && item.id?.endsWith("-section-scene"));
  const following = journey[index + 1];
  const nextText = nextStepLabel || (following
    ? `${german ? "Als Nächstes" : "Next"}: ${following.title}`
    : course.rules?.requireFinalAssessment !== false
      ? german ? "Als Nächstes: Abschlusstest" : "Next: final knowledge check"
      : german ? "Letzter Schritt in diesem Kurs" : "Final step in this course");
  return (
    <header
      className={`academy-lesson-header relative overflow-hidden border-b border-[#DEDFE1] px-6 sm:px-10 ${
        theme.lessonHeaderStyle === "compact"
          ? "pb-7 pt-8"
          : "pb-10 pt-12 sm:pt-16"
      } ${mediaLed ? "bg-slate-900 text-white" : "bg-white"}`}
    >
      {mediaLed ? (
        <>
          <Image
            src={headerImage}
            alt=""
            fill
            sizes="100vw"
            loading={b2 ? "eager" : "lazy"}
            className={`object-cover ${nicosBanner ? "object-[center_35%] opacity-100" : b2 ? "opacity-100" : "opacity-35"}`}
          />
          <div className={`absolute inset-0 ${nicosBanner ? "bg-gradient-to-r from-black/85 via-black/70 to-black/45" : b2 ? "bg-[#14112B]/70 md:bg-gradient-to-r md:from-[#14112B]/90 md:via-[#14112B]/70 md:to-[#14112B]/15" : "bg-gradient-to-r from-black/80 via-black/55 to-black/20"}`} />
        </>
      ) : null}
      <div className={`relative mx-auto ${contentWidthClass}`}>
        <div
          className={`flex flex-wrap gap-3 text-[13px] font-semibold ${mediaLed ? "text-white/75" : "text-[#717376]"}`}
        >
          <span>{lesson.section}</span>
          <span>·</span>
          <span>
            {german ? "Lektion" : "Lesson"} {index + 1} {german ? "von" : "of"} {journey.length}
          </span>
          <span>·</span>
          <span className="inline-flex gap-1.5">
            <Clock size={14} aria-hidden="true" />
            {formatCourseDuration(lesson.durationMinutes)}
          </span>
        </div>
        <h1 className="mt-5 text-[32px] font-bold leading-[1.2] sm:text-[40px] sm:leading-[48px]">
          {lesson.title}
        </h1>
        <div className="mt-5 h-1 w-12 bg-[var(--academy-accent)]" />
        <p
          className={`academy-reading-copy mt-6 text-[17px] leading-[33px] ${mediaLed ? "text-white/85" : "text-[#27313B]"}`}
        >
          {lesson.summary}
        </p>
        {scene && sectionStart && !hasSceneBlock ? (
          <p className="mt-6 border-l-2 border-[var(--academy-spark)] pl-4 text-sm leading-6 text-white/90">
            <span className="font-bold">Bildimpuls · </span>{scene.prompt}
          </p>
        ) : null}
        {theme.preset === "journey" ? (
          <div data-academy-lesson-progress className={`mt-8 flex flex-wrap items-center gap-3 rounded-xl p-4 text-sm ${mediaLed ? "bg-white/15 text-white" : "bg-[var(--academy-accent-soft)] text-[var(--academy-accent-ink)]"}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--academy-spark)] font-bold text-[#17202C]">{index + 1}</span>
            <span className="font-semibold">{german ? "Schritt" : "Step"} {index + 1} {german ? "von" : "of"} {journey.length}</span>
            <span className={mediaLed ? "text-white/80" : "text-[#435164]"}>{nextText}</span>
          </div>
        ) : null}
        {nicosBanner?.attribution ? <p className="mt-3 text-right text-xs text-white/80">{nicosBanner.attribution} · Folge {nicosBanner.episode}: {nicosBanner.title}</p> : null}
      </div>
    </header>
  );
}
