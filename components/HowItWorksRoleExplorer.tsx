"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import ShowcaseTrackedLink from "@/components/analytics/ShowcaseTrackedLink";
import ShowcaseVisibilityTracker from "@/components/analytics/ShowcaseVisibilityTracker";
import ProductScreenshotFrame from "@/components/ProductScreenshotFrame";
import { trackEvent } from "@/lib/analytics";
import type { FeatureFlagKey } from "@/lib/feature-flags";
import { getShowcaseCta, type ShowcaseItem } from "@/lib/product-showcase";

export default function HowItWorksRoleExplorer({ items, flags, initialRole }: {
  items: ShowcaseItem[];
  flags: Record<FeatureFlagKey, boolean>;
  initialRole: ShowcaseItem["role"];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <ShowcaseVisibilityTracker sourcePage="how_it_works" />
      {items.map((item, index) => {
        const cta = getShowcaseCta(item.role, flags);
        return (
          <details id={item.role} key={item.role} open={item.role === initialRole} className="group scroll-mt-28 overflow-hidden rounded-3xl border border-[#d6e5f4] bg-white shadow-sm open:shadow-[0_16px_50px_rgba(7,26,53,.08)]">
            <summary onClick={(event) => { const panel = event.currentTarget.parentElement; if (panel instanceof HTMLDetailsElement && !panel.open) trackEvent("showcase_audience_select", { role: item.role, source_page: "how_it_works" }); }} className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4 font-extrabold text-[#17416b] marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary sm:px-7 [&::-webkit-details-marker]:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2f2ff] text-[#0753a2]" aria-hidden="true">{index + 1}</span>
              <span className="flex-1">{item.label}</span>
              <span className="hidden text-xs font-semibold text-[#66819c] sm:inline">Explore workspace</span>
              <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-[#e1ebf5] p-5 sm:p-7 lg:p-9">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-bold text-primary">{item.label}</p>
                  <h3 className="mt-2 max-w-xl text-2xl font-black tracking-tight text-secondary sm:text-3xl">{item.headline}</h3>
                  <p className="mt-3 max-w-xl leading-7 text-secondary/70">{item.introduction}</p>
                </div>
                {cta && <ShowcaseTrackedLink href={cta.href} role={item.role} sourcePage="how_it_works" kind="cta" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#0753a2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{cta.label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></ShowcaseTrackedLink>}
              </div>
              <figure className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#cbdfee] bg-[linear-gradient(135deg,#e3f2ff,#f3f9ff)] p-3 shadow-[0_18px_50px_rgba(7,26,53,.09)] sm:p-5">
                <div className="overflow-x-auto rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" tabIndex={0} aria-label={`${item.label} dashboard screenshot; scroll horizontally to explore on small screens`}>
                  <div className="w-[720px] sm:w-full"><ProductScreenshotFrame src={item.tourScreenshot} alt={item.screenshotAlt} width={1440} height={900} sizes="(max-width: 640px) 720px, (max-width: 1200px) 100vw, 1100px" /></div>
                </div>
                <figcaption className="pt-3 text-center text-xs text-[#5c7188]">Screen shown with sample data<span className="sm:hidden"> · Swipe to explore</span></figcaption>
              </figure>
              <ol className="mt-8 grid gap-4 md:grid-cols-3">
                {item.journey.map((step, stepIndex) => (
                  <li key={step.title} className="rounded-2xl border border-[#e1ebf5] bg-[#f8fbff] p-5">
                    <span className="text-xs font-black uppercase tracking-wider text-primary">Step {stepIndex + 1}</span>
                    <h4 className="mt-2 font-extrabold text-secondary">{step.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-secondary/65">{step.description}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm leading-6 text-secondary/65"><span className="font-bold text-secondary">Also in your workspace:</span> {item.otherTools.join(" · ")}</p>
            </div>
          </details>
        );
      })}
    </div>
  );
}
