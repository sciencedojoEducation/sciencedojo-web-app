"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight } from "lucide-react";
import ShowcaseTrackedLink from "@/components/analytics/ShowcaseTrackedLink";
import ShowcaseVisibilityTracker from "@/components/analytics/ShowcaseVisibilityTracker";
import ProductScreenshotFrame from "@/components/ProductScreenshotFrame";
import { trackEvent } from "@/lib/analytics";
import type { ShowcaseItem, ShowcaseRole } from "@/lib/product-showcase";

const shortRoleLabels: Record<ShowcaseRole, string> = {
  parent: "Parents",
  student: "Students",
  tutor: "Tutors",
};

export default function HomepageProductShowcase({ items }: { items: ShowcaseItem[] }) {
  const [activeRole, setActiveRole] = useState<ShowcaseRole>(items[0]?.role ?? "parent");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (items.length === 0) return null;

  const activeItem = items.find((item) => item.role === activeRole) ?? items[0];

  function selectRole(role: ShowcaseRole) {
    if (role === activeItem.role) return;
    setActiveRole(role);
    trackEvent("showcase_audience_select", { role, source_page: "homepage" });
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % items.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + items.length) % items.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectRole(items[nextIndex].role);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section className="bg-white px-4 pb-16 pt-14 md:px-8 md:pb-20 md:pt-18" aria-labelledby="showcase-heading">
      <ShowcaseVisibilityTracker sourcePage="homepage" />
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-primary">Inside ScienceDojo</p>
            <h2 id="showcase-heading" className="mt-2 text-3xl font-black tracking-tight text-secondary md:text-4xl">See ScienceDojo in action.</h2>
            <h3 className="mt-4 text-xl font-black tracking-tight text-secondary sm:text-2xl">{activeItem.headline}</h3>
            <p className="mt-2 max-w-2xl leading-7 text-secondary/70">{activeItem.introduction}</p>
          </div>

          {items.length > 1 && (
            <div role="tablist" aria-label="Choose a ScienceDojo workspace" className="flex w-full gap-2 lg:w-auto lg:shrink-0">
              {items.map((item, index) => (
                <button
                  key={item.role}
                  ref={(node) => { tabRefs.current[index] = node; }}
                  id={`homepage-showcase-tab-${item.role}`}
                  type="button"
                  role="tab"
                  aria-label={item.label}
                  aria-selected={activeItem.role === item.role}
                  aria-controls="homepage-showcase-panel"
                  tabIndex={activeItem.role === item.role ? 0 : -1}
                  onClick={() => selectRole(item.role)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`min-h-11 flex-1 rounded-full border px-3 py-2 text-sm font-bold transition sm:px-5 lg:flex-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeItem.role === item.role ? "border-primary bg-primary text-white" : "border-[#cbdfee] bg-white text-secondary hover:border-primary hover:text-primary"}`}
                >
                  {shortRoleLabels[item.role]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div id="homepage-showcase-panel" role={items.length > 1 ? "tabpanel" : undefined} aria-labelledby={items.length > 1 ? `homepage-showcase-tab-${activeItem.role}` : undefined} className="mx-auto mt-7 max-w-[68rem] overflow-hidden rounded-3xl border border-[#dce8f3] bg-[#f8fbfe] shadow-[0_18px_45px_rgba(17,57,94,.05)]">
          <figure className="min-w-0 p-3 sm:p-5 lg:p-6">
            <ProductScreenshotFrame src={activeItem.homeScreenshot} mobileSrc={activeItem.homeMobileScreenshot} alt={activeItem.screenshotAlt} width={1280} height={800} sizes="(max-width: 1200px) 100vw, 1040px" loading="eager" />
            <figcaption className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-medium text-secondary/60">Screen shown with sample data</span>
              <ShowcaseTrackedLink href={`/how-it-works?role=${activeItem.role}#${activeItem.role}`} role={activeItem.role} sourcePage="homepage" kind="tour" className="inline-flex min-h-11 items-center gap-2 self-start font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                Explore the {activeItem.role} experience <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ShowcaseTrackedLink>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
