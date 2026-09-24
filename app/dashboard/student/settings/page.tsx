import { createClient } from "@/utils/supabase/server";
import { updateAccount } from "@/app/login/actions";
import AvatarUploader from "@/components/AvatarUploader";
import Link from "next/link";

export default async function StudentSettings({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name || "";
  const userEmail = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const resolvedParams = await searchParams;
  const message = resolvedParams?.message as string | undefined;
  const error = resolvedParams?.error as string | undefined;

  return (
    <div data-role="student" className="dashboard-home mx-auto max-w-4xl space-y-5 px-4 py-6 md:p-8">
      <div>
         <p className="dashboard-kicker">Your account</p>
         <h1 className="dashboard-title mt-1 text-2xl md:text-3xl">Settings</h1>
         <p className="dashboard-subtitle mt-2 text-sm">Keep your profile accurate and your account secure.</p>
      </div>

      {message && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-5">
         {/* Profile Information */}
         <section className="dashboard-panel p-5 md:p-7">
            <h2 className="dashboard-title mb-5 text-xl">Profile information</h2>
            
            <AvatarUploader currentAvatarUrl={avatarUrl} />

            <form action={updateAccount} className="space-y-6 max-w-lg mt-6">
               <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label htmlFor="student-name" className="mb-1 block text-sm font-semibold text-secondary">Your full name</label>
                    <input 
                      id="student-name"
                      name="name"
                      type="text" 
                      defaultValue={userName} 
                      className="min-h-11 w-full rounded-xl border border-secondary/20 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      required
                    />
                 </div>
                 
                 <div>
                    <label htmlFor="student-email" className="mb-1 block text-sm font-semibold text-secondary">Email address</label>
                    <input 
                      id="student-email"
                      type="email" 
                      defaultValue={userEmail} 
                      className="min-h-11 w-full cursor-not-allowed rounded-xl border border-secondary/20 bg-slate-100 p-3 text-secondary/70"
                      disabled 
                    />
                 </div>
               </div>

               <button 
                 type="submit"
                 className="min-h-11 rounded-xl bg-secondary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
               >
                  Save Changes
               </button>
            </form>
         </section>

         {/* Security */}
         <section className="dashboard-panel p-5 md:p-7">
            <h2 className="dashboard-title mb-2 text-xl">Security</h2>
            <p className="dashboard-subtitle mb-4 text-sm">Need a new password? We’ll send a secure reset link to your email.</p>
            <Link href="/forgot-password" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-secondary transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
               Reset password
            </Link>
         </section>
      </div>
    </div>
  );
}
