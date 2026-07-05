import { TutorProfile } from "@/lib/supabase-queries";
import UserAvatar from "./UserAvatar";
import Link from "next/link";
import TutorConnectLink from "./analytics/TutorConnectLink";

interface TutorCardProps {
  tutor: TutorProfile;
  currentUserRole?: string | null;
  variant?: "default" | "dashboard";
}

function buildTutorTags(tutor: TutorProfile) {
  const tags = new Set<string>();
  const subjectText = tutor.subjects.join(" ").toLowerCase();
  const educationText = tutor.education_level?.toLowerCase() || "";
  const combinedText = `${subjectText} ${educationText}`;

  if (combinedText.includes("gcse") && combinedText.includes("math")) tags.add("GCSE Maths");
  else if (combinedText.includes("gcse")) tags.add("GCSE");
  if (combinedText.includes("ib") && combinedText.includes("physics")) tags.add("IB Physics");
  else if (combinedText.includes("ib")) tags.add("IB");
  if (combinedText.includes("a-level") || combinedText.includes("a level")) tags.add("A-Level");
  if (combinedText.includes("cambridge")) tags.add("Cambridge");
  if (combinedText.includes("ks2") || combinedText.includes("primary")) tags.add("Primary Learning");
  if (combinedText.includes("computer")) tags.add("Computer Science");
  if (combinedText.includes("physics")) tags.add("Physics");
  if (combinedText.includes("chemistry")) tags.add("Chemistry");
  if (combinedText.includes("math")) tags.add("Maths");
  if (tutor.has_teaching_license) tags.add("Teaching license");

  return Array.from(tags).slice(0, 3);
}

function getTutorMatchInsight(tutor: TutorProfile) {
  const combinedText = `${tutor.subjects.join(" ")} ${tutor.education_level || ""}`.toLowerCase();

  if (combinedText.includes("ib") && combinedText.includes("physics")) {
    return {
      title: "IB Physics structure",
      body: "Useful when concepts make sense in class but exam application feels inconsistent.",
    };
  }

  if (combinedText.includes("gcse") && combinedText.includes("math")) {
    return {
      title: "GCSE confidence support",
      body: "Helpful for rebuilding fluency, routine, and confidence before assessments.",
    };
  }

  if (combinedText.includes("ks2") && combinedText.includes("math")) {
    return {
      title: "Foundation building",
      body: "Patient guidance for younger learners who need steadier maths foundations.",
    };
  }

  if ((combinedText.includes("a-level") || combinedText.includes("a level")) && combinedText.includes("chemistry")) {
    return {
      title: "A-Level topic clarity",
      body: "Focused support for difficult chemistry ideas and structured exam preparation.",
    };
  }

  if (combinedText.includes("computer")) {
    return {
      title: "Computing guidance",
      body: "Clear support for programming thinking, debugging, and technical confidence.",
    };
  }

  return {
    title: "Structured mentor support",
    body: "Guided online tutoring adapted to the learner’s subject needs and confidence level.",
  };
}

export default function TutorCard({ tutor, currentUserRole, variant = "default" }: TutorCardProps) {
  const isTutor = currentUserRole === "tutor";
  const isDashboard = variant === "dashboard";
  const connectHref = currentUserRole
    ? `/tutor/${tutor.id}/book`
    : `/signup?next=${encodeURIComponent(`/tutor/${tutor.id}/book`)}`;
  const tutorTags = buildTutorTags(tutor);
  const matchInsight = getTutorMatchInsight(tutor);
  const hasReviews = tutor.review_count > 0;
  const publicTutorLabel = tutor.is_featured
    ? "Featured Tutor"
    : tutor.verified_at !== null
      ? "Verified Tutor"
      : "ScienceDojo Tutor";
  const trustSignals = [
    publicTutorLabel,
    tutor.has_teaching_license ? "Teaching license" : null,
    hasReviews ? `${tutor.average_rating?.toFixed(1)} verified reviews` : "No verified reviews yet",
  ].filter(Boolean);

  return (
    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-secondary/[0.07] bg-white shadow-[0_12px_40px_rgba(0,26,68,0.045)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_22px_64px_rgba(0,102,255,0.09)] md:rounded-[2.25rem]">
      <div className={`flex min-w-0 flex-1 flex-col ${isDashboard ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}>
        <div className={isDashboard ? "mb-5" : "mb-7"}>
          <div className={isDashboard ? "flex min-w-0 items-start gap-4" : "flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center"}>
            <div className={`relative shrink-0 ${isDashboard ? "h-20 w-20 sm:h-24 sm:w-24" : "h-32 w-32 sm:h-36 sm:w-36"}`}>
              <div className={`relative z-0 h-full w-full overflow-hidden border-4 border-surface shadow-xl shadow-secondary/10 ${isDashboard ? "rounded-[1.5rem]" : "rounded-[2rem]"}`}>
                <UserAvatar 
                  src={tutor.avatar_url} 
                  alt={tutor.full_name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              {tutor.is_available_now && (
                <span className="absolute bottom-1 right-1 z-10 h-5 w-5 rounded-full border-4 border-white bg-green-500 shadow-sm ring-2 ring-white/50 animate-pulse"></span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-2">
                <h3
                  title={tutor.full_name}
                  className={`min-w-0 break-words font-black leading-[1.08] text-secondary transition-colors group-hover:text-primary ${isDashboard ? "line-clamp-2 text-xl md:text-[1.35rem]" : "text-2xl md:text-[1.7rem]"}`}
                >
                  {tutor.full_name}
                </h3>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" title={publicTutorLabel}>
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 md:mt-4">
                {tutor.subjects.slice(0, 2).map((subject) => (
                  <span key={subject} className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary/65">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className={`mb-4 min-w-0 text-sm text-secondary/58 ${isDashboard ? "line-clamp-2 leading-6" : "line-clamp-2 leading-7"}`}>
          {tutor.bio}
        </p>

        <div className={`mb-4 rounded-2xl border border-primary/10 bg-primary/5 ${isDashboard ? "p-3.5" : "p-4"} md:mb-5`}>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/55">Recommended support fit</p>
          <h4 className="mt-1 text-sm font-black text-secondary">{matchInsight.title}</h4>
          <p className="mt-1 text-sm font-medium leading-6 text-secondary/62">{matchInsight.body}</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[...trustSignals, ...tutorTags.slice(0, Math.max(0, 3 - trustSignals.length))].slice(0, 3).map((signal) => (
            <span key={signal} className="rounded-full border border-secondary/10 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-secondary/55">
              {signal}
            </span>
          ))}
        </div>

        <div className="mt-auto flex min-w-0 items-center justify-between gap-3 border-t border-secondary/5 pt-4">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.10em] text-secondary/35">Session</p>
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-xl font-black text-secondary md:text-2xl">£{tutor.hourly_rate}</span>
              <span className="text-xs text-secondary/40 font-bold ml-1 uppercase tracking-widest">/hr</span>
            </div>
          </div>
          <div className="min-w-0 text-right">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.10em] text-secondary/35">Next step</p>
            <p className="text-sm font-black text-primary">Meet first</p>
          </div>
        </div>
      </div>
      
      <div className={`flex flex-col gap-2 bg-white/95 backdrop-blur-md border-t border-secondary/10 transition-all ${isDashboard ? "p-4" : "p-4 md:absolute md:inset-x-0 md:bottom-0 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100"}`}>
        {isTutor ? (
          <span className="w-full inline-flex justify-center items-center rounded-xl bg-secondary/5 px-4 py-3 text-sm font-bold text-secondary/40 cursor-not-allowed select-none">
            Tutor Profile
          </span>
        ) : (
          <TutorConnectLink
            href={connectHref}
            isGuest={!currentUserRole}
            subjects={tutor.subjects}
            className="w-full inline-flex justify-center items-center rounded-xl bg-primary px-4 py-3 text-sm font-black text-white hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Meet this tutor
          </TutorConnectLink>
        )}
        <Link
          href={`/tutor/${tutor.id}`}
          className="w-full inline-flex justify-center items-center rounded-xl border border-secondary/10 px-4 py-2 text-xs font-bold text-secondary/60 hover:border-secondary/20 hover:text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          View profile
        </Link>
      </div>
    </div>
  );
}
