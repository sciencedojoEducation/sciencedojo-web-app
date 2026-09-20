"use client";

import { useEffect } from "react";
import { recordAcademyLessonVisit } from "@/app/dashboard/tutor/academy/actions";

export default function AcademyLessonTracker({ lessonSlug }: { lessonSlug: string }) {
  useEffect(() => {
    void recordAcademyLessonVisit(lessonSlug);
  }, [lessonSlug]);

  return null;
}
