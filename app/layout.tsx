import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import SeoConversionCtas from "@/components/SeoConversionCtas";
import PublicChromeGate from "@/components/PublicChromeGate";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ScienceDojo | Online Tutoring for Confident Learners",
    template: "%s | ScienceDojo",
  },
  description: "ScienceDojo connects students with expert online tutors for math, physics, chemistry, GCSE, IB, and A-Level support.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "ScienceDojo | Online Tutoring for Confident Learners",
    description: "Expert online tutoring with clear teaching, smarter learning systems, and parent visibility.",
    url: siteUrl,
    siteName: "ScienceDojo",
    type: "website",
    images: [
      {
        url: "/images/sciencedojo-logo-brand.jpg",
        width: 512,
        height: 512,
        alt: "ScienceDojo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScienceDojo | Online Tutoring for Confident Learners",
    description: "Expert online tutoring with clear teaching, smarter learning systems, and parent visibility.",
    images: ["/images/sciencedojo-logo-brand.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Analytics />
        {!isMaintenanceMode && (
          <PublicChromeGate>
            <Navbar />
          </PublicChromeGate>
        )}
        <main className="flex-1 min-h-0">{children}</main>
        {!isMaintenanceMode && (
          <PublicChromeGate>
            <Footer />
            <SeoConversionCtas />
          </PublicChromeGate>
        )}
      </body>
    </html>
  );
}
