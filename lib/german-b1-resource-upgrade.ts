import { b1AudioUrl } from "./german-b1-audio.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock, QuizQuestion } from "./tutor-academy.ts";
import type { B1Question } from "./german-b1-curriculum.ts";
import { b1GrammarLabs } from "./german-b1-grammar-labs.ts";
import { b1FreshReading, b1FreshGoetheReading, b1FreshTelcReading, b1FreshLetter, b1FreshLanguage, b1FreshListening, b1FreshWriting, b1FreshSpeaking } from "./german-b1-fresh-exam.ts";

function choice(id: string, item: B1Question): QuizQuestion {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const labels = [...item.distractors];
  const correct = (hash >>> 0) % 3;
  labels.splice(correct, 0, item.answer);
  return { id, type: "single-choice", prompt: item.prompt, options: labels.map((label, index) => ({ id: ["a", "b", "c"][index], label })), correctOptionId: ["a", "b", "c"][correct], explanation: item.explanation };
}

export function b1ResourceBlocks(lesson: AcademyLesson): LessonBlock[] {
  const prefix = `${lesson.slug}-resource`;
  const blocks: LessonBlock[] = [];
  const context = lesson.blocks.find(block => block.curriculum)?.curriculum;
  const add = (block: LessonBlock, skills: NonNullable<LessonBlock["curriculum"]>["skills"], grammar = context?.grammar || []) => {
    blocks.push({ ...block, curriculum: { cefr: "B1", domain: context?.domain || "educational", topic: lesson.title, functions: context?.functions || ["apply language independently"], ...context, skills, grammar, ...(lesson.examTrack ? { examTrack: lesson.examTrack } : {}) } } as LessonBlock);
  };
  const check = (suffix: string, heading: string, item: B1Question, skills: NonNullable<LessonBlock["curriculum"]>["skills"], grammar?: string[]) => add({ id: `${prefix}-${suffix}`, type: "knowledge-check", heading, question: choice(`${prefix}-${suffix}-question`, item), completion: "view", required: false }, skills, grammar);
  const core = lesson.slug.match(/^de-b1-(\d{2})$/);
  if (core) {
    const index = Number(core[1]) - 1;
    const lab = b1GrammarLabs[index];
    if (!lab) return blocks;
    add({ id: `${prefix}-lab`, type: "comparison-table", heading: "Sprachlabor · Muster verstehen", columns: ["Funktion", "Originalbeispiel", "Worauf achten?"], rows: lab.rules }, ["grammar"], lab.focus);
    lab.questions.forEach((item, i) => check(`grammar-${i + 1}`, `Sprachlabor · Entscheidung ${i + 1}`, item, ["grammar"], lab.focus));
    add({ id: `${prefix}-repair`, type: "writing-practice", heading: "Sprachlabor · reparieren und selbst verwenden", prompt: `${lab.repair} Schreiben Sie die zwei verbesserten Sätze und anschließend zwei bis vier eigene Sätze. ${lab.transfer} Erst selbst schreiben, dann das Modell vergleichen. Die Musterlösung zeigt eine Möglichkeit; eigene Inhalte können anders formuliert werden.`, minWords: 15, maxWords: 140, modelAnswer: lab.model, checklist: ["Beide Fehler korrigiert", "Struktur in eigenen Sätzen verwendet", "Verbposition und Endungen geprüft", "Eine Regel mit eigenen Worten erklärt"], completion: "interact" }, ["grammar", "writing"], lab.focus);
    const prior = [...new Set([index - 1, index - 3].filter(i => i >= 0))];
    const review = prior.length ? prior : [index];
    add({ id: `${prefix}-retrieval`, type: "flashcards", heading: "Sprachlabor · Regel ohne Vorlage abrufen", items: review.map(i => ({ title: `${b1GrammarLabs[i].focus[0]}: Nennen Sie die Regel und einen eigenen Satz.`, body: `${b1GrammarLabs[i].rules[0][2]} Beispiel zur Kontrolle: ${b1GrammarLabs[i].rules[0][1]} Bei Unsicherheit: Grammatik aktiv, Kapitel ${b1GrammarLabs[i].bookUnits}. Die Buchübung ist optional und wird in Ihrem eigenen Exemplar bearbeitet.` })), completion: "interact" }, ["grammar"], review.flatMap(i => b1GrammarLabs[i].focus));
    return blocks;
  }
  const track = lesson.examTrack;
  if (track !== "goethe" && track !== "telc") return blocks;
  const index = Number(lesson.slug.split("-").at(-1));
  const mock = track === "goethe" ? 7 : 8;
  if (index === mock) {
    add({ id: `${prefix}-fresh-guide`, type: "callout", heading: "Frischer Transfercheck · zuerst ohne Hilfen", body: "Diese neuen Originalaufgaben wurden in den vorangegangenen Übungen nicht verwendet. Bearbeiten Sie sie vor dem Öffnen von Lösungen und Modellen. Es ist ein verkürztes Fertigkeitentraining, keine vollständige Prüfungsnachbildung und keine offizielle Punkteprognose. Kursziel: Lesen 20 Minuten, Hören nach Abspielplan, Schreiben im angegebenen Budget, Sprechen mit einer Partnerperson. Kontrollieren Sie Antworten erst nach Ihrem ersten Durchgang; die Kursoberfläche bietet auch früher Rückmeldung. Ein vollständiger frischer Anbietertest bleibt die abschließende Prüfungschallenge.", tone: "amber" }, ["reading", "listening", "writing", "speaking"]);
    if (track === "goethe") {
      b1FreshGoetheReading.forEach((part, i) => {
        add({ id: `${prefix}-read-text-${i + 1}`, type: "text", heading: `Frisch lesen · Teil ${i + 1}`, paragraphs: [b1FreshReading[part.part]] }, ["reading"]);
        part.questions.forEach((item, j) => check(`read-${i + 1}-${j + 1}`, `Frisch lesen · Teil ${i + 1}, Entscheidung ${j + 1}`, item, ["reading"]));
      });
    } else {
      b1FreshTelcReading.forEach((part, i) => {
        add({ id: `${prefix}-read-text-${i + 1}`, type: "text", heading: part.heading, paragraphs: [part.text] }, ["reading"]);
        part.questions.forEach((item, j) => check(`read-${i + 1}-${j + 1}`, `Frisch lesen · Teil ${i + 1}, Entscheidung ${j + 1}`, item, ["reading"]));
      });
      add({ id: `${prefix}-letter`, type: "text", heading: "Sprachbausteine · zusammenhängende Nachricht", paragraphs: [b1FreshLetter, "Wählen Sie jede Ergänzung im Zusammenhang. Lesen Sie danach die vollständige Nachricht noch einmal. Dies übt Entscheidungen im Text; es ersetzt nicht beide vollständigen offiziellen Sprachbaustein-Teile."] }, ["grammar", "vocabulary"]);
      b1FreshLanguage.forEach((item, i) => check(`language-${i + 1}`, "Sprachbausteine · Ergänzung im Kontext", item, ["grammar", "vocabulary"]));
    }
    add({ id: `${prefix}-audio-plan`, type: "text", heading: "Frisch hören · Ihr Abspielplan", paragraphs: track === "goethe" ? ["Nachricht zweimal, Information einmal, Gespräch einmal, Diskussion zweimal. Lesen Sie zuerst die Fragen. Lassen Sie das Transcript bis zur Auswertung geschlossen. Schreiben Sie nach dem ersten Durchgang zu jeder Antwort ein gehörtes Schlüsselwort auf."] : ["Die neuen Aufnahmen trainieren globales, detailliertes und selektives Verstehen. Kursplan: Nachricht einmal, Information einmal, Gespräch zweimal, Diskussion einmal. Dieser Trainingsplan ist keine Zusage über Wiederholungen in einer echten telc-Prüfung; folgen Sie dort den offiziellen Ansagen."] }, ["listening"]);
    b1FreshListening.forEach((recording, i) => {
      add({ id: `${prefix}-audio-${i + 1}`, type: "audio", heading: recording.title, url: b1AudioUrl(recording.id), transcript: recording.segments.map(segment => `${segment.speaker === "Anna" ? "Sprecherin" : "Sprecher"}: ${segment.text}`).join("\n\n"), caption: "Neue originale Trainingsaufnahme mit synthetischen deutschen Stimmen. Keine offizielle Prüfungsaufnahme." }, ["listening"]);
      recording.questions.forEach((item, j) => check(`listen-${i + 1}-${j + 1}`, `Frisch hören · Entscheidung ${j + 1}`, item, ["listening"]));
    });
    b1FreshWriting[track].forEach((task, i) => add({ id: `${prefix}-write-${i + 1}`, type: "writing-practice", heading: task.title, prompt: `${task.prompt} Schreiben Sie zunächst ohne Modell. Prüfen Sie danach Inhaltspunkte, Register, Verbindungen und Verständlichkeit; verbessern Sie zwei konkrete Stellen.`, minWords: task.min, maxWords: task.max, modelAnswer: task.model, checklist: ["Alle Inhaltspunkte behandelt", "Passendes Register und Textaufbau", "Gründe und sinnvolle Verbindungen", "Zwei Stellen nach dem ersten Versuch verbessert"], completion: "interact" }, ["writing"]));
    b1FreshSpeaking[track].forEach((task, i) => add({ id: `${prefix}-speak-${i + 1}`, type: "speaking-practice", heading: task.heading, prompt: `${task.prompt} Der Kursrekorder nimmt höchstens drei Minuten pro Aufnahme auf. Bei längeren Paargesprächen führen Sie das gesamte Gespräch außerhalb des Rekorders durch oder üben einzelne Abschnitte in getrennten Aufnahmen. Die Aufnahmezeit ist keine offizielle Prüfungszeit.`, modelAnswer: `Kurzmodell für den Aufbau; erweitern Sie es mit eigenen Informationen und Rückfragen.\n\n${task.model}`, preparationSeconds: 90, targetSeconds: Math.min(task.target, 180), checklist: ["Aufgabe vollständig behandelt", "Auf die Partnerperson reagiert", "Gründe oder Beispiele genannt", "Frei mit Stichworten statt abgelesen"], completion: "interact" }, ["speaking", "interaction"]));
    add({ id: `${prefix}-log`, type: "writing-practice", heading: "Transfercheck · Fehlerjournal", prompt: "Notieren Sie zwei Fehler aus dem neuen Set. Schreiben Sie jeweils Ihre Antwort, den Text- oder Hörbeleg, die Fehlerursache und eine passende Wiederholung aus einem Kernkapitel auf. Für Schreiben/Sprechen nennen Sie eine konkrete Stelle, die eine Lehrkraft prüfen sollte. Nach drei Tagen wiederholen Sie die Regel an einem neuen Beispiel. 40–100 Wörter.", minWords: 30, maxWords: 140, modelAnswer: "Beim Lesen habe ich die Zeit für die Buchung mit der Zeit für die Abholung verwechselt. Ich markiere künftig neben jeder Uhrzeit die zugehörige Handlung. Bei den Sprachbausteinen war ich unsicher bei freuen über. Ich wiederhole die festen Präpositionen in Kapitel sieben. Bei meiner Partnerplanung möchte ich prüfen lassen, ob ich genügend auf den Gegenvorschlag reagiert habe.", checklist: ["Zwei konkrete Fehler", "Belege statt bloßem Gefühl", "Passendes Kernkapitel", "Ein überprüfbarer nächster Versuch"], completion: "interact" }, ["writing", "grammar", "reading", "listening"]);
  }
  if (index === (track === "goethe" ? 4 : 5)) {
    add({ id: `${prefix}-writing-review`, type: "comparison-table", heading: "Schreiben · die eigene Überarbeitung prüfen", columns: ["Prüfschritt", "Frage", "Konkrete Handlung"], rows: [["Aufgabe", "Ist jeder verlangte Inhalt erkennbar?", "Jeden Leitpunkt einem Satz zuordnen; fehlende Information ergänzen."], ["Register", "Schreibe ich an eine Freundin oder eine Institution?", "Anrede, du/Sie, Bitte und Schluss angleichen."], ["Aufbau", "Kann man meinem Text ohne Rätsel folgen?", "Reihenfolge prüfen; einen passenden Konnektor ergänzen."], ["Sprache", "Welche zwei Fehler kann ich jetzt selbst beheben?", "Finite Verben markieren; Fälle und Adjektivendungen prüfen."]] }, ["writing", "grammar"]);
  }
  if (index === (track === "goethe" ? 5 : 6)) {
    add({ id: `${prefix}-speaking-review`, type: "numbered-list", heading: "Sprechen · Rückmeldung mit Belegen", items: [{ title: "Aufgabe und Interaktion", body: "Notieren Sie eine Stelle, an der die Person einen Vorschlag macht, auf den anderen Vorschlag reagiert und einen gemeinsamen Schritt festhält." }, { title: "Verständlichkeit", body: "Notieren Sie einen gut verständlichen Grund und eine Stelle, bei der Sie nachfragen mussten. Einzelne Fehler zählen ist keine offizielle Bewertung." }, { title: "Zweiter Versuch", body: "Wiederholen Sie mit einer neuen Zeit- oder Kostenbedingung. Nutzen Sie nur Stichworte; prüfen Sie, ob die Reaktion spontaner wird." }] }, ["speaking", "interaction"]);
  }
  if (track === "goethe" && index === 9) {
    add({ id: `${prefix}-book-plan`, type: "process", heading: "Optional · Ihr eigenes Prüfungsbuch gezielt nutzen", items: [{ title: "Standort bestimmen", body: "Zertifikat B1 neu, 15 Übungsprüfungen: Verwenden Sie einen bisher unbearbeiteten Modelltest aus Ihrem eigenen Exemplar. Die Buchaufgaben werden hier nicht eingebunden. Die Ausgabe ist älter; vergleichen Sie Format und Bedingungen mit den aktuellen Goethe-Unterlagen." }, { title: "Module gezielt üben", body: "Bearbeiten Sie an verschiedenen Tagen je ein schwaches Modul aus einem anderen Modelltest. Notieren Sie Beleg und Fehlerursache, nicht nur die Zahl richtiger Antworten." }, { title: "Höraudio bereitstellen", body: "Zum Hörmodul brauchen Sie die zum Buch gehörenden autorisierten Audiodateien. Das hochgeladene PDF enthält keine abspielbaren Aufnahmen. Ohne Audio bearbeiten Sie nur Lesen, Schreiben und Sprechen; ein Transcript ist kein Ersatz für einen Hörtest." }, { title: "Frisches Material reservieren", body: "Lassen Sie mindestens einen Modelltest unangetastet für den späteren Vergleich. Wechseln Sie danach zu einem aktuellen offiziellen Goethe-Satz und lassen Sie Produktion anhand der Anbieterbeschreibungen besprechen." }] }, ["reading", "listening", "writing", "speaking"]);
  }
  return blocks;
}

/** Add original resource-informed practice to a saved draft without replacing authored content. */
export function upgradeGermanB1Resources(course: AcademyCourse): AcademyCourse {
  let changed = false;
  const lessons = course.lessons.map(lesson => {
    const existing = new Set(lesson.blocks.map(block => block.id));
    const additions = b1ResourceBlocks(lesson).filter(block => !existing.has(block.id));
    if (!additions.length) return lesson;
    changed = true;
    const core = /^de-b1-\d{2}$/.test(lesson.slug);
    const anchor = core ? lesson.blocks.findIndex(block => block.id === `${lesson.slug}-grammar-check`) : -1;
    const blocks = [...lesson.blocks];
    blocks.splice(anchor >= 0 ? anchor + 1 : blocks.length, 0, ...additions);
    const extra = core ? 25 : lesson.slug === "de-b1-goethe-07" ? 130 : lesson.slug === "de-b1-telc-08" ? 105 : 10;
    return { ...lesson, blocks, durationMinutes: lesson.durationMinutes + extra };
  });
  if (!changed) return course;
  const coreMinutes = lessons.filter(lesson => !lesson.examTrack).reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
  const routeMinutes = (course.examTracks || []).map(track => lessons.filter(lesson => lesson.examTrack === track.id).reduce((sum, lesson) => sum + lesson.durationMinutes, 0));
  return { ...course, lessons, estimatedMinutes: coreMinutes + (routeMinutes.length ? Math.min(...routeMinutes) : 0) };
}
