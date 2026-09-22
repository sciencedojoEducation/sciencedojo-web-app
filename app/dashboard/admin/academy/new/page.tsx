import AcademyCourseEditor from "@/components/admin/AcademyCourseEditor";
import AcademyCourseEditorLegacy from "@/components/admin/AcademyCourseEditorLegacy";
import type { AcademyCourse } from "@/lib/tutor-academy";
import { getAcademyMediaLibrary } from "@/lib/academy-courses";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { academyTemplates, getAcademyTemplate } from "@/lib/academy-templates";

const blankCourse: AcademyCourse = {
  key: "new-course",
  title: "New Academy course",
  shortTitle: "New course",
  description:
    "Describe what learners will understand and be able to do after this course.",
  estimatedMinutes: 20,
  heroImage: "/images/home/8.professional-online-teacher.jpg",
  audienceRoles: ["tutor"],
  passMark: 80,
  quizRevision: 1,
  lessons: [
    {
      slug: "welcome",
      section: "Getting started",
      title: "Welcome",
      summary: "Introduce the course and its learning goals.",
      durationMinutes: 5,
      blocks: [
        {
          type: "text",
          heading: "Welcome",
          paragraphs: ["Add your lesson content here."],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "question-1",
      prompt: "What is the most important idea from this course?",
      options: [
        { id: "a", label: "First answer" },
        { id: "b", label: "Second answer" },
      ],
      correctOptionId: "a",
      explanation: "Explain why this answer is correct.",
    },
  ],
};

export default async function NewAcademyCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const [mediaLibrary, useV2] = await Promise.all([
    getAcademyMediaLibrary(),
    isFeatureEnabled("academy_builder_v2_enabled"),
  ]);
  if (!useV2)
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">
          Academy builder
        </p>
        <h1 className="mt-2 text-3xl font-black text-secondary">
          Create course
        </h1>
        <div className="mt-7">
          <AcademyCourseEditorLegacy
            initialCourse={blankCourse}
            status="draft"
            mediaLibrary={mediaLibrary}
          />
        </div>
      </main>
    );
  if (!template)
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">
          Academy builder
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-secondary">
          Start with a strong structure
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-secondary/55">
          Choose a professionally designed starting point. Every template
          remains fully editable in the studio.
        </p>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {academyTemplates.map((item) => (
            <a
              key={item.key}
              href={`/dashboard/admin/academy/new?template=${item.key}`}
              className="group rounded-[1.5rem] border border-secondary/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <span className="rounded-full bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-primary">
                {item.badge}
              </span>
              <h2 className="mt-5 text-2xl font-black text-secondary">
                {item.name}
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-secondary/55">
                {item.description}
              </p>
              <span className="mt-6 inline-flex text-xs font-black uppercase tracking-[0.1em] text-primary">
                Use this template →
              </span>
            </a>
          ))}
        </div>
      </main>
    );
  const selectedCourse = getAcademyTemplate(template).course;
  return (
    <AcademyCourseEditor
      initialCourse={selectedCourse}
      status="draft"
      mediaLibrary={mediaLibrary}
    />
  );
}
