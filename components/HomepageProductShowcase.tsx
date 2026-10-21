"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight } from "lucide-react";
import ShowcaseTrackedLink from "@/components/analytics/ShowcaseTrackedLink";
import ShowcaseVisibilityTracker from "@/components/analytics/ShowcaseVisibilityTracker";
import ProductScreenshotFrame from "@/components/ProductScreenshotFrame";
import { trackEvent } from "@/lib/analytics";
import type { ShowcaseItem, ShowcaseRole } from "@/lib/product-showcase";
import styles from "@/app/home.module.css";

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
    <section className={styles.showcase} aria-labelledby="showcase-heading">
      <ShowcaseVisibilityTracker sourcePage="homepage" />
      <div className={`${styles.container} ${styles.showcaseGrid}`}>
        <div className={styles.showcaseCopy}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Inside ScienceDojo</p>
            <h2 id="showcase-heading" className={styles.heading}>A workspace that supports the learning.</h2>
            <h3 className={styles.showcaseSubheading}>{activeItem.headline}</h3>
            <p className={styles.cardText}>{activeItem.introduction}</p>
          </div>

          {items.length > 1 && (
            <div role="tablist" aria-label="Choose a ScienceDojo workspace" className="mt-6 flex w-full max-w-md gap-2">
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
                  className={`min-h-11 flex-1 rounded-full border px-3 py-2 text-sm font-medium transition sm:px-5 lg:flex-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeItem.role === item.role ? "border-primary bg-primary text-white" : "border-[#cbdfee] bg-white text-secondary hover:border-primary hover:text-primary"}`}
                >
                  {shortRoleLabels[item.role]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div id="homepage-showcase-panel" role={items.length > 1 ? "tabpanel" : undefined} aria-labelledby={items.length > 1 ? `homepage-showcase-tab-${activeItem.role}` : undefined} className={styles.showcasePanel}>
          <figure className="min-w-0 p-3 sm:p-4">
            <ProductScreenshotFrame src={activeItem.homeScreenshot} mobileSrc={activeItem.homeMobileScreenshot} alt={activeItem.screenshotAlt} width={1280} height={800} sizes="(max-width: 640px) 300px, (max-width: 850px) 80vw, 600px" loading="lazy" />
            <figcaption className="flex flex-col gap-1 pt-3">
              <span className="text-xs font-medium text-secondary/60">Screen shown with sample data</span>
              <ShowcaseTrackedLink href={`/how-it-works?role=${activeItem.role}#${activeItem.role}`} role={activeItem.role} sourcePage="homepage" kind="tour" className={styles.textLink}>
                Explore the {activeItem.role} experience <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ShowcaseTrackedLink>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
