import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Use | ScienceDojo",
  description: "ScienceDojo terms for parents, students, tutors, bookings, payments, platform communication, and acceptable use.",
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
};

const sections = [
  {
    title: "Using ScienceDojo",
    body: "ScienceDojo provides an online tutoring platform for families, students, and tutors. By using the website, dashboards, messaging, booking tools, classroom links, or free assessment forms, you agree to use the platform honestly, safely, and respectfully.",
  },
  {
    title: "Accounts and roles",
    items: [
      "Parents are responsible for creating accurate family and student information.",
      "Students should use their account for learning, class participation, homework, messages, and progress tools.",
      "Tutors must provide accurate profile, availability, qualification, and teaching information.",
      "Admins may review accounts, bookings, tutor applications, support messages, and safety reports to operate the service.",
    ],
  },
  {
    title: "Bookings, payments, and cancellations",
    items: [
      "Tutoring prices, availability, and lesson details should be checked before booking.",
      "Payments should stay on the ScienceDojo platform where platform checkout is available.",
      "Cancellation, refund, and rescheduling decisions may depend on timing, tutor availability, payment provider rules, and the specific circumstances.",
      "ScienceDojo may investigate disputes where a lesson, payment, or communication issue is reported.",
    ],
  },
  {
    title: "Platform communication",
    items: [
      "Users should keep tutoring-related communication on ScienceDojo where possible so support and safety checks can work properly.",
      "Users must not harass, threaten, impersonate others, share unsafe content, or attempt to bypass platform safety rules.",
      "Parents, students, and tutors should not post private student information publicly.",
    ],
  },
  {
    title: "Educational information",
    body: "ScienceDojo aims to support learning through structured online tutoring, practice, and feedback. We cannot promise specific grades, exam results, admissions outcomes, or learning outcomes.",
  },
  {
    title: "Changes and contact",
    body: "ScienceDojo may update these terms as the platform grows. For questions about these terms, free assessments, privacy, or support, contact ScienceDojo through the website or the published WhatsApp contact option.",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="ScienceDojo terms"
      title="Terms of Use"
      subtitle="Clear rules for using ScienceDojo safely and fairly as a parent, student, tutor, or admin."
      sections={sections}
    />
  );
}
