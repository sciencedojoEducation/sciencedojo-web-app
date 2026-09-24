import type {
  AcademyAudienceRole,
  AcademyCourse,
  LessonBlock,
  QuizQuestion,
} from "@/lib/tutor-academy";

const courseKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedAudiences = new Set<AcademyAudienceRole>([
  "tutor_applicant",
  "tutor",
  "student",
  "parent",
]);
const allowedBlockTypes = new Set<LessonBlock["type"]>([
  "text",
  "image",
  "callout",
  "numbered-list",
  "accordion",
  "carousel",
  "quote",
  "comparison-table",
  "divider",
  "gallery",
  "video",
  "audio",
  "resources",
  "tabs",
  "flashcards",
  "process",
  "survey",
  "worked-example",
  "knowledge-check",
]);

export type AcademyValidationResult = {
  valid: boolean;
  errors: string[];
  issues: AcademyValidationIssue[];
};

export type AcademyValidationIssue = {
  code: string;
  scope: "course" | "lesson" | "block" | "media" | "assessment";
  message: string;
  lessonId?: string;
  blockId?: string;
  questionId?: string;
  field?: string;
};

function hasText(value: unknown, minimum = 1) {
  return typeof value === "string" && value.trim().length >= minimum;
}

function containsAuthorNote(value: unknown) {
  return (JSON.stringify(value) || "").includes("[[AUTHOR:");
}

function isSafeContentUrl(
  value: string,
  kind: "link" | "image" | "video" | "audio" = "link",
) {
  if (kind === "image" && value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    if (!new Set(["https:", "http:"]).has(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (kind === "video")
      return (
        hostname === "youtube.com" ||
        hostname === "youtu.be" ||
        hostname === "vimeo.com" ||
        hostname === "player.vimeo.com"
      );
    if (kind === "audio")
      return (
        hostname === "spotify.com" ||
        hostname === "open.spotify.com" ||
        hostname === "soundcloud.com" ||
        hostname === "w.soundcloud.com"
      );
    return true;
  } catch {
    return false;
  }
}

function collectHeadingLevels(value: unknown, levels: number[] = []) {
  if (!value || typeof value !== "object") return levels;
  const node = value as {
    type?: unknown;
    attrs?: { level?: unknown };
    content?: unknown[];
  };
  if (node.type === "heading") levels.push(Number(node.attrs?.level));
  if (Array.isArray(node.content))
    node.content.forEach((child) => collectHeadingLevels(child, levels));
  return levels;
}

function validateBlock(
  block: LessonBlock,
  lessonTitle: string,
  index: number,
  errors: string[],
) {
  const label = `${lessonTitle}, block ${index + 1}`;
  if (!block || !allowedBlockTypes.has(block.type)) {
    errors.push(`${label} has an unsupported block type.`);
    return;
  }
  if (block.appearance) {
    const allowedVariants = new Set(
      block.type === "numbered-list"
        ? ["numbered", "bulleted", "checklist"]
        : block.type === "process"
          ? ["slides", "timeline", "build-up"]
          : block.type === "flashcards"
            ? ["flip-grid", "stack"]
            : block.type === "survey"
              ? ["scale", "compact"]
              : ["image", "gallery", "carousel", "video", "audio"].includes(
                    block.type,
                  )
                ? ["framed", "immersive", "captioned"]
                : ["default", "editorial", "compact"],
    );
    if (!allowedVariants.has(block.appearance.variant))
      errors.push(`${label} has an unsupported visual variant.`);
    if (!new Set(["plain", "subtle", "accent"]).has(block.appearance.surface))
      errors.push(`${label} has an unsupported surface style.`);
    if (!new Set(["compact", "comfortable", "spacious"]).has(block.appearance.spacing))
      errors.push(`${label} has an unsupported spacing style.`);
    if (
      block.appearance.width &&
      !new Set(["narrow", "reading", "wide"]).has(block.appearance.width)
    )
      errors.push(`${label} has an unsupported content width.`);
  }
  const interactiveTypes: LessonBlock["type"][] = [
    "accordion",
    "carousel",
    "tabs",
    "flashcards",
    "process",
    "survey",
    "knowledge-check",
  ];
  if (block.completion === "interact" && !interactiveTypes.includes(block.type))
    errors.push(`${label} cannot use interaction-based completion.`);
  if (block.completion === "pass" && block.type !== "knowledge-check")
    errors.push(`${label} cannot use pass-based completion.`);
  if (
    block.type === "text" &&
    (!Array.isArray(block.paragraphs) ||
      !block.paragraphs.some((item) => hasText(item)))
  ) {
    errors.push(`${label} needs at least one paragraph.`);
  }
  if (block.type === "text" && block.content) {
    const headingLevels = collectHeadingLevels(block.content);
    if (headingLevels.some((level) => level !== 2 && level !== 3))
      errors.push(`${label} may only use level 2 and level 3 headings.`);
  }
  if (
    block.type === "text" &&
    block.layout &&
    block.layout !== "single" &&
    block.layout !== "two-column"
  )
    errors.push(`${label} has an unsupported text layout.`);
  if (
    block.type === "image" &&
    (!hasText(block.src) || (!block.decorative && !hasText(block.alt)))
  ) {
    errors.push(`${label} needs an image and descriptive alt text.`);
  }
  if (
    block.type === "image" &&
    hasText(block.src) &&
    !isSafeContentUrl(block.src, "image")
  )
    errors.push(`${label} has an invalid image URL.`);
  if (
    block.type === "callout" &&
    (!hasText(block.heading) || !hasText(block.body))
  ) {
    errors.push(`${label} needs a heading and body.`);
  }
  if (
    (block.type === "numbered-list" ||
      block.type === "accordion" ||
      block.type === "carousel") &&
    (!Array.isArray(block.items) || block.items.length === 0)
  ) {
    errors.push(`${label} needs at least one item.`);
  }
  if (
    block.type === "quote" &&
    (!hasText(block.quote) || !hasText(block.attribution))
  ) {
    errors.push(`${label} needs a quote and attribution.`);
  }
  if (
    block.type === "comparison-table" &&
    (block.columns.length < 2 ||
      block.rows.length === 0 ||
      block.rows.some((row) => row.length !== block.columns.length))
  ) {
    errors.push(
      `${label} needs at least two columns and rows matching those columns.`,
    );
  }
  if (
    (block.type === "gallery" || block.type === "carousel") &&
    (!block.items.length ||
      block.items.some(
        (item) =>
          item.src &&
          (!hasText(item.alt) || !isSafeContentUrl(item.src, "image")),
      ))
  ) {
    errors.push(
      `${label} needs at least one item and alt text for every image.`,
    );
  }
  if (
    (block.type === "video" || block.type === "audio") &&
    (!hasText(block.url) || !isSafeContentUrl(block.url, block.type))
  )
    errors.push(`${label} needs an approved ${block.type} URL.`);
  if (
    (block.type === "video" || block.type === "audio") &&
    hasText(block.url) &&
    !hasText(block.transcript)
  )
    errors.push(`${label} needs a transcript before publishing.`);
  if (
    (block.type === "image" ||
      block.type === "video" ||
      block.type === "audio") &&
    block.captionItems?.some((item) => {
      if (item.type === "ordered-list" || item.type === "unordered-list")
        return !item.items.length || item.items.some((value) => !hasText(value));
      if (item.type === "table")
        return (
          item.columns.length < 2 ||
          item.columns.some((value) => !hasText(value)) ||
          !item.rows.length ||
          item.rows.some(
            (row) =>
              row.length !== item.columns.length ||
              row.some((value) => !hasText(value)),
          )
        );
      return !hasText(item.latex) || !hasText(item.shortDescription);
    })
  )
    errors.push(`${label} has incomplete structured caption content.`);
  if (
    block.type === "resources" &&
    (!block.items.length ||
      block.items.some(
        (item) =>
          !hasText(item.title) ||
          !hasText(item.url) ||
          !isSafeContentUrl(item.url),
      ))
  )
    errors.push(`${label} needs titled HTTP or HTTPS resource links.`);
  if (
    (block.type === "tabs" ||
      block.type === "flashcards" ||
      block.type === "process") &&
    (!block.items.length ||
      block.items.some((item) => !hasText(item.title) || !hasText(item.body)))
  )
    errors.push(`${label} needs complete items.`);
  if (
    block.type === "survey" &&
    (!hasText(block.prompt) ||
      !hasText(block.lowLabel) ||
      !hasText(block.highLabel) ||
      !new Set([3, 5, 7]).has(block.scale))
  )
    errors.push(`${label} needs a question, endpoint labels, and a valid scale.`);
  if (
    block.type === "worked-example" &&
    (!hasText(block.problem) || !hasText(block.answer) || !block.steps.length)
  )
    errors.push(`${label} needs a problem, at least one step, and an answer.`);
  if (block.type === "knowledge-check")
    validateQuestion(block.question, index, errors);
}

function validateQuestion(
  question: QuizQuestion,
  index: number,
  errors: string[],
) {
  const label = `Quiz question ${index + 1}`;
  if (!hasText(question.id) || !hasText(question.prompt))
    errors.push(`${label} needs an ID and prompt.`);
  if (
    question.type !== "reflection" &&
    (!Array.isArray(question.options) || question.options.length < 2)
  )
    errors.push(`${label} needs at least two answers.`);
  if (
    question.type === "single-choice" &&
    !question.options?.some((option) => option.id === question.correctOptionId)
  )
    errors.push(`${label} must identify a valid correct answer.`);
  if (
    question.type === "multiple-response" &&
    (!(question.correctOptionIds || []).length ||
      (question.correctOptionIds || []).some(
        (id) => !question.options.some((option) => option.id === id),
      ))
  )
    errors.push(`${label} must identify valid correct answers.`);
  if (!hasText(question.explanation))
    errors.push(`${label} needs an answer explanation.`);
}

export function validateAcademyCourse(
  course: AcademyCourse,
): AcademyValidationResult {
  const errors: string[] = [];
  if (!courseKeyPattern.test(course.key))
    errors.push("Course key must use lowercase words separated by hyphens.");
  if (!hasText(course.title, 3))
    errors.push("Course title must contain at least 3 characters.");
  if (!hasText(course.shortTitle, 2))
    errors.push("Short title must contain at least 2 characters.");
  if (!hasText(course.description, 10))
    errors.push("Description must contain at least 10 characters.");
  if (containsAuthorNote([course.title, course.shortTitle, course.description]))
    errors.push("Course description contains an author note that must be resolved before publishing.");
  if (!Number.isFinite(course.estimatedMinutes) || course.estimatedMinutes < 1)
    errors.push("Estimated time must be at least one minute.");
  if (
    !Number.isFinite(course.passMark) ||
    Number(course.passMark) < 1 ||
    Number(course.passMark) > 100
  )
    errors.push("Pass mark must be between 1 and 100.");
  if (
    !course.audienceRoles?.length ||
    course.audienceRoles.some((role) => !allowedAudiences.has(role))
  )
    errors.push("Choose at least one valid audience.");
  if (!Array.isArray(course.lessons) || course.lessons.length === 0)
    errors.push("Add at least one lesson.");
  if (
    (course.rules?.requireFinalAssessment ?? true) &&
    (!Array.isArray(course.quiz) || course.quiz.length === 0)
  )
    errors.push("Add at least one final assessment question.");
  if (
    course.rules?.attemptLimit !== null &&
    course.rules?.attemptLimit !== undefined &&
    (course.rules.attemptLimit < 1 || course.rules.attemptLimit > 10)
  )
    errors.push("Attempt limit must be between 1 and 10, or unlimited.");

  const lessonSlugs = new Set<string>();
  const lessonIds = new Set<string>();
  const sectionIds = new Set(
    (course.sections || []).map((section) => section.id),
  );
  const requiresStableStructure =
    Number(course.schemaVersion || 1) >= 2 || Boolean(course.sections?.length);
  course.lessons?.forEach((lesson, lessonIndex) => {
    const label = `Lesson ${lessonIndex + 1}`;
    if (!courseKeyPattern.test(lesson.slug))
      errors.push(`${label} needs a lowercase hyphenated slug.`);
    if (lessonSlugs.has(lesson.slug))
      errors.push(`Lesson slug “${lesson.slug}” is duplicated.`);
    lessonSlugs.add(lesson.slug);
    if (
      requiresStableStructure &&
      (!hasText(lesson.id) || lessonIds.has(lesson.id!))
    )
      errors.push(`${label} needs a unique stable ID.`);
    if (lesson.id) lessonIds.add(lesson.id);
    if (
      requiresStableStructure &&
      (!hasText(lesson.sectionId) || !sectionIds.has(lesson.sectionId!))
    )
      errors.push(`${label} must belong to a valid section.`);
    if (
      !hasText(lesson.section) ||
      !hasText(lesson.title) ||
      !hasText(lesson.summary)
    )
      errors.push(`${label} needs a section, title and summary.`);
    if (containsAuthorNote([lesson.section, lesson.title, lesson.summary]))
      errors.push(`${label} contains an author note that must be resolved before publishing.`);
    if (!Number.isFinite(lesson.durationMinutes) || lesson.durationMinutes < 1)
      errors.push(`${label} needs a valid duration.`);
    if (!Array.isArray(lesson.blocks) || lesson.blocks.length === 0)
      errors.push(`${label} needs at least one content block.`);
    let hasLevelTwoHeading = false;
    lesson.blocks?.forEach((block, blockIndex) => {
      validateBlock(block, lesson.title || label, blockIndex, errors);
      if (containsAuthorNote(block))
        errors.push(`${lesson.title || label}, block ${blockIndex + 1} contains an author note that must be resolved before publishing.`);
      if (block.type !== "text") return;
      if (!block.content) {
        if (hasText(block.heading)) hasLevelTwoHeading = true;
        return;
      }
      for (const level of collectHeadingLevels(block.content)) {
        if (level === 2) hasLevelTwoHeading = true;
        if (level === 3 && !hasLevelTwoHeading)
          errors.push(
            `${lesson.title || label}, block ${blockIndex + 1} needs a level 2 heading before a level 3 heading.`,
          );
      }
    });
  });

  const questionIds = new Set<string>();
  course.quiz?.forEach((question, index) => {
    if (questionIds.has(question.id))
      errors.push(`Quiz question ID “${question.id}” is duplicated.`);
    questionIds.add(question.id);
    validateQuestion(question, index, errors);
    if (containsAuthorNote(question))
      errors.push(`Quiz question ${index + 1} contains an author note that must be resolved before publishing.`);
  });

  const issues = errors.map((message, issueIndex) =>
    locateAcademyValidationIssue(course, message, issueIndex),
  );
  return {
    valid: errors.length === 0,
    errors,
    issues,
  };
}

function locateAcademyValidationIssue(
  course: AcademyCourse,
  message: string,
  issueIndex: number,
): AcademyValidationIssue {
  const questionMatch = message.match(/Quiz question (\d+)/i);
  if (questionMatch) {
    const question = course.quiz[Number(questionMatch[1]) - 1];
    return {
      code: `assessment-${issueIndex + 1}`,
      scope: "assessment",
      message,
      questionId: question?.id,
      field: /explanation/i.test(message)
        ? "explanation"
        : /answer/i.test(message)
          ? "answers"
          : "prompt",
    };
  }

  const lesson = course.lessons.find((item, lessonIndex) => {
    const escapedTitle = item.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (
      new RegExp(`^${escapedTitle}, block \\d+`, "i").test(message) ||
      message.startsWith(`Lesson ${lessonIndex + 1} `) ||
      message.includes(`“${item.slug}”`)
    );
  });
  const blockMatch = message.match(/, block (\d+)/i);
  const block =
    lesson && blockMatch
      ? lesson.blocks[Number(blockMatch[1]) - 1]
      : undefined;
  const mediaIssue = /image|alt text|video|audio|transcript|media|url/i.test(
    message,
  );
  if (block) {
    return {
      code: `${mediaIssue ? "media" : "block"}-${issueIndex + 1}`,
      scope: mediaIssue ? "media" : "block",
      message,
      lessonId: lesson?.id,
      blockId: block.id,
      field: /alt text/i.test(message)
        ? "alt"
        : /transcript/i.test(message)
          ? "transcript"
          : /url/i.test(message)
            ? "url"
            : undefined,
    };
  }
  if (lesson) {
    return {
      code: `lesson-${issueIndex + 1}`,
      scope: "lesson",
      message,
      lessonId: lesson.id,
      field: /slug/i.test(message)
        ? "slug"
        : /duration/i.test(message)
          ? "durationMinutes"
          : undefined,
    };
  }
  return {
    code: `course-${issueIndex + 1}`,
    scope: "course",
    message,
    field: /title/i.test(message)
      ? "title"
      : /description/i.test(message)
        ? "description"
        : /audience/i.test(message)
          ? "audienceRoles"
          : undefined,
  };
}

export function academySlugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type AcademyValidationGroups = {
  course: string[];
  lessons: string[];
  media: string[];
  assessment: string[];
};

export type AcademyValidationIssueGroups = Record<
  "course" | "lessons" | "media" | "assessment",
  AcademyValidationIssue[]
>;

export function groupAcademyValidationIssues(
  issues: AcademyValidationIssue[],
): AcademyValidationIssueGroups {
  return issues.reduce<AcademyValidationIssueGroups>(
    (groups, issue) => {
      if (issue.scope === "assessment") groups.assessment.push(issue);
      else if (issue.scope === "media") groups.media.push(issue);
      else if (issue.scope === "lesson" || issue.scope === "block")
        groups.lessons.push(issue);
      else groups.course.push(issue);
      return groups;
    },
    { course: [], lessons: [], media: [], assessment: [] },
  );
}

export function groupAcademyValidationErrors(
  errors: string[],
): AcademyValidationGroups {
  return errors.reduce<AcademyValidationGroups>(
    (groups, error) => {
      if (/quiz|assessment|correct answer|answer explanation/i.test(error))
        groups.assessment.push(error);
      else if (/image|alt text|video|audio|transcript|media|url/i.test(error))
        groups.media.push(error);
      else if (/lesson|block|heading|section/i.test(error))
        groups.lessons.push(error);
      else groups.course.push(error);
      return groups;
    },
    { course: [], lessons: [], media: [], assessment: [] },
  );
}
