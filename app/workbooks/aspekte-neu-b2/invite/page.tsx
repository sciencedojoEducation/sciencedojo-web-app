import type { Metadata } from "next";
import { WorkbookInvite } from "@/components/workbook/WorkbookInvitations";
export const metadata: Metadata = { title: "Private workbook invitation", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <WorkbookInvite token={token || ""} />;
}
