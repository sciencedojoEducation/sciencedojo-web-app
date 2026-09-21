import type { AcademyAudienceRole, AcademyCourse, LessonBlock, QuizQuestion } from "@/lib/tutor-academy";

const courseKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedAudiences = new Set<AcademyAudienceRole>(["tutor_applicant", "tutor", "student", "parent"]);
const allowedBlockTypes = new Set<LessonBlock["type"]>([
  "text", "image", "callout", "numbered-list", "accordion", "carousel", "quote", "comparison-table",
]);

export type AcademyValidationResult = {
  valid: boolean;
  errors: string[];
};

function hasText(value: unknown, minimum = 1) {
  return typeof value === "string" && value.trim().length >= minimum;
}

function validateBlock(block: LessonBlock, lessonTitle: string, index: number, errors: string[]) {
  const label = `${lessonTitle}, block ${index + 1}`;
  if (!block || !allowedBlockTypes.has(block.type)) {
    errors.push(`${label} has an unsupported block type.`);
    return;
  }
  if (block.type === "text" && (!Array.isArray(block.paragraphs) || !block.paragraphs.some((item) => hasText(item)))) {
    errors.push(`${label} needs at least one paragraph.`);
  }
  if (block.type === "image" && (!hasText(block.src) || !hasText(block.alt))) {
    errors.push(`${label} needs an image and descriptive alt text.`);
  }
  if (block.type === "callout" && (!hasText(block.heading) || !hasText(block.body))) {
    errors.push(`${label} needs a heading and body.`);
  }
  if ((block.type === "numbered-list" || block.type === "accordion" || block.type === "carousel") && (!Array.isArray(block.items) || block.items.length === 0)) {
    errors.push(`${label} needs at least one item.`);
  }
  if (block.type === "quote" && (!hasText(block.quote) || !hasText(block.attribution))) {
    errors.push(`${label} needs a quote and attribution.`);
  }
  if (block.type === "comparison-table" && (block.columns.length < 2 || block.rows.length === 0 || block.rows.some((row) => row.length !== block.columns.length))) {
    errors.push(`${label} needs at least two columns and rows matching those columns.`);
  }
}

function validateQuestion(question: QuizQuestion, index: number, errors: string[]) {
  const label = `Quiz question ${index + 1}`;
  if (!hasText(question.id) || !hasText(question.prompt)) errors.push(`${label} needs an ID and prompt.`);
  if (!Array.isArray(question.options) || question.options.length < 2) errors.push(`${label} needs at least two answers.`);
  if (!question.options?.some((option) => option.id === question.correctOptionId)) errors.push(`${label} must identify a valid correct answer.`);
  if (!hasText(question.explanation)) errors.push(`${label} needs an answer explanation.`);
}

export function validateAcademyCourse(course: AcademyCourse): AcademyValidationResult {
  const errors: string[] = [];
  if (!courseKeyPattern.test(course.key)) errors.push("Course key must use lowercase words separated by hyphens.");
  if (!hasText(course.title, 3)) errors.push("Course title must contain at least 3 characters.");
  if (!hasText(course.shortTitle, 2)) errors.push("Short title must contain at least 2 characters.");
  if (!hasText(course.description, 10)) errors.push("Description must contain at least 10 characters.");
  if (!Number.isFinite(course.estimatedMinutes) || course.estimatedMinutes < 1) errors.push("Estimated time must be at least one minute.");
  if (!Number.isFinite(course.passMark) || Number(course.passMark) < 1 || Number(course.passMark) > 100) errors.push("Pass mark must be between 1 and 100.");
  if (!course.audienceRoles?.length || course.audienceRoles.some((role) => !allowedAudiences.has(role))) errors.push("Choose at least one valid audience.");
  if (!Array.isArray(course.lessons) || course.lessons.length === 0) errors.push("Add at least one lesson.");
  if (!Array.isArray(course.quiz) || course.quiz.length === 0) errors.push("Add at least one quiz question.");

  const lessonSlugs = new Set<string>();
  course.lessons?.forEach((lesson, lessonIndex) => {
    const label = `Lesson ${lessonIndex + 1}`;
    if (!courseKeyPattern.test(lesson.slug)) errors.push(`${label} needs a lowercase hyphenated slug.`);
    if (lessonSlugs.has(lesson.slug)) errors.push(`Lesson slug “${lesson.slug}” is duplicated.`);
    lessonSlugs.add(lesson.slug);
    if (!hasText(lesson.section) || !hasText(lesson.title) || !hasText(lesson.summary)) errors.push(`${label} needs a section, title and summary.`);
    if (!Number.isFinite(lesson.durationMinutes) || lesson.durationMinutes < 1) errors.push(`${label} needs a valid duration.`);
    if (!Array.isArray(lesson.blocks) || lesson.blocks.length === 0) errors.push(`${label} needs at least one content block.`);
    lesson.blocks?.forEach((block, blockIndex) => validateBlock(block, lesson.title || label, blockIndex, errors));
  });

  const questionIds = new Set<string>();
  course.quiz?.forEach((question, index) => {
    if (questionIds.has(question.id)) errors.push(`Quiz question ID “${question.id}” is duplicated.`);
    questionIds.add(question.id);
    validateQuestion(question, index, errors);
  });

  return { valid: errors.length === 0, errors };
}

export function academySlugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
