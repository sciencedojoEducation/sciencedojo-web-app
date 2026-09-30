"use client";

import { useEffect } from "react";
import { recordAcademyLessonVisit } from "@/app/dashboard/tutor/academy/actions";

export default function AcademyLessonTracker({ lessonSlug, courseKey, basePath }: { lessonSlug: string; courseKey: string; basePath?: string }) {
  useEffect(() => {
    void recordAcademyLessonVisit(courseKey, lessonSlug, basePath);
  }, [basePath, courseKey, lessonSlug]);

  return null;
}
