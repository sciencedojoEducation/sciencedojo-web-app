import type { Metadata } from "next";
import { Nunito } from "next/font/google";

const workbookTitle = Nunito({ subsets: ["latin"], variable: "--font-workbook-title", display: "swap" });

export const metadata: Metadata = { manifest: "/workbooks/manifest.webmanifest", appleWebApp: { capable: true, title: "Arbeitsbuch", statusBarStyle: "default" }, icons: { apple: "/workbook-icon-192.png" }, robots: { index: false, follow: false }, referrer: "same-origin" };
export default function WorkbookLayout({ children }: { children: React.ReactNode }) {
  return <div className={workbookTitle.variable}>{children}</div>;
}
