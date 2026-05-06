import type { Metadata } from "next";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sciencedojo.co.uk").replace(/\/$/, "");

export type Faq = {
  question: string;
  answer: string;
};

export type SeoPage = {
  slug: string;
  kind: "service" | "curriculum" | "location" | "pillar" | "article" | "trust";
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  intro: string;
  directAnswer: string;
  benefits: string[];
  faqs: Faq[];
  testimonials?: string[];
  related: string[];
  cta?: string;
};

const defaultFaqs: Faq[] = [
  {
    question: "How does ScienceDojo match students with tutors?",
    answer: "ScienceDojo helps families choose tutors by subject, learning goals, and teaching fit. Parents can browse profiles, review experience, and book sessions with a tutor who suits the student’s needs.",
  },
  {
    question: "Are ScienceDojo lessons online?",
    answer: "Yes. ScienceDojo is built for online tutoring, so students can learn from home with structured sessions, follow-up notes, and easy access to classroom links.",
  },
  {
    question: "Can parents track progress?",
    answer: "Parents can use their dashboard to view bookings, homework, confirmed sessions, and lesson history so learning stays visible between sessions.",
  },
];

export const seoPages: SeoPage[] = [
  {
    slug: "online-math-tutor",
    kind: "service",
    title: "Online Math Tutor | ScienceDojo",
    description: "Find an online math tutor who helps students build confidence, close gaps, and use smarter learning systems.",
    h1: "Online Math Tutor",
    eyebrow: "Math tutoring",
    intro: "ScienceDojo connects students with online math tutors who explain ideas clearly, rebuild confidence, and turn practice into a repeatable learning system.",
    directAnswer: "A good online math tutor helps students understand the reason behind each method, not just memorize steps. ScienceDojo tutors focus on confidence, clear explanations, and structured practice so students can improve steadily.",
    benefits: ["Clear explanations for difficult topics", "Confidence-building practice", "Tutor matching by goals and level", "Follow-up homework and lesson history"],
    related: ["gcse-math-tutor", "online-math-tutor-germany", "why-students-struggle-with-math"],
    faqs: defaultFaqs,
  },
  {
    slug: "online-physics-tutor",
    kind: "service",
    title: "Online Physics Tutor | ScienceDojo",
    description: "Book online physics tutoring for GCSE, IB, and exam confidence with structured ScienceDojo support.",
    h1: "Online Physics Tutor",
    eyebrow: "Physics tutoring",
    intro: "ScienceDojo physics tutors help students connect equations, diagrams, and exam questions so physics starts to feel logical instead of overwhelming.",
    directAnswer: "An online physics tutor can help students turn abstract ideas into simple models. ScienceDojo lessons focus on understanding, exam technique, and guided practice for steady progress.",
    benefits: ["Step-by-step problem solving", "Exam-style question practice", "Support for GCSE and IB topics", "Better confidence with calculations"],
    related: ["ib-physics-tutor", "online-physics-tutor-uk", "best-revision-techniques"],
    faqs: defaultFaqs,
  },
  {
    slug: "online-chemistry-tutor",
    kind: "service",
    title: "Online Chemistry Tutor | ScienceDojo",
    description: "Online chemistry tutoring for students who need clearer explanations, better revision, and exam confidence.",
    h1: "Online Chemistry Tutor",
    eyebrow: "Chemistry tutoring",
    intro: "ScienceDojo chemistry tutors help students make sense of reactions, calculations, and exam technique with calm, structured teaching.",
    directAnswer: "A strong online chemistry tutor helps students connect theory to practice. ScienceDojo tutors use clear teaching, active recall, and targeted exam questions to make chemistry more manageable.",
    benefits: ["Support with calculations and core concepts", "Structured revision systems", "Exam question walkthroughs", "Confidence before mocks and finals"],
    related: ["a-level-chemistry-tutor", "complete-guide-to-online-tutoring", "how-ai-improves-learning"],
    faqs: defaultFaqs,
  },
  {
    slug: "gcse-math-tutor",
    kind: "curriculum",
    title: "GCSE Math Tutor | ScienceDojo",
    description: "GCSE math tutoring focused on confidence, exam technique, and stronger revision habits.",
    h1: "GCSE Math Tutor",
    eyebrow: "GCSE support",
    intro: "ScienceDojo GCSE math tutoring helps students identify weak areas, practise exam-style questions, and build a calmer revision routine.",
    directAnswer: "GCSE math tutoring works best when it combines topic repair, exam practice, and confidence. ScienceDojo tutors help students understand errors and practise in a structured way before exams.",
    benefits: ["Mock exam preparation", "Topic gap diagnosis", "Calculator and non-calculator practice", "Revision plans students can follow"],
    related: ["how-to-study-for-gcse-exams", "online-math-tutor", "best-revision-techniques"],
    faqs: defaultFaqs,
  },
  {
    slug: "gcse-physics-tutor",
    kind: "curriculum",
    title: "GCSE Physics Tutor | ScienceDojo",
    description: "GCSE physics tutoring for clearer concepts, exam-style practice, and stronger confidence before mocks and finals.",
    h1: "GCSE Physics Tutor",
    eyebrow: "GCSE support",
    intro: "ScienceDojo GCSE physics tutoring helps students understand equations, required practicals, and exam wording with calm, structured teaching.",
    directAnswer: "A GCSE physics tutor helps students connect formulas, concepts, and exam technique. ScienceDojo tutors focus on clear explanations, targeted practice, and confidence with common question types.",
    benefits: ["Forces, energy, waves, and electricity support", "Required practical preparation", "Equation practice with understanding", "Mock exam confidence"],
    related: ["online-physics-tutor", "online-physics-tutor-uk", "how-to-study-for-gcse-exams"],
    faqs: defaultFaqs,
  },
  {
    slug: "ib-physics-tutor",
    kind: "curriculum",
    title: "IB Physics Tutor | ScienceDojo",
    description: "IB physics tutoring for students who need conceptual clarity, problem-solving support, and exam confidence.",
    h1: "IB Physics Tutor",
    eyebrow: "IB support",
    intro: "ScienceDojo IB physics tutors help students handle demanding concepts, data questions, and structured problem solving.",
    directAnswer: "IB physics tutoring should make complex ideas usable under exam pressure. ScienceDojo tutors focus on clear models, question strategy, and confidence with multi-step problems.",
    benefits: ["HL and SL topic support", "Data and graph interpretation", "Formula use with understanding", "Exam strategy and revision structure"],
    related: ["online-physics-tutor", "online-physics-tutor-uk", "complete-guide-to-online-tutoring"],
    faqs: defaultFaqs,
  },
  {
    slug: "a-level-chemistry-tutor",
    kind: "curriculum",
    title: "A-Level Chemistry Tutor | ScienceDojo",
    description: "A-Level chemistry tutoring for clearer concepts, better exam technique, and structured revision.",
    h1: "A-Level Chemistry Tutor",
    eyebrow: "A-Level support",
    intro: "ScienceDojo A-Level chemistry tutors help students tackle mechanisms, calculations, and exam wording with structured support.",
    directAnswer: "A-Level chemistry tutoring helps students move from memorising content to applying it. ScienceDojo tutors focus on exam language, recurring question patterns, and confident problem solving.",
    benefits: ["Organic, physical, and inorganic support", "Exam question breakdowns", "Moles and energetics practice", "Revision systems for long courses"],
    related: ["online-chemistry-tutor", "best-revision-techniques", "how-ai-improves-learning"],
    faqs: defaultFaqs,
  },
  {
    slug: "online-math-tutor-germany",
    kind: "location",
    title: "Online Math Tutor Germany | ScienceDojo",
    description: "Online math tutoring for families in Germany who want flexible, English-language academic support.",
    h1: "Online Math Tutor Germany",
    eyebrow: "Online tutoring in Germany",
    intro: "ScienceDojo supports students in Germany with online math tutoring that fits international families, school demands, and exam goals.",
    directAnswer: "Families in Germany can use online math tutoring to access specialist support without location limits. ScienceDojo provides structured, English-language tutoring focused on confidence and progress.",
    benefits: ["Flexible online lessons", "Support for international families", "Clear practice between sessions", "Tutors matched to student goals"],
    related: ["online-math-tutor", "online-math-tutor-berlin", "complete-guide-to-online-tutoring"],
    faqs: defaultFaqs,
  },
  {
    slug: "online-math-tutor-berlin",
    kind: "location",
    title: "Online Math Tutor Berlin | ScienceDojo",
    description: "Online math tutoring for Berlin students who need confidence, structure, and clearer explanations.",
    h1: "Online Math Tutor Berlin",
    eyebrow: "Online tutoring in Berlin",
    intro: "ScienceDojo helps Berlin families find online math tutors who can support schoolwork, exam prep, and confidence from home.",
    directAnswer: "Online math tutoring in Berlin gives families access to specialist tutors without travel. ScienceDojo lessons focus on clear explanations, confidence, and structured practice.",
    benefits: ["No commute required", "Support for busy family schedules", "Focused math practice", "Progress visible in the parent dashboard"],
    related: ["online-math-tutor", "online-math-tutor-germany", "why-students-struggle-with-math"],
    faqs: defaultFaqs,
  },
  {
    slug: "online-physics-tutor-uk",
    kind: "location",
    title: "Online Physics Tutor UK | ScienceDojo",
    description: "Online physics tutoring for UK students preparing for GCSE, A-Level, and confidence-building support.",
    h1: "Online Physics Tutor UK",
    eyebrow: "Online tutoring in the UK",
    intro: "ScienceDojo connects UK students with online physics tutors for exam preparation, clearer explanations, and steady practice.",
    directAnswer: "Online physics tutoring in the UK can help students prepare for GCSE and advanced study with flexible support. ScienceDojo focuses on understanding, exam technique, and confidence.",
    benefits: ["GCSE and advanced topic support", "Online classroom access", "Exam-style practice", "Parent visibility through dashboards"],
    related: ["online-physics-tutor", "ib-physics-tutor", "best-revision-techniques"],
    faqs: defaultFaqs,
  },
  {
    slug: "complete-guide-to-online-tutoring",
    kind: "pillar",
    title: "Complete Guide to Online Tutoring | ScienceDojo",
    description: "A complete guide for parents choosing online tutoring, from tutor fit to learning systems and AI-aware study methods.",
    h1: "Complete Guide to Online Tutoring",
    eyebrow: "Parent guide",
    intro: "Online tutoring works best when strong teaching, clear practice, and parent visibility come together. This guide explains how to choose support that actually helps.",
    directAnswer: "Online tutoring is most effective when lessons are structured, goals are clear, and students practise between sessions. ScienceDojo combines tutor expertise, learning systems, and AI-aware study habits to help students become confident learners.",
    benefits: ["How to choose a tutor", "What parents should track", "How online lessons work", "How AI can support revision safely"],
    related: ["how-to-study-for-gcse-exams", "best-revision-techniques", "how-ai-improves-learning", "online-math-tutor"],
    faqs: defaultFaqs,
  },
  {
    slug: "how-to-study-for-gcse-exams",
    kind: "article",
    title: "How to Study for GCSE Exams | ScienceDojo",
    description: "A practical GCSE revision guide for students who want clearer plans, better practice, and less panic.",
    h1: "How to Study for GCSE Exams",
    eyebrow: "Study guide",
    intro: "GCSE revision becomes easier when students stop rereading and start using active systems: retrieval, spaced practice, error logs, and exam-style questions.",
    directAnswer: "To study for GCSE exams, students should create a realistic plan, practise past-paper questions, review mistakes, and space revision over time. Short, consistent sessions work better than last-minute cramming.",
    benefits: ["Build a weekly revision plan", "Use active recall", "Review mistakes properly", "Practise exam timing"],
    related: ["complete-guide-to-online-tutoring", "gcse-math-tutor", "best-revision-techniques"],
    faqs: defaultFaqs,
  },
  {
    slug: "why-students-struggle-with-math",
    kind: "article",
    title: "Why Students Struggle with Math | ScienceDojo",
    description: "Understand why students lose confidence in math and how tutoring can rebuild foundations.",
    h1: "Why Students Struggle with Math",
    eyebrow: "Learning systems",
    intro: "Math struggles often come from missing foundations, weak practice habits, anxiety, or moving too quickly through topics without feedback.",
    directAnswer: "Students often struggle with math because small gaps build into bigger confusion. The solution is not more pressure; it is clearer explanations, targeted practice, and feedback that helps students understand mistakes.",
    benefits: ["Spot hidden knowledge gaps", "Reduce math anxiety", "Practise the right questions", "Build confidence step by step"],
    related: ["online-math-tutor", "gcse-math-tutor", "complete-guide-to-online-tutoring"],
    faqs: defaultFaqs,
  },
  {
    slug: "best-revision-techniques",
    kind: "article",
    title: "Best Revision Techniques | ScienceDojo",
    description: "The best revision techniques for students: active recall, spaced repetition, practice questions, and error logs.",
    h1: "Best Revision Techniques",
    eyebrow: "Revision guide",
    intro: "The best revision techniques make students think, retrieve, and correct mistakes. Passive rereading feels easy but rarely builds exam confidence.",
    directAnswer: "The best revision techniques are active recall, spaced repetition, past-paper practice, and error logs. These methods help students remember more and understand what to improve next.",
    benefits: ["Use active recall", "Space revision sessions", "Work through past papers", "Keep an error log"],
    related: ["how-to-study-for-gcse-exams", "complete-guide-to-online-tutoring", "a-level-chemistry-tutor"],
    faqs: defaultFaqs,
  },
  {
    slug: "how-ai-improves-learning",
    kind: "article",
    title: "How AI Improves Learning | ScienceDojo",
    description: "How AI can support students with practice, feedback, and revision without replacing strong teaching.",
    h1: "How AI Improves Learning",
    eyebrow: "AI-aware study",
    intro: "AI can help students generate practice questions, check understanding, and revise more actively when it is guided by strong teaching.",
    directAnswer: "AI improves learning when it helps students practise, explain ideas, and spot gaps. It should support thinking, not replace it. ScienceDojo uses AI-aware study methods alongside human tutoring.",
    benefits: ["Generate practice questions", "Explain difficult concepts", "Check understanding", "Use AI safely and critically"],
    related: ["complete-guide-to-online-tutoring", "online-chemistry-tutor", "best-revision-techniques"],
    faqs: defaultFaqs,
  },
  {
    slug: "about",
    kind: "trust",
    title: "About ScienceDojo | Founder-Led Online Tutoring",
    description: "Learn about ScienceDojo, a founder-led tutoring company helping students become confident learners.",
    h1: "About ScienceDojo",
    eyebrow: "Our story",
    intro: "ScienceDojo is a founder-led tutoring company built to help students become confident learners through smarter systems, strong teaching, and AI-aware study methods.",
    directAnswer: "ScienceDojo helps students learn with expert tutors, structured practice, and clear parent visibility. The brand is founder-led, but built to scale through a trusted team of teachers.",
    benefits: ["Founder-led standards", "Multiple expert teachers", "Transparent dashboards", "Student confidence first"],
    related: ["complete-guide-to-online-tutoring", "online-math-tutor", "contact"],
    faqs: defaultFaqs,
  },
  {
    slug: "contact",
    kind: "trust",
    title: "Contact ScienceDojo | Online Tutoring Support",
    description: "Contact ScienceDojo about online tutoring, tutor matching, parent questions, and platform support.",
    h1: "Contact ScienceDojo",
    eyebrow: "Get in touch",
    intro: "Have a question about finding a tutor, booking a lesson, or supporting your child? Contact ScienceDojo and we will help you take the next step.",
    directAnswer: "Parents can contact ScienceDojo to ask about tutor matching, online lessons, subject support, and account help. The fastest next step is to book a free assessment or message the team.",
    benefits: ["Tutor matching help", "Booking support", "Parent questions", "Platform guidance"],
    related: ["about", "online-math-tutor", "complete-guide-to-online-tutoring"],
    cta: "Book Free Assessment",
    faqs: defaultFaqs,
  },
  {
    slug: "privacy-policy",
    kind: "trust",
    title: "Privacy Policy | ScienceDojo",
    description: "ScienceDojo privacy information for parents, students, and tutors using the platform.",
    h1: "Privacy Policy",
    eyebrow: "Transparency",
    intro: "ScienceDojo takes student and parent privacy seriously. This page explains the types of information used to provide tutoring and platform services.",
    directAnswer: "ScienceDojo uses account, booking, messaging, and learning information to provide tutoring services, support families, and keep the platform safe. Private details should only be shared through trusted platform tools.",
    benefits: ["Account information", "Booking and lesson data", "Student support information", "Safety and support records"],
    related: ["about", "contact", "complete-guide-to-online-tutoring"],
    faqs: defaultFaqs,
  },
];

export const seoPageMap = new Map(seoPages.map((page) => [page.slug, page]));

export function pageUrl(slug = "") {
  return `${siteUrl}/${slug}`.replace(/\/$/, "");
}

export function createPageMetadata(page: SeoPage): Metadata {
  const url = pageUrl(page.slug);

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: "ScienceDojo",
      type: "website",
      images: [
        {
          url: `${siteUrl}/images/sciencedojo-logo-brand.jpg`,
          width: 512,
          height: 512,
          alt: "ScienceDojo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [`${siteUrl}/images/sciencedojo-logo-brand.jpg`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ScienceDojo",
    url: siteUrl,
    logo: `${siteUrl}/images/sciencedojo-logo-brand.jpg`,
    sameAs: [],
    description: "ScienceDojo is a founder-led tutoring company helping students become confident learners through smarter systems, strong teaching, and AI-aware study methods.",
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "ScienceDojo",
    url: siteUrl,
    image: `${siteUrl}/images/sciencedojo-logo-brand.jpg`,
    areaServed: ["United Kingdom", "Germany", "Online"],
    priceRange: "££",
    description: "Online tutoring for students who need confidence, structure, and expert teaching.",
  };
}

export function courseJsonLd(page: SeoPage) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: page.h1,
    description: page.description,
    provider: {
      "@type": "Organization",
      name: "ScienceDojo",
      sameAs: siteUrl,
    },
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
