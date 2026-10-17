/** Shared by marketing initialization and events; contains no account or course data. */
export function isCampusPath(path: string) {
  return path === "/campus" || path.startsWith("/campus/");
}

export function isPrivateStudyPath(path: string) {
  const pathname = path.split(/[?#]/, 1)[0];
  return (
    isCampusPath(pathname) ||
    pathname.startsWith("/workbooks/") ||
    pathname === "/dashboard/academy" ||
    pathname.startsWith("/dashboard/academy/")
  );
}

export function isPrivateStudyLocation(href: string) {
  try {
    const url = new URL(href);
    return (
      isPrivateStudyPath(url.pathname) ||
      (["/login", "/signup"].includes(url.pathname) &&
        isPrivateStudyPath(url.searchParams.get("next") || ""))
    );
  } catch {
    return false;
  }
}

export function campusNeedsFreshDocument(
  currentHref: string,
  documentHref: string | undefined,
  hasMarketingTags: boolean,
) {
  try {
    const current = new URL(currentHref);
    if (!isCampusPath(current.pathname)) return false;
    if (hasMarketingTags) return true;
    return documentHref ? !isCampusPath(new URL(documentHref).pathname) : false;
  } catch {
    return true;
  }
}
