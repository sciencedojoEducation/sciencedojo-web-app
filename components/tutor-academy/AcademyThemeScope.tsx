import type { HTMLAttributes, ReactNode } from "react";
import type { AcademyCourse } from "@/lib/tutor-academy";
import { academyThemeStyle, academyTypographyClass } from "@/lib/academy-theme";
import { academyBodyFont } from "@/lib/academy-fonts";

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
      className={`${academyBodyFont.variable} academy-course-typography ${academyTypographyClass(course)} ${className}`}
    >
      {children}
    </div>
  );
}
