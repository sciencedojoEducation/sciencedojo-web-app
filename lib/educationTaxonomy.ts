const primaryUkSubjects = ["Mathematics", "English", "Science"] as const;
const primaryCambridgeSubjects = ["Mathematics", "English", "Science", "Computing"] as const;
const lowerUkSubjects = ["Mathematics", "English", "Science", "Computer Science"] as const;
const lowerCambridgeSubjects = ["Mathematics", "English", "Science", "Computing"] as const;
const gcseSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Combined Science",
  "Computer Science",
  "English Language",
  "English Literature",
  "Business Studies",
] as const;
const cambridgeIgcseSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Combined Science",
  "Computer Science",
  "English",
  "Business Studies",
  "Economics",
] as const;
const sqaNational5Subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computing Science",
  "English",
  "Business Management",
] as const;
const ukALevelSubjects = [
  "Mathematics",
  "Further Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English Literature",
  "Business",
  "Economics",
] as const;
const cambridgeALevelSubjects = [
  "Mathematics",
  "Further Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English Language",
  "English Literature",
  "Business",
  "Economics",
] as const;
const ibSubjects = [
  "Mathematics AA",
  "Mathematics AI",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English A",
  "Business Management",
  "Economics",
] as const;
const sqaHigherSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computing Science",
  "English",
  "Business Management",
] as const;

export const mixedTopicsOption = "Mixed Topics";

const computingTopics = [
  mixedTopicsOption,
  "Algorithms",
  "Programming",
  "Data Representation",
  "Computer Systems",
  "Networks",
  "Cybersecurity",
  "Databases",
  "Boolean Logic",
] as const;
const businessTopics = [
  mixedTopicsOption,
  "Business Activity",
  "Marketing",
  "Finance",
  "Operations",
  "Human Resources",
  "Strategy",
  "External Influences",
  "Business Decisions",
] as const;

export const topicTaxonomy = {
  Mathematics: [
    mixedTopicsOption,
    "Number",
    "Algebra",
    "Geometry",
    "Measures",
    "Ratio & Proportion",
    "Statistics",
    "Probability",
    "Trigonometry",
    "Calculus",
    "Vectors",
    "Functions",
  ],
  "Further Mathematics": [
    mixedTopicsOption,
    "Complex Numbers",
    "Matrices",
    "Further Algebra",
    "Further Calculus",
    "Differential Equations",
    "Mechanics",
    "Statistics",
  ],
  "Mathematics AA": [
    mixedTopicsOption,
    "Number",
    "Algebra",
    "Geometry",
    "Measures",
    "Ratio & Proportion",
    "Statistics",
    "Probability",
    "Trigonometry",
    "Calculus",
    "Vectors",
    "Functions",
  ],
  "Mathematics AI": [
    mixedTopicsOption,
    "Number",
    "Algebra",
    "Geometry",
    "Measures",
    "Ratio & Proportion",
    "Statistics",
    "Probability",
    "Trigonometry",
    "Calculus",
    "Vectors",
    "Functions",
  ],
  Physics: [
    mixedTopicsOption,
    "Forces & Motion",
    "Energy",
    "Waves",
    "Electricity",
    "Magnetism",
    "Thermal Physics",
    "Atomic/Nuclear Physics",
    "Space Physics",
    "Practical Skills",
  ],
  Chemistry: [
    mixedTopicsOption,
    "Atomic Structure",
    "Bonding",
    "Periodic Table",
    "Quantitative Chemistry",
    "Energetics",
    "Rates of Reaction",
    "Organic Chemistry",
    "Acids & Bases",
    "Electrolysis",
    "Practical Skills",
  ],
  Biology: [
    mixedTopicsOption,
    "Cells",
    "Organisation",
    "Infection & Immunity",
    "Bioenergetics",
    "Homeostasis",
    "Genetics",
    "Ecology",
    "Evolution",
    "Practical Skills",
  ],
  "Combined Science": [mixedTopicsOption, "Biology Topics", "Chemistry Topics", "Physics Topics", "Required Practicals"],
  Science: [mixedTopicsOption, "Living Things", "Materials", "Forces", "Energy", "Earth & Space", "Scientific Enquiry"],
  "Computer Science": computingTopics,
  Computing: computingTopics,
  "Computing Science": computingTopics,
  English: [mixedTopicsOption, "Reading Comprehension", "Writing Skills", "Grammar", "Vocabulary", "Poetry", "Prose", "Drama", "Essay Writing"],
  "English Language": [mixedTopicsOption, "Reading", "Writing", "Language Analysis", "Creative Writing", "Transactional Writing", "Speaking & Listening"],
  "English Literature": [mixedTopicsOption, "Poetry", "Shakespeare", "Modern Drama", "Prose Fiction", "Unseen Texts", "Essay Skills"],
  "English A": [mixedTopicsOption, "Reading Comprehension", "Writing Skills", "Grammar", "Vocabulary", "Poetry", "Prose", "Drama", "Essay Writing"],
  Business: businessTopics,
  "Business Studies": businessTopics,
  "Business Management": businessTopics,
  Economics: [
    mixedTopicsOption,
    "Microeconomics",
    "Macroeconomics",
    "Markets",
    "Elasticity",
    "Government Intervention",
    "International Trade",
    "Development Economics",
  ],
} as const;

function subjectsForLevels<const T extends readonly string[], const L extends readonly string[]>(levels: L, subjects: T) {
  return Object.fromEntries(levels.map((level) => [level, subjects])) as Record<L[number], T>;
}

export const educationTaxonomy = {
  Primary: {
    "UK National Curriculum": subjectsForLevels(["KS1", "KS2"], primaryUkSubjects),
    "Cambridge Primary": subjectsForLevels(["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5", "Stage 6"], primaryCambridgeSubjects),
  },
  "Lower Secondary": {
    "UK National Curriculum": subjectsForLevels(["KS3"], lowerUkSubjects),
    "Cambridge Lower Secondary": subjectsForLevels(["Stage 7", "Stage 8", "Stage 9"], lowerCambridgeSubjects),
  },
  "GCSE / IGCSE": {
    "Edexcel GCSE": subjectsForLevels(["Foundation", "Higher"], gcseSubjects),
    "AQA GCSE": subjectsForLevels(["Foundation", "Higher"], gcseSubjects),
    "Cambridge IGCSE": subjectsForLevels(["Core", "Extended"], cambridgeIgcseSubjects),
    "SQA National 5": subjectsForLevels(["National 5"], sqaNational5Subjects),
  },
  "Advanced / Pre-University": {
    "Edexcel A-Level": subjectsForLevels(["AS", "A-Level"], ukALevelSubjects),
    "AQA A-Level": subjectsForLevels(["AS", "A-Level"], ukALevelSubjects),
    "Cambridge International A-Level": subjectsForLevels(["AS", "A-Level"], cambridgeALevelSubjects),
    "IB Diploma Programme": subjectsForLevels(["SL", "HL"], ibSubjects),
    "SQA Higher": subjectsForLevels(["Higher", "Advanced Higher"], sqaHigherSubjects),
  },
} as const;

export const allowedQuestionCounts = [3, 5, 6, 10] as const;

export type EducationalStage = keyof typeof educationTaxonomy;
export type QuestionCount = (typeof allowedQuestionCounts)[number];

export const educationalStages = Object.keys(educationTaxonomy) as EducationalStage[];

export function getAvailableStages() {
  return educationalStages;
}

export function getCurriculaForStage(stage: string) {
  if (!isEducationalStage(stage)) return [];
  return Object.keys(educationTaxonomy[stage]);
}

export function getLevelsForCurriculum(stage: string, curriculum: string) {
  if (!isEducationalStage(stage)) return [];
  const curricula = educationTaxonomy[stage] as Record<string, Record<string, readonly string[]>>;
  return Object.keys(curricula[curriculum] || {});
}

export function getSubjectsForSelection(stage: string, curriculum: string, level: string) {
  if (!isEducationalStage(stage)) return [];
  const curricula = educationTaxonomy[stage] as Record<string, Record<string, readonly string[]>>;
  return [...(curricula[curriculum]?.[level] || [])];
}

export const getSubjectsForLevel = getSubjectsForSelection;

export function getTopicsForSubject(subject: string) {
  const topics = (topicTaxonomy as Record<string, readonly string[]>)[subject];
  return topics ? [...topics] : [];
}

export function isEducationalStage(stage: string): stage is EducationalStage {
  return Object.prototype.hasOwnProperty.call(educationTaxonomy, stage);
}

export function isAllowedQuestionCount(count: number): count is QuestionCount {
  return allowedQuestionCounts.includes(count as QuestionCount);
}

export type QuizSelection = {
  stage: string;
  curriculum: string;
  level: string;
  subject: string;
  topic: string;
  count: number;
};

export function isValidEducationSelection(selection: QuizSelection) {
  if (!isEducationalStage(selection.stage)) {
    return { valid: false, error: "Please choose a valid educational stage." };
  }

  const curricula = educationTaxonomy[selection.stage] as Record<string, Record<string, readonly string[]>>;
  if (!Object.prototype.hasOwnProperty.call(curricula, selection.curriculum)) {
    return {
      valid: false,
      error: "That curriculum is not available for the selected educational stage.",
    };
  }

  if (!Object.prototype.hasOwnProperty.call(curricula[selection.curriculum], selection.level)) {
    return {
      valid: false,
      error: "That level is not available for the selected curriculum.",
    };
  }

  if (!curricula[selection.curriculum][selection.level].includes(selection.subject)) {
    return {
      valid: false,
      error: "That subject is not available for the selected curriculum and level.",
    };
  }

  const topics = getTopicsForSubject(selection.subject);
  if (topics.length === 0 || !topics.includes(selection.topic)) {
    return {
      valid: false,
      error: "Please choose a valid stage, curriculum, level, subject, and topic combination.",
    };
  }

  if (!isAllowedQuestionCount(selection.count)) {
    return { valid: false, error: "Please choose 3, 5, 6, or 10 practice questions." };
  }

  return { valid: true, error: null };
}

export const validateQuizSelection = isValidEducationSelection;
