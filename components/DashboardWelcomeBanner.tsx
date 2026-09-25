"use client";

import Image from "next/image";
import type { DashboardRole } from "@/components/DashboardFrame";
import type { DashboardDayPeriod } from "@/lib/dashboard-day-period";

const PERIODS: Record<DashboardDayPeriod, { greeting: string; image: string }> = {
  morning: {
    greeting: "Good morning",
    image: "/images/dashboard-welcome/morning.jpg",
  },
  afternoon: {
    greeting: "Good afternoon",
    image: "/images/dashboard-welcome/afternoon.jpg",
  },
  evening: {
    greeting: "Good evening",
    image: "/images/dashboard-welcome/evening.jpg",
  },
  night: {
    greeting: "Welcome back",
    image: "/images/dashboard-welcome/night.jpg",
  },
};

const ROLE_COPY: Record<DashboardRole, string> = {
  user: "A calm place to focus on what matters next.",
  admin: "A clear view of the people and work that need your attention.",
  tutor: "Everything for today's teaching, in one quiet place.",
  parent: "Your family's learning journey, clearly in view.",
  student: "Take your learning one thoughtful step at a time.",
  internal: "A calm workspace for meaningful progress.",
};

function getFirstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "there";
}

export default function DashboardWelcomeBanner({
  name,
  avatarUrl,
  role,
  period,
  localNow,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  role: DashboardRole;
  period: DashboardDayPeriod;
  localNow: Date | null;
}) {
  const presentation = PERIODS[period];
  const localTime = localNow
    ? new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
    }).format(localNow)
    : "Your local time";
  const firstName = getFirstName(name);

  return (
    <section
      className="dashboard-welcome-banner relative isolate overflow-hidden"
      data-period={period}
      data-tour={`${role}-welcome`}
      aria-labelledby="dashboard-welcome-title"
      suppressHydrationWarning
    >
      <Image
        key={presentation.image}
        src={presentation.image}
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, calc(100vw - 16rem)"
        className="-z-20 object-cover object-center"
      />
      <div className="dashboard-welcome-shade absolute inset-0 -z-10" />

      <div className="flex min-h-[15rem] flex-col justify-between p-5 sm:min-h-[17rem] sm:p-7 md:p-9">
        <div className="flex items-center justify-between gap-4">
          <div suppressHydrationWarning className="dashboard-welcome-time rounded-full px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md">
            {localTime}
          </div>
          {avatarUrl ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/60 bg-white/15 shadow-sm sm:h-11 sm:w-11">
              <Image src={avatarUrl} alt="" fill sizes="44px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-sm font-semibold text-white backdrop-blur-md sm:h-11 sm:w-11">
              {firstName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="max-w-2xl text-white">
          <p className="mb-2 text-sm font-medium text-white/78">{presentation.greeting}</p>
          <h1 id="dashboard-welcome-title" className="text-3xl font-medium tracking-[-0.035em] sm:text-4xl md:text-5xl">
            {firstName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/82 sm:text-base">
            {ROLE_COPY[role]}
          </p>
        </div>
      </div>
    </section>
  );
}
