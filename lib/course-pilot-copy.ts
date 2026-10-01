import { isGermanAcademyCourse } from "./german-academy-course";

export function courseMarketingCopy(courseKey: string) {
  return isGermanAcademyCourse(courseKey)
    ? {
        language: "de" as const,
        allCourses: "Alle Kurse",
        outcomes: "Das lernen Sie",
        prerequisites: "Voraussetzungen",
        curriculum: "Kursinhalt",
        pilot: "Kostenloser Pilotkurs",
        pace: "Im eigenen Tempo",
        access: "Zeitlich unbegrenzter Zugang",
        full: "Alle 10 Plätze sind vergeben",
        remaining: (n: number) => `${n} von 10 kostenlosen Plätzen verfügbar`,
        waitlistOpen: "Pilotkurs ausgebucht · Warteliste geöffnet",
        joinFailed:
          "Ihre Anmeldung konnte nicht abgeschlossen werden. Möglicherweise hat sich der Kurs geändert. Laden Sie die Seite neu und versuchen Sie es erneut.",
        continueLearning: "Weiterlernen",
        waitlisted:
          "Sie stehen auf der Warteliste. Damit erhalten Sie noch keinen Kurszugang. Verfügbare Plätze werden manuell vergeben.",
        joinWaitlist: "Zur Warteliste anmelden",
        enroll: "Kostenlos teilnehmen",
        verify:
          "Bitte bestätigen Sie vor der Anmeldung Ihre E-Mail-Adresse und laden Sie anschließend diese Seite neu.",
        registerWaitlist: "Registrieren und zur Warteliste anmelden",
        register: "Registrieren und teilnehmen",
        login: "Bereits registriert? Anmelden",
        noReservation: "Die Registrierung allein reserviert keinen Platz.",
        reviewsHeading: "Bewertungen",
        noReviews: "Noch keine Bewertungen.",
        reviewCount: (n: number) =>
          `${n} ${n === 1 ? "Bewertung" : "Bewertungen"}`,
        lessonCount: (n: number) => `${n} ${n === 1 ? "Lektion" : "Lektionen"}`,
        noPrerequisites:
          "Keine Voraussetzungen angegeben. Prüfen Sie den Kursinhalt, um zu entscheiden, ob dieser Kurs zu Ihnen passt.",
        explore: "Kurs ansehen",
        pending: "Bitte warten…",
      }
    : {
        language: "en" as const,
        allCourses: "All courses",
        outcomes: "What you’ll learn",
        prerequisites: "Before you start",
        curriculum: "Curriculum",
        pilot: "Free pilot",
        pace: "Self-paced",
        access: "No access expiry",
        full: "All 10 places have been claimed",
        remaining: (n: number) => `${n} of 10 free places remaining`,
        waitlistOpen: "Pilot full · waitlist open",
        joinFailed:
          "We couldn’t complete your request. The course may have changed. Refresh and try again.",
        continueLearning: "Continue learning",
        waitlisted:
          "You’re on the waitlist. This does not grant course access. Places are offered manually if available.",
        joinWaitlist: "Join waitlist",
        enroll: "Enroll for free",
        verify:
          "Please verify your email before enrolling, then refresh this page.",
        registerWaitlist: "Register to join waitlist",
        register: "Register to enroll",
        login: "Already registered? Log in",
        noReservation: "Creating an account does not reserve a place.",
        reviewsHeading: "Learner reviews",
        noReviews: "No reviews yet.",
        reviewCount: (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`,
        lessonCount: (n: number) => `${n} ${n === 1 ? "lesson" : "lessons"}`,
        noPrerequisites:
          "No prerequisites specified. Review the curriculum to see whether this course suits you.",
        explore: "Explore course",
        pending: "Saving…",
      };
}
