import { createClient } from "@/utils/supabase/server";
import { getTutorById } from "@/lib/supabase-queries";
import TutorSettingsForm from "./TutorSettingsForm";
import MentorSharePanel from "@/components/MentorSharePanel";
import { redirect } from "next/navigation";

export default async function TutorSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const tutor = await getTutorById(user.id);

  if (!tutor) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-secondary mb-4">Tutor Profile Not Found</h1>
        <p className="text-secondary/60">It looks like your tutor profile hasn't been set up yet. Please contact support if you believe this is an error.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
         <h1 className="text-3xl font-bold text-secondary mb-2">Profile Settings</h1>
         <p className="text-secondary/60">Manage your public directory listing, rate, and bio.</p>
      </div>

      <div className="space-y-8">
        <MentorSharePanel tutor={tutor} />
        <TutorSettingsForm tutor={tutor} initialAvailability={tutor.is_available_now} />
      </div>
    </div>
  );
}
