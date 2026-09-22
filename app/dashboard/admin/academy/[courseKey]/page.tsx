import { notFound } from "next/navigation";
import AcademyCourseEditor from "@/components/admin/AcademyCourseEditor";
import AcademyCourseEditorLegacy from "@/components/admin/AcademyCourseEditorLegacy";
import { getAcademyCourseDraft, getAcademyCourseSnapshots, getAcademyMediaLibrary } from "@/lib/academy-courses";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function EditAcademyCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseKey: string }>;
  searchParams: Promise<{ lesson?: string; assessment?: string }>;
}) {
  const { courseKey } = await params;
  const query = await searchParams;
  const record = await getAcademyCourseDraft(courseKey);
  if (!record) notFound();
  const [mediaLibrary, useV2, snapshots] = await Promise.all([
    getAcademyMediaLibrary(),
    isFeatureEnabled("academy_builder_v2_enabled"),
    record.id ? getAcademyCourseSnapshots(record.id) : Promise.resolve([]),
  ]);
  const course = { ...record.draft, id: record.id || undefined };
  if (useV2) return <AcademyCourseEditor initialCourse={course} status={record.status} mediaLibrary={mediaLibrary} initialRevision={record.draftRevision} snapshots={snapshots} initialLessonId={query.lesson} initialAssessmentOpen={query.assessment === "true"} />;
  return <main className="mx-auto max-w-6xl px-4 py-8 md:px-8"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">Academy builder · {record.status}</p><h1 className="mt-2 text-3xl font-black text-secondary">Edit {record.title}</h1><div className="mt-7"><AcademyCourseEditorLegacy initialCourse={course} status={record.status} mediaLibrary={mediaLibrary} /></div></main>;
}
