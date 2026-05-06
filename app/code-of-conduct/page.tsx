import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Code of Conduct | ScienceDojo",
  description: "ScienceDojo conduct rules for parents, students, and tutors using online tutoring, messaging, booking, and classroom features.",
  alternates: {
    canonical: `${siteUrl}/code-of-conduct`,
  },
};

const sections = [
  {
    title: "Everyone on ScienceDojo",
    items: [
      "Be respectful, punctual, honest, and focused on learning.",
      "Do not harass, bully, discriminate, threaten, impersonate, or pressure another user.",
      "Keep personal contact details, payment arrangements, and lesson communication on platform where possible.",
      "Do not share private student information, screenshots, recordings, or messages without permission.",
      "Report safety, safeguarding, payment, attendance, or conduct concerns promptly.",
    ],
  },
  {
    title: "Parent rules",
    items: [
      "Provide accurate parent, student, curriculum, subject, and scheduling information.",
      "Help students attend lessons on time with a suitable device, internet connection, and quiet learning space.",
      "Use respectful communication with tutors, admins, and students.",
      "Do not pressure tutors to move bookings, payments, or communication outside ScienceDojo.",
      "Raise concerns through support rather than confronting students or tutors in unsafe ways.",
    ],
  },
  {
    title: "Student rules",
    items: [
      "Join lessons ready to learn and use classroom tools responsibly.",
      "Complete agreed practice, homework, or mission tasks honestly.",
      "Ask for help when confused and treat tutors and classmates respectfully.",
      "Do not share inappropriate content, private contact details, or another person's work as your own.",
      "Tell a parent, tutor, or ScienceDojo support if something feels unsafe or uncomfortable.",
    ],
  },
  {
    title: "Tutor rules",
    items: [
      "Teach professionally, prepare appropriately, and keep lessons focused on the student's learning goals.",
      "Maintain clear boundaries with students and families.",
      "Keep communication, payment, and scheduling on ScienceDojo where platform tools are available.",
      "Do not make guaranteed grade, admissions, or exam-result promises.",
      "Protect student privacy and record lesson notes, homework, or concerns responsibly.",
      "Update availability, attendance, and lesson information honestly.",
    ],
  },
  {
    title: "Safety and enforcement",
    body: "ScienceDojo may review messages, bookings, reports, tutor applications, support tickets, and classroom activity where needed for safety, dispute resolution, or platform integrity. Serious or repeated breaches may lead to account restrictions, tutor removal, cancelled bookings, or further action.",
  },
];

export default function CodeOfConductPage() {
  return (
    <LegalPage
      eyebrow="ScienceDojo safety"
      title="Code of Conduct"
      subtitle="Simple rules for parents, students, and tutors so ScienceDojo stays safe, respectful, and focused on learning."
      sections={sections}
    />
  );
}
