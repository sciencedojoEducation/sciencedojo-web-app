import Link from "next/link";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import type { CtaVariant } from "@/lib/learning-hub";

const ctaConfig: Record<CtaVariant, { title: string; body: string; href?: string; label: string }> = {
  assessment: {
    title: "Request Free Assessment",
    body: "Tell us about your child and we will recommend a suitable tutoring route.",
    label: "Request Free Assessment",
  },
  tutor: {
    title: "Find the Right Tutor",
    body: "Browse experienced tutors by subject, profile, availability, and learning fit.",
    href: "/#directory",
    label: "Browse Tutors",
  },
  questions: {
    title: "Practice Dojo",
    body: "Generate targeted practice questions by curriculum, subject, and topic.",
    href: "/ai-practice-studio",
    label: "Try Free Tool",
  },
};

export default function LearningHubCtas({ variants, source }: { variants: CtaVariant[]; source: string }) {
  return (
    <div className={`grid gap-4 ${variants.length > 1 ? "md:grid-cols-3" : ""}`}>
      {variants.map((variant) => {
        const cta = ctaConfig[variant];
        const className = "flex h-full flex-col rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm";

        return (
          <div key={variant} className={className}>
            <h2 className="text-xl font-black tracking-tight">{cta.title}</h2>
            <p className="mt-3 flex-1 leading-7 text-secondary/60">{cta.body}</p>
            {variant === "assessment" ? (
              <BookAssessmentLink source={source} className="mt-5 rounded-2xl bg-primary px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-primary-hover">
                {cta.label}
              </BookAssessmentLink>
            ) : variant === "questions" ? (
              <AiPracticeStudioCtaLink
                href={cta.href!}
                cta="try_free_tool"
                source={source}
                className="mt-5 rounded-2xl border border-secondary/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-secondary transition-colors hover:border-primary/30 hover:text-primary"
              >
                {cta.label}
              </AiPracticeStudioCtaLink>
            ) : (
              <Link href={cta.href!} className="mt-5 rounded-2xl border border-secondary/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-secondary transition-colors hover:border-primary/30 hover:text-primary">
                {cta.label}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
