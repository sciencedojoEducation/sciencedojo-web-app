import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { readTrainerManifest, requireTrainerAccess } from "@/lib/intensivtrainer-server";
import { WorkbookAccessError } from "@/lib/workbook-access";
import IntensivtrainerBook from "@/components/workbook/IntensivtrainerBook";
export const metadata: Metadata = { title: "Aspekte neu B2 · Intensivtrainer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function IntensivtrainerPage() {
  const h = await headers();
  try { await requireTrainerAccess(new Request(`${h.get("x-forwarded-proto") || "http"}://${h.get("host") || "localhost"}/workbooks/aspekte-neu-b2-intensivtrainer`, { headers: h })); }
  catch (e) {
    if (e instanceof WorkbookAccessError && e.status === 401) redirect("/login?next=%2Fworkbooks%2Faspekte-neu-b2-intensivtrainer");
    if (e instanceof WorkbookAccessError && e.status === 404) notFound();
    return <main className="p-10"><h1>Private B2 Intensivtrainer</h1><p>{e instanceof WorkbookAccessError ? e.message : "Book access could not be checked."}</p><Link href="/dashboard/admin/workbooks">Back to private workbooks</Link></main>;
  }
  return <IntensivtrainerBook manifest={await readTrainerManifest()} />;
}
