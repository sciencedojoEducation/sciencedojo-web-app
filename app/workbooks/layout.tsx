import type { Metadata } from "next";
export const metadata: Metadata = { manifest: "/workbooks/manifest.webmanifest", appleWebApp: { capable: true, title: "Arbeitsbuch", statusBarStyle: "default" }, icons: { apple: "/workbook-icon-192.png" }, robots: { index: false, follow: false }, referrer: "same-origin" };
export default function WorkbookLayout({ children }: { children: React.ReactNode }) { return children; }
