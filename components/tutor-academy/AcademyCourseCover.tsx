import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveAcademyTheme } from "@/lib/academy-theme";
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
  const theme = resolveAcademyTheme(course);
  const image =
    course.heroImage || "/images/home/8.professional-online-teacher.jpg";
  const usesImage = theme.coverStyle !== "minimal";
  const overlaysImage = theme.coverStyle === "full-image";

  return (
    <section
      className={`relative overflow-hidden ${
        theme.coverStyle === "split-image"
          ? "grid min-h-[550px] md:grid-cols-2"
          : theme.coverStyle === "minimal"
            ? "flex min-h-[460px] items-end bg-[var(--academy-accent-soft)]"
            : "flex min-h-[460px] items-end bg-slate-900 sm:min-h-[550px]"
      }`}
    >
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
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      {overlaysImage ? (
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.12)_100%)]" />
      ) : null}
      <div
        className={`relative w-full px-6 pb-16 pt-24 sm:px-10 ${
          theme.coverStyle === "split-image"
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
            ScienceDojo Academy
          </p>
          <h1 className="mt-5 text-[40px] font-black leading-[1.08] sm:text-[50px]">
            {course.title}
          </h1>
          <p
            className={`academy-reading-copy mt-5 max-w-xl text-[17px] leading-8 ${overlaysImage ? "text-white/80" : "text-[#4A4B4E]"}`}
          >
            {course.description}
          </p>
          <Link
            href={ctaHref}
            className={`mt-8 inline-flex min-h-11 items-center gap-2 rounded-full px-7 text-xs font-black uppercase tracking-[0.1em] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${overlaysImage ? "bg-white text-[#101010] focus-visible:ring-white" : "bg-[var(--academy-accent)] text-white focus-visible:ring-[var(--academy-accent)]"}`}
          >
            {ctaLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
