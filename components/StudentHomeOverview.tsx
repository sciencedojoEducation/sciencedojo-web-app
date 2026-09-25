import Link from "next/link";
import { ArrowRight, Atom, BookOpen, CheckCircle2, Clock3, Compass, FlaskConical, GraduationCap, Monitor, Pi, Timer } from "lucide-react";

export type StudentHomeAction = {
  sectionLabel?: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  label: string;
  detail?: string;
};

export type StudentPlanItem = {
  title: string;
  detail: string;
  href: string;
};

type StudentHomeOverviewProps = {
  action: StudentHomeAction;
  plan: StudentPlanItem[];
  completedLessons: number;
  learningHours: number;
  readyMissions: number;
  subjects: { name: string; lessons: number }[];
};

function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function getSubjectVisual(name: string) {
  const subject = name.toLowerCase();
  if (subject.includes("physics")) return { Icon: Atom, color: "bg-[#eaf1ff] text-[#285ad0]" };
  if (subject.includes("chemistry")) return { Icon: FlaskConical, color: "bg-[#fff0e8] text-[#e45c38]" };
  if (subject.includes("math")) return { Icon: Pi, color: "bg-[#e5f8ed] text-[#178448]" };
  if (subject.includes("computer") || subject.includes("program")) return { Icon: Monitor, color: "bg-[#eaf1ff] text-[#285ad0]" };
  return { Icon: BookOpen, color: "bg-[#f0edff] text-[#6654b8]" };
}

export default function StudentHomeOverview({
  action,
  plan,
  completedLessons,
  learningHours,
  readyMissions,
  subjects,
}: StudentHomeOverviewProps) {
  return (
    <div className="space-y-5 md:space-y-7">
      <section data-tour="student-progress" aria-label="Your learning at a glance" className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--student-line)] bg-[var(--student-surface)] px-3 py-4 sm:gap-4 sm:px-6 sm:py-5">
        {[
          { label: "Lessons completed", value: completedLessons, icon: GraduationCap, color: "bg-[#e5f8ed] text-[#178448]" },
          { label: "Learning hours", value: formatHours(learningHours), icon: Clock3, color: "bg-[#f0edff] text-[#5144c2]" },
          { label: "Missions ready", value: readyMissions, icon: Compass, color: "bg-[#fff3df] text-[#d68a13]" },
        ].map(({ label, value, icon: Icon, color }, index) => (
          <div key={label} className={`flex min-w-0 items-center gap-3 ${index > 0 ? "border-l border-[var(--student-line)] pl-3 sm:pl-5" : ""}`}>
            <span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-full sm:flex ${color}`}>
              <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-tight text-[var(--student-ink)] sm:text-2xl">{value}</p>
              <p className="text-xs leading-4 text-[var(--student-muted)] sm:text-sm">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <section aria-labelledby="student-continue-title" className="relative flex min-h-[17rem] flex-col overflow-hidden rounded-[1.4rem] border border-[var(--student-line)] bg-[var(--student-surface)] p-5 sm:p-7">
          <div className="student-home-glow pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight text-[var(--student-ink)]">{action.sectionLabel || "Continue learning"}</h2>
          <div className="relative mt-6 flex flex-1 flex-col justify-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--student-accent-soft)] text-[var(--student-accent)]">
              <BookOpen className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
            </span>
            <p className="text-xs font-medium text-[var(--student-muted)]">{action.eyebrow}</p>
            <h3 id="student-continue-title" className="mt-1 max-w-xl text-xl font-semibold tracking-tight text-[var(--student-ink)] sm:text-[1.45rem]">{action.title}</h3>
            <p className="mt-2 line-clamp-3 max-w-xl text-sm leading-6 text-[var(--student-muted)]">{action.description}</p>
          </div>
          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--student-muted-soft)]">{action.detail || "One step at a time"}</span>
            <Link href={action.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--student-accent)] px-5 text-sm font-semibold text-[var(--student-accent-contrast)] transition-colors hover:bg-[var(--student-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--student-accent)] focus-visible:ring-offset-2">
              {action.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="student-plan-title" className="flex flex-col rounded-[1.4rem] border border-[var(--student-line)] bg-[var(--student-surface)] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--student-accent)]">A simple path forward</p>
              <h2 id="student-plan-title" className="mt-1 text-xl font-semibold tracking-tight text-[var(--student-ink)]">Your plan</h2>
            </div>
            <CheckCircle2 className="h-5 w-5 text-[#16804d]" strokeWidth={1.7} aria-hidden="true" />
          </div>
          <ol className="mt-5 flex-1 divide-y divide-[var(--student-line)]">
            {plan.map((item, index) => (
              <li key={`${item.href}-${item.title}`}>
                <Link href={item.href} className="group flex min-h-[4.2rem] items-center gap-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--student-accent)]">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${["bg-[#eaf3ff] text-[#2867b7]", "bg-[#e8f8ee] text-[#16804d]", "bg-[#f0edff] text-[#6955ba]"][index % 3]}`}>{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--student-ink-soft)] group-hover:text-[var(--student-accent-hover)]">{item.title}</span>
                    <span className="block truncate text-xs text-[var(--student-muted-soft)]">{item.detail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[var(--student-muted-soft)] group-hover:text-[var(--student-accent-hover)]" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/dashboard/student/timers" className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--student-accent-soft)] px-4 text-sm font-medium text-[var(--student-accent)] transition-colors hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--student-accent)]">
            <Timer className="h-4 w-4" aria-hidden="true" /> Start a focus session
          </Link>
        </section>
      </div>

      {subjects.length > 0 && (
        <section aria-labelledby="student-subjects-title" className="rounded-[1.4rem] border border-[var(--student-line)] bg-[var(--student-surface)] p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--student-accent)]">From completed lessons</p>
              <h2 id="student-subjects-title" className="mt-1 text-xl font-semibold tracking-tight text-[var(--student-ink)]">Your subjects</h2>
            </div>
            <Link href="/dashboard/classes" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[var(--student-accent)] hover:text-[var(--student-accent-hover)]">Open classes <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const { Icon, color } = getSubjectVisual(subject.name);
              return (
                <div key={subject.name} className="flex items-center gap-3 rounded-xl bg-[var(--student-surface-soft)] px-3 py-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}><Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--student-ink-soft)]">{subject.name}</span>
                  <span className="shrink-0 text-xs text-[var(--student-muted)]">{subject.lessons} lesson{subject.lessons === 1 ? "" : "s"}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
