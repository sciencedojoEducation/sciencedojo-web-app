import { migrateAcademyCourse } from "@/lib/academy-schema";
import type { AcademyCourse } from "@/lib/tutor-academy";

export type AcademyTemplate = {
  key: string;
  name: string;
  description: string;
  badge: string;
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
  return migrateAcademyCourse({ ...structuredClone(baseCourse), ...overrides });
}

export const academyTemplates: AcademyTemplate[] = [
  {
    key: "blank",
    name: "Blank course",
    badge: "Flexible",
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
    description:
      "A welcoming, scenario-led onboarding structure with a final check.",
    course: makeTemplate({
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
    description:
      "A concise single-topic lesson with interaction and immediate practice.",
    course: makeTemplate({
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
    description:
      "An editorial narrative with gallery, carousel, tabs, and reflection.",
    course: makeTemplate({
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
];

export function getAcademyTemplate(key?: string) {
  return (
    academyTemplates.find((template) => template.key === key) ||
    academyTemplates[0]
  );
}
