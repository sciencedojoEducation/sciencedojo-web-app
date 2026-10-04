"use client";

import { createContext } from "react";

/** A themed course shell owns the hamburger; lesson topics must not add another. */
export const AcademyCourseNavigationContext = createContext(false);
