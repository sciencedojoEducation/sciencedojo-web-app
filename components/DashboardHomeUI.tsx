import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { ReactNode } from "react";

type HomeMetric = {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "mint" | "violet" | "amber" | "sky";
};

export function HomeMetricStrip({ items, label }: { items: HomeMetric[]; label: string }) {
  return (
    <section aria-label={label} className="home-metric-strip" data-count={items.length}>
      {items.map((item) => (
        <div key={item.label} className="home-metric">
          <span className="home-metric-icon" data-tone={item.tone || "sky"} aria-hidden="true">{item.icon}</span>
          <span className="min-w-0">
            <span className="home-metric-value">{item.value}</span>
            <span className="home-metric-label">{item.label}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

export function HomeSectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="home-section-heading">
      <div>
        {eyebrow && <p className="home-eyebrow">{eyebrow}</p>}
        <h2 className="home-section-title">{title}</h2>
        {description && <p className="home-section-description">{description}</p>}
      </div>
      {href && linkLabel && <Link className="home-text-link" href={href}>{linkLabel}<ArrowRight size={16} aria-hidden="true" /></Link>}
    </div>
  );
}

export function HomePrimaryAction({
  eyebrow,
  title,
  description,
  href,
  label,
  detail,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  label: string;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <section className="home-primary-action" aria-label={eyebrow}>
      <div className="home-action-glow" aria-hidden="true" />
      <h2 className="home-section-title">{eyebrow}</h2>
      <div className="home-action-content">
        <span className="home-action-icon" aria-hidden="true">{icon || <BookOpen size={23} strokeWidth={1.7} />}</span>
        <h3 className="home-action-title">{title}</h3>
        <p className="home-action-description">{description}</p>
      </div>
      <div className="home-action-footer">
        <span className="home-action-detail">{detail}</span>
        <Link className="home-primary-button" href={href}>{label}<ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

export function HomeListRow({
  href,
  title,
  detail,
  trailing,
}: {
  href: string;
  title: string;
  detail?: string;
  trailing?: ReactNode;
}) {
  return (
    <Link className="home-list-row" href={href}>
      <span className="min-w-0 flex-1">
        <span className="home-list-title">{title}</span>
        {detail && <span className="home-list-detail">{detail}</span>}
      </span>
      {trailing || <ArrowRight size={16} className="home-list-arrow" aria-hidden="true" />}
    </Link>
  );
}
