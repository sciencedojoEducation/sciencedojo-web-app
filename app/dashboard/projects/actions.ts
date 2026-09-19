"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  isInternalProjectPriority,
  isInternalProjectStatus,
} from "@/lib/internal-projects";
import { getActiveInternalMemberByUserId } from "@/lib/internal-auth";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function revalidateProjects(projectId?: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/admin/projects");
  revalidatePath("/dashboard/internal");
  revalidatePath("/dashboard/internal/projects");
  if (projectId) revalidatePath(`/dashboard/projects/${projectId}`);
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized.");
  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" && user.user_metadata?.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return { supabase, user };
}

async function validateAssignee(supabase: Awaited<ReturnType<typeof createClient>>, assignedTo: string | null) {
  if (!assignedTo) return;
  const { data, error } = await supabase
    .from("internal_team_members")
    .select("id")
    .eq("id", assignedTo)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data) throw new Error("Choose an active internal team member.");
}

function validateProjectFields(formData: FormData) {
  const title = text(formData, "title");
  const brief = text(formData, "brief");
  const expectedOutcome = text(formData, "expected_outcome");
  const priority = text(formData, "priority");
  const targetDate = nullableText(formData, "target_date");
  const assignedTo = nullableText(formData, "assigned_to");

  if (title.length < 3 || title.length > 160) throw new Error("Title must be between 3 and 160 characters.");
  if (brief.length < 10 || brief.length > 6000) throw new Error("Brief must be between 10 and 6000 characters.");
  if (expectedOutcome.length < 3 || expectedOutcome.length > 3000) throw new Error("Expected outcome must be between 3 and 3000 characters.");
  if (!isInternalProjectPriority(priority)) throw new Error("Choose a valid priority.");
  if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) throw new Error("Choose a valid target date.");

  return { title, brief, expectedOutcome, priority, targetDate, assignedTo };
}

export async function createInternalProject(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const values = validateProjectFields(formData);
  await validateAssignee(supabase, values.assignedTo);

  const { data: project, error } = await supabase
    .from("internal_projects")
    .insert({
      title: values.title,
      brief: values.brief,
      expected_outcome: values.expectedOutcome,
      priority: values.priority,
      assigned_to: values.assignedTo,
      target_date: values.targetDate,
      created_by: user.id,
      status: "idea",
    })
    .select("id")
    .single();

  if (error || !project) {
    if (error?.code === "23514" && error.message.includes("internal_projects_priority_check")) {
      throw new Error("The project priority schema is out of date. Apply SQL migration 053, then try again.");
    }
    throw new Error(error?.message || "Could not create the project idea.");
  }

  const { error: activityError } = await supabase.from("internal_project_activity").insert({
    project_id: project.id,
    actor_id: user.id,
    activity_type: "created",
    note: values.assignedTo ? "Project idea created and assigned." : "Project idea created in the admin backlog.",
    new_status: "idea",
  });
  if (activityError) console.error("[internal-projects] Creation activity failed:", activityError.message);

  revalidateProjects(project.id);
  return { ok: true, projectId: project.id };
}

export async function updateInternalProject(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const projectId = text(formData, "project_id");
  const status = text(formData, "status");
  if (!projectId) throw new Error("Missing project id.");
  if (!isInternalProjectStatus(status)) throw new Error("Choose a valid status.");
  const values = validateProjectFields(formData);
  await validateAssignee(supabase, values.assignedTo);

  const { data: current, error: lookupError } = await supabase
    .from("internal_projects")
    .select("status, assigned_to")
    .eq("id", projectId)
    .maybeSingle();
  if (lookupError || !current) throw new Error(lookupError?.message || "Project not found.");

  const { error } = await supabase.from("internal_projects").update({
    title: values.title,
    brief: values.brief,
    expected_outcome: values.expectedOutcome,
    priority: values.priority,
    assigned_to: values.assignedTo,
    target_date: values.targetDate,
    status,
  }).eq("id", projectId);
  if (error) throw new Error(error.message);

  const activities: Array<Record<string, string | null>> = [{
    project_id: projectId,
    actor_id: user.id,
    activity_type: "brief_updated",
    note: "Project details updated by an admin.",
  }];
  if (current.assigned_to !== values.assignedTo) {
    activities.push({ project_id: projectId, actor_id: user.id, activity_type: "assignment_changed", note: values.assignedTo ? "Project assigned or reassigned." : "Project returned to the unassigned backlog." });
  }
  if (current.status !== status) {
    activities.push({ project_id: projectId, actor_id: user.id, activity_type: "status_changed", note: null, previous_status: current.status, new_status: status });
  }
  const { error: activityError } = await supabase.from("internal_project_activity").insert(activities);
  if (activityError) console.error("[internal-projects] Update activity failed:", activityError.message);

  revalidateProjects(projectId);
  return { ok: true };
}

export async function setInternalProjectArchived(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const projectId = text(formData, "project_id");
  const shouldArchive = text(formData, "archived") === "true";
  if (!projectId) throw new Error("Missing project id.");

  const { error } = await supabase.from("internal_projects").update({
    archived_at: shouldArchive ? new Date().toISOString() : null,
    archived_by: shouldArchive ? user.id : null,
  }).eq("id", projectId);
  if (error) throw new Error(error.message);

  const { error: activityError } = await supabase.from("internal_project_activity").insert({
    project_id: projectId,
    actor_id: user.id,
    activity_type: shouldArchive ? "archived" : "restored",
    note: shouldArchive ? "Project archived by an admin." : "Project restored by an admin.",
  });
  if (activityError) console.error("[internal-projects] Archive activity failed:", activityError.message);

  revalidateProjects(projectId);
  return { ok: true };
}

export async function updateAssignedInternalProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const member = await getActiveInternalMemberByUserId(supabase, user.id);
  if (!member) throw new Error("Active internal access required.");

  const projectId = text(formData, "project_id");
  const requestedStatus = nullableText(formData, "status");
  const note = nullableText(formData, "note");
  if (!projectId) throw new Error("Missing project id.");
  if (requestedStatus && !isInternalProjectStatus(requestedStatus)) throw new Error("Choose a valid status.");
  if (note && note.length > 3000) throw new Error("Progress notes must be 3000 characters or fewer.");

  const { error } = await supabase.rpc("update_assigned_internal_project", {
    target_project_id: projectId,
    requested_status: requestedStatus,
    progress_note: note,
  });
  if (error) throw new Error(error.message);

  revalidateProjects(projectId);
  return { ok: true };
}

export async function adminAddProjectNote(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const projectId = text(formData, "project_id");
  const note = text(formData, "note");
  if (!projectId || !note) throw new Error("Add a progress note.");
  if (note.length > 3000) throw new Error("Progress notes must be 3000 characters or fewer.");

  const { error } = await supabase.from("internal_project_activity").insert({
    project_id: projectId,
    actor_id: user.id,
    activity_type: "progress_note",
    note,
  });
  if (error) throw new Error(error.message);
  await supabase.from("internal_projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);

  revalidateProjects(projectId);
  return { ok: true };
}
