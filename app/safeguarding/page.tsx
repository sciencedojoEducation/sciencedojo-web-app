import type { Metadata } from "next";
import Link from "next/link";
import SupportInfoPage from "@/components/SupportInfoPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Safeguarding Policy | ScienceDojo",
  description: "How ScienceDojo protects students through tutor checks, recorded online classrooms, parent visibility, and safeguarding reporting.",
  alternates: {
    canonical: `${siteUrl}/safeguarding`,
  },
};

const sections = [
  {
    title: "Our commitment to student safety",
    body: "ScienceDojo is built around safe, structured online learning. We aim to create a calm environment where students can learn with confidence and parents can understand how support is being delivered.",
  },
  {
    title: "Tutor approval and DBS checks",
    body: "All tutors are DBS checked before being approved on ScienceDojo. Tutor applications are reviewed before tutors can offer lessons to families.",
  },
  {
    title: "Recorded online classroom",
    body: "All sessions take place in our built-in online classroom, which is recorded for safety. This helps protect students, families, and tutors while keeping lessons focused on learning.",
  },
  {
    title: "Parent visibility after lessons",
    body: "Parents can view session summaries after every lesson so they can understand what was covered and what support may be needed next.",
  },
  {
    title: "How to report a concern",
    body: "If something feels unsafe or inappropriate, please contact ScienceDojo as soon as possible.",
    items: [
      <>Use the <Link href="/contact" className="font-bold text-primary underline-offset-4 hover:underline">Contact Us</Link> page and choose the most relevant reason.</>,
      "For safeguarding concerns, include the student name, tutor name, lesson date, and a brief description where appropriate.",
    ],
  },
  {
    title: "Safeguarding lead contact",
    body: "For safeguarding questions or concerns, contact safeguarding@sciencedojo.com.",
  },
];

export default function SafeguardingPage() {
  return (
    <SupportInfoPage
      eyebrow="Support & safety"
      title="Safeguarding Policy"
      subtitle="How ScienceDojo supports safer online learning for students, parents, and tutors."
      sections={sections}
    />
  );
}
