export const INTERNAL_PROJECT_STATUSES = ["idea", "exploring", "planned", "in_development", "testing", "pilot", "live", "paused", "discontinued"] as const;
export const INTERNAL_PROJECT_PRIORITIES = ["p0", "p1", "p2", "p3", "research", "hold"] as const;

export type InternalProjectStatus = (typeof INTERNAL_PROJECT_STATUSES)[number];
export type InternalProjectPriority = (typeof INTERNAL_PROJECT_PRIORITIES)[number];

export type InternalProjectMember = {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  title: string | null;
};

export type InternalProject = {
  id: string;
  title: string;
  brief: string;
  expected_outcome: string;
  priority: InternalProjectPriority;
  status: InternalProjectStatus;
  assigned_to: string | null;
  created_by: string;
  target_date: string | null;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
  assignee?: InternalProjectMember | InternalProjectMember[] | null;
};

export type InternalProjectActivity = {
  id: string;
  project_id: string;
  actor_id: string | null;
  activity_type: string;
  note: string | null;
  previous_status: InternalProjectStatus | null;
  new_status: InternalProjectStatus | null;
  created_at: string;
  actor?: { full_name: string | null } | Array<{ full_name: string | null }> | null;
};

export const INTERNAL_PROJECT_STATUS_LABELS: Record<InternalProjectStatus, string> = {
  idea: "💡 Idea",
  exploring: "🔎 Exploring",
  planned: "📋 Planned",
  in_development: "🛠 In Development",
  testing: "🧪 Testing",
  pilot: "🚀 Pilot",
  live: "✅ Live",
  paused: "⏸ Paused",
  discontinued: "🗑 Discontinued",
};

export const INTERNAL_PROJECT_PRIORITY_META: Record<InternalProjectPriority, {
  code: string;
  label: string;
  symbol: string;
  color: string;
  cardClass: string;
  badgeClass: string;
}> = {
  p0: { code: "P0", label: "Critical", symbol: "🔴", color: "#DC2626", cardClass: "border-red-300 bg-red-50", badgeClass: "bg-red-600 text-white" },
  p1: { code: "P1", label: "High Priority", symbol: "🟠", color: "#EA580C", cardClass: "border-orange-300 bg-orange-50", badgeClass: "bg-orange-600 text-white" },
  p2: { code: "P2", label: "Planned", symbol: "🟡", color: "#D97706", cardClass: "border-amber-300 bg-amber-50", badgeClass: "bg-amber-600 text-white" },
  p3: { code: "P3", label: "Future", symbol: "🟢", color: "#16A34A", cardClass: "border-green-300 bg-green-50", badgeClass: "bg-green-600 text-white" },
  research: { code: "R&D", label: "Research & Experiment", symbol: "🔵", color: "#2563EB", cardClass: "border-blue-300 bg-blue-50", badgeClass: "bg-blue-600 text-white" },
  hold: { code: "HOLD", label: "On Hold", symbol: "⚪", color: "#6B7280", cardClass: "border-gray-300 bg-gray-100", badgeClass: "bg-gray-600 text-white" },
};

export function isInternalProjectStatus(value: string): value is InternalProjectStatus {
  return INTERNAL_PROJECT_STATUSES.includes(value as InternalProjectStatus);
}

export function isInternalProjectPriority(value: string): value is InternalProjectPriority {
  return INTERNAL_PROJECT_PRIORITIES.includes(value as InternalProjectPriority);
}

export function getProjectAssignee(project: InternalProject) {
  return Array.isArray(project.assignee) ? project.assignee[0] || null : project.assignee || null;
}

export function getActivityActor(activity: InternalProjectActivity) {
  return Array.isArray(activity.actor) ? activity.actor[0] || null : activity.actor || null;
}

export function formatProjectStatus(status: InternalProjectStatus | null) {
  return status ? INTERNAL_PROJECT_STATUS_LABELS[status] : "";
}
