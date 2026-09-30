import { germanA1Curriculum, type GermanA1Skill } from "./german-a1-curriculum.ts";

/** Topic labels from the Goethe Start Deutsch 1 vocabulary specification,
 * plus its cross-topic number and calendar categories. These tags describe
 * coverage, not an affiliation with or endorsement by Goethe. */
export const germanA1CoverageAreas = [
  "person", "wohnen", "umwelt", "reisen-verkehr", "essen-trinken",
  "einkaufen-gebrauchsartikel", "dienstleistungen", "bildung-lernen",
  "arbeit-beruf", "freizeit-unterhaltung", "zahlen-preise", "zeit-datum",
  "laender-sprachen", "farben-mengen",
] as const;

export type GermanA1CoverageArea = (typeof germanA1CoverageAreas)[number];

const areaMap: Record<number, GermanA1CoverageArea[]> = {
  1: ["person", "zahlen-preise", "laender-sprachen"],
  2: ["person", "laender-sprachen", "zahlen-preise"],
  3: ["person", "arbeit-beruf"],
  4: ["zeit-datum", "zahlen-preise", "bildung-lernen"],
  5: ["wohnen", "einkaufen-gebrauchsartikel", "zahlen-preise"],
  6: ["essen-trinken", "einkaufen-gebrauchsartikel", "farben-mengen", "zahlen-preise"],
  7: ["einkaufen-gebrauchsartikel", "farben-mengen", "zahlen-preise"],
  8: ["dienstleistungen", "reisen-verkehr", "zeit-datum"],
  9: ["reisen-verkehr", "dienstleistungen", "zeit-datum", "zahlen-preise"],
  10: ["arbeit-beruf", "bildung-lernen", "zeit-datum", "laender-sprachen"],
  11: ["freizeit-unterhaltung", "zeit-datum", "person"],
  12: ["person", "dienstleistungen", "zeit-datum"],
  13: ["umwelt", "freizeit-unterhaltung", "zeit-datum"],
  14: ["dienstleistungen", "person", "zeit-datum", "bildung-lernen"],
  15: [...germanA1CoverageAreas],
};

const allSkills: GermanA1Skill[] = ["hoeren", "lesen", "schreiben", "sprechen"];

const examTransferMap: Record<number, string> = {
  1: "Namen und Nummern aus einer Anmeldung verstehen; Formularfelder ausfüllen.",
  2: "Persönliche Angaben aus kurzen Gesprächen verstehen; sich mündlich vorstellen.",
  3: "Ein Personenprofil lesen und Beziehungen beschreiben.",
  4: "Uhrzeiten, Daten und Änderungen in Ansagen oder Nachrichten erkennen.",
  5: "Wohnungsanzeigen vergleichen und eine kurze Anfrage schreiben.",
  6: "Speisekarten und Bestellungen verstehen; im Gespräch bestellen.",
  7: "Preise, Farben und Größen in Anzeigen und Verkaufsgesprächen erkennen.",
  8: "Öffnungszeiten, Wegbeschreibungen und Schalterauskünfte verstehen.",
  9: "Fahrpläne, Ansagen und Ticketinformationen für eine Reise nutzen.",
  10: "Kurs- und Arbeitspläne lesen; formell nach einem Kurs fragen.",
  11: "Einladungen verstehen und ein Treffen schriftlich oder mündlich vereinbaren.",
  12: "Eine einfache Beschwerde nennen, Hilfe erbitten und Praxishinweise lesen.",
  13: "Wetterbericht verstehen und einen passenden Plan vorschlagen.",
  14: "Formular und kurze Nachricht unter Zeitdruck vollständig beantworten.",
  15: "Hören, Lesen, Schreiben und Sprechen in wechselnden A1-Situationen verbinden.",
};

export const germanA1CoverageMatrix = germanA1Curriculum.map((chapter) => ({
  chapterNumber: chapter.number,
  chapterTitle: chapter.title,
  officialAreas: areaMap[chapter.number],
  skills: allSkills,
  grammarInContext: chapter.grammarInContext,
  listeningSituation: chapter.listeningSituation,
  readingText: chapter.readingText,
  writingTask: chapter.writingTask,
  speakingTask: chapter.speakingTask,
  examTransfer: examTransferMap[chapter.number],
}));
