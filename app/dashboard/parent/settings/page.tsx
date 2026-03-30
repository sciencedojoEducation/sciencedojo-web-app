import { createClient } from "@/utils/supabase/server";
import { updateAccount, requestPasswordReset } from "@/app/login/actions";
import AvatarUploader from "@/components/AvatarUploader";

export default async function ParentSettings({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name || "";
  const userEmail = user?.email || "";
  const subRole = user?.user_metadata?.sub_role;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const studentName = user?.user_metadata?.student_name || "";

  const resolvedParams = await searchParams;
  const message = resolvedParams?.message as string | undefined;
  const error = resolvedParams?.error as string | undefined;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
         <h1 className="text-3xl font-bold text-secondary mb-2">Account Settings</h1>
         <p className="text-secondary/60">Update your profile, security, and payment methods.</p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      <div className="space-y-8">
         {/* Profile Information */}
         <div className="bg-white p-8 rounded-3xl border border-secondary/10 shadow-sm">
            <h2 className="text-xl font-bold text-secondary mb-6">Profile Information</h2>
            
            <AvatarUploader currentAvatarUrl={avatarUrl} />

            <form action={updateAccount} className="space-y-6 max-w-lg mt-6">
               <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-secondary mb-1">
                      {subRole === "parent" ? "Your Full Name" : "Full Name"}
                    </label>
                    <input 
                      name="name"
                      type="text" 
                      defaultValue={userName} 
                      className="w-full p-3 rounded-xl border border-secondary/20 bg-white focus:outline-none focus:border-primary" 
                      required
                    />
                 </div>
                 
                 {subRole === "parent" && (
                    <div>
                      <label className="block text-sm font-bold text-secondary mb-1">Student's Full Name</label>
                      <input 
                        name="student_name"
                        type="text" 
                        defaultValue={studentName} 
                        className="w-full p-3 rounded-xl border border-secondary/20 bg-white focus:outline-none focus:border-primary" 
                        required
                      />
                    </div>
                 )}

                 <div>
                    <label className="block text-sm font-bold text-secondary mb-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={userEmail} 
                      className="w-full p-3 rounded-xl border border-secondary/20 bg-white focus:outline-none focus:border-primary opacity-60 cursor-not-allowed" 
                      disabled 
                    />
                 </div>
               </div>

               <button 
                 type="submit"
                 className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
               >
                  Save Changes
               </button>
            </form>
         </div>

         {/* Payment Methods */}
         <div className="bg-white p-8 rounded-3xl border border-secondary/10 shadow-sm">
            <h2 className="text-xl font-bold text-secondary mb-6">Payment Methods</h2>
            <div className="border border-secondary/10 rounded-xl p-4 flex justify-between items-center mb-4 bg-white max-w-lg">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-blue-100 rounded flex items-center justify-center text-[10px] font-black text-blue-800">VISA</div>
                  <div>
                     <p className="font-bold text-secondary text-sm">Visa ending in 4242</p>
                     <p className="text-xs text-secondary/60">Expires 12/2028</p>
                  </div>
               </div>
               <button className="text-xs text-red-500 font-bold hover:underline">Remove</button>
            </div>
            <button className="text-primary font-bold text-sm hover:underline">+ Add new payment method via Stripe link</button>
         </div>

         {/* Password Reset */}
         <div className="bg-white p-8 rounded-3xl border border-red-500/10 shadow-sm">
            <h2 className="text-xl font-bold text-red-600 mb-2">Security</h2>
            <p className="text-sm text-secondary/60 mb-4">Request a password reset link to be sent to your email.</p>
            <button className="px-6 py-2 border border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">
               Reset Password
            </button>
         </div>
      </div>
    </div>
  );
}
