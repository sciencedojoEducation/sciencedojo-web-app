import Link from "next/link";
import Logo from "@/components/Logo";
import { businessNavigationItems } from "@/lib/business-navigation";

/** Streamed navigation needs a readable fallback when scripts cannot reveal it. */
export default function PublicNavigationFallback() {
  return <div data-public-site-header className="h-20 border-b border-primary/[0.08] bg-white">
    <noscript>
      <nav aria-label="Main navigation without JavaScript" className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 text-sm text-secondary">
        <Link href="/" aria-label="ScienceDojo home"><Logo className="text-xl" /></Link>
        <details className="relative">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-medium">For Business</summary>
          <div className="absolute right-0 top-full z-50 w-64 rounded-xl border border-primary/10 bg-white p-2 shadow-lg">
            {businessNavigationItems.map(item => <Link key={item.href} href={item.href} className="block rounded-lg px-4 py-3 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">{item.label}</Link>)}
          </div>
        </details>
      </nav>
    </noscript>
  </div>;
}
