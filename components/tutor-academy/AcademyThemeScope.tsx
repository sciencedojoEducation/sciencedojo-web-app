import type { HTMLAttributes, ReactNode } from "react";
import type { AcademyCourse } from "@/lib/tutor-academy";
import { academyThemeStyle, academyTypographyClass } from "@/lib/academy-theme";

export default function AcademyThemeScope({
  course,
  children,
  className = "",
  ...props
}: {
  course: Pick<AcademyCourse, "theme">;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "style">) {
  return (
    <div
      {...props}
      style={academyThemeStyle(course)}
      className={`${academyTypographyClass(course)} ${className}`}
    >
      {children}
    </div>
  );
}
