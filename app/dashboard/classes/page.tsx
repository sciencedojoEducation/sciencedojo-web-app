import { createClient } from "@/utils/supabase/server";
import { getClassesForUser } from "@/lib/class-queries";
import ClassCard from "@/components/ClassCard";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const { archived } = await searchParams;
  const isArchivedView = archived === "true";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "student";
  const classes = await getClassesForUser(user.id, isArchivedView);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center transform -rotate-3 transition-transform hover:rotate-0 shadow-lg">
            <span className="text-3xl text-indigo-500">🎓</span>
          </div>
          <div>
            <h1 className="text-4xl font-black mb-1 text-secondary tracking-tight">
              My Classes
            </h1>
            <p className="text-secondary/60 text-sm font-bold flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isArchivedView ? 'bg-amber-400 font-black' : 'bg-green-500'}`}></span>
              {classes.length} {isArchivedView ? "archived" : "active"} class{classes.length === 1 ? "" : "es"}
            </p>
          </div>
        </div>

        {/* 💎 Tabbed Toggle UI */}
        <div className="flex items-center bg-slate-200/50 p-1 rounded-2xl border border-secondary/5 self-start">
           <Link 
             href="/dashboard/classes"
             className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isArchivedView ? 'bg-white text-secondary shadow-md' : 'text-secondary/40 hover:text-secondary/60'}`}
           >
             Active
           </Link>
           <Link 
             href="/dashboard/classes?archived=true"
             className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isArchivedView ? 'bg-white text-secondary shadow-md' : 'text-secondary/40 hover:text-secondary/60'}`}
           >
             Archived
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.map(cls => (
          <ClassCard key={cls.id} classRoom={cls as any} currentUserId={user.id} currentUserRole={role} />
        ))}
        {classes.length === 0 && (
          <div className="col-span-full p-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-secondary/10 mt-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl opacity-20 text-secondary mx-auto mb-4">
               {isArchivedView ? "📁" : "📚"}
            </div>
            <p className="text-secondary/40 font-bold">
               {isArchivedView ? "No archived classes found." : "You don't have any classes yet."}
            </p>
            {!isArchivedView && (
               <>
                  {role === 'tutor' ? (
                  <p className="text-xs text-secondary/30 uppercase tracking-widest font-black mt-2">Classes are auto-created when bookings are confirmed.</p>
                  ) : (
                  <Link href="/dashboard/student/tutors" className="mt-4 px-6 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all shadow-md inline-block">
                     Find a Tutor
                  </Link>
                  )}
               </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
