"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { EngineeringInterest } from "@/lib/engineering-demo";

const InterestContext = createContext<{ interest: EngineeringInterest; choose: (interest: EngineeringInterest) => void } | null>(null);

export function useEngineeringInterest() {
  const context = useContext(InterestContext);
  if (!context) throw new Error("Engineering interest requires its provider.");
  return context;
}

export default function EngineeringExperience({ children }: { children: ReactNode }) {
  const [interest, choose] = useState<EngineeringInterest>("unsure");
  return <InterestContext.Provider value={{ interest, choose }}>{children}</InterestContext.Provider>;
}
