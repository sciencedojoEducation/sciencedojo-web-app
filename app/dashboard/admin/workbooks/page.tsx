import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireWorkbookAccess } from "@/lib/workbook-access";
import { WorkbookInvitations } from "@/components/workbook/WorkbookInvitations";
export default async function WorkbookAccessPage() {
  const h = await headers();
  try { await requireWorkbookAccess(new Request(`${h.get("x-forwarded-proto") || "http"}://${h.get("host") || "localhost"}/dashboard/admin/workbooks`, { headers: h }), true); }
  catch { redirect("/login?next=%2Fdashboard%2Fadmin%2Fworkbooks"); }
  return <><section className="mx-auto max-w-4xl p-6 pb-0"><Link className="inline-block rounded-xl border border-violet-200 bg-violet-50 p-5 text-violet-950" href="/workbooks/aspekte-neu-b2-intensivtrainer"><strong className="block text-lg">Aspekte neu B2 · Intensivtrainer</strong><span className="mt-2 block">Open native interactive exercises, vocabulary and your private saved answers →</span></Link></section><WorkbookInvitations /></>;
}
