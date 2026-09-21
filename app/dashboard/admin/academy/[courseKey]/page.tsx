import { notFound } from "next/navigation";
import AcademyCourseEditor from "@/components/admin/AcademyCourseEditor";
import { getAcademyCourseDraft, getAcademyMediaLibrary } from "@/lib/academy-courses";

export default async function EditAcademyCoursePage({ params }: { params: Promise<{ courseKey: string }> }) {
  const { courseKey } = await params;
  const record = await getAcademyCourseDraft(courseKey);
  if (!record) notFound();
  const mediaLibrary = await getAcademyMediaLibrary();
  return <main className="mx-auto max-w-6xl px-4 py-8 md:px-8"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">Academy builder · {record.status}</p><h1 className="mt-2 text-3xl font-black text-secondary">Edit {record.title}</h1><div className="mt-7"><AcademyCourseEditor initialCourse={{ ...record.draft, id: record.id || undefined }} status={record.status} mediaLibrary={mediaLibrary} /></div></main>;
}
