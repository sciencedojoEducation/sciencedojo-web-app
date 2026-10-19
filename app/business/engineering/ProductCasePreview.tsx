"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { showcaseItems, type ShowcaseRole } from "@/lib/product-showcase";
import s from "./engineering.module.css";

const roles: ShowcaseRole[] = ["student", "parent", "tutor"];

export default function ProductCasePreview() {
  const [role, setRole] = useState<ShowcaseRole>("student");
  const item = showcaseItems.find(item => item.role === role)!;
  return <div className={s.productPreview} data-product-views>
    <div className={s.productToolbar}>
      <div role="group" aria-label="Choose a product view" className={s.roleChoices}>{roles.map(value => <button key={value} type="button" aria-pressed={role === value} onClick={() => setRole(value)}>{value === "student" ? "Learner" : value === "parent" ? "Parent" : "Tutor"} view</button>)}</div>
      <span className={s.sampleLabel}>Actual interface · sample data</span>
    </div>
    <figure>
      <div className={s.productScreen}>
        <Image src={item.homeScreenshot} alt={item.screenshotAlt} width={1280} height={800} sizes="(max-width: 760px) 92vw, (max-width: 1200px) 52vw, 700px" />
      </div>
      <figcaption className={s.productCaption}>
        <div aria-live="polite" aria-atomic="true"><strong>{item.headline}</strong></div>
        <a href={item.homeScreenshot} target="_blank" rel="noopener noreferrer">Full-size image <Expand size={16} aria-hidden="true" /><span className={s.srOnly}> (opens a new tab)</span></a>
      </figcaption>
    </figure>
  </div>;
}
