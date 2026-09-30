import { Atkinson_Hyperlegible } from "next/font/google";

// Body copy only; Inter and existing editorial heading fonts remain unchanged.
export const academyBodyFont = Atkinson_Hyperlegible({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-academy-body",
});
