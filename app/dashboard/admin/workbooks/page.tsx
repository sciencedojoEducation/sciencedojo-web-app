import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireWorkbookAccess } from "@/lib/workbook-access";
import { WorkbookInvitations } from "@/components/workbook/WorkbookInvitations";
export default async function WorkbookAccessPage() {
  const h = await headers();
  try { await requireWorkbookAccess(new Request(`${h.get("x-forwarded-proto") || "http"}://${h.get("host") || "localhost"}/dashboard/admin/workbooks`, { headers: h }), true); }
  catch { redirect("/login?next=%2Fdashboard%2Fadmin%2Fworkbooks"); }
  return <WorkbookInvitations />;
}
