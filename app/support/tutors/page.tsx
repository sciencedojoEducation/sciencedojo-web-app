import type { Metadata } from "next";
import SupportInfoPage from "@/components/SupportInfoPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tutor Support | ScienceDojo",
  description:
    "Tutor support for applying to ScienceDojo, preparing verification documents, creating a strong tutor profile, teaching online, and understanding payments.",
  alternates: {
    canonical: `${siteUrl}/support/tutors`,
  },
};

const sections = [
  {
    title: "Applying to become a tutor",
    body: "The tutor application helps ScienceDojo understand your subject knowledge, teaching style, availability, and readiness to support students safely online.",
    items: [
      "Complete each application step with accurate information about your teaching background and subject strengths.",
      "After you submit, the ScienceDojo team usually reviews applications within 48 hours.",
      "You can save a draft during onboarding and return when you have your documents or demo link ready.",
    ],
  },
  {
    title: "Creating a strong tutor profile",
    body: "A strong profile should make it easy for families and students to understand how you teach and who you can help best.",
    items: [
      "Write clearly about the subjects, levels, and curricula you are confident teaching.",
      "Choose subjects that match your real expertise rather than listing every possible topic.",
      "For your introduction video, explain one concept calmly and show how you make learning easier to follow.",
      "Set an hourly rate that reflects your experience while staying fair and transparent.",
    ],
  },
  {
    title: "Verification & safety",
    body: "ScienceDojo verifies tutors to protect students, support parent trust, and maintain a high-quality learning environment.",
    items: [
      "Prepare a valid photo ID, relevant qualification evidence, and any safeguarding or background-check documents you have.",
      "Teaching qualifications are helpful, but subject expertise, tutoring experience, and communication quality are also considered.",
      "Tutors are expected to follow safeguarding expectations and keep all lesson communication within ScienceDojo systems.",
    ],
  },
  {
    title: "Teaching on ScienceDojo",
    body: "ScienceDojo is built around structured learning continuity, not one-off tutoring. Tutors help create the lesson records, practice tasks, and Missions that keep students supported between sessions.",
    items: [
      "Online lessons run through ScienceDojo classroom tools and require reliable internet, camera, and microphone access.",
      "Lesson records help parents and students understand what was covered and what should happen next.",
      "Homework, practice tasks, and Missions help connect lessons into a guided learning journey.",
      "You can tutor from another country if you meet ScienceDojo requirements and can teach reliably online.",
    ],
  },
  {
    title: "Payments",
    body: "Tutor payments are handled through ScienceDojo’s platform payments flow so bookings, payouts, and records stay organized.",
    items: [
      "Approved tutors may be asked to connect Stripe before receiving payouts.",
      "Payout timing can depend on completed lesson records, payment processing, and platform review checks.",
      "Payment disputes, refunds, and booking questions should be handled through ScienceDojo support rather than off-platform arrangements.",
    ],
  },
  {
    title: "Frequently asked questions",
    items: [
      "Can I tutor from another country? Yes, as long as you have reliable internet and meet ScienceDojo verification and teaching requirements.",
      "How long does application review take? Usually within 48 hours after you submit the completed application.",
      "Do I need teaching qualifications? Not always. Experience, subject expertise, and teaching quality are also considered.",
      "Can I teach multiple subjects? Yes, if each subject reflects your real knowledge and teaching confidence.",
      "What documents should I prepare? Photo ID, qualification evidence, and any safeguarding or background-check documentation you already have.",
    ],
  },
];

export default function TutorSupportPage() {
  return (
    <SupportInfoPage
      eyebrow="Tutor help"
      title="Tutor Support"
      subtitle="Guidance for applying to ScienceDojo, preparing your tutor profile, completing verification, and understanding how teaching works on the platform."
      sections={sections}
      ctaEyebrow="Applying to ScienceDojo?"
      ctaTitle="Continue your tutor application"
      ctaBody="Return to onboarding when you are ready to complete your profile, upload documents, or submit your application for review."
      ctaHref="/tutor/onboarding"
      ctaLabel="Continue Application"
    />
  );
}
