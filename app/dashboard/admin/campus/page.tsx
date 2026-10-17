import Link from "next/link";
import { requirePilotAdmin } from "@/lib/course-pilot";
import { manageCampus } from "./actions";
export const metadata = { title: "Campus moderation | ScienceDojo" };
export default async function CampusAdmin({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { supabase } = await requirePilotAdmin();
  const [membersResult, reportsResult, auditResult] = await Promise.all([
    supabase
      .from("campus_members")
      .select(
        "user_id,campus_id,pseudonym,enabled,adult_verified,eea_verified,verified_at",
      ),
    supabase
      .from("campus_reports")
      .select("id,target,reason,created_at,resolved_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("campus_audit")
      .select("id,target,action,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const { message } = await searchParams;
  const unavailable =
    membersResult.error || reportsResult.error || auditResult.error;
  const members = membersResult.data || [],
    reports = reportsResult.data || [],
    audits = auditResult.data || [];
  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 text-slate-900">
      <header>
        <Link href="/dashboard/admin" className="text-blue-700 underline">
          ← Administration
        </Link>
        <h1 className="mt-5 text-3xl font-semibold">Virtual campus</h1>
        <p className="mt-3 leading-7">
          Invite-only, ages 18+, EU/EEA residents. Approve memberships only
          after reviewing eligibility evidence privately. This screen does not
          approve the launch gates or enable the campus.
        </p>
        <Link
          href="/dashboard/admin/feature-flags"
          className="mt-3 inline-flex min-h-11 items-center text-blue-700 underline"
        >
          Feature flags / campus shutdown
        </Link>
      </header>
      {message && (
        <p role="status" className="rounded-xl bg-blue-50 p-4">
          {message === "saved"
            ? "Change saved."
            : message === "revoked-polling"
              ? "Membership revoked. Immediate removal notification failed; room revalidation will remove presence within 15 seconds while the service is healthy."
              : "Change could not be saved. Check configuration and retry."}
        </p>
      )}
      {unavailable ? (
        <p role="alert">
          Campus schema unavailable. Apply the reviewed additive migration 070
          through your normal process.
        </p>
      ) : (
        <>
          <section className="rounded-xl border p-5">
            <h2 className="text-xl font-semibold">
              Approve a reviewed invitation
            </h2>
            <form action={manageCampus} className="mt-4 space-y-4">
              <input type="hidden" name="action" value="admit" />
              <label className="block">
                Existing account UUID
                <input
                  required
                  name="id"
                  className="mt-2 block min-h-11 w-full rounded border p-3"
                  placeholder="Account identifier from your private verification record"
                />
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="reviewed"
                  required
                  className="mt-1"
                />
                I have verified adult and EU/EEA eligibility and saved the
                evidence privately. I am approving this person for the
                supervised pilot.
              </label>
              <button className="min-h-11 rounded bg-slate-900 px-5 text-white">
                Approve invitation
              </button>
            </form>
          </section>
          <section>
            <h2 className="text-xl font-semibold">
              Members ({members.length})
            </h2>
            <div className="mt-4 space-y-3">
              {members.map((m) => (
                <article
                  key={m.campus_id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <strong>{m.pseudonym}</strong>
                    <p className="mt-1 break-all text-sm">
                      Account: {m.user_id}
                    </p>
                    <p className="text-sm">
                      {m.enabled ? "Invited" : "Revoked"} · Adult{" "}
                      {m.adult_verified ? "reviewed" : "pending"} · EU/EEA{" "}
                      {m.eea_verified ? "reviewed" : "pending"}
                    </p>
                  </div>
                  <form action={manageCampus}>
                    <input type="hidden" name="action" value="revoke" />
                    <input type="hidden" name="id" value={m.user_id} />
                    <button
                      disabled={!m.enabled}
                      className="min-h-11 rounded border border-red-300 px-4 text-red-800 disabled:opacity-40"
                    >
                      Revoke and remove
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Reports</h2>
            <p className="mt-2 text-sm">
              Up to 100 most recent reports. Work with the session supervisor;
              resolving a report does not itself remove a member.
            </p>
            <div className="mt-4 space-y-3">
              {reports.length ? (
                reports.map((r) => (
                  <article
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                    key={r.id}
                  >
                    <div>
                      <strong>
                        {members.find((m) => m.campus_id === r.target)
                          ?.pseudonym || "Deleted participant"}
                      </strong>
                      <p>
                        {r.reason} · {new Date(r.created_at).toISOString()}
                      </p>
                    </div>
                    {r.resolved_at ? (
                      <p>Resolved</p>
                    ) : (
                      <form action={manageCampus}>
                        <input type="hidden" name="action" value="resolve" />
                        <input type="hidden" name="id" value={r.id} />
                        <button className="min-h-11 rounded border px-4">
                          Record resolution
                        </button>
                      </form>
                    )}
                  </article>
                ))
              ) : (
                <p>No reports recorded.</p>
              )}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Recent audit</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {audits.map((a) => (
                <li key={a.id}>
                  {new Date(a.created_at).toISOString()} · {a.action} ·{" "}
                  {members.find((m) => m.campus_id === a.target)?.pseudonym ||
                    "Deleted participant"}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
