export const mixedTopicsOption = "Mixed Topics";
export const uncertainEducationOption = "not_sure";
export const otherEducationOption = "other";

type Option = { key: string; label: string };
type StageConfig = Option & { awardingBodies: string[]; requiresAwardingBody: boolean };

export const curriculumPathways = [
  { key: "england", label: "England National Curriculum" },
  { key: "wales", label: "Curriculum for Wales" },
  { key: "northern_ireland", label: "Northern Ireland Curriculum" },
  { key: "scotland", label: "Scotland Curriculum for Excellence" },
  { key: "cambridge_international", label: "Cambridge International" },
  { key: "pearson_international", label: "Pearson Edexcel International" },
  { key: "ib", label: "International Baccalaureate" },
  { key: otherEducationOption, label: "Other / not listed" },
  { key: uncertainEducationOption, label: "I’m not sure" },
] as const satisfies readonly Option[];

export const awardingBodies = [
  { key: "aqa", label: "AQA" }, { key: "pearson_edexcel", label: "Pearson Edexcel" },
  { key: "ocr", label: "OCR (Cambridge OCR)" }, { key: "eduqas", label: "Eduqas (WJEC)" },
  { key: "wjec", label: "WJEC" }, { key: "ccea", label: "CCEA" },
  { key: "cambridge_international", label: "Cambridge International" },
  { key: "pearson_edexcel_international", label: "Pearson Edexcel International" },
  { key: "qualifications_scotland", label: "Qualifications Scotland (formerly SQA)" },
  { key: "international_baccalaureate", label: "International Baccalaureate" },
  { key: otherEducationOption, label: "Other / not listed" },
  { key: uncertainEducationOption, label: "I’m not sure" },
] as const satisfies readonly Option[];

const stage = (key: string, label: string, awardingBodyOptions: string[] = [], requiresAwardingBody = false): StageConfig => ({ key, label, awardingBodies: awardingBodyOptions, requiresAwardingBody });
const englandBoards = ["aqa", "pearson_edexcel", "ocr", "eduqas"];
const northernIrelandBoards = ["ccea", "aqa", "pearson_edexcel", "ocr", "wjec"];

export const pathwayStages: Record<string, StageConfig[]> = {
  england: [stage("ks1", "KS1"), stage("ks2", "KS2"), stage("ks3", "KS3"), stage("gcse", "GCSE", englandBoards, true), stage("as_level", "AS Level", englandBoards, true), stage("a_level", "A Level", englandBoards, true)],
  wales: [stage("primary", "Primary"), stage("secondary", "Secondary"), stage("gcse", "GCSE", ["wjec"], true), stage("as_level", "AS Level", ["wjec"], true), stage("a_level", "A Level", ["wjec"], true)],
  northern_ireland: [stage("foundation", "Foundation Stage"), stage("ks1", "KS1"), stage("ks2", "KS2"), stage("ks3", "KS3"), stage("ks4", "KS4"), stage("gcse", "GCSE", northernIrelandBoards, true), stage("as_level", "AS Level", northernIrelandBoards, true), stage("a_level", "A Level", northernIrelandBoards, true)],
  scotland: [stage("primary", "Primary"), stage("bge", "Broad General Education"), stage("national_4", "National 4", ["qualifications_scotland"], true), stage("national_5", "National 5", ["qualifications_scotland"], true), stage("higher", "Higher", ["qualifications_scotland"], true), stage("advanced_higher", "Advanced Higher", ["qualifications_scotland"], true)],
  cambridge_international: [
    stage("early_years", "Early Years", ["cambridge_international"]),
    ...Array.from({ length: 6 }, (_, index) => stage(`primary_stage_${index + 1}`, `Primary Stage ${index + 1}`, ["cambridge_international"])),
    ...Array.from({ length: 3 }, (_, index) => stage(`lower_secondary_stage_${index + 7}`, `Lower Secondary Stage ${index + 7}`, ["cambridge_international"])),
    stage("igcse", "IGCSE", ["cambridge_international"], true), stage("o_level", "O Level", ["cambridge_international"], true), stage("international_as", "International AS Level", ["cambridge_international"], true), stage("international_a_level", "International A Level", ["cambridge_international"], true),
  ],
  pearson_international: [stage("iprimary", "iPrimary", ["pearson_edexcel_international"]), stage("ilower_secondary", "iLowerSecondary", ["pearson_edexcel_international"]), stage("international_gcse", "International GCSE", ["pearson_edexcel_international"], true), stage("international_as", "International AS Level", ["pearson_edexcel_international"], true), stage("international_a_level", "International A Level", ["pearson_edexcel_international"], true)],
  ib: [stage("pyp", "Primary Years Programme (PYP)", ["international_baccalaureate"]), stage("myp", "Middle Years Programme (MYP)", ["international_baccalaureate"]), stage("dp", "Diploma Programme (DP)", ["international_baccalaureate"], true), stage("cp", "Career-related Programme (CP)", ["international_baccalaureate"], true)],
  [otherEducationOption]: [stage(otherEducationOption, "Other / not listed")],
  [uncertainEducationOption]: [stage(uncertainEducationOption, "I’m not sure")],
};

const academicSubjects = [
  "Mathematics", "Science", "Biology", "Chemistry", "Physics", "English", "Geography", "History", "Religious Studies",
  "Computer Science", "Design & Technology", "Business", "Economics", "Accounting", "Psychology", "Sociology", "Politics", "Law", "Philosophy",
  "French", "Spanish", "German", "Mandarin Chinese", "Arabic", "Latin", "Classical Civilisation", "Art & Design", "Music", "Drama",
  "Media Studies", "Film Studies", "Physical Education",
] as const;
const primarySubjects = ["Mathematics", "English", "Science", "Computer Science", "Geography", "History", "Religious Studies", "Art & Design", "Music", "Physical Education"];
const lowerSubjects = [...primarySubjects, "Biology", "Chemistry", "Physics", "Design & Technology", "French", "Spanish", "German", "Drama"];
const without = (...excluded: string[]) => academicSubjects.filter((subject) => !excluded.includes(subject));
const academicSubjectsByBoard: Record<string, readonly string[]> = {
  aqa: without("Accounting", "Mandarin Chinese", "Arabic", "Latin", "Classical Civilisation", "Film Studies"),
  pearson_edexcel: without("Law", "Philosophy"),
  ocr: without("Accounting", "Arabic", "Mandarin Chinese"),
  eduqas: without("Accounting", "Mandarin Chinese", "Arabic", "Latin"),
  wjec: without("Accounting", "Mandarin Chinese", "Arabic", "Latin"),
  ccea: without("Accounting", "Mandarin Chinese", "Arabic", "Latin", "Classical Civilisation", "Film Studies", "Philosophy"),
  cambridge_international: [...academicSubjects],
  pearson_edexcel_international: without("Religious Studies", "Politics", "Law", "Film Studies"),
  qualifications_scotland: without("Accounting", "Religious Studies", "Politics", "Law", "Film Studies"),
  international_baccalaureate: without("Media Studies", "Film Studies", "Law", "Accounting"),
};

const subjectAliases: Record<string, string> = {
  Math: "Mathematics", Maths: "Mathematics", Programming: "Computer Science", Computing: "Computer Science", "Business Studies": "Business",
  "Business Management": "Business", "Computing Science": "Computer Science", "English Language": "English", "English Literature": "English",
  "Combined Science": "Science", "Further Mathematics": "Mathematics", "Mathematics AA": "Mathematics", "Mathematics AI": "Mathematics",
};

export const subjectVariants: Record<string, Option[]> = {
  Mathematics: [{ key: "mathematics", label: "Mathematics" }, { key: "further_mathematics", label: "Further Mathematics" }, { key: "ib_analysis_approaches", label: "IB Mathematics: Analysis & Approaches (AA)" }, { key: "ib_applications_interpretation", label: "IB Mathematics: Applications & Interpretation (AI)" }],
  Science: [{ key: "general_science", label: "General Science" }, { key: "combined_science", label: "Combined Science" }, { key: "separate_sciences", label: "Separate Sciences" }, { key: "coordinated_sciences", label: "Co-ordinated Sciences" }, { key: "integrated_science", label: "Integrated Science" }],
  English: [{ key: "english_language", label: "English Language" }, { key: "english_literature", label: "English Literature" }, { key: "english_language_literature", label: "English Language & Literature" }],
  "Art & Design": [{ key: "fine_art", label: "Fine Art" }, { key: "graphic_communication", label: "Graphic Communication" }, { key: "photography", label: "Photography" }, { key: "textile_design", label: "Textile Design" }],
};

const genericTopics = [mixedTopicsOption, "Core Knowledge", "Concepts & Vocabulary", "Applying Knowledge", "Analysis", "Exam Technique", "Coursework Skills"];
const topicTaxonomy: Record<string, string[]> = {
  Mathematics: [mixedTopicsOption, "Number", "Algebra", "Geometry", "Measures", "Ratio & Proportion", "Statistics", "Probability", "Trigonometry", "Calculus", "Vectors", "Functions"],
  Science: [mixedTopicsOption, "Working Scientifically", "Biology Topics", "Chemistry Topics", "Physics Topics", "Required Practicals"],
  Biology: [mixedTopicsOption, "Cells", "Organisation", "Infection & Immunity", "Bioenergetics", "Homeostasis", "Genetics", "Ecology", "Evolution", "Practical Skills"],
  Chemistry: [mixedTopicsOption, "Atomic Structure", "Bonding", "Periodic Table", "Quantitative Chemistry", "Energetics", "Rates of Reaction", "Organic Chemistry", "Acids & Bases", "Electrolysis", "Practical Skills"],
  Physics: [mixedTopicsOption, "Forces & Motion", "Energy", "Waves", "Electricity", "Magnetism", "Thermal Physics", "Atomic/Nuclear Physics", "Space Physics", "Practical Skills"],
  English: [mixedTopicsOption, "Reading", "Writing", "Language Analysis", "Creative Writing", "Poetry", "Prose", "Drama", "Essay Skills"],
  "Computer Science": [mixedTopicsOption, "Algorithms", "Programming", "Data Representation", "Computer Systems", "Networks", "Cybersecurity", "Databases", "Boolean Logic"],
  Business: [mixedTopicsOption, "Business Activity", "Marketing", "Finance", "Operations", "Human Resources", "Strategy", "External Influences"],
  Economics: [mixedTopicsOption, "Microeconomics", "Macroeconomics", "Markets", "Elasticity", "Government Intervention", "International Trade", "Development Economics"],
};
for (const subject of academicSubjects) topicTaxonomy[subject] ||= genericTopics;

export function canonicalizeEducationSubject(subject: string) { return subjectAliases[subject] || subject; }
export function getCurriculumPathways() { return [...curriculumPathways]; }
export function getStagesForCurriculum(curriculumKey: string) { return [...(pathwayStages[curriculumKey] || [])]; }
export function getAwardingBodiesForSelection(curriculumKey: string, stageKey: string) {
  const selectedStage = getStagesForCurriculum(curriculumKey).find((item) => item.key === stageKey);
  return (selectedStage?.awardingBodies || []).map((key) => awardingBodies.find((item) => item.key === key)).filter((item): item is (typeof awardingBodies)[number] => Boolean(item));
}
export function getDerivedAwardingBody(curriculumKey: string, stageKey: string) {
  const options = getAwardingBodiesForSelection(curriculumKey, stageKey);
  return options.length === 1 ? options[0].key : "";
}
function isPrimaryStage(stageKey: string) { return ["foundation", "primary", "ks1", "ks2", "early_years", "iprimary", "pyp"].includes(stageKey) || stageKey.startsWith("primary_stage_"); }
function isLowerStage(stageKey: string) { return ["secondary", "ks3", "ks4", "bge", "ilower_secondary", "myp"].includes(stageKey) || stageKey.startsWith("lower_secondary_stage_"); }

export function getSubjectsForEducationSelection(curriculumKey: string, stageKey: string, awardingBodyKey = "") {
  if (!pathwayStages[curriculumKey]?.some((item) => item.key === stageKey)) return [];
  if (isPrimaryStage(stageKey)) return [...primarySubjects];
  if (isLowerStage(stageKey)) return [...lowerSubjects];
  const stageConfig = pathwayStages[curriculumKey].find((item) => item.key === stageKey);
  if (stageConfig?.requiresAwardingBody && !stageConfig.awardingBodies.includes(awardingBodyKey) && ![uncertainEducationOption, otherEducationOption].includes(awardingBodyKey)) return [];
  return [...(academicSubjectsByBoard[awardingBodyKey] || academicSubjects)];
}
export function getSubjectVariants(subject: string, curriculumKey = "", stageKey = "") {
  const canonical = canonicalizeEducationSubject(subject);
  const variants = subjectVariants[canonical] || [];
  if (canonical === "Mathematics" && curriculumKey === "ib" && ["dp", "cp"].includes(stageKey)) return variants.filter((item) => item.key.startsWith("ib_"));
  if (canonical === "Mathematics") return variants.filter((item) => !item.key.startsWith("ib_"));
  return [...variants];
}
export function getLevelsForEducationSelection(curriculumKey: string, stageKey: string, subject: string) {
  const canonical = canonicalizeEducationSubject(subject);
  if (curriculumKey === "ib" && ["dp", "cp"].includes(stageKey)) return [{ key: "sl", label: "Standard Level (SL)" }, { key: "hl", label: "Higher Level (HL)" }];
  if (["gcse", "international_gcse"].includes(stageKey) && ["Mathematics", "Science"].includes(canonical)) return [{ key: "foundation", label: "Foundation" }, { key: "higher", label: "Higher" }];
  if (["igcse", "o_level"].includes(stageKey) && ["Mathematics", "Science", "Biology", "Chemistry", "Physics"].includes(canonical)) return [{ key: "core", label: "Core" }, { key: "extended", label: "Extended" }];
  return [];
}
export function getTopicsForSubject(subject: string) { return [...(topicTaxonomy[canonicalizeEducationSubject(subject)] || genericTopics)]; }

export function getEducationLabel(kind: "curriculum" | "stage" | "awardingBody" | "level" | "subjectVariant", key?: string | null, context: { curriculumKey?: string; stage?: string; subject?: string } = {}) {
  if (!key) return "Not specified";
  if (kind === "curriculum") return curriculumPathways.find((item) => item.key === key)?.label || key;
  if (kind === "stage") return getStagesForCurriculum(context.curriculumKey || "").find((item) => item.key === key)?.label || key;
  if (kind === "awardingBody") return awardingBodies.find((item) => item.key === key)?.label || key;
  if (kind === "subjectVariant") return getSubjectVariants(context.subject || "", context.curriculumKey, context.stage).find((item) => item.key === key)?.label || key;
  return getLevelsForEducationSelection(context.curriculumKey || "", context.stage || "", context.subject || "").find((item) => item.key === key)?.label || key;
}

export type EducationSelectionInput = { curriculumKey: string; stage: string; awardingBodyKey?: string; level?: string; subject: string; subjectVariant?: string; specificationCode?: string; assessmentDate?: string; topic?: string };
export type EducationSelectionSnapshot = { schemaVersion: 2; curriculumKey: string | null; stage: string | null; awardingBodyKey: string | null; level: string | null; subject: string; subjectVariant?: string; specificationVersionId: string | null; specificationCode?: string; topic?: string; subtopic?: string; intakeStatus: "complete" | "needs_clarification"; missingFields: string[] };

export function validateEducationSelection(input: EducationSelectionInput, options: { topicRequired?: boolean; allowUncertain?: boolean } = {}) {
  const missingFields: string[] = [];
  if (!curriculumPathways.some((item) => item.key === input.curriculumKey)) return { valid: false, missingFields, error: "Choose a valid curriculum pathway." };
  if ([uncertainEducationOption, otherEducationOption].includes(input.curriculumKey)) missingFields.push("curriculum");
  const stages = getStagesForCurriculum(input.curriculumKey);
  if (!stages.some((item) => item.key === input.stage)) return { valid: false, missingFields, error: "Choose a valid stage or qualification." };
  if ([uncertainEducationOption, otherEducationOption].includes(input.stage)) missingFields.push("stage");
  const selectedStage = stages.find((item) => item.key === input.stage);
  if (selectedStage?.requiresAwardingBody && !selectedStage.awardingBodies.includes(input.awardingBodyKey || "")) {
    if ([uncertainEducationOption, otherEducationOption].includes(input.awardingBodyKey || "")) missingFields.push("awardingBody");
    else return { valid: false, missingFields, error: "Choose an exam board or awarding body that matches the selected route." };
  }
  const canonicalSubject = canonicalizeEducationSubject(input.subject);
  const subjects = getSubjectsForEducationSelection(input.curriculumKey, input.stage, input.awardingBodyKey || getDerivedAwardingBody(input.curriculumKey, input.stage));
  if (!canonicalSubject || (!missingFields.length && !subjects.includes(canonicalSubject))) return { valid: false, missingFields, error: "Choose a subject available for this education route." };
  const variants = getSubjectVariants(canonicalSubject, input.curriculumKey, input.stage);
  if (variants.length && !variants.some((item) => item.key === input.subjectVariant)) return { valid: false, missingFields, error: "Choose a valid subject route." };
  const levels = getLevelsForEducationSelection(input.curriculumKey, input.stage, canonicalSubject);
  if (levels.length && !levels.some((item) => item.key === input.level)) {
    if ([uncertainEducationOption, otherEducationOption].includes(input.level || "")) missingFields.push("level");
    else return { valid: false, missingFields, error: "Choose a valid tier or course level." };
  }
  if (options.topicRequired && !getTopicsForSubject(canonicalSubject).includes(input.topic || "")) return { valid: false, missingFields, error: "Choose a valid topic." };
  if (options.allowUncertain === false && missingFields.length) return { valid: false, missingFields, error: "Clarify the curriculum details before continuing." };
  return { valid: true, missingFields: [...new Set(missingFields)], error: null };
}

export function resolveSpecificationVersion(input: EducationSelectionInput) {
  const validation = validateEducationSelection(input);
  if (!validation.valid || validation.missingFields.length) return null;
  const year = input.assessmentDate?.match(/\b20\d{2}\b/)?.[0] || "active";
  return [input.curriculumKey, input.stage, input.awardingBodyKey || "no-board", canonicalizeEducationSubject(input.subject), input.subjectVariant || "standard", year]
    .map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).join(".");
}
export function buildEducationSelectionSnapshot(input: EducationSelectionInput & { subtopic?: string }, options: { topicRequired?: boolean } = {}) {
  const validation = validateEducationSelection(input, { topicRequired: options.topicRequired });
  if (!validation.valid) return { snapshot: null, error: validation.error };
  const unclear = [uncertainEducationOption, otherEducationOption];
  const snapshot: EducationSelectionSnapshot = {
    schemaVersion: 2,
    curriculumKey: unclear.includes(input.curriculumKey) ? null : input.curriculumKey,
    stage: unclear.includes(input.stage) ? null : input.stage,
    awardingBodyKey: !input.awardingBodyKey || unclear.includes(input.awardingBodyKey) ? null : input.awardingBodyKey,
    level: !input.level || unclear.includes(input.level) ? null : input.level,
    subject: canonicalizeEducationSubject(input.subject),
    subjectVariant: input.subjectVariant || undefined,
    specificationVersionId: resolveSpecificationVersion(input),
    specificationCode: input.specificationCode?.trim() || undefined,
    topic: input.topic || undefined,
    subtopic: input.subtopic?.trim() || undefined,
    intakeStatus: validation.missingFields.length ? "needs_clarification" : "complete",
    missingFields: validation.missingFields,
  };
  return { snapshot, error: null };
}
export function getActiveCurriculumVersionId(curriculumKey: string) {
  if (!curriculumKey || [uncertainEducationOption, otherEducationOption].includes(curriculumKey)) return null;
  return `${curriculumKey}.taxonomy-2026`;
}

export const allowedQuestionCounts = [3, 5, 6, 10] as const;
export type QuestionCount = (typeof allowedQuestionCounts)[number];
export function isAllowedQuestionCount(count: number): count is QuestionCount { return allowedQuestionCounts.includes(count as QuestionCount); }
export type QuizSelection = EducationSelectionInput & { count: number };
export function validateQuizSelection(selection: QuizSelection) {
  const education = validateEducationSelection(selection, { topicRequired: true, allowUncertain: false });
  if (!education.valid) return { valid: false, error: education.error };
  if (!isAllowedQuestionCount(selection.count)) return { valid: false, error: "Please choose 3, 5, 6, or 10 practice questions." };
  return { valid: true, error: null };
}
export const validateLessonRequestEducationSelection = validateEducationSelection;

// Compatibility exports for older imports while callers migrate to the v2 hierarchy.
export const educationalStages = curriculumPathways.map((item) => item.key);
export function getCurriculaForStage(curriculumKey: string) { return getStagesForCurriculum(curriculumKey).map((item) => item.key); }
export function getLevelsForCurriculum(curriculumKey: string, stageKey: string) { return getAwardingBodiesForSelection(curriculumKey, stageKey).map((item) => item.key); }
export function getSubjectsForSelection(curriculumKey: string, stageKey: string, awardingBodyKey: string) { return getSubjectsForEducationSelection(curriculumKey, stageKey, awardingBodyKey); }
export const getSubjectsForLevel = getSubjectsForSelection;
