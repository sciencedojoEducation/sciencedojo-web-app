import Image from "next/image";

type SDLogoBadgeSize = "sm" | "md" | "lg";
type SDLogoBadgeVariant = "circle" | "rounded" | "minimal" | "light";

type SDLogoBadgeProps = {
  size?: SDLogoBadgeSize;
  variant?: SDLogoBadgeVariant;
  className?: string;
  alt?: string;
  priority?: boolean;
};

const sizeClasses: Record<SDLogoBadgeSize, { badge: string; image: number }> = {
  sm: { badge: "h-6 w-6 p-1", image: 16 },
  md: { badge: "h-10 w-10 p-1", image: 32 },
  lg: { badge: "h-14 w-14 p-1.5", image: 48 },
};

const variantClasses: Record<SDLogoBadgeVariant, string> = {
  circle: "rounded-full border border-[#E5EAF2] bg-white shadow-[0_8px_22px_rgba(15,35,70,0.10)]",
  rounded: "rounded-2xl border border-[#E5EAF2] bg-white shadow-[0_8px_22px_rgba(15,35,70,0.10)]",
  minimal: "rounded-full border border-[#E5EAF2] bg-white shadow-sm",
  light: "rounded-full bg-white shadow-[0_8px_22px_rgba(15,35,70,0.08)]",
};

const lightSizeClasses: Record<SDLogoBadgeSize, { badge: string; image: number }> = {
  sm: { badge: "h-6 w-6", image: 24 },
  md: { badge: "h-11 w-11", image: 44 },
  lg: { badge: "h-14 w-14", image: 56 },
};

export default function SDLogoBadge({
  size = "md",
  variant = "circle",
  className = "",
  alt = "ScienceDojo SD logo",
  priority = false,
}: SDLogoBadgeProps) {
  const selectedSize = variant === "light" ? lightSizeClasses[size] : sizeClasses[size];
  const src = variant === "light" ? "/images/sd-logo-light.png" : "/images/sd-logo-transparent.png";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        selectedSize.badge,
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      <Image
        src={src}
        alt={alt}
        width={selectedSize.image}
        height={selectedSize.image}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
