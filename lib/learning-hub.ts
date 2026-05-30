import type { Metadata } from "next";
import { siteUrl, type Faq } from "@/lib/seo";

export const learningHubCategories = [
  "Study Tips",
  "GCSE",
  "IB",
  "A-Level",
  "Parent Guides",
  "AI & Learning",
  "Revision Techniques",
] as const;

export type LearningHubCategory = (typeof learningHubCategories)[number];

export type ArticleSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type CtaVariant = "assessment" | "tutor" | "questions";

export type LearningArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: LearningHubCategory;
  tags: string[];
  author: string;
  publishedDate: string;
  readingTime: string;
  featured?: boolean;
  coverImage?: string;
  sections: ArticleSection[];
  faqs?: Faq[];
  internalLinks: Array<{ label: string; href: string }>;
  ctas: CtaVariant[];
};

export const learningArticles: LearningArticle[] = [
  {
    slug: "how-to-study-for-gcse-physics",
    title: "How to Study for GCSE Physics",
    excerpt: "A practical GCSE physics revision plan for formulas, required practicals, graphs, and exam-style questions.",
    category: "GCSE",
    tags: ["physics", "gcse", "exam technique", "revision"],
    author: "ScienceDojo Learning Team",
    publishedDate: "2026-05-06",
    readingTime: "6 min read",
    featured: true,
    sections: [
      {
        heading: "Start with the question types",
        body: "GCSE physics revision works best when students practise the kinds of questions they will actually face. Formula recall matters, but marks usually come from choosing the right equation, using units correctly, explaining concepts clearly, and applying ideas to unfamiliar situations.",
        bullets: ["Collect recent exam questions by topic.", "Highlight command words such as explain, calculate, and compare.", "Keep a simple error log for repeated mistakes."],
      },
      {
        heading: "Learn formulas with meaning",
        body: "Students often memorise equations without knowing when to use them. A better approach is to connect each formula to a physical idea, a diagram, and a worked example. That makes recall easier under pressure.",
        bullets: ["Write what each symbol means.", "Practise unit conversions separately.", "Explain the formula aloud before solving."],
      },
      {
        heading: "Do required practical revision actively",
        body: "Required practicals are not just experiments to remember. Students need to understand variables, controls, apparatus, graph patterns, sources of error, and how to improve reliability.",
      },
      {
        heading: "Build a weekly routine",
        body: "A strong weekly routine mixes topic repair, active recall, exam questions, and review. Short regular sessions are usually more effective than long last-minute revision blocks.",
      },
    ],
    faqs: [
      {
        question: "How often should a student revise GCSE physics?",
        answer: "Most students benefit from two or three focused physics sessions per week, mixing formula recall, topic review, and exam-style questions.",
      },
      {
        question: "What is the biggest mistake in GCSE physics revision?",
        answer: "The biggest mistake is rereading notes without practising questions. Physics confidence grows when students apply ideas and review mistakes.",
      },
    ],
    internalLinks: [
      { label: "GCSE Physics Tutor", href: "/gcse-physics-tutor" },
      { label: "Online Physics Tutor", href: "/online-physics-tutor" },
      { label: "Practice Dojo", href: "/ai-practice-studio" },
    ],
    ctas: ["assessment", "questions"],
  },
  {
    slug: "best-revision-techniques-for-students",
    title: "Best Revision Techniques for Students",
    excerpt: "The revision methods that help students remember more: active recall, spaced repetition, past papers, and error logs.",
    category: "Revision Techniques",
    tags: ["revision", "study tips", "active recall", "exam prep"],
    author: "ScienceDojo Learning Team",
    publishedDate: "2026-05-06",
    readingTime: "5 min read",
    featured: true,
    sections: [
      {
        heading: "Use active recall first",
        body: "Active recall means trying to retrieve information before looking at notes. It feels harder than rereading, but that difficulty is useful because it shows the brain what needs strengthening.",
        bullets: ["Close the book and answer a question.", "Use flashcards with short answers.", "Explain a topic in simple language."],
      },
      {
        heading: "Space revision over time",
        body: "Students remember more when revision is spread across days and weeks. Spaced repetition helps avoid the trap of recognising information in the moment but forgetting it in the exam.",
      },
      {
        heading: "Practise with real questions",
        body: "Past-paper and exam-style questions teach students how marks are awarded. They also reveal whether a student can apply knowledge, not just recognise it.",
      },
      {
        heading: "Keep an error log",
        body: "An error log turns mistakes into a plan. Students should write the topic, the mistake, the correct method, and one similar question to try later.",
      },
    ],
    faqs: [
      {
        question: "Is rereading notes a good revision method?",
        answer: "Rereading can help at the start, but it should not be the main method. Students need retrieval practice and exam questions to test real understanding.",
      },
    ],
    internalLinks: [
      { label: "Complete Guide to Online Tutoring", href: "/complete-guide-to-online-tutoring" },
      { label: "How to Study for GCSE Exams", href: "/how-to-study-for-gcse-exams" },
      { label: "Book Free Assessment", href: "/free-assessment" },
    ],
    ctas: ["questions", "assessment"],
  },
  {
    slug: "why-students-struggle-with-math",
    title: "Why Students Struggle With Math",
    excerpt: "Math struggles often come from hidden gaps, anxiety, weak practice systems, and unclear feedback.",
    category: "Study Tips",
    tags: ["math", "confidence", "learning gaps", "study tips"],
    author: "ScienceDojo Learning Team",
    publishedDate: "2026-05-06",
    readingTime: "5 min read",
    sections: [
      {
        heading: "Small gaps become big problems",
        body: "Math builds layer by layer. If a student is unsure about fractions, algebra, or rearranging formulas, later topics can feel confusing even when they are trying hard.",
      },
      {
        heading: "Students copy steps without understanding",
        body: "Many students can follow a worked example but struggle when the question changes. This usually means they know the surface method, but not the reason behind it.",
        bullets: ["Ask why each step works.", "Change one number or condition in the question.", "Compare two methods for the same problem."],
      },
      {
        heading: "Confidence affects performance",
        body: "Math anxiety can make students rush, avoid practice, or give up too early. Calm teaching and guided practice can help students rebuild trust in their own thinking.",
      },
      {
        heading: "Feedback needs to be specific",
        body: "Telling a student to practise more is too vague. Useful feedback shows the exact gap, the next action, and the kind of question to practise next.",
      },
    ],
    faqs: [
      {
        question: "Can a student improve in math after losing confidence?",
        answer: "Yes. Many students improve when gaps are diagnosed clearly and practice is targeted. Confidence usually returns when they experience small wins consistently.",
      },
    ],
    internalLinks: [
      { label: "Online Math Tutor", href: "/online-math-tutor" },
      { label: "GCSE Math Tutor", href: "/gcse-math-tutor" },
      { label: "Best Revision Techniques", href: "/learning-hub/best-revision-techniques-for-students" },
    ],
    ctas: ["tutor", "assessment"],
  },
  {
    slug: "how-parents-can-support-learning-at-home",
    title: "How Parents Can Support Learning at Home",
    excerpt: "Simple ways parents can support study routines, confidence, communication, and independent learning.",
    category: "Parent Guides",
    tags: ["parents", "home learning", "confidence", "study routines"],
    author: "ScienceDojo Learning Team",
    publishedDate: "2026-05-06",
    readingTime: "6 min read",
    featured: true,
    sections: [
      {
        heading: "Make study visible but not stressful",
        body: "Parents do not need to become subject experts. The most useful support is often structure: a calm routine, a clear place to study, and gentle check-ins about what the student is practising.",
      },
      {
        heading: "Ask better questions",
        body: "Instead of asking whether homework is finished, ask what felt easiest, what felt hardest, and what the student will try next. This helps students notice their own learning process.",
        bullets: ["What did you understand better today?", "Which mistake taught you something?", "What question do you want to ask your tutor?"],
      },
      {
        heading: "Protect confidence",
        body: "Students are more likely to keep going when effort and strategy are noticed. Praise the process: planning, checking mistakes, asking for help, and returning to a difficult question.",
      },
      {
        heading: "Use tutoring as a system",
        body: "Tutoring works best when lessons, practice, parent visibility, and feedback connect together. Parents can help by checking the next task and making time for follow-up practice.",
      },
    ],
    faqs: [
      {
        question: "Should parents sit with students while they revise?",
        answer: "Not always. Many students need independence, but parents can help by setting routines, checking plans, and encouraging students to explain what they are learning.",
      },
    ],
    internalLinks: [
      { label: "Book Free Assessment", href: "/free-assessment" },
      { label: "Complete Guide to Online Tutoring", href: "/complete-guide-to-online-tutoring" },
      { label: "Browse Tutors", href: "/#directory" },
    ],
    ctas: ["assessment", "tutor"],
  },
  {
    slug: "how-ai-can-improve-learning",
    title: "How AI Can Improve Learning",
    excerpt: "How students can use AI for practice, explanations, feedback, and revision without replacing thinking.",
    category: "AI & Learning",
    tags: ["ai", "learning", "study tools", "revision"],
    author: "ScienceDojo Learning Team",
    publishedDate: "2026-05-06",
    readingTime: "6 min read",
    featured: true,
    sections: [
      {
        heading: "AI should support thinking",
        body: "AI is most useful when it helps students practise, explain, question, and review. It should not simply give final answers, because students still need to build understanding and exam confidence.",
      },
      {
        heading: "Generate practice questions",
        body: "A student can use AI-style prompts to create recall questions, mixed-topic practice, or quick checks after a lesson. The key is to answer before looking for help.",
        bullets: ["Ask for five questions on one topic.", "Try them without notes.", "Mark mistakes and repeat similar questions later."],
      },
      {
        heading: "Ask for explanations at the right level",
        body: "Students can ask for simpler explanations, analogies, or step-by-step breakdowns. A tutor can then check whether the explanation is accurate and suited to the curriculum.",
      },
      {
        heading: "Use AI with human feedback",
        body: "AI can create more practice, but tutors help students understand misconceptions, choose priorities, and prepare for exam-style marking.",
      },
    ],
    faqs: [
      {
        question: "Can AI replace a tutor?",
        answer: "AI can support practice and explanations, but it does not replace a tutor who understands the student, curriculum, motivation, and exam priorities.",
      },
      {
        question: "How should students avoid overusing AI?",
        answer: "Students should attempt questions first, use AI for hints or review, then check understanding with notes, mark schemes, or a tutor.",
      },
    ],
    internalLinks: [
      { label: "Practice Dojo", href: "/ai-practice-studio" },
      { label: "How AI Improves Learning", href: "/how-ai-improves-learning" },
      { label: "Online Chemistry Tutor", href: "/online-chemistry-tutor" },
    ],
    ctas: ["questions", "assessment"],
  },
];

export const learningArticleMap = new Map(learningArticles.map((article) => [article.slug, article]));

export function learningHubUrl(slug = "") {
  return `${siteUrl}/learning-hub${slug ? `/${slug}` : ""}`;
}

export function getRelatedArticles(article: LearningArticle, limit = 3) {
  return learningArticles
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => ({
      article: candidate,
      score:
        (candidate.category === article.category ? 3 : 0) +
        candidate.tags.filter((tag) => article.tags.includes(tag)).length,
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((candidate) => candidate.article);
}

export function createArticleMetadata(article: LearningArticle): Metadata {
  const url = learningHubUrl(article.slug);

  return {
    title: `${article.title} | ScienceDojo Learning Hub`,
    description: article.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url,
      type: "article",
      publishedTime: article.publishedDate,
      authors: [article.author],
      images: article.coverImage
        ? [
            {
              url: article.coverImage,
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export function articleJsonLd(article: LearningArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: {
      "@type": "Organization",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "ScienceDojo",
      url: siteUrl,
    },
    datePublished: article.publishedDate,
    dateModified: article.publishedDate,
    mainEntityOfPage: learningHubUrl(article.slug),
    articleSection: article.category,
    keywords: article.tags.join(", "),
  };
}
