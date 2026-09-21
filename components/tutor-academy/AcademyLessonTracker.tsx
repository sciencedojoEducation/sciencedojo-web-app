"use client";

import { useEffect } from "react";
import { recordAcademyLessonVisit } from "@/app/dashboard/tutor/academy/actions";

export default function AcademyLessonTracker({ lessonSlug, courseKey }: { lessonSlug: string; courseKey: string }) {
  useEffect(() => {
    void recordAcademyLessonVisit(courseKey, lessonSlug);
  }, [courseKey, lessonSlug]);

  return null;
}
