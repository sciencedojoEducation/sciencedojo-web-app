import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import OnboardingStepper from "./OnboardingStepper";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "tutor") {
    redirect("/dashboard/parent");
  }

  // Load existing draft application
  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // If already completed and pending review, maybe redirect to a "waiting" screen or dashboard with a banner
  if (application?.status === 'pending' || application?.status === 'approved') {
    redirect("/dashboard/tutor");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-secondary/10">
        <div className="p-8 md:p-12 bg-gradient-to-r from-secondary to-secondary/90 text-white">
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Sensei Onboarding 🥋
          </h1>
          <p className="font-medium text-white/70">
            For the safety and high quality of ScienceDojo, every expert is vetted. Complete this 3-stage process to go live.
          </p>
        </div>
        <div className="p-8 md:p-12">
           <OnboardingStepper initialData={application || {}} userId={user.id} />
        </div>
      </div>
    </div>
  );
}
