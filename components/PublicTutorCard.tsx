import Link from "next/link";
import { ArrowRight, BadgeCheck, GraduationCap, Star } from "lucide-react";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import TutorConnectLink from "@/components/analytics/TutorConnectLink";
import UserAvatar from "@/components/UserAvatar";
import type { TutorProfile } from "@/lib/supabase-queries";

export default function PublicTutorCard({ tutor, profilesEnabled, bookingEnabled, assessmentEnabled, reviewsEnabled }: {
  tutor: TutorProfile;
  profilesEnabled: boolean;
  bookingEnabled: boolean;
  assessmentEnabled: boolean;
  reviewsEnabled: boolean;
}) {
  const subjects = tutor.subjects || [];
  const profileHref = `/tutor/${tutor.id}`;
  const bookingHref = `/signup?next=${encodeURIComponent(`${profileHref}/book`)}`;

  return (
    <article className="flex min-w-0 flex-col rounded-[1.75rem] border border-[#dce8f2] bg-white p-5 shadow-[0_12px_36px_rgba(18,59,95,.06)] transition hover:border-primary/25 hover:shadow-[0_20px_48px_rgba(18,59,95,.1)] sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#eaf4ff] sm:h-24 sm:w-24">
          <UserAvatar src={tutor.avatar_url} alt={tutor.full_name} fill sizes="(max-width: 640px) 80px, 96px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-xl font-black leading-tight tracking-tight text-secondary sm:text-2xl">{tutor.full_name}</h3>
          {tutor.is_verified && <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verified tutor</p>}
          {reviewsEnabled && tutor.review_count > 0 && tutor.average_rating !== null && <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary/65"><Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" /> {tutor.average_rating.toFixed(1)} from {tutor.review_count} {tutor.review_count === 1 ? "review" : "reviews"}</p>}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Subjects taught">
        {subjects.slice(0, 4).map((subject) => <span key={subject} className="rounded-full bg-[#eaf4ff] px-3 py-1.5 text-xs font-bold text-primary">{subject}</span>)}
        {subjects.length > 4 && <span className="rounded-full bg-[#f0f5f9] px-3 py-1.5 text-xs font-semibold text-secondary/60">+{subjects.length - 4} more</span>}
      </div>

      {tutor.bio && <p className="mt-4 line-clamp-3 text-sm leading-6 text-secondary/70">{tutor.bio}</p>}
      {(tutor.education_level || tutor.has_teaching_license) && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-secondary/60">
        {tutor.education_level && <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{tutor.education_level}</span>}
        {tutor.has_teaching_license && <span>Teaching license</span>}
      </div>}

      <div className="mt-auto flex flex-col gap-3 border-t border-[#e8eef3] pt-5 sm:flex-row sm:items-center sm:justify-between">
        {profilesEnabled ? (
          <Link href={profileHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            View tutor profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : assessmentEnabled ? (
          <BookAssessmentLink source="find_tutors_card" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Request a free assessment <ArrowRight className="h-4 w-4" aria-hidden="true" /></BookAssessmentLink>
        ) : (
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Contact ScienceDojo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        )}
        {profilesEnabled && bookingEnabled && <TutorConnectLink href={bookingHref} isGuest subjects={subjects} className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Request a lesson <ArrowRight className="h-4 w-4" aria-hidden="true" /></TutorConnectLink>}
      </div>
    </article>
  );
}
