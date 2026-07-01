export type FocusDojoAccessLevel = "free" | "basic" | "pro";
export type FocusDojoLockedReason = "basic_required" | "pro_required";

export const FOCUSDOJO_PRO_PRODUCT_KEY = "focusdojo_pro";

const ACCESS_RANK: Record<FocusDojoAccessLevel, number> = {
  free: 0,
  basic: 1,
  pro: 2,
};

export function canAccessFocusDojoItem(
  userAccess: FocusDojoAccessLevel,
  minimumAccess: FocusDojoAccessLevel,
) {
  return ACCESS_RANK[userAccess] >= ACCESS_RANK[minimumAccess];
}

export function getLockedReason(
  userAccess: FocusDojoAccessLevel,
  minimumAccess: FocusDojoAccessLevel,
): FocusDojoLockedReason | null {
  if (canAccessFocusDojoItem(userAccess, minimumAccess)) return null;
  if (minimumAccess === "basic") return "basic_required";
  if (minimumAccess === "pro") return "pro_required";
  return null;
}
