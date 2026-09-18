import { createClient } from "@/utils/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  // RLS limits this row to the requester, assigned tutor, or an admin.
  const { data: material, error } = await supabase
    .from("lesson_request_materials")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !material) return new Response("Not found", { status: 404 });

  const { data: signed, error: signingError } = await supabase.storage
    .from("lesson-request-materials")
    .createSignedUrl(material.storage_path, 60);

  if (signingError || !signed?.signedUrl) return new Response("Could not open material", { status: 500 });
  return Response.redirect(signed.signedUrl, 302);
}
