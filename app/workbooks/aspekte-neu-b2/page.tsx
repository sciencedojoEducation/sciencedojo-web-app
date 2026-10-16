import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireWorkbookAccess, WorkbookAccessError } from "@/lib/workbook-access";
import { readWorkbookManifest, workbookEnabled } from "@/lib/aspekte-workbook-server";
import AspekteWorkbook from "@/components/workbook/AspekteWorkbook";

export const metadata: Metadata = { title: "Aspekte neu B2 · Mein Arbeitsbuch", robots: { index: false, follow: false } };

/** Personal native workbook; the PDF is an optional reference inside the reader. */
export default async function WorkbookPage() {
  const requestHeaders = await headers();
  if (!workbookEnabled()) notFound();
  try {
    await requireWorkbookAccess(new Request(`${requestHeaders.get("x-forwarded-proto") || "http"}://${requestHeaders.get("host") || "localhost"}/workbooks/aspekte-neu-b2`, { headers: requestHeaders }));
  } catch (e) {
    if (e instanceof WorkbookAccessError && e.status === 401) redirect("/login?next=%2Fworkbooks%2Faspekte-neu-b2");
    if (e instanceof WorkbookAccessError && e.status === 404) notFound();
    return <main className="p-10"><h1>Private workbook</h1><p>{e instanceof Error ? e.message : "Unable to check workbook access."}</p><Link href="/login?next=%2Fworkbooks%2Faspekte-neu-b2">Sign in to your invited account</Link></main>;
  }
  const manifest = await readWorkbookManifest();
  if (!manifest) return <main className="p-10"><h1>Workbook sources are not ready yet.</h1><p>Run the local workbook preparation script first.</p></main>;
  return <AspekteWorkbook manifest={manifest} />;
}
