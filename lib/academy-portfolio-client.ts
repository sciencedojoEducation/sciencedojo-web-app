import type { AcademyPortfolioSubmission } from "@/app/dashboard/academy/portfolio-actions";

type Submissions = Record<string, AcademyPortfolioSubmission>;

// Share only in-flight reads. Completed requests are discarded so a later
// mount (including a different signed-in account) always reads fresh data.
export function createAcademyPortfolioLoader(fetcher: typeof fetch = fetch) {
  const pending = new Map<string, Promise<Submissions>>();
  return async (courseKey: string, lessonId: string, blockId: string) => {
    const query = new URLSearchParams({ courseKey, lessonId });
    const key = query.toString();
    let request = pending.get(key);
    if (!request) {
      request = (async () => {
        const response = await fetcher(`/api/academy/portfolio?${query}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Saved answers could not be loaded.");
        const payload = await response.json() as { submissions: Submissions };
        return payload.submissions;
      })();
      pending.set(key, request);
      // Both success and failure must release the request for a fresh retry.
      void request.then(() => pending.delete(key), () => pending.delete(key));
    }
    const submissions = await request;
    return Object.prototype.hasOwnProperty.call(submissions, blockId) ? submissions[blockId] : null;
  };
}

export const loadAcademyPortfolioSubmission = createAcademyPortfolioLoader();
