"use client";

import type { Announcement } from "@/lib/announcement-queries";
import type { AvailabilitySlot, Booking, TutorProfile } from "@/lib/supabase-queries";
import type { TutorReadinessResult } from "@/lib/tutor-readiness";
import { useState, useTransition } from "react";
import Link from "next/link";
import AnnouncementFeed from "@/components/AnnouncementFeed";
import { markTutorWelcomeSeen } from "./actions";

type LaunchChecklistItem = {
  id: string;
  label: string;
  helper: string;
  completed: boolean;
  href?: string;
  action?: "availability";
};

interface TutorHomeDashboardUIProps {
  userId: string;
  userName: string;
  avatarUrl?: string;
  bookings: Booking[];
  tutorData: TutorProfile | null;
  slots: AvailabilitySlot[];
  announcements: Announcement[];
  reviewVisibility: {
    approved: number;
    pending: number;
  };
  showAcceptedWelcome: boolean;
  profileReadiness: TutorReadinessResult;
  launchChecklist: LaunchChecklistItem[];
  mentorReach: {
    profileVisits: number;
    learningChecks: number;
    trialLessons: number;
  };
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Tutor";
}

function isSameDay(value: string, date: Date) {
  const source = new Date(value);
  return (
    source.getFullYear() === date.getFullYear() &&
    source.getMonth() === date.getMonth() &&
    source.getDate() === date.getDate()
  );
}

function formatLessonDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActionHref(readiness: TutorReadinessResult) {
  const cta = readiness.recommendedNextAction.cta;
  if (cta.action === "availability") return "/dashboard/tutor/schedule?tab=availability";
  return cta.href || "/dashboard/tutor";
}

export default function TutorHomeDashboardUI({
  userName,
  avatarUrl,
  bookings,
  tutorData,
  slots,
  announcements,
  reviewVisibility,
  showAcceptedWelcome,
  profileReadiness,
  launchChecklist,
  mentorReach,
}: TutorHomeDashboardUIProps) {
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(showAcceptedWelcome);
  const [isDismissingWelcome, startWelcomeDismiss] = useTransition();

  const requested = bookings.filter((booking) => booking.status === "requested");
  const upcoming = bookings
    .filter((booking) => booking.status === "confirmed" || booking.status === "accepted")
    .sort((a, b) => new Date(a.requested_date).getTime() - new Date(b.requested_date).getTime());
  const todayLessons = upcoming.filter((booking) => isSameDay(booking.requested_date, new Date()));
  const completed = bookings.filter((booking) => booking.status === "completed");
  const totalEarnings = completed.reduce((sum, booking) => sum + Number(booking.price_at_booking), 0);
  const nextActionHref = getActionHref(profileReadiness);
  const remainingProfileActions = launchChecklist.filter((item) => !item.completed).length;

  const recentActivity = [
    ...requested.slice(0, 2).map((booking) => ({
      label: "Lesson request",
      title: `${booking.student_name || "A student"} requested ${booking.subject}`,
      meta: formatLessonDate(booking.requested_date),
      href: "/dashboard/tutor/schedule?tab=requests",
    })),
    ...upcoming.slice(0, 2).map((booking) => ({
      label: "Upcoming lesson",
      title: `${booking.subject} with ${booking.student_name || "student"}`,
      meta: formatLessonDate(booking.requested_date),
      href: "/dashboard/tutor/schedule?tab=sessions",
    })),
    ...(reviewVisibility.pending > 0
      ? [{
          label: "Reviews",
          title: `${reviewVisibility.pending} review${reviewVisibility.pending === 1 ? "" : "s"} pending admin approval`,
          meta: "ScienceDojo moderation",
          href: "/dashboard/tutor",
        }]
      : []),
    ...(slots.length > 0
      ? [{
          label: "Availability",
          title: "Your requestable lesson times are published",
          meta: `${slots.length} slot${slots.length === 1 ? "" : "s"} active`,
          href: "/dashboard/tutor/schedule?tab=availability",
        }]
      : []),
  ].slice(0, 4);

  const handleDismissWelcome = () => {
    startWelcomeDismiss(async () => {
      const result = await markTutorWelcomeSeen();
      if (!result?.error) {
        setIsWelcomeVisible(false);
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:p-6 md:space-y-6 md:p-8">
      {!tutorData?.is_verified && (
        <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4 shadow-sm shadow-amber-900/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700/60">Verification in progress</p>
              <h2 className="mt-1 text-lg font-black text-amber-950">Your tutor profile is under review.</h2>
              <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-amber-800/70">
                You can keep polishing your profile and availability while ScienceDojo reviews your application.
              </p>
            </div>
            <Link href="/support/tutors" className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-amber-800 shadow-sm">
              Review guide
            </Link>
          </div>
        </div>
      )}

      {announcements.length > 0 && <AnnouncementFeed announcements={announcements} />}

      {isWelcomeVisible && (
        <section className="rounded-[1.5rem] border border-primary/10 bg-[linear-gradient(135deg,#ffffff_0%,#f5fbff_58%,#ecfeff_100%)] p-4 shadow-sm shadow-primary/5 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Verified tutor network</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-secondary">Welcome to ScienceDojo</h2>
              <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-secondary/60">
                You're now part of our verified tutor network. Next goal: launch your tutor profile.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismissWelcome}
              disabled={isDismissingWelcome}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-secondary/10 bg-white px-5 text-xs font-black uppercase tracking-[0.12em] text-secondary/50 transition-all hover:border-primary/20 hover:text-primary disabled:opacity-50"
            >
              {isDismissingWelcome ? "Saving..." : "Got it"}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-[1.5rem] border border-secondary/5 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-accent/10 shadow-md sm:h-16 sm:w-16">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-accent">{userName.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Dashboard</p>
              <h1 className="mt-1 break-words text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                Hello, {getFirstName(userName)}
              </h1>
              <p className="mt-1 text-sm font-semibold leading-6 text-secondary/55">
                Your priorities, next action, and teaching activity for today.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[32rem]">
            {[
              ["Today", todayLessons.length],
              ["Upcoming", upcoming.length],
              ["Requests", requested.length],
              ["Profile tasks", profileReadiness.actionsRemaining],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-secondary/35">{label}</p>
                <p className="mt-1 text-xl font-black text-secondary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.5rem] border border-primary/10 bg-[linear-gradient(135deg,#06172f_0%,#0b4b93_58%,#0066ff_100%)] p-5 text-white shadow-xl shadow-primary/10 md:rounded-[2rem] md:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/70">Next best action</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">{profileReadiness.recommendedNextAction.title}</h2>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-white/70">
            {profileReadiness.recommendedNextAction.body}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={nextActionHref} className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-primary shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5">
              {profileReadiness.recommendedNextAction.cta.label}
            </Link>
            <Link href="/support/tutors" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-black text-white/80 transition-all hover:bg-white/10">
              Open Success Center
            </Link>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-secondary/5 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Tutor health</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-secondary">Ready for students</h2>
            </div>
            <div className="rounded-2xl bg-primary/5 px-4 py-3 text-center">
              <p className="text-2xl font-black text-primary">{profileReadiness.percent}%</p>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-secondary/35">ready</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-700"
              style={{ width: `${profileReadiness.percent}%` }}
            />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              ["Availability", profileReadiness.healthSummary.availabilityLabel],
              ["Payouts", profileReadiness.healthSummary.payoutsLabel],
              ["Reviews", profileReadiness.healthSummary.reviewsLabel],
              ["Status", profileReadiness.healthSummary.launchStatus],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-secondary/35">{label}</p>
                <p className="mt-1 text-sm font-black text-secondary">{value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[1.5rem] border border-primary/10 bg-[linear-gradient(135deg,#ffffff_0%,#f6fbff_100%)] p-5 shadow-sm md:rounded-[2rem] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Mentor reach</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-secondary">Is your sharing working?</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-secondary/55">
              Share your mentor profile to help parents discover you through ScienceDojo. These are profile-share signals from this month.
            </p>
          </div>
          <Link href="/dashboard/tutor/settings" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5">
            Open Share Tools
          </Link>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {[
            ["Profile visits", mentorReach.profileVisits],
            ["Learning checks", mentorReach.learningChecks],
            ["Trial lessons", mentorReach.trialLessons],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-secondary/5">
              <p className="text-2xl font-black text-secondary">{value}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-secondary/35">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.5rem] border border-secondary/5 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Teaching queue</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-secondary">Upcoming lessons</h2>
            </div>
            <Link href="/dashboard/tutor/schedule" className="text-[10px] font-black uppercase tracking-[0.12em] text-accent hover:text-accent-hover">
              Open schedule
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {upcoming.slice(0, 3).map((booking) => (
              <Link key={booking.id} href="/dashboard/tutor/schedule?tab=sessions" className="flex flex-col gap-2 rounded-2xl border border-secondary/5 bg-slate-50/70 p-4 transition-all hover:border-primary/20 hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-secondary">{booking.subject}</p>
                  <p className="mt-1 text-xs font-semibold text-secondary/50">
                    {booking.student_name || "Student"} · {formatLessonDate(booking.requested_date)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-primary shadow-sm">
                  {booking.status}
                </span>
              </Link>
            ))}
            {upcoming.length === 0 && (
              <div className="rounded-2xl border border-dashed border-secondary/10 bg-slate-50/70 p-5">
                <p className="text-sm font-black text-secondary/55">No upcoming lessons yet.</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-secondary/40">
                  Confirmed lessons will appear here once students book your available times.
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-secondary/5 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Earnings snapshot</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-secondary">£{totalEarnings.toFixed(2)}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-secondary/55">
            Based on {completed.length} completed lesson{completed.length === 1 ? "" : "s"} before platform fee calculations.
          </p>
          <Link href="/dashboard/tutor/earnings" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.12em] text-white transition-all hover:-translate-y-0.5">
            View earnings
          </Link>
          <div className="mt-5 border-t border-secondary/5 pt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Review visibility</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-lg font-black text-secondary">{reviewVisibility.approved}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-secondary/35">public</p>
              </div>
              <div className="rounded-2xl bg-primary/5 px-3 py-3">
                <p className="text-lg font-black text-primary">{reviewVisibility.pending}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-secondary/35">pending</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[1.5rem] border border-secondary/5 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Recent activity</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-secondary">What changed recently</h2>
          </div>
          <Link href="/dashboard/tutor/schedule?tab=requests" className="text-[10px] font-black uppercase tracking-[0.12em] text-accent hover:text-accent-hover">
            Review requests
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {recentActivity.map((activity) => (
            <Link key={`${activity.label}-${activity.title}`} href={activity.href} className="rounded-2xl border border-secondary/5 bg-slate-50/70 p-4 transition-all hover:border-primary/20 hover:bg-primary/5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/60">{activity.label}</p>
              <h3 className="mt-2 text-sm font-black text-secondary">{activity.title}</h3>
              <p className="mt-1 text-xs font-semibold text-secondary/42">{activity.meta}</p>
            </Link>
          ))}
          {recentActivity.length === 0 && (
            <div className="rounded-2xl border border-dashed border-secondary/10 bg-slate-50/70 p-5 md:col-span-2">
              <p className="text-sm font-black text-secondary/55">Activity will appear here as students request lessons and your profile changes.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
