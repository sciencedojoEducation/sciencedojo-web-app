import { ArrowRight, BookOpenCheck, CalendarDays, ChartNoAxesCombined, ChevronDown, ClipboardCheck, CreditCard, GraduationCap, MessageSquareText, UsersRound, Video } from "lucide-react";

type RoleKey = "student" | "tutor" | "parent";

const roles = {
  student: {
    label: "For students",
    icon: GraduationCap,
    title: "Everything needed to keep learning moving.",
    intro: "See your lessons, enter your class space and know what to practise next.",
    points: [
      { icon: Video, title: "Join your lesson", text: "Find upcoming bookings and launch the live video lesson from your classroom." },
      { icon: ClipboardCheck, title: "Practise with Missions", text: "Choose daily, weekly, monthly or exam-preparation Missions built from tutor-written lesson summaries. Your tutor can review your work and guide the next step." },
      { icon: MessageSquareText, title: "Stay connected", text: "Find assignments, tutor messages and focus timers in your workspace." },
    ],
    previewTitle: "Student learning home",
    previewNav: ["My Bookings", "My Classes", "Missions"],
    previewFocus: "Your class space",
    previewDetail: "Lesson link · class stream · assignments",
    previewCards: [
      { icon: CalendarDays, label: "Next lesson", detail: "View your upcoming booking" },
      { icon: ClipboardCheck, label: "Your Missions", detail: "Practise between lessons" },
    ],
  },
  tutor: {
    label: "For tutors",
    icon: UsersRound,
    title: "Plan, teach and follow up in one workspace.",
    intro: "Keep your schedule, teaching spaces and student practice in view.",
    points: [
      { icon: CalendarDays, title: "Manage your schedule", text: "See booking requests and upcoming lessons from your tutor dashboard." },
      { icon: BookOpenCheck, title: "Teach from a class space", text: "Use the class stream, assignments, sessions and live-lesson launch point." },
      { icon: ClipboardCheck, title: "Review the practice", text: "Review student Mission responses and approve progress updates." },
    ],
    previewTitle: "Tutor teaching home",
    previewNav: ["Schedule", "Students & Classes", "Mission Reviews"],
    previewFocus: "Your teaching queue",
    previewDetail: "Booking requests · upcoming lessons",
    previewCards: [
      { icon: BookOpenCheck, label: "Class spaces", detail: "Stream · assignments · sessions" },
      { icon: ClipboardCheck, label: "Mission reviews", detail: "See work and give feedback" },
    ],
  },
  parent: {
    label: "For parents",
    icon: ChartNoAxesCombined,
    title: "The practical details and progress, together.",
    intro: "Manage bookings and understand how your child is getting on.",
    points: [
      { icon: CreditCard, title: "Manage bookings and payment", text: "Track lesson requests and confirmed bookings, then pay accepted bookings by card." },
      { icon: ChartNoAxesCombined, title: "See the learning journey", text: "Follow lesson summaries, progress and the next steps shared by tutors." },
      { icon: MessageSquareText, title: "Stay informed", text: "See Mission activity and tutor feedback without chasing separate updates." },
    ],
    previewTitle: "Parent learning home",
    previewNav: ["Learning Home", "Bookings", "Progress"],
    previewFocus: "Your child’s learning journey",
    previewDetail: "Lessons · progress · next steps",
    previewCards: [
      { icon: CreditCard, label: "Bookings", detail: "Review and pay accepted lessons" },
      { icon: ChartNoAxesCombined, label: "Progress", detail: "Lesson notes · tutor feedback" },
    ],
  },
} as const;

export default function HowItWorksRoleExplorer() {
  return (
    <div className="space-y-4">
      {(Object.keys(roles) as RoleKey[]).map((key, index) => {
        const role = roles[key];
        const RoleIcon = role.icon;
        return <details key={key} open={index === 0} className="group overflow-hidden rounded-3xl border border-[#d6e5f4] bg-white shadow-sm open:shadow-[0_16px_50px_rgba(7,26,53,.08)]">
          <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4 font-extrabold text-[#17416b] marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary sm:px-7 [&::-webkit-details-marker]:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2f2ff] text-[#0753a2]"><RoleIcon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="flex-1">{role.label}</span>
            <span className="hidden text-xs font-semibold text-[#66819c] sm:inline">Explore workspace</span>
            <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="grid items-center gap-8 border-t border-[#e1ebf5] p-5 sm:p-7 lg:grid-cols-[.9fr_1.1fr] lg:gap-12">
        <div>
          <h3 className="mt-2 max-w-xl text-2xl font-black tracking-tight text-secondary sm:text-3xl">{role.title}</h3>
          <p className="mt-3 max-w-xl leading-7 text-secondary/70">{role.intro}</p>
          <ul className="mt-7 space-y-5">
            {role.points.map((point) => {
              const Icon = point.icon;
              return <li key={point.title} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e2f2ff] text-[#0753a2]"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><h4 className="font-extrabold text-secondary">{point.title}</h4><p className="mt-1 text-sm leading-6 text-secondary/70">{point.text}</p></div></li>;
            })}
          </ul>
        </div>

        <figure className="overflow-hidden rounded-[1.75rem] border border-[#d6e5f4] bg-white shadow-[0_20px_60px_rgba(7,26,53,.11)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#d6e5f4] bg-[#071a35] px-5 py-4 text-white sm:px-6">
            <span className="text-sm font-black">ScienceDojo</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{role.previewTitle}</span>
          </div>
          <div className="grid sm:grid-cols-[132px_1fr]">
            <div className="hidden border-r border-[#e1ebf5] bg-[#f5f9fe] p-4 sm:block" aria-hidden="true">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#66819c]">Workspace</span>
              <div className="mt-4 space-y-2">{role.previewNav.map((item, index) => <div key={item} className={`rounded-lg px-2 py-2 text-xs font-semibold ${index === 0 ? "bg-[#dceeff] text-[#0753a2]" : "text-[#58718a]"}`}>{item}</div>)}</div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#2871ad]">Overview</p>
              <h4 className="mt-2 text-xl font-black text-[#102e4e]">{role.previewFocus}</h4>
              <p className="mt-1 text-sm text-[#5c7188]">{role.previewDetail}</p>
              <div className="mt-5 rounded-2xl bg-[linear-gradient(120deg,#e8f6ff,#f4f8ff)] p-4">
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-[#17416b]">Your next step</span><ArrowRight className="h-4 w-4 text-[#0753a2]" aria-hidden="true" /></div>
                <div className="mt-3 h-2 max-w-[85%] rounded-full bg-[#a9d7f4]" /><div className="mt-2 h-2 max-w-[60%] rounded-full bg-[#d1e6f7]" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{role.previewCards.map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-2xl border border-[#dfebf5] p-4"><Icon className="h-5 w-5 text-[#0877bb]" aria-hidden="true" /><p className="mt-3 text-sm font-extrabold text-[#102e4e]">{card.label}</p><p className="mt-1 text-xs leading-5 text-[#5c7188]">{card.detail}</p></div>; })}</div>
            </div>
          </div>
          <figcaption className="border-t border-[#e1ebf5] px-5 py-3 text-xs text-[#5c7188] sm:px-6">Illustrative interface preview · actual dashboard varies by account</figcaption>
        </figure>
      </div>
        </details>;
      })}
    </div>
  );
}
