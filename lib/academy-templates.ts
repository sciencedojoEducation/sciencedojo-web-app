import { migrateAcademyCourse } from "./academy-schema.ts";
import { stakeholderAcademyTemplates } from "./academy-stakeholder-templates.ts";
import type { AcademyAudienceRole, AcademyCourse } from "@/lib/tutor-academy";

export type AcademyTemplateCategory =
  | "Foundations"
  | "Platform training"
  | "Platform updates"
  | "UK subject learning";

export type AcademyTemplate = {
  key: string;
  name: string;
  description: string;
  badge: string;
  image: string;
  imageAlt: string;
  accent: string;
  category: AcademyTemplateCategory;
  audienceRoles: AcademyAudienceRole[];
  learningPattern: string;
  curriculumLabel?: string;
  course: AcademyCourse;
};

const baseCourse: AcademyCourse = {
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
  lessons: [],
  quiz: [],
};

function makeTemplate(overrides: Partial<AcademyCourse>): AcademyCourse {
  const draft = { ...structuredClone(baseCourse), ...overrides };
  if (draft.lessons[0]) {
    draft.lessons[0].blocks.push({
      type: "callout",
      heading: "Author review",
      body: "[[AUTHOR: Replace or verify the starter copy, answer choices, links, and images before publishing. Remove this note when the course is ready.]]",
      tone: "amber",
    });
  }
  return migrateAcademyCourse(draft);
}

export const academyTemplates: AcademyTemplate[] = [
  {
    key: "blank",
    name: "Blank course",
    badge: "Flexible",
    image: "/images/education-bg-minimal.png",
    imageAlt: "A calm abstract learning workspace",
    accent: "#46627F",
    category: "Foundations",
    audienceRoles: ["tutor"],
    learningPattern: "Open structure",
    description: "Start with one clean lesson and shape every block yourself.",
    course: makeTemplate({
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
    }),
  },
  {
    key: "guided-induction",
    name: "Guided induction",
    badge: "Recommended",
    image: "/images/home/8.professional-online-teacher.jpg",
    imageAlt: "A professional online tutor leading a lesson",
    accent: "#1E5AA8",
    category: "Foundations",
    audienceRoles: ["tutor_applicant", "tutor"],
    learningPattern: "Welcome → standards → decision → check",
    description:
      "A welcoming, scenario-led onboarding structure with a final check.",
    course: makeTemplate({
      audienceRoles: ["tutor_applicant", "tutor"],
      title: "New team induction",
      shortTitle: "Team induction",
      description:
        "Help new team members understand the mission, essential standards, and what excellent practice looks like.",
      estimatedMinutes: 35,
      lessons: [
        {
          slug: "welcome",
          section: "Welcome",
          title: "Why your work matters",
          summary:
            "Connect the learner to the mission and the people they support.",
          durationMinutes: 6,
          blocks: [
            {
              type: "text",
              heading: "Welcome",
              paragraphs: ["Open with the human reason this course matters."],
            },
            {
              type: "quote",
              quote: "Add a memorable principle that anchors the course.",
              attribution: "Your organisation",
            },
          ],
        },
        {
          slug: "standards",
          section: "Core practice",
          title: "The standards we share",
          summary: "Turn policies into clear, observable actions.",
          durationMinutes: 10,
          blocks: [
            {
              type: "numbered-list",
              heading: "What good looks like",
              items: [
                {
                  title: "Prepare",
                  body: "Explain the first essential behaviour.",
                },
                {
                  title: "Act",
                  body: "Explain the second essential behaviour.",
                },
                {
                  title: "Reflect",
                  body: "Explain the third essential behaviour.",
                },
              ],
            },
            {
              type: "callout",
              heading: "Remember",
              body: "Highlight the most important boundary or safety rule.",
              tone: "blue",
            },
          ],
        },
        {
          slug: "scenario",
          section: "Core practice",
          title: "Apply it to a real situation",
          summary:
            "Let learners practise a realistic decision before the final assessment.",
          durationMinutes: 9,
          blocks: [
            {
              type: "worked-example",
              heading: "A typical situation",
              problem: "Describe a realistic challenge.",
              steps: [
                { title: "Notice", body: "Identify the important facts." },
                { title: "Decide", body: "Choose a safe, effective response." },
              ],
              answer: "Explain the recommended response and why it works.",
            },
            {
              type: "knowledge-check",
              heading: "Quick check",
              question: {
                id: "inline-1",
                prompt: "What should happen first?",
                options: [
                  { id: "a", label: "Recommended action" },
                  { id: "b", label: "Plausible distractor" },
                ],
                correctOptionId: "a",
                explanation: "Connect the answer to the standard.",
              },
            },
          ],
        },
      ],
      quiz: [
        {
          id: "final-1",
          prompt: "Which action best reflects the course standard?",
          options: [
            { id: "a", label: "Recommended action" },
            { id: "b", label: "Plausible distractor" },
            { id: "c", label: "Unsafe or ineffective action" },
          ],
          correctOptionId: "a",
          explanation: "Explain the principle, not only the answer.",
        },
      ],
    }),
  },
  {
    key: "microlearning",
    name: "Focused microlearning",
    badge: "10–15 min",
    image: "/images/home/6.focused-student-study.jpg",
    imageAlt: "A focused student working through a short learning activity",
    accent: "#B56B2E",
    category: "Foundations",
    audienceRoles: ["tutor", "parent", "student"],
    learningPattern: "Goal → idea → recall → apply",
    description:
      "A concise single-topic lesson with interaction and immediate practice.",
    course: makeTemplate({
      audienceRoles: ["tutor", "parent", "student"],
      title: "Focused skill builder",
      shortTitle: "Skill builder",
      description:
        "Teach one useful idea quickly, then let learners practise it.",
      estimatedMinutes: 12,
      rules: {
        navigation: "free",
        lessonCompletion: "required-blocks",
        requireFinalAssessment: false,
        attemptLimit: null,
        feedbackTiming: "immediate",
      },
      lessons: [
        {
          slug: "learn-practise-apply",
          section: "Skill builder",
          title: "Learn, practise, apply",
          summary: "A focused sequence for one clear learning objective.",
          durationMinutes: 12,
          blocks: [
            {
              type: "callout",
              heading: "Learning goal",
              body: "State one observable outcome using a strong action verb.",
              tone: "teal",
            },
            {
              type: "text",
              heading: "The essential idea",
              paragraphs: [
                "Explain the idea with a concise example and plain language.",
              ],
            },
            {
              type: "flashcards",
              heading: "Check the essentials",
              items: [
                { title: "Prompt", body: "Reveal the answer or definition." },
                { title: "Prompt", body: "Reveal the answer or definition." },
              ],
              completion: "interact",
            },
            {
              type: "knowledge-check",
              heading: "Try it",
              question: {
                id: "inline-1",
                prompt: "Apply the idea to this example.",
                options: [
                  { id: "a", label: "Correct application" },
                  { id: "b", label: "Common misconception" },
                ],
                correctOptionId: "a",
                explanation: "Explain the reasoning.",
              },
              completion: "pass",
            },
          ],
        },
      ],
      quiz: [],
    }),
  },
  {
    key: "media-story",
    name: "Visual story",
    badge: "Media-rich",
    image: "/images/home/9.modern-online-tutoring.jpg",
    imageAlt: "A modern online learning session",
    accent: "#39766C",
    category: "Foundations",
    audienceRoles: ["tutor", "parent", "student"],
    learningPattern: "Observe → explore → compare → reflect",
    description:
      "An editorial narrative with gallery, carousel, tabs, and reflection.",
    course: makeTemplate({
      audienceRoles: ["tutor", "parent", "student"],
      title: "A visual learning story",
      shortTitle: "Visual story",
      description:
        "Guide learners through a topic using purposeful imagery, progressive disclosure, and reflection.",
      estimatedMinutes: 25,
      lessons: [
        {
          slug: "explore",
          section: "Explore",
          title: "See the bigger picture",
          summary:
            "Use a strong opening image and a short narrative to establish context.",
          durationMinutes: 8,
          blocks: [
            {
              type: "image",
              src: "/images/home/8.professional-online-teacher.jpg",
              alt: "A professional tutor teaching online",
              caption: "Replace this with a purposeful course image.",
              width: "wide",
              aspect: "wide",
              focalPoint: "center",
            },
            {
              type: "text",
              heading: "Set the scene",
              paragraphs: [
                "Use a short editorial introduction that invites curiosity.",
              ],
            },
            {
              type: "carousel",
              heading: "Explore the story",
              items: [
                {
                  eyebrow: "Part one",
                  title: "Begin with context",
                  body: "Introduce the situation.",
                  src: "/images/home/8.professional-online-teacher.jpg",
                  alt: "Online teaching workspace",
                },
                {
                  eyebrow: "Part two",
                  title: "Reveal the insight",
                  body: "Show what changes and why it matters.",
                  src: "/images/home/8.professional-online-teacher.jpg",
                  alt: "Tutor working with a learner",
                },
              ],
            },
          ],
        },
        {
          slug: "compare",
          section: "Make meaning",
          title: "Compare the choices",
          summary: "Help learners distinguish between similar ideas.",
          durationMinutes: 8,
          blocks: [
            {
              type: "tabs",
              heading: "Different perspectives",
              items: [
                {
                  title: "Option A",
                  body: "Explain when this approach is useful.",
                },
                { title: "Option B", body: "Explain its trade-offs." },
              ],
            },
            {
              type: "comparison-table",
              heading: "At a glance",
              columns: ["Approach", "Best for", "Watch for"],
              rows: [
                ["Option A", "Situation", "Trade-off"],
                ["Option B", "Situation", "Trade-off"],
              ],
            },
          ],
        },
      ],
      quiz: [
        {
          id: "reflection-1",
          type: "reflection",
          prompt: "What will you apply first, and why?",
          options: [],
          correctOptionId: "",
          explanation: "Encourage a specific next action.",
        },
      ],
    }),
  },
  ...stakeholderAcademyTemplates,
];

export function filterAcademyTemplates(filters: {
  search?: string;
  audience?: string;
  category?: string;
}) {
  const search = (filters.search || "").trim().toLowerCase();
  return academyTemplates.filter(
    (item) =>
      (!filters.audience ||
        filters.audience === "all" ||
        item.audienceRoles.includes(filters.audience as AcademyAudienceRole)) &&
      (!filters.category ||
        filters.category === "all" ||
        item.category === filters.category) &&
      (!search ||
        `${item.name} ${item.description} ${item.learningPattern} ${item.curriculumLabel || ""}`
          .toLowerCase()
          .includes(search)),
  );
}

export function getAcademyTemplate(key?: string) {
  return (
    academyTemplates.find((template) => template.key === key) ||
    academyTemplates[0]
  );
}
