import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveAcademyTheme } from "@/lib/academy-theme";
import { germanB2HeroImage } from "@/lib/german-b2-visuals";
import type { AcademyCourse } from "@/lib/tutor-academy";

export default function AcademyCourseCover({
  course,
  ctaHref,
  ctaLabel,
}: {
  course: AcademyCourse;
  ctaHref: string;
  ctaLabel: string;
}) {
  const b2 = course.key === "german-b2-complete";
  const theme = {
    ...resolveAcademyTheme(course),
    ...(b2 && course.theme?.coverStyle === "minimal"
      ? { coverStyle: "split-image" as const } : {}),
  };
  const image =
    course.heroImage || (b2 ? germanB2HeroImage : undefined) ||
    "/images/home/8.professional-online-teacher.jpg";
  const usesImage = theme.coverStyle !== "minimal";
  const overlaysImage = theme.coverStyle === "full-image";
  const splitImage = theme.coverStyle === "split-image";
  const journey = theme.preset === "journey";
  const actionLabel = b2
    ? ctaLabel === "Start course" ? "Kurs starten"
      : ctaLabel === "Continue course" ? "Kurs fortsetzen" : ctaLabel
    : ctaLabel;

  return (
    <section
      style={
        splitImage
          ? {
              backgroundImage: b2
                ? "linear-gradient(135deg, #f8f4ff 0%, #eee7fb 54%, #e8f5ef 100%)"
                : "linear-gradient(135deg, #eaf3fa 0%, #dfecf5 54%, #f3e8d3 100%)",
              boxShadow: "0 20px 50px -34px rgba(15, 42, 70, 0.62)",
            }
          : undefined
      }
      className={`academy-course-cover relative overflow-hidden ${
        splitImage
          ? "grid min-h-[550px] border-b border-slate-300 md:grid-cols-2"
          : theme.coverStyle === "minimal"
            ? "flex min-h-[460px] items-end bg-[var(--academy-accent-soft)]"
            : "flex min-h-[460px] items-end bg-slate-900 sm:min-h-[550px]"
      }`}
    >
      {splitImage ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden md:right-1/2"
        >
          <span className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[var(--academy-accent)] opacity-[0.09] blur-3xl" />
          <span className="absolute -bottom-32 left-[42%] h-72 w-72 rounded-full bg-[var(--academy-spark)] opacity-25 blur-3xl" />
          <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--academy-accent)]/25 to-transparent" />
        </div>
      ) : null}
      {usesImage ? (
        <div
          className={
            theme.coverStyle === "split-image"
              ? "relative min-h-[300px] md:col-start-2 md:row-start-1"
              : "absolute inset-0"
          }
        >
          <Image
            src={image}
            alt=""
            fill
            preload
            sizes={splitImage ? "(min-width: 768px) 50vw, 100vw" : "100vw"}
            className="object-cover"
          />
          {splitImage ? (
            <div
              aria-hidden="true"
              className={`absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r to-transparent md:block ${b2 ? "from-[#F0EAFB]" : "from-[#EEF5FA]"}`}
            />
          ) : null}
        </div>
      ) : null}
      {overlaysImage ? (
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.12)_100%)]" />
      ) : null}
      <div
        className={`relative w-full px-6 pb-16 pt-24 sm:px-10 ${
          splitImage
            ? "md:col-start-1 md:row-start-1 md:flex md:items-end md:px-16"
            : "mx-auto max-w-[1100px]"
        }`}
      >
        <div
          className={`max-w-[650px] ${overlaysImage ? "text-white" : "text-[#17202C]"}`}
        >
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.2em] ${overlaysImage ? "text-white/75" : "text-[var(--academy-accent)]"}`}
          >
            {journey ? "ScienceDojo Learning Journey" : "ScienceDojo Academy"}
          </p>
          <h1 className="mt-5 text-[40px] font-black leading-[1.08] sm:text-[50px]">
            {course.title}
          </h1>
          <p
            className={`academy-reading-copy mt-5 max-w-xl text-[17px] leading-8 ${overlaysImage ? "text-white/90" : "text-[#27313B]"}`}
          >
            {course.description}
          </p>
          <Link
            href={ctaHref}
            className={`mt-8 inline-flex min-h-11 items-center gap-2 rounded-full px-7 text-xs font-black uppercase tracking-[0.1em] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${overlaysImage ? "bg-white text-[#101010] focus-visible:ring-white" : "bg-[var(--academy-accent)] text-white focus-visible:ring-[var(--academy-accent)]"}`}
          >
            {actionLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          {journey ? (
            <p className={`mt-5 inline-flex items-center rounded-full bg-[var(--academy-spark)] px-4 py-2 text-xs font-bold text-[#17202C] ${overlaysImage ? "shadow-lg" : ""}`}>
              {b2 ? "Lernen · Anwenden · Fortschritt sehen" : "Learn a little · Try it · See your progress"}
            </p>
          ) : null}
        </div>
      </div>
      {splitImage ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-gradient-to-r from-[var(--academy-accent)] via-[var(--academy-spark)] to-transparent opacity-55"
        />
      ) : null}
    </section>
  );
}
