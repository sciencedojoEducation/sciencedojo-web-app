"use client";

import React, { ReactNode } from "react";
import { DailyProvider as BaseDailyProvider } from "@daily-co/daily-react";

interface dailyProviderProps {
  children: ReactNode;
}

/**
 * ScienceDojo Video Command Center.
 * Wraps children in the Daily.co React context for high-performance video management.
 */
export function DailyProvider({ children }: dailyProviderProps) {
  return (
    <BaseDailyProvider>
      {children}
    </BaseDailyProvider>
  );
}
