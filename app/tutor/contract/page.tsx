import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CodeOfConduct from "./CodeOfConduct";

export default async function ContractPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load existing draft application
  const { data: application } = await supabase
    .from("applications")
    .select("status")
    .eq("user_id", user.id)
    .single();

  // Load existing tutor data
  const { data: tutor } = await supabase
    .from("tutors")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  // If already verified, go to dashboard
  if (tutor?.is_verified) {
    redirect("/dashboard/tutor");
  }

  // If application is not approved yet by admin, they can't sign contract!
  if (application?.status !== 'approved') {
    redirect("/dashboard/tutor"); // or to a waiting page
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background min-h-[calc(100vh-80px)] py-12 px-4 relative overflow-hidden">
      {/* Abstract Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="z-10 w-full max-w-4xl text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Final Step: Code of Conduct 🥋</h1>
        <p className="text-slate-500 mt-2 font-medium max-w-xl mx-auto">
          Your application has been approved by the administrators! You are one click away from joining the live ScienceDojo expert marketplace.
        </p>
      </div>

      <div className="z-10 w-full">
         <CodeOfConduct />
      </div>
    </div>
  );
}
