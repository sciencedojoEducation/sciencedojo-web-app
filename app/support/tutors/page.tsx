import type { Metadata } from "next";
import SupportInfoPage from "@/components/SupportInfoPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tutor Guide Hub | ScienceDojo",
  description:
    "Tutor guidance for getting started on ScienceDojo, completing your profile, teaching lessons, supporting students, managing payments, and understanding platform policies.",
  alternates: {
    canonical: `${siteUrl}/support/tutors`,
  },
};

const sections = [
  {
    title: "Getting started",
    body: "Once accepted, your first goal is to prepare a clear profile and understand how ScienceDojo supports students between lessons.",
    items: [
      "Review your tutor dashboard and complete the launch checklist before your first student enquiry.",
      "Use your first week to refine your profile, set availability, and become familiar with bookings and lesson records.",
      "Keep communication, lesson updates, and student support inside ScienceDojo so families have one trusted place to follow progress.",
    ],
  },
  {
    title: "Building your profile",
    body: "Your profile should quickly help families understand who you teach, how you teach, and what kind of learning support you provide.",
    items: [
      "Add a clear profile photo so parents and students can recognize you.",
      "Write a calm bio that explains your subjects, levels, teaching approach, and the type of student you support best.",
      "Choose subjects and curricula that match your real confidence rather than listing every possible topic.",
      "Use your introduction or demo video to show how you explain a concept clearly and support student confidence.",
      "Set availability and hourly rate details that are accurate, sustainable, and easy for families to understand.",
    ],
  },
  {
    title: "Working with students",
    body: "ScienceDojo is built around continuity: lessons, notes, homework, and Missions should connect into a guided learning journey.",
    items: [
      "Respond to booking requests promptly and only accept lessons you can reliably deliver.",
      "Use lesson records to summarize what was covered, why it matters, and what should happen next.",
      "Assign homework or practice tasks when they help the student make progress between sessions.",
      "Use Missions to turn recurring learning needs into structured, visible progress.",
      "Keep messages supportive, professional, and focused on learning.",
    ],
  },
  {
    title: "Growing as a tutor",
    body: "Strong tutors build trust through clear communication, consistent records, and a profile that accurately reflects their strengths.",
    items: [
      "Ask for reviews only after verified lessons and let ScienceDojo review feedback before it appears publicly.",
      "Build trust by keeping lesson notes specific, calm, and helpful for parents and students.",
      "Improve profile visibility by keeping subjects, availability, rate, and intro video up to date.",
      "Use parent and student questions as signals for how to improve explanations and future lesson planning.",
    ],
  },
  {
    title: "Payments and policies",
    body: "Payments, refunds, safeguarding, and platform expectations are handled through ScienceDojo so teaching stays organized and transparent.",
    items: [
      "Connect Stripe when prompted so payouts can be handled securely after paid lessons.",
      "Payout timing can depend on completed lesson records, payment processing, and platform review checks.",
      "Payment disputes, refunds, and booking questions should be handled through ScienceDojo support rather than off-platform arrangements.",
      "Follow safeguarding expectations and keep all lesson communication within ScienceDojo systems.",
      "Do not independently arrange lessons or payments with students or families introduced through ScienceDojo.",
    ],
  },
  {
    title: "Application and verification",
    body: "If you are still applying, the onboarding process helps ScienceDojo understand your teaching background, subject strengths, and readiness to support students safely online.",
    items: [
      "Complete each application step with accurate information about your teaching background and subject strengths.",
      "After you submit, the ScienceDojo team usually reviews applications within 48 hours.",
      "Prepare photo ID, qualification evidence, and any safeguarding or background-check documentation you already have.",
      "Teaching qualifications are helpful, but experience, subject expertise, and communication quality are also considered.",
      "You can tutor from another country if you have reliable internet and meet ScienceDojo verification and teaching requirements.",
    ],
  },
  {
    title: "Technical setup",
    body: "Reliable online lessons depend on clear audio, stable video, and a calm teaching environment.",
    items: [
      "Use a laptop or desktop computer where possible for lesson delivery.",
      "Check your webcam, microphone or headset, and internet connection before teaching.",
      "Choose a quiet space with enough lighting for students to see and hear you clearly.",
      "If a technical issue affects a lesson, communicate early and keep support inside the platform.",
    ],
  },
];

export default function TutorSupportPage() {
  return (
    <SupportInfoPage
      eyebrow="Tutor help"
      title="Tutor Guide Hub"
      subtitle="A practical guide for launching your tutor profile, teaching through ScienceDojo, supporting students between lessons, and managing payments and policies."
      sections={sections}
      ctaEyebrow="Ready to continue?"
      ctaTitle="Open your tutor workspace"
      ctaBody="Use your dashboard to finish profile setup, review launch steps, manage availability, and prepare for student enquiries."
      ctaHref="/dashboard/tutor"
      ctaLabel="Open Tutor Workspace"
    />
  );
}
