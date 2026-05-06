import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy | ScienceDojo",
  description: "How ScienceDojo handles account, student, booking, messaging, lead, analytics, and support information.",
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
};

const sections = [
  {
    title: "Information we collect",
    items: [
      "Account details such as name, email address, role, login provider, and profile information.",
      "Parent and student details submitted during signup, onboarding, booking, free assessment, or support flows.",
      "Tutor profile, application, availability, subject, qualification, payout, and teaching information.",
      "Booking, lesson, classroom, message, homework, review, support, dispute, and admin status information.",
      "Basic analytics events such as page views, free assessment actions, CTA clicks, role selection, and tutor connect clicks when analytics is configured.",
    ],
  },
  {
    title: "How we use information",
    items: [
      "To create accounts and show the correct dashboard for parents, students, tutors, and admins.",
      "To help families request free assessments, find tutors, book lessons, and communicate about learning support.",
      "To help tutors manage sessions, availability, student communication, lesson notes, and payouts.",
      "To improve safety, investigate disputes, prevent misuse, and support platform administration.",
      "To understand whether public SEO pages and booking flows are helping families find the right support.",
    ],
  },
  {
    title: "Student privacy",
    body: "Student information should be treated carefully. Parents, students, tutors, and admins should avoid sharing unnecessary personal details in public areas. Tutors should use student information only for teaching, preparation, feedback, and agreed support.",
  },
  {
    title: "Third-party services",
    items: [
      "Supabase may be used for authentication, profiles, bookings, messages, leads, and platform data.",
      "Stripe may be used for checkout, tutor payouts, and payment-related records.",
      "Resend may be used for email notifications.",
      "Google services may be used for login, calendar features, analytics, or AI-supported study tools when configured.",
      "Jitsi may be used for online classroom links or embedded calls.",
    ],
  },
  {
    title: "Data choices and contact",
    body: "Users can contact ScienceDojo to ask about their information, request corrections, or raise a privacy concern. Some records may need to be retained for safety, payment, legal, or dispute resolution reasons.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="ScienceDojo privacy"
      title="Privacy Policy"
      subtitle="How ScienceDojo handles information for families, students, tutors, leads, bookings, and platform support."
      sections={sections}
    />
  );
}
