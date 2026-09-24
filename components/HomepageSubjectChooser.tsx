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
    <div className="mt-8 max-w-[36rem]" aria-labelledby="subject-heading">
      <p id="subject-heading" className="text-sm font-bold text-white">What do you need help with?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {subjects.map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/ai-practice-studio?subject=${encodeURIComponent(value)}#studio` : assessmentEnabled ? "/free-assessment" : "/ai-practice-studio#studio"}
            onClick={() => trackEvent("homepage_subject_selected", { subject: value || "not_sure" })}
            className="inline-flex min-h-10 items-center rounded-full border border-white/35 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-200 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
