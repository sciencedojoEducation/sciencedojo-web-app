"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AcademyPreviewDevicePicker from "./AcademyPreviewDevicePicker";
import {
  academyPreviewDevices,
  type AcademyPreviewDeviceId,
} from "@/lib/academy-preview-devices";

export default function AcademyTemplatePreviewStudio({
  templateKey,
  templateName,
  lessons,
  hasQuiz,
}: {
  templateKey: string;
  templateName: string;
  lessons: { slug: string; title: string }[];
  hasQuiz: boolean;
}) {
  const [deviceId, setDeviceId] = useState<AcademyPreviewDeviceId>("desktop");
  const [view, setView] = useState<"cover" | "lesson" | "quiz">("cover");
  const [lessonSlug, setLessonSlug] = useState(lessons[0]?.slug || "");
  const device = academyPreviewDevices.find((item) => item.id === deviceId)!;
  const query = new URLSearchParams({
    template: templateKey,
    embedded: "1",
    view,
  });
  if (view === "lesson" && lessonSlug) query.set("lesson", lessonSlug);

  return (
    <main className="flex min-h-screen flex-col bg-[#17191d] text-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#202329] px-4 py-3">
        <Link
          href="/dashboard/admin/academy/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowLeft size={16} /> Templates
        </Link>
        <div className="mr-auto min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
            Starter preview
          </p>
          <p className="truncate text-sm font-semibold">{templateName}</p>
        </div>
        <AcademyPreviewDevicePicker value={deviceId} onChange={setDeviceId} />
        <select
          value={view}
          onChange={(event) => setView(event.target.value as typeof view)}
          aria-label="Preview page"
          className="min-h-11 rounded-lg border border-white/15 bg-[#30343b] px-3 text-xs font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <option value="cover">Course cover</option>
          {lessons.length ? <option value="lesson">Lesson</option> : null}
          {hasQuiz ? <option value="quiz">Final assessment</option> : null}
        </select>
        {view === "lesson" ? (
          <select
            value={lessonSlug}
            onChange={(event) => setLessonSlug(event.target.value)}
            aria-label="Preview lesson"
            className="min-h-11 max-w-48 rounded-lg border border-white/15 bg-[#30343b] px-3 text-xs font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {lessons.map((lesson) => (
              <option key={lesson.slug} value={lesson.slug}>
                {lesson.title}
              </option>
            ))}
          </select>
        ) : null}
        <Link
          href={`/dashboard/admin/academy/new?template=${encodeURIComponent(templateKey)}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-xs font-bold text-[#18212B] outline-none hover:bg-[#E6EDF8] focus-visible:ring-2 focus-visible:ring-white"
        >
          Use template <ArrowRight size={15} />
        </Link>
      </header>
      <div className="flex flex-1 justify-center overflow-auto p-4 sm:p-6">
        <iframe
          key={`${view}-${lessonSlug}`}
          title={`${templateName} ${view} preview`}
          src={`/dashboard/admin/academy/new/preview?${query.toString()}`}
          className="shrink-0 border-0 bg-white shadow-2xl transition-[width,height] duration-200 motion-reduce:transition-none"
          style={{ width: device.width, height: device.height }}
        />
      </div>
    </main>
  );
}
