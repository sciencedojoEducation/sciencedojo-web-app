/** Returning Google users in the course signup funnel keep their existing account. */
export function existingCourseSignupReturn(
  next: string,
  establishedRole: string | null,
  placeholder: boolean,
) {
  if (
    !establishedRole ||
    placeholder ||
    !["user", "student", "parent", "tutor", "admin", "internal"].includes(
      establishedRole,
    )
  )
    return null;
  return /^\/courses\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(next) ? next : null;
}
