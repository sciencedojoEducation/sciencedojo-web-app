import type { Metadata } from "next";
import SupportInfoPage from "@/components/SupportInfoPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Your Online Classroom Guide | ScienceDojo",
  description: "Learn how the ScienceDojo online classroom works, what students need, how to join sessions, and where to get technical support.",
  alternates: {
    canonical: `${siteUrl}/classroom-guide`,
  },
};

const sections = [
  {
    title: "What is the ScienceDojo classroom?",
    body: "The ScienceDojo classroom is the built-in online space where booked lessons take place. Students can join lessons directly inside ScienceDojo without needing separate meeting tools.",
  },
  {
    title: "What you need",
    items: ["A laptop, tablet, or desktop computer", "A stable internet connection", "A modern browser", "A quiet space where the student can focus"],
  },
  {
    title: "How to join your first session",
    body: "After a lesson is booked, students can join from their ScienceDojo dashboard at the scheduled time. Parents should help younger students check their device, audio, and internet connection before the first lesson.",
  },
  {
    title: "Classroom features",
    items: ["Whiteboard for explanations and working", "Screen share for resources and examples", "Video for live online tutoring", "Chat for lesson communication"],
  },
  {
    title: "Recording and playback",
    body: "Lessons in the built-in classroom are recorded for safety. Playback availability may depend on account settings and platform permissions.",
  },
  {
    title: "Technical support",
    body: "For classroom issues, contact hello@sciencedojo.co.uk and include the lesson time, device, browser, and a short description of the problem.",
  },
];

export default function ClassroomGuidePage() {
  return (
    <SupportInfoPage
      eyebrow="Online lessons"
      title="Your Online Classroom Guide"
      subtitle="How to join lessons, use the classroom tools, and get help if something does not work."
      sections={sections}
    />
  );
}
