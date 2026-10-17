import { notFound } from "next/navigation";
import { hostingCheckEnabled } from "@/lib/campus/hosting-check";
import HostingCheck from "./probe";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Vercel preview check | ScienceDojo",
  robots: { index: false, follow: false },
};
export default function HostingCheckPage() {
  if (!hostingCheckEnabled(process.env)) notFound();
  return <main className="min-h-screen bg-[#f5f3ec] px-6 py-20 text-[#173b39]">
    <div className="mx-auto max-w-xl">
      <p className="text-2xl font-semibold">sciencedojo.</p>
      <h1 className="mt-10 text-3xl font-semibold">Vercel preview check</h1>
      <p className="mt-5 leading-7">This checks whether the existing project can accept live connections.
        It uses four short synthetic connections, with no account or course data.</p>
      <HostingCheck />
      <p className="mt-6 text-sm leading-6">This is a connection test. Shared library positions, seats and admission
        still require coordination across server instances. The student beta remains closed.
        This experiment expires on 18 October 2026 at 00:00 UTC.</p>
    </div>
  </main>;
}
