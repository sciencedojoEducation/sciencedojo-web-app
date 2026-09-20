export function resolveDashboardRole(
  profileRole: string | null | undefined,
  metadataRole: string | null | undefined,
  hasTutorApplication: boolean,
) {
  const role = profileRole || metadataRole;
  if ((!role || role === "parent") && hasTutorApplication) return "tutor";
  return role || "user";
}

export function isMaintenanceModeEnabled(value = process.env.MAINTENANCE_MODE) {
  return value === "true";
}
