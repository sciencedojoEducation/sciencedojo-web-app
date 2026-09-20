import {
  otherEducationOption,
  resolveSpecificationVersion,
  uncertainEducationOption,
  validateLessonRequestEducationSelection,
} from "@/lib/educationTaxonomy";

export const lessonPurposes = [
  "new_topic",
  "catch_up",
  "homework_help",
  "exam_practice",
  "revision",
  "assessment_review",
  "stretch",
] as const;

export const confidenceLevels = [
  "not_started",
  "very_unsure",
  "some_understanding",
  "mostly_confident",
] as const;

export type LessonPurpose = (typeof lessonPurposes)[number];
export type LearnerConfidence = (typeof confidenceLevels)[number];
export type LessonRequestIntakeStatus = "complete" | "needs_clarification";

export interface LearnerProfile {
  id: string;
  ownerId: string;
  linkedProfileId?: string | null;
  name: string;
  schoolYear: string;
  stage: string;
  curriculumKey: string | null;
  curriculumVersionId: string | null;
  level: string | null;
  supportPreferences: string[];
  accommodations?: string | null;
}

export interface LessonRequestLearningContext {
  schemaVersion: 2;
  learnerId: string;
  learnerName: string;
  schoolYear: string;
  stage: string | null;
  curriculumKey: string | null;
  awardingBodyKey: string | null;
  curriculumVersionId: string | null;
  specificationVersionId: string | null;
  level: string | null;
  subject: string;
  subjectVariant?: string;
  specificationCode?: string;
  topic: string;
  subtopic?: string;
  lessonPurpose: LessonPurpose;
  lessonGoal: string;
  confidence: LearnerConfidence;
  difficultyDetails: string;
  currentAttainment?: string;
  targetAttainment?: string;
  assessmentDate?: string;
  assessmentDetails?: string;
  homeworkInstructions?: string;
  recentScore?: string;
  teacherFeedback?: string;
  lostMarksOn?: string;
  longerTermGoal?: string;
  priorityTopics?: string;
  importantDeadline?: string;
  supportPreferences?: string[];
  accommodations?: string;
  previousApproaches?: string;
  additionalContext?: string;
  materialIds: string[];
  intakeStatus: LessonRequestIntakeStatus;
  missingFields: string[];
}

export interface LessonRequestMaterial {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath?: string;
}

export const lessonPurposeLabels: Record<LessonPurpose, string> = {
  new_topic: "Learn a new topic",
  catch_up: "Catch up",
  homework_help: "Homework help",
  exam_practice: "Exam practice",
  revision: "General revision",
  assessment_review: "Review an assessment",
  stretch: "Stretch and challenge",
};

export const confidenceLabels: Record<LearnerConfidence, string> = {
  not_started: "Not studied yet",
  very_unsure: "Very unsure",
  some_understanding: "Some understanding",
  mostly_confident: "Mostly confident",
};

export const acceptedLessonMaterialTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
export const maxLessonMaterialCount = 5;
export const maxLessonMaterialBytes = 10 * 1024 * 1024;

export function buildLessonRequestLearningContext(input: {
  learnerId: string;
  learnerName: string;
  schoolYear: string;
  stage: string;
  curriculumKey: string;
  awardingBodyKey?: string;
  level: string;
  subject: string;
  subjectVariant?: string;
  specificationCode?: string;
  topic: string;
  subtopic?: string;
  lessonPurpose: string;
  lessonGoal: string;
  confidence: string;
  difficultyDetails: string;
  currentAttainment?: string;
  targetAttainment?: string;
  assessmentDate?: string;
  assessmentDetails?: string;
  homeworkInstructions?: string;
  recentScore?: string;
  teacherFeedback?: string;
  lostMarksOn?: string;
  longerTermGoal?: string;
  priorityTopics?: string;
  importantDeadline?: string;
  supportPreferences?: string[];
  accommodations?: string;
  previousApproaches?: string;
  additionalContext?: string;
  materialIds?: string[];
}) {
  const requiredText: Array<[string, string]> = [
    ["learnerName", input.learnerName],
    ["schoolYear", input.schoolYear],
    ["stage", input.stage],
    ["subject", input.subject],
    ["topic", input.topic],
    ["lessonGoal", input.lessonGoal],
    ["difficultyDetails", input.difficultyDetails],
  ];
  const missingFields = requiredText.filter(([, value]) => !value.trim()).map(([field]) => field);

  if (!lessonPurposes.includes(input.lessonPurpose as LessonPurpose)) missingFields.push("lessonPurpose");
  if (!confidenceLevels.includes(input.confidence as LearnerConfidence)) missingFields.push("confidence");

  const education = validateLessonRequestEducationSelection({
    stage: input.stage,
    curriculumKey: input.curriculumKey,
    awardingBodyKey: input.awardingBodyKey,
    level: input.level,
    subject: input.subject,
    subjectVariant: input.subjectVariant,
    specificationCode: input.specificationCode,
    assessmentDate: input.assessmentDate,
    topic: input.topic,
  }, { topicRequired: true });
  if (!education.valid) {
    return { context: null, error: education.error || "Invalid education selection." };
  }
  missingFields.push(...education.missingFields);

  const materials = input.materialIds || [];
  if (input.lessonPurpose === "homework_help" && !input.homeworkInstructions?.trim() && materials.length === 0) {
    missingFields.push("homeworkInstructionsOrMaterial");
  }

  if (missingFields.some((field) => !["curriculum", "stage", "awardingBody", "level"].includes(field))) {
    return { context: null, error: `Please complete: ${[...new Set(missingFields)].join(", ")}.` };
  }

  const uniqueMissingFields = [...new Set(missingFields)];
  const unclearValues = [uncertainEducationOption, otherEducationOption];
  const specificationVersionId = resolveSpecificationVersion(input);
  const context: LessonRequestLearningContext = {
    schemaVersion: 2,
    learnerId: input.learnerId,
    learnerName: input.learnerName.trim(),
    schoolYear: input.schoolYear.trim(),
    stage: unclearValues.includes(input.stage) ? null : input.stage,
    curriculumKey: unclearValues.includes(input.curriculumKey) ? null : input.curriculumKey,
    awardingBodyKey: !input.awardingBodyKey || unclearValues.includes(input.awardingBodyKey) ? null : input.awardingBodyKey,
    curriculumVersionId: specificationVersionId,
    specificationVersionId,
    level: !input.level || unclearValues.includes(input.level) ? null : input.level,
    subject: input.subject,
    subjectVariant: input.subjectVariant || undefined,
    specificationCode: input.specificationCode?.trim() || undefined,
    topic: input.topic,
    subtopic: input.subtopic?.trim() || undefined,
    lessonPurpose: input.lessonPurpose as LessonPurpose,
    lessonGoal: input.lessonGoal.trim(),
    confidence: input.confidence as LearnerConfidence,
    difficultyDetails: input.difficultyDetails.trim(),
    currentAttainment: input.currentAttainment?.trim() || undefined,
    targetAttainment: input.targetAttainment?.trim() || undefined,
    assessmentDate: input.assessmentDate || undefined,
    assessmentDetails: input.assessmentDetails?.trim() || undefined,
    homeworkInstructions: input.homeworkInstructions?.trim() || undefined,
    recentScore: input.recentScore?.trim() || undefined,
    teacherFeedback: input.teacherFeedback?.trim() || undefined,
    lostMarksOn: input.lostMarksOn?.trim() || undefined,
    longerTermGoal: input.longerTermGoal?.trim() || undefined,
    priorityTopics: input.priorityTopics?.trim() || undefined,
    importantDeadline: input.importantDeadline || undefined,
    supportPreferences: input.supportPreferences || [],
    accommodations: input.accommodations?.trim() || undefined,
    previousApproaches: input.previousApproaches?.trim() || undefined,
    additionalContext: input.additionalContext?.trim() || undefined,
    materialIds: materials,
    intakeStatus: uniqueMissingFields.length ? "needs_clarification" : "complete",
    missingFields: uniqueMissingFields,
  };

  return { context, error: null };
}
