"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

const subjects = [
  { label: "Maths", value: "Mathematics" },
  { label: "Physics", value: "Physics" },
  { label: "Chemistry", value: "Chemistry" },
  { label: "Biology", value: "Biology" },
  { label: "Computer Science", value: "Computer Science" },
  { label: "English", value: "English" },
  { label: "Other / not sure", value: "" },
];

export default function HomepageSubjectChooser({ assessmentEnabled }: { assessmentEnabled: boolean }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6" aria-labelledby="subject-heading">
      <p id="subject-heading" className="shrink-0 text-sm font-bold text-secondary">Start with a subject</p>
      <div className="flex flex-wrap gap-2">
        {subjects.map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/ai-practice-studio?subject=${encodeURIComponent(value)}#studio` : assessmentEnabled ? "/free-assessment" : "/ai-practice-studio#studio"}
            onClick={() => trackEvent("homepage_subject_selected", { subject: value || "not_sure" })}
            className="inline-flex min-h-10 items-center rounded-full border border-[#d2e4f3] bg-white px-4 py-2 text-sm font-semibold text-secondary transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
