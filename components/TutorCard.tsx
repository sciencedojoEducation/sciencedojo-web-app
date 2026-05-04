import { TutorProfile } from "@/lib/supabase-queries";
import UserAvatar from "./UserAvatar";
import Link from "next/link";

interface TutorCardProps {
  tutor: TutorProfile;
  currentUserRole?: string | null;
}

export default function TutorCard({ tutor, currentUserRole }: TutorCardProps) {
  const isTutor = currentUserRole === "tutor";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm border border-secondary/10 transition-all hover:shadow-xl hover:border-primary/30">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-surface shadow-md z-0">
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
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl text-secondary group-hover:text-primary transition-colors">
                  {tutor.full_name}
                </h3>
                {tutor.is_verified && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary" title="Verified Expert">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {tutor.subjects.slice(0, 2).map((subject) => (
                  <span key={subject} className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary/80">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-secondary/70 text-sm line-clamp-2 md:line-clamp-3 mb-6 flex-1 leading-relaxed">
          {tutor.bio}
        </p>

        <div className="flex items-center justify-between border-t border-secondary/5 pt-4 mt-auto">
          <div>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-black text-secondary">{tutor.rating}</span>
              <span className="text-sm text-secondary/40 font-medium">({tutor.review_count} reviews)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-primary">£{tutor.hourly_rate}</span>
            <span className="text-xs text-secondary/40 font-bold ml-1 uppercase tracking-widest">/hr</span>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full opacity-0 bg-white/95 backdrop-blur-md border-t border-secondary/10 transition-all group-hover:translate-y-0 group-hover:opacity-100 flex gap-2">
         <Link href={`/tutor/${tutor.id}`} className="flex-1 inline-flex justify-center items-center rounded-xl bg-secondary/5 px-4 py-2.5 text-sm font-bold text-secondary hover:bg-secondary/10 transition-colors">
            View Profile
         </Link>
          {isTutor ? (
            <span className="flex-1 inline-flex justify-center items-center rounded-xl bg-secondary/5 px-4 py-2.5 text-sm font-bold text-secondary/40 cursor-not-allowed select-none">
              Tutor Profile
            </span>
          ) : (
            <Link href={`/tutor/${tutor.id}/book`} className="flex-1 inline-flex justify-center items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-white hover:bg-primary-hover transition-all shadow-lg active:scale-95">
              Connect
            </Link>
          )}
       </div>
    </div>
  );
}
