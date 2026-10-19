"use server";
import { redirect } from "next/navigation";
import { campusSession } from "@/lib/campus/server";
import { CAMPUS_NOTICE } from "@/lib/campus/protocol";
export async function acceptCampusNotice(form: FormData) {
  if (form.get("accepted") !== "on")
    throw new Error("Please read and accept the campus notice.");
  const session = await campusSession();
  if (!session) redirect("/campus");
  const { error } = await session.supabase.rpc("campus_accept_notice", {
    notice: CAMPUS_NOTICE,
  });
  if (error)
    throw new Error(
      "Unable to record acceptance. Please contact your supervisor.",
    );
  redirect("/campus");
}
