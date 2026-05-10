import type { Metadata } from "next";
import SupportInfoPage from "@/components/SupportInfoPage";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How We Verify Our Tutors | ScienceDojo",
  description: "ScienceDojo tutor verification includes application review, DBS check verification, subject assessment, and trial lesson review.",
  alternates: {
    canonical: `${siteUrl}/how-we-verify`,
  },
};

const sections = [
  {
    title: "Our 4-step verification process",
    items: [
      "Step 1: Application and background check",
      "Step 2: DBS check verification",
      "Step 3: Subject knowledge assessment",
      "Step 4: Trial lesson review",
    ],
  },
  {
    title: "What the Verified Tutor badge means",
    body: "The Verified Tutor badge means a tutor has completed ScienceDojo's approval checks before being listed for families. It is a trust signal, not a guarantee of any specific academic outcome.",
  },
  {
    title: "How we handle complaints about tutors",
    body: "If a parent or student raises a concern, ScienceDojo reviews the report and may inspect relevant lesson, booking, message, or support information where needed for safety and quality.",
  },
  {
    title: "Ongoing quality monitoring",
    body: "ScienceDojo continues to monitor tutor quality through platform activity, lesson feedback, parent concerns, and internal review processes.",
  },
];

export default function HowWeVerifyPage() {
  return (
    <SupportInfoPage
      eyebrow="Tutor quality"
      title="How We Verify Our Tutors"
      subtitle="A clear overview of how tutors are reviewed before supporting ScienceDojo students."
      sections={sections}
    />
  );
}
