import type { CSSProperties, ReactNode } from "react";
import { academyBackgroundNeedsContentPanel, isSafeAcademyBackgroundImageUrl, isValidAcademyBackgroundColor } from "@/lib/academy-block-background";
import type { AcademyBlockAppearance } from "@/lib/tutor-academy";

export default function AcademyBlockBackground({
  appearance,
  className,
  children,
  id,
  variant,
  blockType,
}: {
  appearance: AcademyBlockAppearance;
  className: string;
  children: ReactNode;
  id?: string;
  variant?: string;
  blockType?: string;
}) {
  const background = appearance.background;
  const kind = background?.kind;
  const imageUrl = background?.kind === "image" && isSafeAcademyBackgroundImageUrl(background.imageUrl) ? background.imageUrl : undefined;
  const customColor = background?.kind === "custom" && isValidAcademyBackgroundColor(background.color) ? background.color : undefined;
  const panel = academyBackgroundNeedsContentPanel(background);
  const style: CSSProperties = {
    ...(customColor ? { "--academy-block-custom-color": customColor } : {}),
    ...(imageUrl ? {
      position: "relative", height: "auto", inset: "auto", overflow: "clip",
      borderRadius: "1.5rem",
    } : {}),
  };

  if (!kind) return <div id={id} data-block-variant={variant} data-academy-block-type={blockType} className={className}>{children}</div>;

  return (
    <div
      id={id}
      data-block-variant={variant}
      data-academy-block-type={blockType}
      data-block-background={kind || "default"}
      className={`${className} academy-block-background academy-block-background-${kind} ${panel ? "academy-block-background-panel" : ""}`}
      style={style}
    >
      {imageUrl ? (
        // Runtime media-library and direct image URLs cannot be constrained to Next image hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" aria-hidden="true" loading="lazy" className="academy-block-background-media"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%", borderRadius: "inherit" }} />
      ) : null}
      <div className="academy-block-background-content">{children}</div>
    </div>
  );
}
