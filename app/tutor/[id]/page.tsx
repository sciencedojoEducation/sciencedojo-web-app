import { getTutorById } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import YouTubeLite from "@/components/YouTubeLite";
import MessageTutorButton from "@/components/MessageTutorButton";

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TutorProfileServer id={id} />;
}

async function TutorProfileServer({ id }: { id: string }) {
  const tutor = await getTutorById(id);

  if (!tutor) {
    notFound();
  }

  if (!tutor) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch verified reviews for this tutor
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, profiles(full_name, avatar_url)")
    .eq("tutor_id", id)
    .order("created_at", { ascending: false });

  // Check if current viewer is a tutor — they cannot book sessions
  const { data: { user } } = await supabase.auth.getUser();
  let viewerRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    viewerRole = profile?.role ?? null;
  }
  const isTutor = viewerRole === "tutor";

  return (
    <div className="bg-slate-50/50">
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-secondary/60 hover:text-primary transition-colors mb-8 font-medium group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tutors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Left Column: Profile Bio & Details */}
          <div className="lg:col-span-2 space-y-12">
            
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="relative h-32 w-32 md:h-48 md:w-48 shrink-0">
                <div className="relative h-full w-full overflow-hidden rounded-3xl border-8 border-white shadow-2xl z-0">
                  <Image 
                    src={tutor.avatar_url || "/tutor_placeholder.webp"} 
                    alt={tutor.full_name} 
                    fill 
                    className="object-cover" 
                    priority
                  />
                </div>
                {tutor.is_available_now && (
                  <span className="absolute bottom-2 right-2 z-10 h-6 w-6 rounded-full border-4 border-white bg-green-500 shadow-lg animate-pulse"></span>
                )}
              </div>

              <div className="flex-1 pt-4">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-4">
                  <h1 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">
                    {tutor.full_name}
                  </h1>
                  {tutor.is_verified && (
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mt-1">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Expert
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`h-5 w-5 ${i < Math.floor(tutor.rating) ? 'fill-current' : 'text-slate-300'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-bold text-secondary">
                      {tutor.review_count > 0 ? Number(tutor.rating).toFixed(1) : "New"}
                    </span>
                    <span className="text-secondary/40 font-medium">
                      ({tutor.review_count || 0} review{tutor.review_count !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex items-center gap-2 text-secondary/60">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">150+ Hours Taught</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Introduction Video */}
              {tutor.youtube_intro_url && (
                <section>
                  <YouTubeLite url={tutor.youtube_intro_url} />
                  <div className="mt-4 flex flex-col items-center">
                    <MessageTutorButton 
                      tutorId={tutor.id} 
                      tutorName={tutor.full_name}
                      viewerRole={viewerRole}
                      isAuthenticated={!!user}
                    />
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-2xl font-black text-secondary mb-4 flex items-center gap-3">
                  <span className="h-8 w-1 bg-primary rounded-full"></span>
                  About Me
                </h2>
                <p className="text-lg text-secondary/70 leading-relaxed font-medium">
                  {tutor.bio}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-secondary mb-4 flex items-center gap-3">
                  <span className="h-8 w-1 bg-accent rounded-full"></span>
                  Subjects & Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((subject) => (
                    <span key={subject} className="px-4 py-2 bg-white border border-secondary/10 text-secondary font-bold rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-default">
                      {subject}
                    </span>
                  ))}
                  <span className="px-4 py-2 bg-white border border-secondary/10 text-secondary font-bold rounded-xl shadow-sm opacity-50">Exam Prep</span>
                  <span className="px-4 py-2 bg-white border border-secondary/10 text-secondary font-bold rounded-xl shadow-sm opacity-50">Curriculum Design</span>
                </div>
              </section>

              <section className="bg-white rounded-3xl p-8 border border-secondary/5 shadow-sm">
                <h2 className="text-2xl font-black text-secondary mb-6">Learning Philosophy</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-secondary">Student-Centered Growth</h4>
                      <p className="text-sm text-secondary/60">Tailoring every session to the child's unique pace and existing knowledge base.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-secondary">Concept Visualization</h4>
                      <p className="text-sm text-secondary/60">Using state-of-the-art interactive tools to make abstract concepts visible and tangible.</p>
                    </div>
                  </div>
                </div>
              </section>

              {reviewsData && reviewsData.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-2xl font-black text-secondary mb-8 flex items-center gap-3">
                    <span className="h-8 w-1 bg-yellow-400 rounded-full"></span>
                    Student Reviews
                  </h2>
                  <div className="space-y-6">
                    {reviewsData.map((review: any) => (
                      <div key={review.id} className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/10 border-2 border-slate-50 relative">
                              {review.profiles?.avatar_url ? (
                                <Image src={review.profiles.avatar_url} alt="" fill className="object-cover" />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center font-bold text-secondary">{review.profiles?.full_name?.charAt(0) || 'S'}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-secondary text-sm">{review.profiles?.full_name || 'ScienceDojo Student'}</p>
                              <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest">
                                {new Date(review.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm font-medium text-secondary/70 italic border-l-2 border-secondary/10 pl-4 py-1">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Right Column: Booking Sidebar */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-secondary text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
               {/* Accent glow in sidebar */}
              <div className="absolute -top-12 -right-12 h-24 w-24 bg-primary/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black">£{tutor.hourly_rate}</span>
                  <span className="text-lg text-white/50 font-medium tracking-widest uppercase">/hr</span>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-white/80">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold">Available this week</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7l2 2h4a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                    </svg>
                    <span className="text-sm font-semibold">Lesson notes after every class</span>
                  </div>
                </div>

                {isTutor ? (
                  <div className="text-center py-4">
                    <p className="text-white/60 text-sm font-medium mb-2">You are viewing a fellow tutor's profile.</p>
                    <p className="text-white/40 text-xs">Tutors cannot book sessions on ScienceDojo.</p>
                  </div>
                ) : (
                  <>
                    <Link
                      href={`/tutor/${tutor.id}/book`}
                      className="block w-full text-center bg-primary text-white font-black py-5 rounded-2xl shadow-xl hover:bg-primary-hover transition-all hover:scale-[1.02] active:scale-95 text-lg"
                    >
                      Send Booking Request
                    </Link>
                    <p className="text-center text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mt-4">
                      No payment required yet
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-secondary/10 flex flex-col items-center">
              <h4 className="text-secondary/60 text-xs font-black uppercase tracking-widest mb-4">Share this Profile</h4>
              <div className="flex gap-4">
                 <button className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-secondary hover:bg-secondary hover:text-white transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></button>
                 <button className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-secondary hover:bg-secondary hover:text-white transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3.06 13h17.88l-5.94 5.94 1.41 1.41L24 12l-7.59-7.59-1.41 1.41L20.94 11H3.06l5.94-5.94-1.41-1.41L0 12l7.59 7.59 1.41-1.41L3.06 13z"/></svg></button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Floating CTA for Mobile/Desktop */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 lg:hidden">
         <Link
            href={`/tutor/${tutor.id}/book`}
            className="flex items-center justify-between w-full h-16 px-8 bg-primary text-white font-black rounded-2xl shadow-[0_20px_50px_rgba(255,107,107,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs"
         >
            <span>Book Expert Session</span>
            <span className="bg-white/20 px-3 py-1 rounded-lg">£{tutor.hourly_rate}</span>
         </Link>
      </div>
    </div>
  );
}

