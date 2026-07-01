import type { Metadata } from "next";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import FocusZone from "@/components/focus/FocusZone";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/seo";
import { ThemeProvider } from "@/lib/themeProvider";

export const metadata: Metadata = {
  title: "FocusDojo | Free Study Timer | ScienceDojo",
  description:
    "Use FocusDojo for calm study sessions, structured breaks, and exam-style timing with a free focus soundtrack.",
  alternates: {
    canonical: `${siteUrl}/focus-dojo`,
  },
  openGraph: {
    title: "FocusDojo | ScienceDojo",
    description:
      "A calm public study timer from ScienceDojo for focused revision and exam practice.",
    url: `${siteUrl}/focus-dojo`,
    siteName: "ScienceDojo",
    type: "website",
  },
};

export default async function FocusDojoPage() {
  const enabled = await isFeatureEnabled("focus_dojo_enabled");

  if (!enabled) {
    return (
      <FeatureUnavailable
        eyebrow="FocusDojo"
        title="FocusDojo is almost ready."
        message="We are preparing this study timer carefully before opening it to students and families."
      />
    );
  }

  return (
    <main className="min-h-screen bg-background text-secondary">
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 md:text-xs">
            Free study timer
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-secondary md:text-6xl">
            FocusDojo
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-secondary/65 md:text-lg">
            A calm timer for focused revision, structured breaks, and
            exam-style practice. Use it when you want a quiet study space
            without opening another app or playlist.
          </p>
        </div>

        <div className="mt-8 grid gap-4 text-sm font-semibold leading-7 text-secondary/60 md:grid-cols-3">
          <p>
            Choose Focus Mode for a Pomodoro-style study rhythm with short
            breaks between rounds.
          </p>
          <p>
            Use Exam Mode when you want silent, timed practice for papers,
            mocks, or homework under pressure.
          </p>
          <p>
            Guests get one Deep Focus soundtrack. ScienceDojo students unlock
            the full focus environment in their dashboard.
          </p>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-secondary/10 bg-white p-2 shadow-xl shadow-secondary/5 md:rounded-[2.25rem] md:p-3">
          <ThemeProvider>
            <FocusZone accessLevel="guest" shellMode="framed" />
          </ThemeProvider>
        </div>
      </section>
    </main>
  );
}
