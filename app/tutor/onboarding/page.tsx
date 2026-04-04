import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import OnboardingStepper from "./OnboardingStepper";
import AuthCard from "@/components/AuthCard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role;
  
  if (role !== "tutor") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "tutor") {
      redirect("/dashboard/parent");
    }
  }

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (application?.status === 'pending' || application?.status === 'approved') {
    redirect("/dashboard/tutor");
  }

  return (
    <AuthCard 
      title="Sensei Onboarding 🥋"
      subtitle="Complete your 6-stage calibration"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        <p className="text-center text-navy/60 font-bold max-w-2xl mx-auto leading-relaxed">
          For the safety and high quality of ScienceDojo, every expert is vetted. 
          Complete this process to join our elite network of tutors.
        </p>
        <OnboardingStepper initialData={application || {}} userId={user.id} />
      </div>
    </AuthCard>
  );
}
