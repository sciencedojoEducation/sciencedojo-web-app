import { migrateAcademyCourse } from "./academy-schema.ts";
import { germanA2Chapters, germanA2Sources, type A2Chapter, type A2Question } from "./german-a2-curriculum.ts";
import { a2ExamSets, type A2ExamSet } from "./german-a2-exam-practice.ts";
import { a2MasteryMissions } from "./german-a2-mastery.ts";
import { styleGermanA2Course } from "./german-a2-visual-design.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock, QuizQuestion } from "./tutor-academy.ts";

export const GERMAN_A2_COURSE_KEY = "german-a2-complete";
type Skills = NonNullable<LessonBlock["curriculum"]>["skills"];
type Track = "goethe" | "telc";
const number = (index: number) => String(index + 1).padStart(2, "0");
const allSkills: Skills = ["reading", "listening", "writing", "speaking", "interaction"];
const sections = [
  { id: "a2-bridge", title: "Von A1 zu verbundenem Deutsch" },
  { id: "a2-personal", title: "Menschen, Zeit und Erlebnisse" },
  { id: "a2-everyday", title: "Wohnen, Essen und Einkaufen" },
  { id: "a2-public", title: "Stadt, Reisen und Arbeit" },
  { id: "a2-social", title: "Lernen, Gesundheit und Zusammenleben" },
  { id: "a2-mastery", title: "A2 Mastery" },
  { id: "a2-goethe", title: "Goethe-Zertifikat A2" },
  { id: "a2-telc", title: "Start Deutsch 2 / telc Deutsch A2" },
];

export function a2Choice(id: string, item: A2Question): QuizQuestion {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const labels = [...item.distractors];
  const correct = (hash >>> 0) % 3;
  labels.splice(correct, 0, item.answer);
  return { id, type: "single-choice", prompt: item.prompt, options: labels.map((label, i) => ({ id: ["a", "b", "c"][i], label })), correctOptionId: ["a", "b", "c"][correct], explanation: item.explanation };
}
function check(id: string, heading: string, item: A2Question, completion: "pass" | "view" = "pass"): LessonBlock {
  return { id, type: "knowledge-check", heading, question: a2Choice(`${id}-question`, item), completion };
}
function tag(chapter: A2Chapter, item: LessonBlock, skills: Skills, track?: Track): LessonBlock {
  return { ...item, curriculum: { cefr: "A2", domain: chapter.domain, topic: chapter.title, skills, functions: [chapter.function], grammar: chapter.grammar, ...(track ? { examTrack: track } : {}) } };
}
const diagnostics: A2Question[] = [
  { prompt: "Präsens: Er ___ in Bonn. (wohnen)", answer: "wohnt", distractors: ["wohnen", "wohnst"], explanation: "Er/sie/es verwendet die Endung -t: wohnt." },
  { prompt: "Akkusativ: Ich besuche ___ Kurs.", answer: "den", distractors: ["dem", "der"], explanation: "Besuchen + Akkusativ: den Kurs." },
  { prompt: "Dativ: Ich helfe ___ Freundin.", answer: "meiner", distractors: ["meine", "meinen"], explanation: "Helfen + Dativ: meiner Freundin." },
  { prompt: "Modalverb: Welcher Satz ist richtig?", answer: "Ich möchte morgen lernen.", distractors: ["Ich möchte morgen zu lernen.", "Ich morgen lernen möchte."], explanation: "Modalverb auf Position zwei; Infinitiv ohne zu am Ende." },
  { prompt: "Trennbares Verb: Welcher Satz ist richtig?", answer: "Ich stehe um sieben auf.", distractors: ["Ich aufstehe um sieben.", "Ich stehe auf um sieben bin."], explanation: "Stehe auf bildet die Satzklammer." },
  { prompt: "Perfekt: Welcher Satz ist richtig?", answer: "Ich bin nach Köln gefahren.", distractors: ["Ich habe nach Köln gefahren.", "Ich bin nach Köln gefahrt."], explanation: "Fahren mit Ortswechsel: sein + gefahren." },
  { prompt: "Satzposition und Frage: Welche Frage ist richtig?", answer: "Wann beginnt der Kurs?", distractors: ["Wann der Kurs beginnt? (direkte Frage)", "Wann beginnen der Kurs?"], explanation: "Direkte W-Frage: Fragewort, finites Verb, Subjekt." },
];
function coreLesson(chapter: A2Chapter, index: number): AcademyLesson {
  const id = `de-a2-${number(index)}`;
  const section = sections[index === 0 ? 0 : index < 4 ? 1 : index < 7 ? 2 : index < 10 ? 3 : index < 15 ? 4 : 5];
  const blocks: LessonBlock[] = [];
  const add = (item: LessonBlock, skills: Skills) => blocks.push(tag(chapter, item, skills));
  add({ id: `${id}-entry`, type: "callout", heading: "1 · Einstieg", body: `${chapter.outcome} Ihre Situation: ${chapter.mission} Was würden Sie zuerst sagen?`, tone: "blue" }, ["interaction"]);
  if (index === 0) {
    add({ id: `${id}-diagnostic-guide`, type: "text", heading: "A1-Diagnose · reaktivieren statt neu beginnen", paragraphs: ["Antworten Sie ohne Hilfe. Notieren Sie falsche Antworten nach Thema. Diese kurze Selbstdiagnose ist nicht adaptiv; sie erstellt keine automatische Einstufung. Hören, Schreiben und Sprechen prüfen Sie mit den folgenden Aufgaben dieses Kapitels.", "A1: Ich heiße Mila. Ich komme aus Polen. A2: Ich heiße Mila und komme ursprünglich aus Polen. Seit einem Jahr wohne ich in Bonn und arbeite in einem Hotel."] }, ["grammar", "speaking"]);
    diagnostics.forEach((item, i) => add(check(`${id}-diagnostic-${i}`, `Startdiagnose ${i + 1}`, item, "view"), ["grammar"]));
    add({ id: `${id}-plan`, type: "comparison-table", heading: "Ihr persönlicher A2-Plan", columns: ["Unsicher bei", "Wiederholung", "Nachweis"], rows: [["Präsens, Fälle, Modalverben", "Kapitel 1, 5, 8, 12", "Drei eigene richtige Sätze"], ["Perfekt und Wortstellung", "Kapitel 1 und 4", "Ein Wochenende erzählen"], ["Hören", "Kursnachricht in Kapitel 1", "Tag, Zeit, Raum ohne Transcript"], ["Schreiben", "Startnachricht dieses Kapitels", "Alle vier Inhaltspunkte"], ["Sprechen", "Vier Sprechmodi dieses Kapitels", "Verständliche Aufnahme und Rückfragen"]] }, allSkills);
  }
  add({ id: `${id}-words`, type: "flashcards", heading: "2 · Wortschatz im Kontext", items: chapter.vocabulary.map(([title, meaning, example], i) => ({ id: `${id}-word-${i}`, title, body: `${meaning}. ${example} Sagen Sie danach einen eigenen Satz, ohne auf die Antwort zu schauen.` })), completion: "interact" }, ["vocabulary"]);
  add({ id: `${id}-listen-guide`, type: "text", heading: "3 · Hören", paragraphs: ["Hören Sie zuerst ohne Transcript: Wer spricht und worum geht es? Hören Sie dann für Zeiten, Zahlen, Änderungen und den nächsten Schritt. Antworten Sie vor dem Öffnen des Transcripts."] }, ["listening"]);
  add({ id: `${id}-audio`, type: "audio", heading: "Eine Nachricht aus dem Alltag", url: `/audio/german-a2/${id}.m4a`, transcript: chapter.listening, caption: "Originaler ScienceDojo-Text mit synthetischer deutscher Stimme. Transcript erst zur Kontrolle öffnen." }, ["listening"]);
  add(check(`${id}-listen-check`, "Hören · Information und Beleg", chapter.listeningCheck), ["listening"]);
  add({ id: `${id}-read`, type: "text", heading: "4 · Lesen", paragraphs: [chapter.reading, "Markieren Sie den Beleg für Ihre Antwort. Achten Sie auf nicht, nur, erst und neue Zeitangaben."] }, ["reading"]);
  add(check(`${id}-read-check`, "Lesen · genau verstehen", chapter.readingCheck), ["reading"]);
  add({ id: `${id}-notice`, type: "worked-example", heading: "5 · Sprache entdecken", problem: "Was drückt das Beispiel aus, und wo stehen die Verben?", steps: [{ title: "Beobachten", body: chapter.example }, { title: "Markieren", body: "Markieren Sie finite Verben, Infinitive oder Partizipien. Welche Wörter verbinden Informationen?" }, { title: "Übertragen", body: "Verändern Sie eine Person, eine Zeit oder einen Gegenstand. Sprechen Sie Ihren neuen Satz." }], answer: chapter.example }, ["grammar"]);
  add({ id: `${id}-grammar`, type: "text", heading: "6 · Grammatik für Ihre Situation", paragraphs: [chapter.rule, "Sprechen Sie das Beispiel zuerst. Erklären Sie dann mit eigenen Worten, wie es funktioniert."] }, ["grammar"]);
  add(check(`${id}-grammar-check`, "Grammatik · anwenden", chapter.grammarCheck), ["grammar"]);
  add({ id: `${id}-phrases`, type: "flashcards", heading: "7 · Redemittel", items: chapter.phrases.map(([title, body]) => ({ title, body: `${body}. Ergänzen Sie den Ausdruck mit eigenen Informationen.` })), completion: "interact" }, ["vocabulary", "speaking", "writing"]);
  add({ id: `${id}-phrasebook`, type: "writing-practice", heading: "Meine Redemittel · Ihr persönlicher Eintrag", prompt: "Speichern Sie in dieser Aufgabe zwei Redemittel dieses Kapitels und je einen eigenen Beispielsatz. Sie können Ihre gespeicherte Antwort später in dieser Lektion wieder öffnen.", minWords: 15, maxWords: 80, checklist: ["Zwei passende Redemittel", "Eigene Informationen statt nur Kopieren"], modelAnswer: `${chapter.phrases.map(([title, body]) => `${title} (${body})`).join("; ")}. Mein eigener Beispielsatz: ${chapter.example}`, completion: "interact" }, ["vocabulary", "writing"]);
  const modes = [
    { mode: "Answer · antworten", prompt: `Antworten Sie auf die Leitfragen dieser Aufgabe: ${chapter.speaking}`, model: chapter.speakingModel, seconds: 45 },
    { mode: "Ask · fragen", prompt: `Formulieren Sie drei Fragen zu dieser Situation und beantworten Sie anschließend eine Rückfrage: ${chapter.interaction}`, model: chapter.interactionModel, seconds: 45 },
    { mode: "Describe · beschreiben", prompt: chapter.speaking, model: chapter.speakingModel, seconds: index < 4 ? 60 : 90 },
    { mode: "Interact · gemeinsam handeln", prompt: `${chapter.interaction} Üben Sie mit einer Partnerperson. Allein: Sprechen Sie beide Rollen abwechselnd und reagieren Sie auf einen Einwand.`, model: chapter.interactionModel, seconds: 120 },
  ];
  modes.forEach((mode, i) => add({ id: `${id}-speak-${i}`, type: "speaking-practice", heading: `8 · Sprechen: ${mode.mode}`, prompt: mode.prompt, preparationSeconds: 45, targetSeconds: mode.seconds, checklist: ["Auf die Aufgabe eingehen", "Eigene verständliche Sätze", "Passende Frage oder Rückfrage", "Ergebnis oder Schluss nennen"], modelAnswer: `Kurzmodell; ergänzen Sie eigene Informationen und spontane Rückfragen.\n\n${mode.model}`, completion: "interact" }, i === 1 || i === 3 ? ["speaking", "interaction"] : ["speaking"]));
  add({ id: `${id}-write-guide`, type: "process", heading: "9 · Schreiben: planen und prüfen", items: [{ title: "Punkte", body: chapter.writing }, { title: "Verbinden", body: "Verbinden Sie passende Gedanken mit und, aber, weil oder deshalb. Verwenden Sie nur Strukturen, die zur Bedeutung passen." }, { title: "Prüfen", body: "Alle Punkte? Passende Anrede? du/Sie konsequent? Verbposition, Uhrzeit und gewünschte Handlung klar?" }] }, ["writing"]);
  add({ id: `${id}-writing`, type: "writing-practice", heading: "Ihre eigene Nachricht", prompt: chapter.writing, minWords: index < 4 ? 35 : 40, maxWords: 85, checklist: ["Alle genannten Inhaltspunkte", "Anrede und Schluss", "Mindestens eine passende Verbindung", "Konkrete Information oder Bitte"], modelAnswer: chapter.writingModel, completion: "interact" }, ["writing"]);
  add({ id: `${id}-everyday`, type: "callout", heading: "10 · Deutsch im Alltag", body: chapter.everyday, tone: "teal" }, ["interaction", "mediation"]);
  add({ id: `${id}-mission`, type: "process", heading: "11 · Mission", items: [{ title: "Verstehen", body: "Fassen Sie Text und Aufnahme in zwei eigenen Sätzen zusammen. Was bleibt gleich, was ändert sich?" }, { title: "Handeln", body: chapter.mission }, { title: "Nachweisen", body: "Speichern Sie Ihre Nachricht und Ihre Aufnahme in den Schreib- und Sprechaufgaben. Prüfen Sie alle Inhaltspunkte mit einer Partnerperson oder Lehrkraft." }] }, allSkills);
  const preview = a2ExamSets[0].reading[index % 4];
  add({ id: `${id}-exam-text`, type: "text", heading: `12 · Prüfungsblick · ${index % 2 ? "telc" : "Goethe"}`, paragraphs: ["Kurze Originalübung zu einer Prüfungsfertigkeit. Die vollständigen Formate folgen nach A2 Mastery.", preview.text] }, ["reading"]);
  add(check(`${id}-exam-check`, "Prüfungsblick · mit Beleg entscheiden", preview.questions[index % 2]), ["reading"]);
  const previous = [...new Set([index, index - 1, index - 3, index - 7].filter((i) => i >= 0))];
  add({ id: `${id}-recall`, type: "flashcards", heading: "13 · Recall: heute, in drei Tagen, in einer Woche", items: previous.flatMap((i) => germanA2Chapters[i].vocabulary.slice(0, 2).map(([title, meaning, example]) => ({ title: `Erinnern: ${meaning}`, body: `${title}. ${example}` }))), completion: "interact" }, ["vocabulary"]);
  add({ id: `${id}-mastery-guide`, type: "numbered-list", heading: "14 · Chapter Mastery", items: [{ title: "Verstehen", body: "Nennen Sie Hauptaussage, eine konkrete Information und den Beleg aus Text und Aufnahme." }, { title: "Produzieren", body: "Prüfen Sie Ihre Nachricht und Aufnahme: alle Punkte, klare Zeiten, passende Verbindungen, verständliche Reaktion." }, { title: "Übertragen", body: "Wiederholen Sie die Mission mit einer anderen Person oder Zeit. Verbessern Sie eine konkrete Stelle statt nur das Modell zu lesen." }] }, allSkills);
  add(check(`${id}-mastery-check`, "Mastery · eine Entscheidung treffen", chapter.mastery), ["interaction", "reading"]);
  if (index === 15) {
    for (const mission of a2MasteryMissions) {
      add({ id: `${mission.id}-read`, type: "text", heading: `Mastery-Mission · ${mission.title}`, paragraphs: [mission.reading] }, ["reading"]);
      add({ id: `${mission.id}-audio`, type: "audio", heading: "Neue Information · ohne Transcript hören", url: `/audio/german-a2/${mission.id}.m4a`, transcript: mission.listening, caption: "Originaler Transferfall mit synthetischer deutscher Stimme." }, ["listening"]);
      add(check(`${mission.id}-check`, "Die nächste Handlung", mission.question), ["reading", "listening", "interaction"]);
      add({ id: `${mission.id}-write`, type: "writing-practice", heading: "Schriftlich reagieren", prompt: mission.writing, minWords: 40, maxWords: 85, checklist: ["Alle Inhaltspunkte", "Änderung berücksichtigt", "Konkrete Frage oder Bitte", "Passende Anrede und Schluss"], modelAnswer: mission.model, completion: "interact" }, ["writing"]);
      add({ id: `${mission.id}-speak`, type: "speaking-practice", heading: "Mündlich handeln", prompt: mission.interaction, preparationSeconds: 45, targetSeconds: 120, checklist: ["Fragen und antworten", "Auf neue Information reagieren", "Ergebnis bestätigen"], modelAnswer: mission.interactionModel, completion: "interact" }, ["speaking", "interaction"]);
    }
    add({ id: `${id}-readiness`, type: "comparison-table", heading: "Ihr A2-Profil · gezielte Wiederholung", columns: ["Bereich", "Nachweis", "Wiederholen"], rows: [["Lesen", "Bedingungen und Änderungen mit Beleg erkennen", "Kapitel 5, 8, 9"], ["Hören", "Zeiten, Zahlen und Handlungsauftrag ohne Transcript", "Kapitel 3, 9, 12"], ["Schreiben", "Alle Inhaltspunkte in einer verbundenen Nachricht", "Kapitel 10, 11, 14"], ["Sprechen", "Beschreiben, fragen, reagieren und vereinbaren", "Kapitel 2, 13, 15"], ["Grammatik", "Vergangenheit, Fälle, Gründe und Folgen passend verwenden", "Kapitel 4, 5, 11, 15"]] }, allSkills);
    add({ id: `${id}-choice`, type: "callout", heading: "Ihr nächster Weg", body: "Nach den gemeinsamen Kapiteln und dem internen Abschlusstest wählen Sie Goethe A2 oder telc Deutsch A2. Die interne Grenze von 70 % dient der Kursnavigation; Schreiben und Sprechen brauchen zusätzlich Selbstkontrolle und möglichst Feedback einer Lehrkraft. Der bestehende Kursablauf bietet keinen separaten diagnostischen Direkteinstieg in die Prüfungswege.", tone: "blue" }, allSkills);
  }
  return { id: `${id}-lesson`, slug: id, sectionId: section.id, section: section.title, title: `${index + 1}. ${chapter.title}`, summary: chapter.outcome, durationMinutes: index === 15 ? 180 : 120, blocks };
}

const trackTitles = ["Ihre Prüfung verstehen", "Lesen · Formate und Belege", "Hören · Notizen und Entscheidungen", "Schreiben · alle Inhaltspunkte", "Sprechen · fragen, erzählen, vereinbaren", "Strategien und typische Fehler", "ScienceDojo Mini-Mock 1", "Persönliche Fehleranalyse", "ScienceDojo Mini-Mock 2", "Offizielle Prüfungspraxis"];
function examLesson(track: Track, index: number): AcademyLesson {
  const id = `de-a2-${track}-${number(index)}`;
  const section = sections[track === "goethe" ? 6 : 7];
  const blocks: LessonBlock[] = [];
  const chapter = { ...germanA2Chapters[15], title: trackTitles[index], function: `prepare ${track} A2 examination` };
  const add = (item: LessonBlock, skills: Skills) => blocks.push(tag(chapter, item, skills, track));
  const text = (suffix: string, heading: string, paragraphs: string[], skills: Skills) => add({ id: `${id}-${suffix}`, type: "text", heading, paragraphs }, skills);
  const writingBlock = (suffix: string, heading: string, prompt: string, modelAnswer: string, minWords: number, maxWords: number) => add({ id: `${id}-${suffix}`, type: "writing-practice", heading, prompt, modelAnswer, minWords, maxWords, checklist: ["Alle verlangten Informationen", "Anrede und Schluss bei Nachrichten", "Passendes Register", "Wortzahl und Verbposition prüfen"], completion: "interact" }, ["writing"]);
  const reading = (set: A2ExamSet) => {
    text("read-guide", "Aufgabenformate", [track === "goethe" ? "Goethe A2 Lesen hat vier Teile: Artikel, Orientierung in Informationstafeln, persönliche Nachricht und Zuordnung von Situationen zu Anzeigen. In Zuordnungen kann keine Anzeige passen (X)." : "telc A2 Lesen hat drei Teile: Informationen auswählen, Aussagen zu einem Text als richtig/falsch beurteilen, Situationen Anzeigen zuordnen; eine Situation kann ohne passende Anzeige bleiben (X).", "Die Aufgaben hier sind verkürzt. Zuordnungen und Richtig/Falsch trainieren wir mit Auswahlchecks; im offiziellen Test nutzen Sie dessen Antwortbogen und Regeln."], ["reading"]);
    const tasks = track === "goethe" ? set.reading : [set.reading[1], set.reading[2], set.reading[3]];
    tasks.forEach((task, i) => {
      text(`read-${i}`, `Teil ${i + 1} · ${task.title}`, [task.text], ["reading"]);
      const questions = track === "telc" && i === 1 ? task.questions.slice(0, 1) : task.questions;
      questions.forEach((item, j) => add(check(`${id}-read-${i}-${j}`, "Antwort mit Textbeleg", item), ["reading"]));
    });
  };
  const listening = (set: A2ExamSet) => {
    text("listen-guide", "Hörformate und Abspielplan", [track === "goethe" ? "Goethe A2: Teil 1 kurze Nachrichten zweimal; Teil 2 Gespräch mit Zuordnung einmal; Teil 3 kurze Gespräche einmal; Teil 4 Interview mit Ja/Nein zweimal. Unsere Auswahlchecks für Teil 2 ersetzen die Bildzuordnung nur im Training." : "telc A2: Teil 1 Telefonnotizen ergänzen, zweimal; Teil 2 kurze Texte mit Auswahl, einmal; Teil 3 Gespräch zuordnen, zweimal. Die Notizaufgabe ist ein freier Eintrag; die Zuordnung wird hier mit Auswahlchecks trainiert.", "Setzen Sie einen externen Timer und spielen Sie nur die angegebene Anzahl ab. Die Plattform sperrt zusätzliche Wiedergaben nicht. Transcript und Modelle erst nach dem Antworten öffnen."], ["listening"]);
    const order = track === "goethe" ? [0, 1, 2, 3] : [0, 2, 1];
    order.forEach((recordingIndex, i) => {
      const recording = set.audio[recordingIndex];
      add({ id: `${id}-audio-${i}`, type: "audio", heading: `Teil ${i + 1} · ${recording.title}`, url: `/audio/german-a2/${recording.id}.m4a`, transcript: recording.segments.map((segment) => segment.text).join("\n\n"), caption: "Originaltraining mit synthetischen deutschen Stimmen. Keine offizielle Prüfungsaufnahme." }, ["listening"]);
      if (track === "telc" && i === 0) {
        add({ id: `${id}-notes`, type: "writing-practice", heading: "Teil 1 · fünf Telefonnotizen", prompt: set.notePrompt, minWords: 5, maxWords: 25, modelAnswer: set.noteModel, checklist: ["Fünf Felder", "Zahlen und Namen genau", "Transcript erst nach dem Eintragen"], completion: "interact" }, ["listening", "writing"]);
      } else recording.questions.forEach((item, j) => add(check(`${id}-listen-${i}-${j}`, "Hören · gezielt entscheiden", item), ["listening"]));
    });
  };
  const writing = (set: A2ExamSet) => {
    text("write-guide", "Inhalt vor Form", [track === "goethe" ? "Goethe A2 Schreiben: SMS mit 20–30 Wörtern und E-Mail mit 30–40 Wörtern; jeweils alle drei Inhaltspunkte. Zusammen 30 Minuten. Die Wortgrenzen der Aufgaben entsprechen diesem Modellformat." : "telc A2 Schreiben: fünf Informationen in ein Formular eintragen und eine persönliche Nachricht mit etwa 40 Wörtern. Im Modell wählen Sie drei von vier angebotenen Punkten und schreiben zu jedem ein bis zwei Sätze. Lesen und Schreiben teilen sich 50 Minuten; die Wortspanne hier ist ein Trainingsziel."], ["writing"]);
    if (track === "goethe") {
      writingBlock("sms", "Teil 1 · SMS", set.smsPrompt, set.smsModel, 20, 30);
      writingBlock("email", "Teil 2 · E-Mail", set.emailPrompt, set.emailModel, 30, 40);
    } else {
      writingBlock("form", "Teil 1 · Formular", set.formPrompt, set.formModel, 5, 25);
      writingBlock("message", "Teil 2 · persönliche Nachricht", set.telcPrompt, set.telcModel, 30, 55);
    }
  };
  const speaking = (set: A2ExamSet) => {
    const tasks = track === "goethe" ? [
      ["Teil 1 · Fragen zur Person", "Karten: Wohnort, Arbeit, Wochenende, Sprachen. Stellen Sie zu jedem Stichwort eine Frage und antworten Sie auf die Fragen Ihrer Partnerperson.", "Wo wohnen Sie? Was machen Sie beruflich? Was machen Sie am Wochenende? Welche Sprachen sprechen Sie? — Ich wohne in Bonn und arbeite im Hotel. Am Wochenende koche ich gern. Ich spreche Polnisch und etwas Deutsch."],
      ["Teil 2 · von sich erzählen", set.personalTopic, set.personalModel],
      ["Teil 3 · einen Termin finden", set.calendar, set.calendarModel],
    ] : [
      ["Teil 1 · sich vorstellen", "Stellen Sie sich vor: Name, Herkunft, Wohnort, Arbeit, Sprachen, Familie und Hobby. Antworten Sie auf eine Rückfrage.", "Ich heiße Mila Nowak. Ich komme aus Polen und wohne in Bonn. Ich arbeite im Hotel. Ich spreche Polnisch und Deutsch. Meine Schwester wohnt in Köln. Ich koche gern. — Ja, ich lebe seit einem Jahr hier."],
      ["Teil 2 · Alltagsgespräch", `Thema Freizeit: Fragen und antworten Sie über Aktivitäten, Ort und Zeit. ${set.personalTopic} Reagieren Sie auf eine Antwort mit einer Rückfrage.`, `A: Was machen Sie am Wochenende? B: ${set.personalModel} A: Mit wem machen Sie das? B: Meist mit Freunden. Was machen Sie gern?`],
      ["Teil 3 · etwas aushandeln", set.calendar, set.calendarModel],
    ];
    text("speak-guide", "Gemeinsam sprechen", [track === "goethe" ? "Trainieren Sie Fragen zur Person, eine kurze Beschreibung des eigenen Lebens und eine gemeinsame Terminvereinbarung. Benutzen Sie Stichwörter statt auswendig gelesener Texte." : "Die telc-Prüfung hat keine Vorbereitungszeit. Trainieren Sie Vorstellung, Alltagsgespräch und Aushandeln eines Ergebnisses direkt. Partnerarbeit ist besonders hilfreich."], ["speaking", "interaction"]);
    tasks.forEach(([heading, prompt, modelAnswer], i) => add({ id: `${id}-speak-${i}`, type: "speaking-practice", heading, prompt: `${prompt} Allein: beide Rollen abwechselnd aufnehmen.`, preparationSeconds: 0, targetSeconds: i === 1 ? 90 : 120, checklist: ["Verständliche eigene Sätze", "Frage und passende Antwort", "Rückfrage oder Reaktion", "Konkretes Ergebnis"], modelAnswer: `Kurzmodell; in der Partnerübung mit eigenen Informationen erweitern.\n\n${modelAnswer}`, completion: "interact" }, ["speaking", "interaction"]));
  };
  if (index === 0 || index === 5) {
    add({ id: `${id}-format`, type: "comparison-table", heading: "Format und Zeiten · Erwachsene, allgemeines A2", columns: ["Bereich", "Zeit", "Teile"], rows: track === "goethe" ? [["Lesen", "etwa 30 Minuten", "4"], ["Hören", "etwa 30 Minuten", "4"], ["Schreiben", "30 Minuten", "2: SMS und E-Mail"], ["Sprechen", "etwa 15 Minuten", "3"]] : [["Hören", "etwa 20 Minuten", "3"], ["Lesen + Schreiben", "zusammen 50 Minuten", "3 + 2"], ["Sprechen", "etwa 15 Minuten; keine Vorbereitung", "3, in der Regel zwei Teilnehmende"]] }, allSkills);
    text("plan", "Ihre Vorbereitung", ["Schreiben Sie einen persönlichen Übungsplan: zwei Schwächen, passende Kernkapitel und ein Termin für den nächsten Versuch. Diese Zeiten wurden am 30.09.2026 anhand der offiziellen Anbieterinformationen geprüft. Lesen Sie vor der Anmeldung die aktuellen Bedingungen.", track === "goethe" ? "Als Trainingsstrategie: Schreiben etwa 10 Minuten für SMS, 15 für E-Mail und 5 für Kontrolle. Das ist Ihr Übungsbudget, keine vorgeschriebene Teilzeit." : "Als Trainingsstrategie: etwa 30 Minuten Lesen und 20 Minuten Schreiben innerhalb des gemeinsamen 50-Minuten-Budgets. Testen Sie, ob das zu Ihrem Tempo passt. Der A2-Weg enthält kein separates B1-Sprachbausteintraining."], allSkills);
    if (index === 5) {
      add({ id: `${id}-mistakes`, type: "comparison-table", heading: "Typische Fehler reparieren", columns: ["Fehler", "Neue Strategie", "Kapitel"], rows: [["Alte statt neue Uhrzeit", "Änderung und Endergebnis markieren", "3, 9"], ["Gleiches Wort, falsche Bedingung", "Tag, Preis, Zweck zusammen prüfen", "5, 7, 13"], ["Ein Inhaltspunkt fehlt", "Vor dem Schreiben Punkte abhaken", "10, 14"], ["Weil mit Hauptsatzstellung", "Finites Verb ans Ende", "11, 15"], ["Nur eigenen Plan vorlesen", "Rückfrage stellen und auf Einwand reagieren", "13, 15"]] }, allSkills);
      writing(a2ExamSets[0]); speaking(a2ExamSets[0]);
    }
  } else if (index === 1) reading(a2ExamSets[0]);
  else if (index === 2) listening(a2ExamSets[0]);
  else if (index === 3) writing(a2ExamSets[0]);
  else if (index === 4) speaking(a2ExamSets[0]);
  else if (index === 6 || index === 8) {
    const set = a2ExamSets[index === 6 ? 1 : 2];
    add({ id: `${id}-scope`, type: "callout", heading: "Verkürzter Originaltest · frisches Material", body: "Dieser Mini-Mock verwendet neue Texte und Aufnahmen gegenüber dem Intensivtraining. Er enthält weniger Aufgaben als die echte Prüfung. Zuordnungen sind im Kurs vereinfacht; die schriftlichen und mündlichen Aufgaben brauchen eigene Antworten. Nutzen Sie einen externen Timer: 15 Minuten Lesen, Hören nach Abspielplan, Schreiben nach Ihrem Trainingsbudget und Sprechen mit Partnerperson. Das Resultat ist eine interne Standortbestimmung, keine offizielle Prüfungsnote.", tone: "amber" }, allSkills);
    reading(set); listening(set); writing(set); speaking(set);
  } else if (index === 7) {
    add({ id: `${id}-review`, type: "process", heading: "Fehler → Ursache → Übung → neuer Versuch", items: [{ title: "Belege", body: "Notieren Sie je einen Lese- und Hörfehler: eigene Antwort, richtiger Beleg, Ursache. Prüfen Sie Negation, Zahl, Sprecher und Änderung." }, { title: "Produktion", body: "Prüfen Sie jeden Inhaltspunkt Ihrer Nachricht. Hören Sie Ihre Aufnahme an: Haben Sie gefragt, reagiert und ein Ergebnis bestätigt? Nutzen Sie möglichst Feedback einer Lehrkraft." }, { title: "Wiederholen", body: "Wählen Sie passende Kapitel: Fälle 1/5; Vergangenheit 4/10; Gründe 11/15; formelle Bitte 8/14; Planung 13/15. Verbessern Sie eine konkrete Antwort." }, { title: "Transfer", body: "Bearbeiten Sie Mini-Mock 2 mit neuen Inhalten. Prüfen Sie, ob Ihre Strategie auch dort hilft." }] }, allSkills);
    writingBlock("error-plan", "Mein persönlicher Wiederholungsplan", "Schreiben Sie zwei Fehler, je eine Ursache, eine passende Kapitelübung und einen Termin für Mini-Mock 2.", "Ich habe eine neue Uhrzeit überhört. Deshalb übe ich die Nachricht in Kapitel 3 und notiere Änderungen. Beim Schreiben habe ich eine Frage vergessen. Ich prüfe die Punkte in Kapitel 14 vor dem Senden. Am Sonntag mache ich Mini-Mock 2 und kontrolliere diese beiden Bereiche.", 35, 85);
  } else {
    add({ id: `${id}-resources`, type: "resources", heading: "Offizielle A2-Praxis", items: germanA2Sources.filter((item) => item.title.startsWith(track === "goethe" ? "Goethe" : "telc")) }, allSkills);
    add({ id: `${id}-official`, type: "process", heading: "Vollständigen offiziellen Übungstest durchführen", items: [{ title: "Bereitstellen", body: "Laden Sie Aufgaben, Antwortbogen, Lösungen und Audio von der verlinkten Anbieterwebsite. Wählen Sie allgemeines A2 für Erwachsene, nicht B1 oder einen Berufstest." }, { title: "Simulieren", body: "Nutzen Sie die offiziellen Zeiten und Abspielanweisungen. Wörterbuch, Modelle und Transcript bleiben geschlossen. Verwenden Sie einen externen Timer." }, { title: "Kontrollieren", body: "Vergleichen Sie Lesen und Hören erst nach dem Test mit dem offiziellen Lösungsschlüssel und dessen Punkteverteilung." }, { title: "Produktion besprechen", body: "Prüfen Sie Schreiben und Sprechen anhand der offiziellen Kriterien und möglichst mit einer Lehrkraft. Der Kurs vergibt dafür keine offiziellen Prüfungspunkte." }, { title: "Weiterplanen", body: "Vergleichen Sie Ihre Ergebnisse mit den aktuellen Bestehensregeln des Anbieters. Wiederholen Sie schwache Fertigkeiten und verwenden Sie für den nächsten Versuch frisches Material." }] }, allSkills);
  }
  return { id: `${id}-lesson`, slug: id, examTrack: track, sectionId: section.id, section: section.title, title: `${track === "goethe" ? "G" : "T"}${index + 1} · ${trackTitles[index]}`, summary: `A2-Originaltraining für ${track === "goethe" ? "Goethe-Zertifikat A2" : "Start Deutsch 2 / telc Deutsch A2"}: ${trackTitles[index]}.`, durationMinutes: index === 9 ? 120 : index === 6 || index === 8 ? 105 : 60, blocks };
}
const core = germanA2Chapters.map(coreLesson);
const goethe = trackTitles.map((_, index) => examLesson("goethe", index));
const telc = trackTitles.map((_, index) => examLesson("telc", index));
const quiz: QuizQuestion[] = [
  ...germanA2Chapters.slice(0, 6).map((chapter, i) => a2Choice(`a2-final-read-${number(i)}`, { ...chapter.readingCheck, prompt: `${chapter.reading}\n\n${chapter.readingCheck.prompt}` })),
  ...germanA2Chapters.slice(6, 12).map((chapter, i) => ({ ...a2Choice(`a2-final-listen-${number(i)}`, chapter.listeningCheck), audioUrl: `/audio/german-a2/de-a2-${number(i + 6)}.m4a`, audioTranscript: chapter.listening })),
  ...germanA2Chapters.slice(10, 16).map((chapter, i) => a2Choice(`a2-final-language-${number(i)}`, chapter.grammarCheck)),
];
export const germanA2Course: AcademyCourse = styleGermanA2Course(migrateAcademyCourse({
  key: GERMAN_A2_COURSE_KEY, title: "Deutsch A2 komplett: Alltag meistern, Goethe und telc vorbereiten", shortTitle: "Deutsch A2 komplett",
  description: "Von A1 zu verbundenem Deutsch: 15 thematische Kapitel mit Wortschatz, Hören, Lesen, Grammatik, Redemitteln und vier Sprechmodi. A2 Mastery integriert Wohnung, Reise, Gesundheit und Bestellung. Nach dem gemeinsamen Abschlusstest wählen Sie einen eigenen Goethe-A2- oder telc-A2-Weg mit Intensivtraining, zwei Mini-Mocks, Fehleranalyse und offizieller Prüfungspraxis. Voraussetzung: Deutsch auf A1-Niveau.",
  estimatedMinutes: core.reduce((sum, lesson) => sum + lesson.durationMinutes, 0) + goethe.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
  audienceRoles: ["student"], passMark: 70, quizRevision: 1, sections,
  examTracks: [{ id: "goethe", title: "Goethe-Zertifikat A2", description: "Vier Lese- und Hörteile, SMS und E-Mail, Fragen zur Person, Erzählen und Terminplanung." }, { id: "telc", title: "Start Deutsch 2 / telc Deutsch A2", description: "Telefonnotizen, drei Lese- und Hörteile, Formular, persönliche Nachricht und drei mündliche Teile ohne Vorbereitung." }],
  theme: { preset: "journey", accent: "coral-navy", typography: "friendly-sans", density: "comfortable", coverStyle: "minimal", lessonHeaderStyle: "editorial" },
  rules: { navigation: "linear", lessonCompletion: "required-blocks", requireFinalAssessment: true, attemptLimit: null, feedbackTiming: "after-submit" },
  lessons: [...core, ...goethe, ...telc], quiz,
}));
