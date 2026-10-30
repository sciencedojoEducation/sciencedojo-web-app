import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireWorkbookAccess } from "@/lib/workbook-access";
import { WorkbookInvitations } from "@/components/workbook/WorkbookInvitations";
export default async function WorkbookAccessPage() {
  const h = await headers();
  try { await requireWorkbookAccess(new Request(`${h.get("x-forwarded-proto") || "http"}://${h.get("host") || "localhost"}/dashboard/admin/workbooks`, { headers: h }), true); }
  catch { redirect("/login?next=%2Fdashboard%2Fadmin%2Fworkbooks"); }
  return <>
    <section className="mx-auto grid max-w-4xl gap-4 p-6 pb-0 sm:grid-cols-2">
      <Link className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950" href="/workbooks/aspekte-neu-b2-lehrbuch"><strong className="block text-lg">Aspekte neu B2 · Lehrbuch</strong><span className="mt-2 block">Open your private book, questions, answers and learning reflections →</span></Link>
      <Link className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-violet-950" href="/workbooks/aspekte-neu-b2-intensivtrainer"><strong className="block text-lg">Aspekte neu B2 · Intensivtrainer</strong><span className="mt-2 block">Open native interactive exercises, vocabulary and your private saved answers →</span></Link>
    </section>
    <WorkbookInvitations />
  </>;
}
