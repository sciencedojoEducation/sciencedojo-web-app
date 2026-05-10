import type { Metadata } from "next";
import SupportInfoPage from "@/components/SupportInfoPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Parent Support | ScienceDojo",
  description: "Parent support for finding tutors, booking a free first session, understanding reports, switching tutors, billing, and payments.",
  alternates: {
    canonical: `${siteUrl}/support`,
  },
};

const sections = [
  {
    title: "How to find the right tutor for your child",
    body: "Start with your child's subject, level, curriculum, and learning goals. ScienceDojo helps families look for tutor fit based on what the student needs most.",
  },
  {
    title: "How to book a free first session",
    body: "Use the free assessment flow to tell us about your child's current support needs. We will use that information to help guide the next step.",
  },
  {
    title: "Understanding session reports",
    body: "Session reports help parents see what was covered, what the student should practise next, and where support may be needed.",
  },
  {
    title: "How to switch tutors if needed",
    body: "If a tutor is not the right fit, contact ScienceDojo support. We will review the situation and help explore a better match where possible.",
  },
  {
    title: "Billing and payment questions",
    body: "For billing, payment, invoice, or booking questions, contact support with the parent account email and lesson details.",
  },
  {
    title: "Contact options",
    body: "We respond to all parent messages within 2 hours.",
  },
];

export default function ParentSupportPage() {
  return (
    <SupportInfoPage
      eyebrow="Parent help"
      title="Parent Support"
      subtitle="Practical help for families using ScienceDojo for online tutoring and structured learning support."
      sections={sections}
    />
  );
}
