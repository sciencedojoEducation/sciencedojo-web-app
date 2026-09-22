import { migrateAcademyCourse } from "./academy-schema.ts";
import type { AcademyTemplate } from "@/lib/academy-templates";
import type {
  AcademyAudienceRole,
  AcademyCourse,
  AcademyLesson,
  LessonBlock,
  QuizQuestion,
} from "@/lib/tutor-academy";

const image = {
  tutor: "/images/home/8.professional-online-teacher.jpg",
  teaching: "/images/home/9.modern-online-tutoring.jpg",
  parent: "/images/home/3.parent-support-learning.jpg",
  student: "/images/home/5.teen-online-study.jpg",
  maths: "/images/home/6.focused-student-study.jpg",
  english: "/images/home/12.happy-learning-moment.jpg",
  science: "/images/home/1.hero-stem-online-learning.jpg",
};

const englandKs3Sources = {
  maths:
    "https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study",
  english:
    "https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study",
  science:
    "https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study",
};

function text(heading: string, ...paragraphs: string[]): LessonBlock {
  return { type: "text", heading, paragraphs };
}

function note(body: string): LessonBlock {
  return {
    type: "callout",
    heading: "Author review",
    body: `[[AUTHOR: ${body}]]`,
    tone: "amber",
  };
}

function check(
  id: string,
  prompt: string,
  options: [string, string, ...string[]],
  correctIndex: number,
  explanation: string,
): QuizQuestion {
  return {
    id,
    type: "single-choice",
    prompt,
    options: options.map((label, index) => ({
      id: `option-${index + 1}`,
      label,
    })),
    correctOptionId: `option-${correctIndex + 1}`,
    explanation,
  };
}

function lesson(
  slug: string,
  section: string,
  title: string,
  summary: string,
  durationMinutes: number,
  blocks: LessonBlock[],
): AcademyLesson {
  return { slug, section, title, summary, durationMinutes, blocks };
}

function course(input: {
  title: string;
  shortTitle: string;
  description: string;
  audienceRoles: AcademyAudienceRole[];
  heroImage: string;
  lessons: AcademyLesson[];
  quiz?: QuizQuestion[];
}): AcademyCourse {
  const quiz = input.quiz || [];
  return migrateAcademyCourse({
    key: "new-course",
    title: input.title,
    shortTitle: input.shortTitle,
    description: input.description,
    heroImage: input.heroImage,
    audienceRoles: input.audienceRoles,
    estimatedMinutes: input.lessons.reduce(
      (sum, item) => sum + item.durationMinutes,
      0,
    ),
    passMark: 80,
    quizRevision: 1,
    lessons: input.lessons,
    quiz,
    rules: {
      navigation: "free",
      lessonCompletion: "manual",
      requireFinalAssessment: quiz.length > 0,
      attemptLimit: null,
      feedbackTiming: "immediate",
    },
  });
}

export const stakeholderAcademyTemplates: AcademyTemplate[] = [
  {
    key: "tutor-platform-walkthrough",
    name: "Tutor platform walkthrough",
    badge: "Tutors",
    image: image.tutor,
    imageAlt: "Tutor teaching in an online lesson",
    accent: "#1E5AA8",
    category: "Platform training",
    audienceRoles: ["tutor"],
    learningPattern: "See a task → follow steps → decide → find help",
    description:
      "Teach a tutor one complete ScienceDojo workflow through a guided task.",
    course: course({
      title: "Run your first ScienceDojo lesson",
      shortTitle: "First lesson workflow",
      description:
        "Prepare your profile and schedule, manage a booking, then guide learning after the lesson.",
      audienceRoles: ["tutor"],
      heroImage: image.tutor,
      lessons: [
        lesson(
          "prepare",
          "Before the lesson",
          "Prepare your teaching space",
          "Locate the essential tutor tools before a student joins.",
          6,
          [
            text(
              "Start with the tutor dashboard",
              "Your tutor dashboard is the starting point for your schedule, students, messages, and Mission reviews. Check the booking details before preparing your lesson.",
            ),
            {
              type: "process",
              heading: "Your preparation route",
              items: [
                {
                  title: "Check your schedule",
                  body: "Open Schedule and confirm the date, time, and booking status.",
                },
                {
                  title: "Review the learner",
                  body: "Use Students & Classes for class context and any available learning history.",
                },
                {
                  title: "Plan the next step",
                  body: "Prepare a clear objective and one way to check understanding.",
                },
              ],
            },
            note(
              "Verify each named tutor screen and replace this note with an approved screenshot or current guidance before publishing.",
            ),
          ],
        ),
        lesson(
          "follow-through",
          "After the lesson",
          "Keep learning moving",
          "Choose a useful next action and know where support lives.",
          6,
          [
            text(
              "Close the loop",
              "A useful lesson summary tells the learner and parent what was covered, what went well, and what to practise next. Keep private concerns out of general lesson notes.",
            ),
            {
              type: "knowledge-check",
              heading: "Which follow-up helps most?",
              question: check(
                "tutor-workflow-check",
                "A learner understood today's example but needs more practice. What is the best follow-up?",
                [
                  "Record the topic and a specific practice task",
                  "Write only that the lesson went well",
                  "Wait until the next booking to mention it",
                ],
                0,
                "A specific next task makes the lesson summary useful for the student and parent.",
              ),
              completion: "interact",
            },
            {
              type: "resources",
              heading: "Where to go next",
              items: [
                {
                  title: "Tutor schedule",
                  url: "https://www.sciencedojo.co.uk/dashboard/tutor/schedule",
                  description: "Review upcoming lessons and requests.",
                },
                {
                  title: "Tutor support",
                  url: "https://www.sciencedojo.co.uk/support/tutors",
                  description: "Get help with teaching on ScienceDojo.",
                },
              ],
            },
          ],
        ),
      ],
    }),
  },
  {
    key: "tutor-decision-practice",
    name: "Tutor decision practice",
    badge: "Scenario",
    image: image.teaching,
    imageAlt: "Tutor and student working together online",
    accent: "#39766C",
    category: "Platform training",
    audienceRoles: ["tutor_applicant", "tutor"],
    learningPattern: "Situation → choice → consequence → feedback",
    description:
      "A safe decision exercise for professional boundaries or communication.",
    course: course({
      title: "Respond to a difficult tutoring moment",
      shortTitle: "Tutor decision practice",
      description:
        "Practise making a calm, professional decision when a learner raises a concern.",
      audienceRoles: ["tutor_applicant", "tutor"],
      heroImage: image.teaching,
      lessons: [
        lesson(
          "recognise-the-moment",
          "Notice",
          "Recognise the situation",
          "Read a realistic situation before choosing a response.",
          5,
          [
            text(
              "A learner asks for a private channel",
              "Near the end of an online lesson, a learner asks to continue the conversation through a personal social media account. They say it would be quicker than using the platform.",
            ),
            {
              type: "tabs",
              heading: "What should you consider?",
              items: [
                {
                  title: "The learner",
                  body: "They may need help or reassurance. Listen carefully without promising secrecy.",
                },
                {
                  title: "The boundary",
                  body: "Keep tutoring communication within approved ScienceDojo channels.",
                },
                {
                  title: "The next step",
                  body: "If a concern about safety emerges, use the approved reporting route promptly.",
                },
              ],
            },
            note(
              "Have the safeguarding lead review this scenario, answer, reporting route, and wording against the current ScienceDojo policy before publishing.",
            ),
          ],
        ),
        lesson(
          "choose-a-response",
          "Decide",
          "Choose and explain your response",
          "Consider the consequences of each option.",
          6,
          [
            {
              type: "knowledge-check",
              heading: "What would you say?",
              question: check(
                "tutor-boundary-check",
                "Which response best protects the learner and professional boundary?",
                [
                  "Explain that communication stays on approved channels and ask what help they need",
                  "Share a personal account just for this learner",
                  "Ignore the request without asking whether they need help",
                ],
                0,
                "Acknowledge the request, keep communication in the approved channel, and follow safeguarding procedures if the conversation raises a concern.",
              ),
              completion: "interact",
            },
            {
              type: "accordion",
              heading: "Explore the consequences",
              items: [
                {
                  title: "Approved channel",
                  body: "The learner gets a clear boundary and a way to ask for support.",
                },
                {
                  title: "Personal account",
                  body: "This blurs boundaries and removes the conversation from approved records.",
                },
                {
                  title: "No response",
                  body: "A possible need for support may be missed.",
                },
              ],
            },
          ],
        ),
      ],
    }),
  },
  {
    key: "parent-getting-started",
    name: "Parent getting started",
    badge: "Parents",
    image: image.parent,
    imageAlt: "Parent supporting a child at home",
    accent: "#39766C",
    category: "Platform training",
    audienceRoles: ["parent"],
    learningPattern: "Locate → act → check → get help",
    description: "Help parents find bookings, messages, payments, and support.",
    course: course({
      title: "Find your way around ScienceDojo",
      shortTitle: "Parent start guide",
      description:
        "A short guide to the parent dashboard and the actions you will use most often.",
      audienceRoles: ["parent"],
      heroImage: image.parent,
      lessons: [
        lesson(
          "first-steps",
          "Get oriented",
          "Find the essentials",
          "Know where to look for lessons and tutor communication.",
          5,
          [
            text(
              "Your parent dashboard",
              "The dashboard brings together booking information and learning progress. My Classes shows your class context; Messages is the place to contact your tutor.",
            ),
            {
              type: "numbered-list",
              heading: "Try this route",
              items: [
                {
                  title: "Check a booking",
                  body: "Open the parent dashboard to review upcoming and requested lessons.",
                },
                {
                  title: "Contact a tutor",
                  body: "Use Messages rather than a personal contact channel.",
                },
                {
                  title: "Review payment",
                  body: "If a booking is accepted and payment is due, follow the payment action shown on the parent dashboard.",
                },
                {
                  title: "Get help",
                  body: "Open Support when you need platform assistance.",
                },
              ],
            },
            note(
              "Verify current booking and payment labels and add an approved parent-dashboard image before publishing.",
            ),
          ],
        ),
        lesson(
          "plan-next-step",
          "Take action",
          "Know what to do next",
          "Use the status of a lesson to choose a useful action.",
          5,
          [
            {
              type: "knowledge-check",
              heading: "Quick decision",
              question: check(
                "parent-start-check",
                "You have a question about an upcoming lesson. Where should you start?",
                [
                  "Open Messages to contact the tutor",
                  "Post a public comment",
                  "Wait until after the lesson",
                ],
                0,
                "Messages keeps tutor communication in the platform.",
              ),
              completion: "interact",
            },
            {
              type: "resources",
              heading: "Useful links",
              items: [
                {
                  title: "Parent dashboard",
                  url: "https://www.sciencedojo.co.uk/dashboard/parent",
                },
                {
                  title: "Support",
                  url: "https://www.sciencedojo.co.uk/dashboard/support",
                },
              ],
            },
          ],
        ),
      ],
    }),
  },
  {
    key: "parent-progress-guide",
    name: "Understanding your child’s progress",
    badge: "Parents",
    image: image.parent,
    imageAlt: "Parent helping a child reflect on learning",
    accent: "#4C746D",
    category: "Platform training",
    audienceRoles: ["parent"],
    learningPattern: "Observe → interpret → support → review",
    description:
      "Make lesson summaries, homework, and Missions easier to act on.",
    course: course({
      title: "Use progress to support learning",
      shortTitle: "Progress guide",
      description:
        "Read learning updates and choose one practical way to support the next step.",
      audienceRoles: ["parent"],
      heroImage: image.parent,
      lessons: [
        lesson(
          "read-the-signals",
          "Understand",
          "Read the learning picture",
          "Connect lesson notes with practice between sessions.",
          6,
          [
            text(
              "Progress is more than a score",
              "Past lesson summaries can show what was covered and what the tutor suggests next. Homework and Missions help connect that guidance to practice between lessons.",
            ),
            {
              type: "comparison-table",
              heading: "What each signal can tell you",
              columns: ["Signal", "Look for", "Useful response"],
              rows: [
                [
                  "Lesson summary",
                  "What was covered and what needs practice",
                  "Ask your child to explain one idea.",
                ],
                [
                  "Homework",
                  "A specific practice task",
                  "Help make time for a short attempt.",
                ],
                [
                  "Mission",
                  "A guided practice pathway",
                  "Celebrate effort and review feedback together.",
                ],
              ],
            },
            note(
              "Verify how lesson summaries, homework, and Missions appear in the current parent dashboard before publishing.",
            ),
          ],
        ),
        lesson(
          "support-one-step",
          "Support",
          "Choose one helpful next action",
          "Respond to a learning need without turning it into pressure.",
          5,
          [
            {
              type: "knowledge-check",
              heading: "A useful response",
              question: check(
                "parent-progress-check",
                "A lesson note identifies fractions as the next focus. What is a helpful first step?",
                [
                  "Ask your child to show one example and allow a short practice attempt",
                  "Treat one difficult topic as proof they are falling behind",
                  "Ignore the note until the next term",
                ],
                0,
                "A small, specific practice step supports the tutor's guidance without adding unnecessary pressure.",
              ),
              completion: "interact",
            },
            {
              type: "callout",
              heading: "Keep it manageable",
              body: "A short conversation and one clear practice action can be more useful than trying to redo a whole lesson at home.",
              tone: "teal",
            },
          ],
        ),
      ],
    }),
  },
  {
    key: "student-getting-started",
    name: "Student getting started",
    badge: "Students",
    image: image.student,
    imageAlt: "Teen student studying online",
    accent: "#1E5AA8",
    category: "Platform training",
    audienceRoles: ["student"],
    learningPattern: "Find → try → reflect",
    description:
      "Show students how to find lessons, messages, Missions, and progress.",
    course: course({
      title: "Your ScienceDojo learning space",
      shortTitle: "Student start guide",
      description:
        "Find your next lesson, practise with a Mission, and see what to work on next.",
      audienceRoles: ["student"],
      heroImage: image.student,
      lessons: [
        lesson(
          "find-your-learning",
          "Explore",
          "Find your next step",
          "Start with the tools you need for this week.",
          5,
          [
            text(
              "Start from your dashboard",
              "My Bookings shows your lessons. My Classes helps you find class information. Messages keeps tutor conversations together.",
            ),
            {
              type: "process",
              heading: "A simple learning loop",
              items: [
                {
                  title: "Before",
                  body: "Check your next lesson and bring one question.",
                },
                {
                  title: "During",
                  body: "Try the example and explain your thinking.",
                },
                {
                  title: "After",
                  body: "Look at your practice task or Mission and take one small step.",
                },
              ],
            },
            note(
              "Verify current student navigation labels and add an approved student-dashboard image before publishing.",
            ),
          ],
        ),
        lesson(
          "practice-and-progress",
          "Practise",
          "Use your Mission",
          "See how practice connects with tutor feedback.",
          5,
          [
            text(
              "What a Mission does",
              "Missions offer guided practice linked to learning. After you submit work, look for feedback that helps you decide what to try next. Your student dashboard also brings together recent learning activity so you can see your next focus.",
            ),
            {
              type: "knowledge-check",
              heading: "Check your next move",
              question: check(
                "student-start-check",
                "You are unsure what to practise after a lesson. What should you check first?",
                [
                  "Your lesson guidance or Missions",
                  "A random topic with no connection to your lesson",
                  "Only the final score",
                ],
                0,
                "Your tutor's guidance and Missions are designed to connect practice with what you have learned.",
              ),
              completion: "interact",
            },
          ],
        ),
      ],
    }),
  },
  {
    key: "platform-update",
    name: "What’s new on ScienceDojo",
    badge: "Update",
    image: image.teaching,
    imageAlt: "Online learning session on ScienceDojo",
    accent: "#B56B2E",
    category: "Platform updates",
    audienceRoles: ["tutor", "parent", "student"],
    learningPattern: "What changed → show → act → support",
    description:
      "Turn a feature announcement into a short, useful walkthrough.",
    course: course({
      title: "A new way to learn on ScienceDojo",
      shortTitle: "Platform update",
      description: "See what changed, how it helps, and what to do next.",
      audienceRoles: ["tutor", "parent", "student"],
      heroImage: image.teaching,
      lessons: [
        lesson(
          "what-changed",
          "The update",
          "What changed and why",
          "Give the change a clear purpose before listing controls.",
          4,
          [
            text(
              "The change in one sentence",
              "[[AUTHOR: Describe the actual new feature, the task it helps people complete, and who can use it.]]",
            ),
            {
              type: "comparison-table",
              heading: "Before and now",
              columns: ["Before", "Now", "Why it helps"],
              rows: [
                [
                  "[[AUTHOR: Previous task]]",
                  "[[AUTHOR: New route]]",
                  "[[AUTHOR: Benefit to this audience]]",
                ],
              ],
            },
            note(
              "Replace the example copy with the actual release notes, audience, date, and current interface before publishing.",
            ),
          ],
        ),
        lesson(
          "try-the-change",
          "Try it",
          "Take your first step",
          "Show one task and give a place to find help.",
          4,
          [
            {
              type: "process",
              heading: "Try it in three steps",
              items: [
                {
                  title: "Find it",
                  body: "[[AUTHOR: Name the exact starting screen.]]",
                },
                {
                  title: "Use it",
                  body: "[[AUTHOR: Describe the one action that matters most.]]",
                },
                {
                  title: "Check the result",
                  body: "[[AUTHOR: Explain what success looks like.]]",
                },
              ],
            },
            {
              type: "resources",
              heading: "Need help?",
              items: [
                {
                  title: "ScienceDojo support",
                  url: "https://www.sciencedojo.co.uk/dashboard/support",
                },
              ],
            },
          ],
        ),
      ],
    }),
  },
  {
    key: "ks3-maths-concept",
    name: "KS3 Maths concept and practice",
    badge: "England KS3",
    image: image.maths,
    imageAlt: "Student working through a mathematics problem",
    accent: "#1E5AA8",
    category: "UK subject learning",
    audienceRoles: ["student"],
    curriculumLabel: "England KS3 · Mathematics",
    learningPattern: "Notice → model → practise → explain",
    description:
      "A complete example lesson on solving one-step linear equations.",
    course: course({
      title: "Solve one-step linear equations",
      shortTitle: "One-step equations",
      description:
        "Use inverse operations to find an unknown and check your answer by substitution.",
      audienceRoles: ["student"],
      heroImage: image.maths,
      lessons: [
        lesson(
          "see-the-balance",
          "Understand",
          "Keep the equation balanced",
          "See why the same operation is applied to both sides.",
          7,
          [
            text(
              "What does the equals sign tell us?",
              "An equation says that two expressions have the same value. To keep that equality true, make the same change on both sides.",
            ),
            {
              type: "worked-example",
              heading: "Solve x + 5 = 12",
              problem: "Find x in x + 5 = 12.",
              steps: [
                {
                  title: "Undo the addition",
                  body: "Subtract 5 from both sides: x + 5 − 5 = 12 − 5.",
                },
                { title: "Simplify", body: "x = 7." },
                {
                  title: "Check",
                  body: "Substitute 7: 7 + 5 = 12, so the solution works.",
                },
              ],
              answer: "x = 7",
            },
            {
              type: "callout",
              heading: "Why it works",
              body: "Subtracting the same number from both sides preserves equality.",
              tone: "blue",
            },
          ],
        ),
        lesson(
          "try-and-explain",
          "Practise",
          "Try it yourself",
          "Use the same reasoning on a new equation.",
          7,
          [
            {
              type: "knowledge-check",
              heading: "Your turn",
              question: check(
                "maths-linear-check",
                "Solve y − 4 = 9. What is y?",
                ["5", "13", "−13"],
                1,
                "Add 4 to both sides to get y = 13. Check: 13 − 4 = 9.",
              ),
              completion: "interact",
            },
            {
              type: "flashcards",
              heading: "Recall the method",
              items: [
                {
                  title: "How do you undo + 5?",
                  body: "Subtract 5 from both sides.",
                },
                {
                  title: "How do you check a solution?",
                  body: "Substitute it into the original equation.",
                },
              ],
            },
            {
              type: "resources",
              heading: "Curriculum reference",
              items: [
                {
                  title: "England KS3 mathematics programme",
                  url: englandKs3Sources.maths,
                },
              ],
            },
          ],
        ),
      ],
    }),
  },
  {
    key: "ks3-english-close-reading",
    name: "KS3 English close reading",
    badge: "England KS3",
    image: image.english,
    imageAlt: "Student reading and reflecting on a text",
    accent: "#39766C",
    category: "UK subject learning",
    audienceRoles: ["student"],
    curriculumLabel: "England KS3 · English",
    learningPattern: "Read → infer → cite → reflect",
    description:
      "An original short passage with modelled inference and evidence practice.",
    course: course({
      title: "Make an inference from a short text",
      shortTitle: "Reading for clues",
      description:
        "Read closely, choose a plausible inference, and support it with a detail from the text.",
      audienceRoles: ["student"],
      heroImage: image.english,
      lessons: [
        lesson(
          "read-for-clues",
          "Read",
          "What is the text suggesting?",
          "Use details from an original passage to infer a character's feelings.",
          7,
          [
            text(
              "Read the passage",
              "The hall was almost empty when Maya reached the display board. Her design was still pinned beside the others. She straightened its corner, then stepped back as footsteps sounded behind her. Instead of leaving, she stayed to see who had come in.",
            ),
            {
              type: "quote",
              quote: "Instead of leaving, she stayed to see who had come in.",
              attribution: "Original ScienceDojo practice passage",
            },
            {
              type: "worked-example",
              heading: "Model the inference",
              problem: "What might Maya be feeling?",
              steps: [
                {
                  title: "Notice a detail",
                  body: "She straightens the corner of her design, showing that its presentation matters to her.",
                },
                {
                  title: "Connect actions",
                  body: "She could leave when someone arrives, but chooses to stay.",
                },
                {
                  title: "Make a cautious claim",
                  body: "She may feel proud and curious about the visitor's reaction.",
                },
              ],
              answer:
                "Maya may be proud of her work and interested in how someone responds.",
            },
          ],
        ),
        lesson(
          "support-your-inference",
          "Explain",
          "Choose evidence that fits",
          "Use a detail from the passage to justify a reading.",
          7,
          [
            {
              type: "knowledge-check",
              heading: "Which detail supports the inference?",
              question: check(
                "english-inference-check",
                "Which detail best supports the idea that Maya cares about her design?",
                [
                  "The hall was almost empty",
                  "She straightened its corner",
                  "Footsteps sounded behind her",
                ],
                1,
                "Straightening the design is a deliberate action that suggests she cares how it looks.",
              ),
              completion: "interact",
            },
            text(
              "Make your own sentence",
              "Try this structure: Maya may feel ___ because the text says ___. Explain how the detail supports your idea rather than repeating it.",
            ),
            {
              type: "resources",
              heading: "Curriculum reference",
              items: [
                {
                  title: "England KS3 English programme",
                  url: englandKs3Sources.english,
                },
              ],
            },
          ],
        ),
      ],
    }),
  },
  {
    key: "ks3-science-investigation",
    name: "KS3 Science investigation",
    badge: "England KS3",
    image: image.science,
    imageAlt: "Students exploring a science topic",
    accent: "#B56B2E",
    category: "UK subject learning",
    audienceRoles: ["student"],
    curriculumLabel: "England KS3 · Science",
    learningPattern: "Question → predict → compare data → conclude",
    description:
      "A guided investigation into how light affects seedling growth.",
    course: course({
      title: "Investigate light and seedlings",
      shortTitle: "Light and growth",
      description:
        "Plan a fair comparison, read simple data, and explain what the results do and do not show.",
      audienceRoles: ["student"],
      heroImage: image.science,
      lessons: [
        lesson(
          "plan-a-fair-test",
          "Plan",
          "Ask a testable question",
          "Identify the variable to change and what to measure.",
          7,
          [
            text(
              "The question",
              "Does the amount of light affect the height of seedlings after one week? To compare fairly, change the light conditions while keeping the seed type, water, soil, and growing time the same.",
            ),
            {
              type: "process",
              heading: "Plan the comparison",
              items: [
                { title: "Predict", body: "State what you expect and why." },
                {
                  title: "Change one factor",
                  body: "Give one group light and keep another in a darker place.",
                },
                {
                  title: "Measure",
                  body: "Record seedling heights after the same period of time.",
                },
              ],
            },
            {
              type: "callout",
              heading: "Safety",
              body: "Use a classroom-safe setup, wash hands after handling soil, and follow your teacher's instructions.",
              tone: "amber",
            },
          ],
        ),
        lesson(
          "use-the-evidence",
          "Explain",
          "What do the results show?",
          "Read a small data set and avoid claiming more than it proves.",
          8,
          [
            {
              type: "comparison-table",
              heading: "Illustrative results after one week",
              columns: [
                "Light condition",
                "Seedling A",
                "Seedling B",
                "Mean height",
              ],
              rows: [
                ["More light", "7 cm", "9 cm", "8 cm"],
                ["Less light", "4 cm", "6 cm", "5 cm"],
              ],
            },
            {
              type: "knowledge-check",
              heading: "Interpret the pattern",
              question: check(
                "science-light-check",
                "What can you say from this illustrative data?",
                [
                  "The more-light group had a higher mean height in this small sample",
                  "Light always makes every plant grow faster",
                  "Water could not have mattered in any experiment",
                ],
                0,
                "The sample shows a difference between these groups, but two seedlings per condition are too few for a broad claim.",
              ),
              completion: "interact",
            },
            {
              type: "resources",
              heading: "Curriculum reference",
              items: [
                {
                  title: "England KS3 science programme",
                  url: englandKs3Sources.science,
                },
              ],
            },
          ],
        ),
      ],
    }),
  },
];
