export const TUTOR_ACADEMY_COURSE_KEY = "science-dojo-tutor-foundations";
export const TUTOR_ACADEMY_PASS_MARK = 80;

export type AcademyBlockTone = "blue" | "teal" | "amber" | "navy";

export type LessonBlock =
  | { type: "text"; heading?: string; paragraphs: string[] }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "callout"; heading: string; body: string; tone: AcademyBlockTone }
  | { type: "numbered-list"; heading?: string; items: Array<{ title: string; body: string }> }
  | { type: "accordion"; heading?: string; items: Array<{ title: string; body: string }> }
  | { type: "carousel"; heading?: string; items: Array<{ title: string; body: string; eyebrow?: string }> }
  | { type: "quote"; quote: string; attribution: string }
  | { type: "comparison-table"; heading?: string; columns: string[]; rows: string[][] };

export type AcademyLesson = {
  slug: string;
  section: string;
  title: string;
  summary: string;
  durationMinutes: number;
  blocks: LessonBlock[];
};

export type QuizOption = { id: string; label: string };

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
};

export type AcademyCourse = {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  estimatedMinutes: number;
  lessons: AcademyLesson[];
  quiz: QuizQuestion[];
};

export type AcademyProgress = {
  completedLessons: string[];
  currentLesson: string | null;
  quizAttempts: number;
  bestScore: number;
  completedAt: string | null;
};

export const tutorAcademyCourse: AcademyCourse = {
  key: TUTOR_ACADEMY_COURSE_KEY,
  title: "ScienceDojo Tutor Foundations",
  shortTitle: "Tutor Foundations",
  description:
    "A practical induction to safe, thoughtful teaching and the learning rhythm every ScienceDojo family should experience.",
  estimatedMinutes: 40,
  lessons: [
    {
      slug: "welcome-to-sciencedojo",
      section: "Your foundations",
      title: "Welcome to ScienceDojo",
      summary: "Understand our mission, the tutor promise, and what excellent support feels like for a family.",
      durationMinutes: 5,
      blocks: [
        {
          type: "image",
          src: "/images/home/9.modern-online-tutoring.jpg",
          alt: "A tutor supporting a learner in an online lesson",
          caption: "Human tutoring first, with technology making the journey clearer.",
        },
        {
          type: "text",
          heading: "More capable than their grades suggest",
          paragraphs: [
            "ScienceDojo exists for students whose confidence, habits, or hidden knowledge gaps are stopping their ability from showing. Our tutors combine subject expertise with patience, structure, and visible next steps.",
            "A strong ScienceDojo lesson should leave the student clearer, calmer, and able to explain what they will do next. Parents should be able to understand the same journey without having to chase for updates.",
          ],
        },
        {
          type: "numbered-list",
          heading: "The ScienceDojo tutor promise",
          items: [
            { title: "Meet the learner where they are", body: "Start with evidence and curiosity rather than assumptions about effort or ability." },
            { title: "Teach for understanding", body: "Model thinking, invite questions, and check that the learner can use the idea independently." },
            { title: "Make progress visible", body: "Connect each lesson to a focused next step, useful practice, and an honest learning record." },
          ],
        },
        {
          type: "quote",
          quote: "Confidence grows when a learner can see that today's small step belongs to a larger journey.",
          attribution: "The ScienceDojo teaching principle",
        },
      ],
    },
    {
      slug: "safeguarding-and-boundaries",
      section: "Your foundations",
      title: "Safeguarding and Professional Boundaries",
      summary: "Protect students through professional communication, privacy, clear boundaries, and prompt reporting.",
      durationMinutes: 8,
      blocks: [
        {
          type: "callout",
          heading: "Safety is part of every lesson",
          body: "Safeguarding is not a separate administrative task. It shapes how we communicate, teach, record concerns, and protect student information.",
          tone: "amber",
        },
        {
          type: "accordion",
          heading: "Core expectations",
          items: [
            { title: "Keep communication on ScienceDojo", body: "Use the platform's messages and lesson spaces wherever possible. Do not move students or families to personal messaging accounts, private email, or social media." },
            { title: "Maintain appropriate boundaries", body: "Keep conversations relevant to learning and wellbeing in the educational context. Never request unnecessary personal information or arrange unrecorded contact." },
            { title: "Protect personal information", body: "Only use student and family information to deliver the agreed support. Do not download, copy, or share records without a clear platform-approved reason." },
            { title: "Report concerns promptly", body: "If something feels unsafe, concerning, or inappropriate, preserve the relevant context and contact ScienceDojo support. Do not investigate a safeguarding concern yourself." },
          ],
        },
        {
          type: "comparison-table",
          heading: "Choose the safer response",
          columns: ["Situation", "Do", "Avoid"],
          rows: [
            ["A parent asks for your private number", "Keep the conversation in platform messages", "Moving routine communication off-platform"],
            ["A student shares a concerning experience", "Listen calmly and report the facts promptly", "Promising secrecy or conducting your own investigation"],
            ["You need lesson context", "Request only information relevant to teaching", "Collecting or storing unnecessary personal details"],
          ],
        },
        {
          type: "callout",
          heading: "When in doubt, pause and ask",
          body: "Use the dashboard support route or email hello@sciencedojo.co.uk. For an immediate danger, contact the appropriate emergency service first.",
          tone: "navy",
        },
      ],
    },
    {
      slug: "excellent-lessons",
      section: "Teaching well",
      title: "Delivering an Excellent Lesson",
      summary: "Prepare with purpose, create active learning, and close with evidence of understanding.",
      durationMinutes: 8,
      blocks: [
        {
          type: "carousel",
          heading: "A dependable lesson rhythm",
          items: [
            { eyebrow: "Before", title: "Prepare one useful outcome", body: "Review the request and available learning context. Decide what the student should understand or be able to do by the end." },
            { eyebrow: "During", title: "Make thinking visible", body: "Explain in manageable steps, model expert thinking, and ask the learner to retrieve, apply, and explain—not only listen." },
            { eyebrow: "After", title: "Check and connect", body: "Confirm what is secure, what still needs work, and the smallest useful action before the next lesson." },
          ],
        },
        {
          type: "numbered-list",
          heading: "Four habits of active teaching",
          items: [
            { title: "Diagnose before explaining", body: "Use a short question or example to find the actual gap." },
            { title: "Model, then release", body: "Move from worked example to supported attempt to independent attempt." },
            { title: "Check beyond yes or no", body: "Ask the student to explain, compare, predict, or solve a fresh example." },
            { title: "Respond to evidence", body: "Slow down, change representation, or revisit a prerequisite when the evidence requires it." },
          ],
        },
        {
          type: "quote",
          quote: "A busy lesson is not automatically a productive lesson. Look for changed understanding.",
          attribution: "ScienceDojo lesson standard",
        },
      ],
    },
    {
      slug: "keeping-learning-moving",
      section: "Teaching well",
      title: "Keeping Learning Moving",
      summary: "Turn lessons into useful records, focused practice, and progress that families can understand.",
      durationMinutes: 6,
      blocks: [
        {
          type: "text",
          heading: "The lesson is one part of the rhythm",
          paragraphs: [
            "Students make stronger progress when the explanation, practice, feedback, and next lesson connect. ScienceDojo uses lesson summaries, homework, and Missions to keep that connection visible.",
            "Write for the people who will use the record: the learner, their family, another tutor, and your future self. Be specific, constructive, and proportionate.",
          ],
        },
        {
          type: "comparison-table",
          heading: "Useful records are specific",
          columns: ["Record", "Too vague", "More useful"],
          rows: [
            ["Summary", "We covered algebra", "Solved linear equations; sign changes remain the main source of errors"],
            ["Homework", "Practise more", "Complete five mixed equations and explain each inverse operation"],
            ["Next lesson", "Continue topic", "Check independent accuracy, then introduce equations with brackets"],
          ],
        },
        {
          type: "callout",
          heading: "Keep practice purposeful",
          body: "A short task tied to today's evidence is usually more valuable than a large generic worksheet. Use Missions when a structured pathway would help the learner continue between lessons.",
          tone: "teal",
        },
      ],
    },
    {
      slug: "using-the-platform",
      section: "Working on ScienceDojo",
      title: "Using the ScienceDojo Platform",
      summary: "Manage your profile, availability, bookings, messages, classroom work, and support requests confidently.",
      durationMinutes: 7,
      blocks: [
        {
          type: "image",
          src: "/images/home/8.professional-online-teacher.jpg",
          alt: "A professional tutor preparing for an online session",
          caption: "A reliable platform routine helps families trust the learning experience.",
        },
        {
          type: "accordion",
          heading: "Your essential workflow",
          items: [
            { title: "Profile and availability", body: "Keep your subjects, experience, introduction, rates, and requestable times accurate. Only publish slots you can reliably honour." },
            { title: "Lesson requests", body: "Review the learner's context before accepting. Accept promptly when the request is a strong fit; ask for clarification or decline when it is not." },
            { title: "Messages", body: "Use messages for concise, professional lesson communication. Keep scheduling, resources, and decisions in the platform record." },
            { title: "Classroom and lesson records", body: "Join prepared, use the built-in classroom tools responsibly, and complete the lesson summary and next steps promptly." },
            { title: "Changes and support", body: "Communicate unavoidable changes early and use dashboard support when a booking, payment, safety, or technical issue needs help." },
          ],
        },
        {
          type: "callout",
          heading: "Your dashboard is the source of truth",
          body: "Check it regularly for requests, upcoming sessions, messages, Mission reviews, profile actions, and payment status.",
          tone: "blue",
        },
      ],
    },
    {
      slug: "payments-reviews-and-growth",
      section: "Working on ScienceDojo",
      title: "Payments, Reviews and Tutor Growth",
      summary: "Understand professional platform conduct and the habits that build lasting family trust.",
      durationMinutes: 6,
      blocks: [
        {
          type: "numbered-list",
          heading: "Build a dependable tutor practice",
          items: [
            { title: "Keep bookings and payments on-platform", body: "This protects the tutor, family, learning record, and support process. Do not arrange private payment for ScienceDojo introductions." },
            { title: "Earn trust through consistency", body: "Be punctual, prepared, honest about fit, and reliable with follow-up. These habits matter more than promotional language." },
            { title: "Use feedback professionally", body: "Reviews and support feedback are opportunities to improve. Never pressure a family for a positive review or dispute feedback directly with a student." },
            { title: "Grow within your strengths", body: "Keep your profile accurate, expand availability sustainably, and accept subjects and levels you can teach confidently." },
          ],
        },
        {
          type: "carousel",
          heading: "What families remember",
          items: [
            { eyebrow: "Clarity", title: "They knew what was happening", body: "Expectations, explanations, booking decisions, and next steps were easy to understand." },
            { eyebrow: "Care", title: "The learner felt respected", body: "The tutor was patient, curious, and attentive without lowering expectations." },
            { eyebrow: "Consistency", title: "The experience felt dependable", body: "Sessions started prepared, records were completed, and communication stayed professional." },
          ],
        },
        {
          type: "quote",
          quote: "Your expertise opens the door. Reliability and care are what make families want to continue.",
          attribution: "ScienceDojo tutor success principle",
        },
      ],
    },
  ],
  quiz: [
    {
      id: "mission",
      prompt: "What should a strong ScienceDojo lesson leave behind?",
      options: [
        { id: "a", label: "The maximum possible amount of content" },
        { id: "b", label: "Clearer understanding and a useful next step" },
        { id: "c", label: "Only a high homework score" },
      ],
      correctOptionId: "b",
      explanation: "Our lesson standard prioritises changed understanding, confidence, and a focused next step.",
    },
    {
      id: "communication",
      prompt: "A parent asks to move routine lesson communication to your personal messaging account. What should you do?",
      options: [
        { id: "a", label: "Agree if the parent requests it" },
        { id: "b", label: "Share your number only for cancellations" },
        { id: "c", label: "Keep the conversation in ScienceDojo messages" },
      ],
      correctOptionId: "c",
      explanation: "Platform communication preserves professional boundaries, visibility, and support records.",
    },
    {
      id: "concern",
      prompt: "A student shares information that raises a safeguarding concern. What is the best response?",
      options: [
        { id: "a", label: "Listen calmly, record the facts, and report promptly" },
        { id: "b", label: "Promise to keep it secret" },
        { id: "c", label: "Investigate by contacting other people" },
      ],
      correctOptionId: "a",
      explanation: "Tutors should respond calmly and report concerns, not promise secrecy or investigate independently.",
    },
    {
      id: "diagnose",
      prompt: "What should usually happen before a long explanation?",
      options: [
        { id: "a", label: "Set a large worksheet" },
        { id: "b", label: "Diagnose the learner's actual gap" },
        { id: "c", label: "Ask whether they understand" },
      ],
      correctOptionId: "b",
      explanation: "A short diagnostic question helps the tutor respond to evidence rather than assumptions.",
    },
    {
      id: "check",
      prompt: "Which is the strongest check for understanding?",
      options: [
        { id: "a", label: "Do you understand?" },
        { id: "b", label: "Was that easy?" },
        { id: "c", label: "Explain the method and apply it to a fresh example" },
      ],
      correctOptionId: "c",
      explanation: "Explanation and transfer provide stronger evidence than a yes-or-no response.",
    },
    {
      id: "record",
      prompt: "Which lesson note is most useful?",
      options: [
        { id: "a", label: "Covered algebra" },
        { id: "b", label: "Good lesson" },
        { id: "c", label: "Solved linear equations; sign changes remain the main error" },
      ],
      correctOptionId: "c",
      explanation: "Specific evidence helps the learner, family, and tutor understand what should happen next.",
    },
    {
      id: "practice",
      prompt: "What makes between-lesson practice most useful?",
      options: [
        { id: "a", label: "It is long" },
        { id: "b", label: "It is tied to evidence from the lesson" },
        { id: "c", label: "It introduces several unrelated topics" },
      ],
      correctOptionId: "b",
      explanation: "Focused practice should reinforce the specific understanding or habit the learner needs next.",
    },
    {
      id: "request",
      prompt: "When should you accept a lesson request?",
      options: [
        { id: "a", label: "Whenever the time is free" },
        { id: "b", label: "After checking that the subject, level, and learner need are a strong fit" },
        { id: "c", label: "Only after moving the conversation off-platform" },
      ],
      correctOptionId: "b",
      explanation: "Reviewing the context protects lesson quality and sets honest expectations for the family.",
    },
    {
      id: "payments",
      prompt: "How should payment for a ScienceDojo introduction be handled?",
      options: [
        { id: "a", label: "Through ScienceDojo" },
        { id: "b", label: "By private bank transfer" },
        { id: "c", label: "Whichever method the tutor prefers" },
      ],
      correctOptionId: "a",
      explanation: "On-platform payment protects the tutor, family, records, and support process.",
    },
    {
      id: "reviews",
      prompt: "What is the professional response to feedback?",
      options: [
        { id: "a", label: "Pressure the family to change it" },
        { id: "b", label: "Use it constructively and contact support if formal help is needed" },
        { id: "c", label: "Message the student to dispute it" },
      ],
      correctOptionId: "b",
      explanation: "Feedback should support improvement; concerns should be handled through the platform's support process.",
    },
  ],
};

export const emptyAcademyProgress: AcademyProgress = {
  completedLessons: [],
  currentLesson: null,
  quizAttempts: 0,
  bestScore: 0,
  completedAt: null,
};

export function getAcademyLesson(slug: string) {
  return tutorAcademyCourse.lessons.find((lesson) => lesson.slug === slug) || null;
}

export function getAcademyLessonIndex(slug: string) {
  return tutorAcademyCourse.lessons.findIndex((lesson) => lesson.slug === slug);
}

export function getAcademyResumeHref(progress: AcademyProgress) {
  if (progress.completedAt) return `/dashboard/tutor/academy/lessons/${tutorAcademyCourse.lessons[0].slug}`;

  const currentLesson = progress.currentLesson && getAcademyLesson(progress.currentLesson);
  if (currentLesson) return `/dashboard/tutor/academy/lessons/${currentLesson.slug}`;

  const firstIncomplete = tutorAcademyCourse.lessons.find(
    (lesson) => !progress.completedLessons.includes(lesson.slug),
  );
  return firstIncomplete
    ? `/dashboard/tutor/academy/lessons/${firstIncomplete.slug}`
    : "/dashboard/tutor/academy/quiz";
}

export function getAcademyProgressPercent(progress: AcademyProgress) {
  const completed = tutorAcademyCourse.lessons.filter((lesson) =>
    progress.completedLessons.includes(lesson.slug),
  ).length;
  const totalSteps = tutorAcademyCourse.lessons.length + 1;
  return Math.round(((completed + (progress.completedAt ? 1 : 0)) / totalSteps) * 100);
}

export function scoreTutorAcademyQuiz(answers: Record<string, string>) {
  const results = tutorAcademyCourse.quiz.map((question) => ({
    questionId: question.id,
    correct: answers[question.id] === question.correctOptionId,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
  }));
  const correctCount = results.filter((result) => result.correct).length;
  const score = Math.round((correctCount / tutorAcademyCourse.quiz.length) * 100);
  return { score, passed: score >= TUTOR_ACADEMY_PASS_MARK, results };
}

export function getPublicQuizQuestions() {
  return tutorAcademyCourse.quiz.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
  }));
}
