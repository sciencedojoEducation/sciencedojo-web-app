import AcademyCourseEditor from "@/components/admin/AcademyCourseEditor";
import type { AcademyCourse } from "@/lib/tutor-academy";
import { getAcademyMediaLibrary } from "@/lib/academy-courses";

const blankCourse: AcademyCourse = {
  key: "new-course",
  title: "New Academy course",
  shortTitle: "New course",
  description: "Describe what learners will understand and be able to do after this course.",
  estimatedMinutes: 20,
  heroImage: "/images/home/8.professional-online-teacher.jpg",
  audienceRoles: ["tutor"],
  passMark: 80,
  quizRevision: 1,
  lessons: [{ slug: "welcome", section: "Getting started", title: "Welcome", summary: "Introduce the course and its learning goals.", durationMinutes: 5, blocks: [{ type: "text", heading: "Welcome", paragraphs: ["Add your lesson content here."] }] }],
  quiz: [{ id: "question-1", prompt: "What is the most important idea from this course?", options: [{ id: "a", label: "First answer" }, { id: "b", label: "Second answer" }], correctOptionId: "a", explanation: "Explain why this answer is correct." }],
};

export default async function NewAcademyCoursePage() {
  const mediaLibrary = await getAcademyMediaLibrary();
  return <main className="mx-auto max-w-6xl px-4 py-8 md:px-8"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">Academy builder</p><h1 className="mt-2 text-3xl font-black text-secondary">Create course</h1><div className="mt-7"><AcademyCourseEditor initialCourse={blankCourse} status="draft" mediaLibrary={mediaLibrary} /></div></main>;
}
