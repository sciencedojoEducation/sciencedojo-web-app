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
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:px-4 md:space-y-10 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex h-14 w-14 shrink-0 -rotate-3 items-center justify-center rounded-[1.25rem] border-2 border-indigo-100 bg-indigo-50 shadow-sm transition-transform hover:rotate-0 md:h-16 md:w-16 md:rounded-[1.5rem] md:shadow-lg">
            <span className="text-2xl text-indigo-500 md:text-3xl">🎓</span>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Learning spaces</p>
            <h1 className="mb-1 text-3xl font-black tracking-tight text-secondary md:text-4xl">
              My Classes
            </h1>
            <p className="flex items-center gap-2 text-sm font-bold text-secondary/60">
              <span className={`h-2 w-2 rounded-full ${isArchivedView ? 'bg-amber-400 font-black' : 'bg-green-500'}`}></span>
              {classes.length} {isArchivedView ? "archived" : "active"} class{classes.length === 1 ? "" : "es"}
            </p>
          </div>
        </div>

        {/* 💎 Tabbed Toggle UI */}
        <div className="flex w-fit items-center self-start rounded-2xl border border-secondary/5 bg-slate-200/50 p-1">
           <Link 
             href="/dashboard/classes"
             className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all md:px-6 ${!isArchivedView ? 'bg-white text-secondary shadow-md' : 'text-secondary/40 hover:text-secondary/60'}`}
           >
             Active
           </Link>
           <Link 
             href="/dashboard/classes?archived=true"
             className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all md:px-6 ${isArchivedView ? 'bg-white text-secondary shadow-md' : 'text-secondary/40 hover:text-secondary/60'}`}
           >
             Archived
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {classes.map(cls => (
          <ClassCard key={cls.id} classRoom={cls as any} currentUserId={user.id} currentUserRole={role} />
        ))}
        {classes.length === 0 && (
          <div className="col-span-full mt-2 rounded-[1.5rem] border border-dashed border-secondary/10 bg-white p-8 text-center md:mt-6 md:rounded-[2rem] md:border-2 md:p-16">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-3xl text-secondary opacity-20 md:h-16 md:w-16">
               {isArchivedView ? "📁" : "📚"}
            </div>
            <p className="font-bold text-secondary/40">
               {isArchivedView ? "No archived classes found." : "You don't have any classes yet."}
            </p>
            {!isArchivedView && (
               <>
                  {role === 'tutor' ? (
                  <p className="mt-2 text-xs font-black uppercase tracking-widest text-secondary/30">Classes are auto-created when bookings are confirmed.</p>
                  ) : (
                  <Link href="/dashboard/student/tutors" className="mt-4 inline-block rounded-xl bg-primary px-6 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-primary-hover">
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
