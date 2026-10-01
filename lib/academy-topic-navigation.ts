/** The dock appears only after the inline controls and while the lesson is in view. */
export function shouldDockAcademyTopicNavigator(startTop: number, lessonBottom: number) {
  return startTop < -112 && lessonBottom > 160;
}

/** Small wheel/touch jitter must not immediately close a newly opened menu. */
export function shouldCollapseAcademyTopicNavigator(docked: boolean, scrollY: number, openedAt: number) {
  return !docked || scrollY > openedAt + 48;
}
