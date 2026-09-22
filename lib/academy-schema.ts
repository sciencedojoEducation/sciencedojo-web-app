import type {
  AcademyCourse,
  AcademyLesson,
  AcademySection,
  LessonBlock,
  QuizQuestion,
} from "@/lib/tutor-academy";

export const ACADEMY_DOCUMENT_SCHEMA_VERSION = 2;
export const ACADEMY_BLOCK_SCHEMA_VERSION = 1;

export type AcademyBlockCategory =
  | "Text"
  | "Media"
  | "Interactive"
  | "Data & STEM"
  | "Assessment";

export type AcademyBlockDefinition = {
  type: LessonBlock["type"];
  label: string;
  description: string;
  category: AcademyBlockCategory;
  keywords: string[];
  create: () => LessonBlock;
};

export function createAcademyId(prefix: string) {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value}`;
}

function identity(type: LessonBlock["type"]) {
  return {
    id: createAcademyId("block"),
    type,
    schemaVersion: ACADEMY_BLOCK_SCHEMA_VERSION,
  } as const;
}

export const academyBlockRegistry: AcademyBlockDefinition[] = [
  {
    type: "text",
    label: "Rich text",
    description: "Headings, paragraphs, lists, links, code, and equations.",
    category: "Text",
    keywords: ["paragraph", "heading", "copy"],
    create: () => ({
      ...identity("text"),
      type: "text",
      heading: "New section",
      paragraphs: ["Start writing here."],
    }),
  },
  {
    type: "quote",
    label: "Quote",
    description: "An editorial quotation with attribution.",
    category: "Text",
    keywords: ["testimonial", "statement"],
    create: () => ({
      ...identity("quote"),
      type: "quote",
      quote: "Add a memorable quotation.",
      attribution: "Source",
    }),
  },
  {
    type: "callout",
    label: "Callout",
    description: "Highlight a tip, warning, or important idea.",
    category: "Text",
    keywords: ["notice", "tip", "warning"],
    create: () => ({
      ...identity("callout"),
      type: "callout",
      heading: "Key point",
      body: "Add helpful context.",
      tone: "blue",
    }),
  },
  {
    type: "numbered-list",
    label: "Numbered list",
    description: "Present a clear ordered sequence.",
    category: "Text",
    keywords: ["steps", "list"],
    create: () => ({
      ...identity("numbered-list"),
      type: "numbered-list",
      heading: "Steps",
      items: [
        {
          id: createAcademyId("item"),
          title: "First step",
          body: "Explain this step.",
        },
      ],
    }),
  },
  {
    type: "divider",
    label: "Divider",
    description: "Create a visual pause between ideas.",
    category: "Text",
    keywords: ["separator", "space"],
    create: () => ({ ...identity("divider"), type: "divider", label: "" }),
  },
  {
    type: "image",
    label: "Image",
    description: "A responsive image with accessible description.",
    category: "Media",
    keywords: ["photo", "picture"],
    create: () => ({
      ...identity("image"),
      type: "image",
      src: "",
      alt: "",
      caption: "",
      aspect: "wide",
      width: "wide",
    }),
  },
  {
    type: "gallery",
    label: "Image gallery",
    description: "A responsive two- or three-column gallery.",
    category: "Media",
    keywords: ["photos", "grid"],
    create: () => ({
      ...identity("gallery"),
      type: "gallery",
      heading: "Gallery",
      columns: 2,
      items: [{ id: createAcademyId("item"), src: "", alt: "", caption: "" }],
    }),
  },
  {
    type: "carousel",
    label: "Media carousel",
    description: "Swipeable cards containing copy and imagery.",
    category: "Media",
    keywords: ["slider", "slides"],
    create: () => ({
      ...identity("carousel"),
      type: "carousel",
      heading: "Explore",
      items: [
        {
          id: createAcademyId("item"),
          eyebrow: "01",
          title: "First card",
          body: "Add the card content.",
          src: "",
          alt: "",
        },
      ],
    }),
  },
  {
    type: "video",
    label: "Video",
    description: "Embed an approved YouTube or Vimeo video.",
    category: "Media",
    keywords: ["youtube", "vimeo", "film"],
    create: () => ({
      ...identity("video"),
      type: "video",
      heading: "Watch",
      url: "",
      caption: "",
      transcript: "",
    }),
  },
  {
    type: "audio",
    label: "Audio",
    description: "Embed approved Spotify or SoundCloud audio.",
    category: "Media",
    keywords: ["podcast", "listen"],
    create: () => ({
      ...identity("audio"),
      type: "audio",
      heading: "Listen",
      url: "",
      caption: "",
      transcript: "",
    }),
  },
  {
    type: "resources",
    label: "Resources",
    description: "Provide downloads and trusted external links.",
    category: "Media",
    keywords: ["pdf", "download", "link"],
    create: () => ({
      ...identity("resources"),
      type: "resources",
      heading: "Resources",
      items: [
        {
          id: createAcademyId("item"),
          title: "Resource",
          description: "",
          url: "",
        },
      ],
    }),
  },
  {
    type: "accordion",
    label: "Accordion",
    description: "Reveal supporting details progressively.",
    category: "Interactive",
    keywords: ["expand", "faq"],
    create: () => ({
      ...identity("accordion"),
      type: "accordion",
      heading: "Explore the details",
      items: [
        {
          id: createAcademyId("item"),
          title: "First item",
          body: "Add the detail.",
        },
      ],
    }),
  },
  {
    type: "tabs",
    label: "Tabs",
    description: "Compare related topics without a long page.",
    category: "Interactive",
    keywords: ["switch", "compare"],
    create: () => ({
      ...identity("tabs"),
      type: "tabs",
      heading: "Explore",
      items: [
        {
          id: createAcademyId("item"),
          title: "First tab",
          body: "Add the tab content.",
        },
      ],
    }),
  },
  {
    type: "flashcards",
    label: "Flashcards",
    description: "Create retrieval-practice cards.",
    category: "Interactive",
    keywords: ["flip", "recall"],
    create: () => ({
      ...identity("flashcards"),
      type: "flashcards",
      heading: "Check your recall",
      completion: "interact",
      items: [
        { id: createAcademyId("item"), title: "Question", body: "Answer" },
      ],
    }),
  },
  {
    type: "process",
    label: "Process",
    description: "Show a process or timeline as connected steps.",
    category: "Interactive",
    keywords: ["timeline", "sequence"],
    create: () => ({
      ...identity("process"),
      type: "process",
      heading: "Process",
      items: [
        {
          id: createAcademyId("item"),
          title: "Step one",
          body: "Explain the step.",
        },
      ],
    }),
  },
  {
    type: "comparison-table",
    label: "Comparison table",
    description: "Compare options in an accessible table.",
    category: "Data & STEM",
    keywords: ["table", "data"],
    create: () => ({
      ...identity("comparison-table"),
      type: "comparison-table",
      heading: "Compare",
      columns: ["Option", "Guidance"],
      rows: [["A", "Add guidance"]],
    }),
  },
  {
    type: "worked-example",
    label: "Worked example",
    description: "Reveal a STEM solution in teachable steps.",
    category: "Data & STEM",
    keywords: ["math", "equation", "solution"],
    create: () => ({
      ...identity("worked-example"),
      type: "worked-example",
      heading: "Worked example",
      problem: "Add the problem.",
      steps: [
        {
          id: createAcademyId("item"),
          title: "Step 1",
          body: "Explain the reasoning.",
        },
      ],
      answer: "Add the final answer.",
      latex: "",
    }),
  },
  {
    type: "knowledge-check",
    label: "Knowledge check",
    description: "Add a formative check inside the lesson.",
    category: "Assessment",
    keywords: ["quiz", "question", "assessment"],
    create: () => ({
      ...identity("knowledge-check"),
      type: "knowledge-check",
      heading: "Check your understanding",
      completion: "interact",
      required: false,
      question: createQuestion("single-choice"),
    }),
  },
];

export function createQuestion(
  type: NonNullable<QuizQuestion["type"]> = "single-choice",
): QuizQuestion {
  const id = createAcademyId("question");
  if (type === "reflection")
    return {
      id,
      type,
      prompt: "What is your key takeaway?",
      options: [],
      correctOptionId: "",
      explanation: "Use this space to reflect on your answer.",
    };
  return {
    id,
    type,
    prompt: "Add your question.",
    options: [
      { id: createAcademyId("option"), label: "Answer A" },
      { id: createAcademyId("option"), label: "Answer B" },
    ],
    correctOptionId: "",
    correctOptionIds: [],
    explanation: "Explain the answer.",
    weight: 1,
  };
}

function legacyId(...parts: Array<string | number>) {
  return `legacy:${parts.map(String).join(":")}`;
}

function migrateQuestion(
  question: QuizQuestion,
  courseKey: string,
  index: number,
): QuizQuestion {
  const options = (question.options || []).map((option, optionIndex) => ({
    ...option,
    id:
      option.id ||
      legacyId(courseKey, "question", index, "option", optionIndex),
  }));
  return {
    ...question,
    id: question.id || legacyId(courseKey, "question", index),
    type: question.type || "single-choice",
    options,
    correctOptionIds:
      question.correctOptionIds ||
      (question.correctOptionId ? [question.correctOptionId] : []),
    weight: question.weight || 1,
  };
}

function migrateBlock(
  block: LessonBlock,
  courseKey: string,
  lessonSlug: string,
  index: number,
): LessonBlock {
  const migrated = {
    ...block,
    id: block.id || legacyId(courseKey, lessonSlug, "block", index),
    schemaVersion: block.schemaVersion || ACADEMY_BLOCK_SCHEMA_VERSION,
  } as LessonBlock;
  if ("items" in migrated) {
    migrated.items = migrated.items.map((item, itemIndex) => ({
      ...item,
      id:
        item.id ||
        legacyId(courseKey, lessonSlug, "block", index, "item", itemIndex),
    })) as never;
  }
  if (migrated.type === "knowledge-check") {
    migrated.question = migrateQuestion(migrated.question, courseKey, index);
  }
  return migrated;
}

export function migrateAcademyCourse(input: AcademyCourse): AcademyCourse {
  const course = structuredClone(input);
  const sectionMap = new Map<string, AcademySection>();
  for (const [index, lesson] of course.lessons.entries()) {
    const title = lesson.section || "Course lessons";
    if (!sectionMap.has(title))
      sectionMap.set(title, {
        id: legacyId(course.key, "section", sectionMap.size),
        title,
      });
    const section = sectionMap.get(title)!;
    course.lessons[index] = {
      ...lesson,
      id: lesson.id || legacyId(course.key, lesson.slug),
      sectionId: lesson.sectionId || section.id,
      section: section.title,
      blocks: lesson.blocks.map((block, blockIndex) =>
        migrateBlock(block, course.key, lesson.slug, blockIndex),
      ),
    };
  }
  course.quiz = (course.quiz || []).map((question, index) =>
    migrateQuestion(question, course.key, index),
  );
  course.schemaVersion = ACADEMY_DOCUMENT_SCHEMA_VERSION;
  course.sections = course.sections?.length
    ? course.sections
    : [...sectionMap.values()];
  course.theme ||= {
    preset: "editorial",
    accent: "blue",
    typography: "editorial",
    density: "comfortable",
  };
  course.rules ||= {
    navigation: "free",
    lessonCompletion: "manual",
    requireFinalAssessment: true,
    attemptLimit: null,
    feedbackTiming: "after-submit",
  };
  return course;
}

export function createAcademyLesson(
  course: AcademyCourse,
  sectionId?: string,
): AcademyLesson {
  const section = course.sections?.find((item) => item.id === sectionId) ||
    course.sections?.[0] || {
      id: createAcademyId("section"),
      title: "Course lessons",
    };
  const number = course.lessons.length + 1;
  return {
    id: createAcademyId("lesson"),
    sectionId: section.id,
    section: section.title,
    slug: `new-lesson-${number}`,
    title: `New lesson ${number}`,
    summary: "Add a concise lesson summary.",
    durationMinutes: 5,
    blocks: [academyBlockRegistry[0].create()],
  };
}

export function getAcademyBlockDefinition(type: LessonBlock["type"]) {
  return academyBlockRegistry.find((definition) => definition.type === type)!;
}
