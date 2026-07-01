import type { Metadata } from "next";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import FocusZone from "@/components/focus/FocusZone";
import { getFocusDojoAccessLevel } from "@/lib/focusdojo/access";
import { syncFocusDojoCheckoutSessionForUser } from "@/lib/focusdojo/subscription-sync";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/seo";
import { ThemeProvider } from "@/lib/themeProvider";
import { createClient } from "@/utils/supabase/server";

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

type FocusDojoPageProps = {
  searchParams?: Promise<{
    checkout?: string | string[];
    session_id?: string | string[];
  }>;
};

function singleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FocusDojoPage({ searchParams }: FocusDojoPageProps) {
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = searchParams ? await searchParams : {};
  const checkout = singleParam(params.checkout);
  const sessionId = singleParam(params.session_id);
  let checkoutMessage: string | null = null;
  let checkoutMessageTone: "success" | "pending" | "error" = "pending";

  if (checkout === "success" && sessionId) {
    if (!user) {
      checkoutMessage =
        "Please log in with the account you used for checkout so we can refresh your FocusDojo Pro access.";
      checkoutMessageTone = "error";
    } else {
      try {
        const result = await syncFocusDojoCheckoutSessionForUser(
          sessionId,
          user.id,
        );
        if (result.synced) {
          checkoutMessage = "FocusDojo Pro is active on this account.";
          checkoutMessageTone = "success";
        } else {
          checkoutMessage =
            "Payment was received, but we could not refresh your access yet. Please check My Dojo in a moment.";
          checkoutMessageTone = "error";
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[focusdojo-page] checkout return sync failed for ${user.id} / ${sessionId}: ${message}`,
        );
        checkoutMessage =
          "Payment was received, but we could not refresh your access yet. Please check My Dojo in a moment.";
        checkoutMessageTone = "error";
      }
    }
  }

  const accessLevel = await getFocusDojoAccessLevel(user?.id);

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
            Start with selected themes and soundtracks. ScienceDojo students
            get FocusDojo Basic included with their learning.
          </p>
        </div>

        {checkoutMessage ? (
          <div
            className={`mt-8 rounded-2xl border px-5 py-4 text-sm font-bold ${
              checkoutMessageTone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {checkoutMessage}
          </div>
        ) : null}

        <div className="mt-10 rounded-[1.75rem] border border-secondary/10 bg-white p-2 shadow-xl shadow-secondary/5 md:rounded-[2.25rem] md:p-3">
          <ThemeProvider>
            <FocusZone accessLevel={accessLevel} shellMode="framed" />
          </ThemeProvider>
        </div>
      </section>
    </main>
  );
}
