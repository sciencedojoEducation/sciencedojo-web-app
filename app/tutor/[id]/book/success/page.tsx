import { getTutorById } from "@/lib/supabase-queries";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import BookingCreatedTracker from "@/components/analytics/BookingCreatedTracker";

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subject?: string; date?: string }>;
}) {
  const { id } = await params;
  const { subject, date } = await searchParams;
  const tutor = await getTutorById(id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const subRole = user?.user_metadata?.sub_role;
  const role = user?.user_metadata?.role;
  
  const dashboardLabel = subRole === "student" ? "Student Dashboard" : "Parent Dashboard";

  if (!tutor) {
    notFound();
  }

  const formattedDate = date 
    ? new Date(date).toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    : "Your requested time";

  return (
    <div className="bg-slate-50/50 min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <BookingCreatedTracker tutorId={tutor.id} subject={subject} />
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-secondary/5 overflow-hidden text-center">
          {/* Success Header */}
          <div className="bg-secondary p-12 text-white relative overflow-hidden">
             {/* Dynamic glow */}
             <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
             
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl mb-6 transform scale-110">
                   <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                   </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Request Sent!</h1>
                <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Handshake Initiated</p>
             </div>
          </div>

          {/* Session Summary Card */}
          <div className="p-8 md:p-12 space-y-8">
            <div className="bg-slate-50 border border-secondary/5 rounded-[2rem] p-6 flex items-center gap-6 text-left">
               <div className="w-16 h-16 relative rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                  <Image src={tutor.avatar_url || "/tutor_placeholder.webp"} alt={tutor.full_name} fill className="object-cover" />
               </div>
               <div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{subject || "General Session"}</div>
                  <h3 className="font-black text-secondary text-lg">Session with {tutor.full_name.split(' ')[0]}</h3>
                  <div className="flex items-center gap-1.5 text-secondary/40 text-xs font-bold mt-1">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     {formattedDate}
                  </div>
               </div>
            </div>

            {/* Handshake Roadmap */}
            <div className="space-y-6">
               <h4 className="text-xs font-black text-secondary/40 uppercase tracking-[0.3em]">The Trusted Handshake</h4>
               <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4 text-left">
                     <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-xs border border-primary/20">1</div>
                     <div>
                        <p className="text-sm font-black text-secondary">{tutor.full_name.split(' ')[0]} reviews your request</p>
                        <p className="text-xs text-secondary/40 font-medium">Experts typically respond within 2-4 hours.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4 text-left">
                     <div className="w-8 h-8 rounded-full bg-slate-100 text-secondary/30 flex items-center justify-center shrink-0 font-black text-xs">2</div>
                     <div>
                        <p className="text-sm font-black text-secondary/40">Secure Payment & Confirm</p>
                        <p className="text-xs text-secondary/20 font-medium">Once accepted, you'll receive an alert to finalize payment.</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-secondary/5 flex flex-col gap-3">
               <Link 
                  href="/dashboard/parent"
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:bg-primary-hover transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
               >
                  Go to {dashboardLabel}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
               </Link>
               <Link 
                  href="/#directory"
                  className="w-full py-4 bg-transparent text-secondary/60 font-bold rounded-2xl hover:text-secondary transition-colors"
               >
                  Browse more Experts
               </Link>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-secondary/40 text-xs font-bold leading-relaxed px-6">
           Ensuring safe, high-quality learning through our <span className="text-primary font-black uppercase tracking-widest text-[10px]">sciencedojo</span> vetted handshake policy.
        </p>
      </div>
    </div>
  );
}
