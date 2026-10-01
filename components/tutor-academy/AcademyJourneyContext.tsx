"use client";

import { createContext } from "react";

// null means the roadmap is standalone; an empty string means no topic is current.
export const AcademyJourneyContext = createContext<string | null>(null);
