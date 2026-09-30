import { migrateAcademyCourse } from "./academy-schema.ts";
import { germanB1Chapters, germanB1Sources, type B1Chapter, type B1Question } from "./german-b1-curriculum.ts";
import { b1ExamReading, b1ExamReadingQuestions, b1ExamListening, b1LanguageElements, b1ExamWriting } from "./german-b1-exam-practice.ts";
import { b1ChapterMastery } from "./german-b1-mastery.ts";
import { styleGermanB1Course } from "./german-b1-visual-design.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock, QuizQuestion } from "./tutor-academy.ts";

export const GERMAN_B1_COURSE_KEY = "german-b1-complete";
const number = (index: number) => String(index + 1).padStart(2, "0");
type Skills = NonNullable<LessonBlock["curriculum"]>["skills"];

export function b1Choice(id: string, item: B1Question): QuizQuestion {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const labels = [...item.distractors];
  const correctIndex = (hash >>> 0) % 3;
  labels.splice(correctIndex, 0, item.answer);
  return { id, type: "single-choice", prompt: item.prompt, options: labels.map((label, i) => ({ id: ["a", "b", "c"][i], label })), correctOptionId: ["a", "b", "c"][correctIndex], explanation: item.explanation };
}

const sections = [
  { id: "b1-bridge", title: "Ihre Brücke zu B1" },
  { id: "b1-life", title: "Menschen, Alltag und Wohnen" },
  { id: "b1-work", title: "Arbeit, Lernen und Gesundheit" },
  { id: "b1-public", title: "Unterwegs und im digitalen Alltag" },
  { id: "b1-community", title: "Umwelt, Gemeinschaft und Kultur" },
  { id: "b1-communication", title: "Lösungen, Meinungen und B1-Mastery" },
  { id: "b1-goethe", title: "Goethe-Zertifikat B1" },
  { id: "b1-telc", title: "telc Deutsch B1" },
];

function tag(chapter: B1Chapter, item: LessonBlock, skills: Skills, examTrack?: string): LessonBlock {
  return { ...item, curriculum: { cefr: "B1", domain: chapter.domain, topic: chapter.title, skills, functions: [chapter.function], grammar: chapter.grammar, ...(examTrack ? { examTrack } : {}) } };
}

function check(id: string, heading: string, question: B1Question, pass = true): LessonBlock {
  return { id, type: "knowledge-check", heading, question: b1Choice(`${id}-question`, question), completion: pass ? "pass" : "view" };
}

function diagnostic(chapter: B1Chapter): LessonBlock[] {
  const items: B1Question[] = [
    { prompt: "Präsens: Welche Form ist richtig?", answer: "Er arbeitet jeden Montag.", distractors: ["Er arbeiten jeden Montag.", "Er arbeitest jeden Montag."], explanation: "Er/sie/es arbeitet: Endung -et bei arbeiten." },
    { prompt: "Perfekt: Welche Aussage ist richtig?", answer: "Ich bin nach Leipzig umgezogen.", distractors: ["Ich habe nach Leipzig umgezogen.", "Ich bin nach Leipzig umziehen."], explanation: "Umziehen im Sinn von Wohnortwechsel bildet das Perfekt mit sein und umgezogen." },
    { prompt: "Präteritum: Gestern ___ ich keine Zeit.", answer: "hatte", distractors: ["hätte", "habe morgen"], explanation: "Hatte ist die Vergangenheitsform von haben; hätte ist Konjunktiv II." },
    { prompt: "Fälle: Ich helfe ___ Nachbarn und besuche ___ Kurs.", answer: "dem / den", distractors: ["den / dem", "der / der"], explanation: "Helfen + Dativ; besuchen + Akkusativ." },
    { prompt: "Modalverb: Welche Aussage ist richtig?", answer: "Ich möchte morgen früher anfangen.", distractors: ["Ich möchte morgen früher anzufangen.", "Ich morgen anfangen möchte früher."], explanation: "Modalverb auf Position zwei, Infinitiv ohne zu am Ende." },
    { prompt: "Nebensatz: Welche Aussage ist richtig?", answer: "Ich hoffe, dass der Kurs morgen beginnt.", distractors: ["Ich hoffe, dass beginnt der Kurs morgen.", "Ich hoffe, dass der Kurs beginnt morgen ist."], explanation: "Dass stellt das finite Verb beginnt ans Ende." },
    { prompt: "Verbindungen: Welche Aussage erklärt eine Folge?", answer: "Ich möchte sicherer sprechen. Deshalb übe ich regelmäßig.", distractors: ["Ich möchte sicherer sprechen. Obwohl übe ich regelmäßig.", "Ich möchte sicherer sprechen. Deshalb ich regelmäßig übe."], explanation: "Deshalb bezeichnet eine Folge und verlangt Verbzweitstellung." },
  ];
  return [
    tag(chapter, { id: "b1-diagnostic-guide", type: "callout", heading: "Ihr A2-Einstiegstest", body: "Bearbeiten Sie die sieben Fragen ohne Hilfe. Notieren Sie die Themen falscher Antworten. Die Diagnose ist ein Startpunkt und keine Zugangssperre: Wiederholen Sie bei Schwierigkeiten die passenden Beispiele und prüfen Sie sie später erneut. Die Plattform erstellt hier kein automatisches adaptives Profil.", tone: "blue" }, ["grammar"]),
    ...items.map((item, i) => tag(chapter, check(`b1-diagnostic-${number(i)}`, `Einstiegstest ${i + 1} · ${item.prompt.split(":")[0]}`, item, false), ["grammar"])),
    tag(chapter, { id: "b1-diagnostic-plan", type: "comparison-table", heading: "Ihre nächsten Schritte nach der Diagnose", columns: ["Unsicher bei", "Passende Wiederholung"], rows: [["Präsens, Perfekt, Präteritum", "Kapitel 1 Sprachlabor; Kapitel 2 Erzählung"], ["Fälle und Modalverben", "Kapitel 1 Beispiele; Kapitel 4 und 5 Sprachlabor"], ["Nebensätze und Verbindungen", "Kapitel 1 Konnektoren; Kapitel 3 und 6 Sprachlabor"], ["Lesen oder Hören", "Text zuerst global, dann im Detail; Aufnahme erneut hören"], ["Schreiben oder Sprechen", "Modell analysieren, eigene Antwort aufnehmen, eine Stelle verbessern"]] }, ["grammar", "reading", "listening", "writing", "speaking"]),
  ];
}

function coreLesson(chapter: B1Chapter, index: number): AcademyLesson {
  const id = `de-b1-${number(index)}`;
  const section = sections[index === 0 ? 0 : index < 4 ? 1 : index < 7 ? 2 : index < 10 ? 3 : index < 13 ? 4 : 5];
  const blocks: LessonBlock[] = [];
  const add = (item: LessonBlock, skills: Skills) => blocks.push(tag(chapter, item, skills));
  add({ id: `${id}-entry`, type: "callout", heading: "1 · Einstieg", body: `${chapter.outcome} Denken Sie an eine eigene Situation zum Kapitelthema. Was können Sie schon sagen, wobei brauchen Sie Hilfe?`, tone: "blue" }, ["speaking"]);
  if (!index) blocks.push(...diagnostic(chapter));
  add({ id: `${id}-words`, type: "flashcards", heading: "2 · Wortschatz im Kontext", completion: "interact", items: chapter.vocabulary.map(([title, meaning, example], i) => ({ id: `${id}-word-${i}`, title, body: `${meaning}. ${example} Bilden Sie danach einen eigenen Satz.` })) }, ["vocabulary"]);
  add({ id: `${id}-audio-guide`, type: "text", heading: "3 · Hören: Überblick vor Details", paragraphs: ["Hören Sie zunächst ohne Transcript: Wer spricht, worum geht es und was soll die Person tun? Hören Sie danach erneut für Zahlen, Gründe und Änderungen. Öffnen Sie das Transcript erst zur Kontrolle."] }, ["listening"]);
  add({ id: `${id}-audio`, type: "audio", heading: "Hören · Nachricht aus dem Alltag", url: `/audio/german-b1/${id}.m4a`, caption: "Originaler ScienceDojo-Übungstext mit synthetischer deutscher Stimme. Training, keine offizielle Prüfungsaufnahme.", transcript: chapter.listening }, ["listening"]);
  add(check(`${id}-listening-check`, "Hören · Informationen unterscheiden", chapter.listeningCheck), ["listening"]);
  add({ id: `${id}-reading`, type: "text", heading: "4 · Lesen: Hauptaussage und Beleg", paragraphs: ["Lesen Sie zuerst für das Thema. Markieren Sie beim zweiten Lesen die Textstelle, die Ihre Antwort belegt.", chapter.reading] }, ["reading"]);
  add(check(`${id}-reading-check`, "Lesen · den passenden Beleg finden", chapter.readingCheck), ["reading"]);
  add({ id: `${id}-notice`, type: "worked-example", heading: "5 · Sprache entdecken", problem: "Welche Gedanken verbindet das Beispiel und wo stehen die Verben?", steps: [{ title: "Beobachten", body: chapter.grammarExample }, { title: "Markieren", body: "Markieren Sie die finiten Verben, die Verbindung und die Information vor und nach der Verbindung." }, { title: "Übertragen", body: "Formulieren Sie zwei eigene verbundene Sätze mit demselben Muster." }], answer: chapter.grammarExample }, ["grammar"]);
  add({ id: `${id}-grammar`, type: "text", heading: "6 · Grammatik im Alltag", paragraphs: [chapter.grammarExplanation, "Sagen Sie zuerst, was Sie ausdrücken wollen. Wählen Sie dann die Struktur und prüfen Sie Verbposition, Fall und Bedeutung."] }, ["grammar"]);
  add(check(`${id}-grammar-check`, "Grammatik · anwenden und erklären", chapter.grammarCheck), ["grammar"]);
  add({ id: `${id}-connectors`, type: "flashcards", heading: "B1-Konnektoren · Gedanken verbinden", completion: "interact", items: chapter.connectors.map(([title, body]) => ({ title, body: `${body}. Verbinden Sie zwei eigene Gedanken zum Kapitelthema.` })) }, ["grammar", "writing", "speaking"]);
  add({ id: `${id}-speaking`, type: "speaking-practice", heading: index >= 14 ? "7 · Sprechen: Mini-Präsentation" : "7 · Sprechen: zusammenhängend erzählen", prompt: chapter.speaking, preparationSeconds: index >= 14 ? 180 : 60, targetSeconds: index >= 14 ? 180 : index < 5 ? 90 : 120, checklist: ["Klare Einleitung", "Grund und konkretes Beispiel", "Passende Verbindungen", "Verständlicher Abschluss; kein auswendig gelesener Text"], modelAnswer: `Muster für Aufbau und Redemittel; erweitern Sie es mit eigenen Beispielen auf die Zielzeit.\n\n${chapter.speakingModel}`, completion: "interact" }, ["speaking"]);
  add({ id: `${id}-interaction`, type: "speaking-practice", heading: "Sprechen · gemeinsam handeln", prompt: `${chapter.interaction} Üben Sie zu zweit. Bei Einzelarbeit nehmen Sie abwechselnd beide Rollen ein; reagieren Sie auf einen Einwand, statt nur einen Plan vorzulesen.`, preparationSeconds: 60, targetSeconds: 180, checklist: ["Nach dem Wunsch der anderen Person fragen", "Einen Vorschlag begründen", "Auf einen Einwand reagieren", "Eine gemeinsame Entscheidung bestätigen"], modelAnswer: `A: ${chapter.redemittel[0][0]}\nB: Ich verstehe Ihren Punkt. Für mich wäre eine andere Möglichkeit besser, weil ich wenig Zeit habe.\nA: Dann könnten wir eine Lösung ausprobieren und später prüfen, ob sie für beide passt.\nB: Einverstanden. Halten wir Zeit und Aufgaben noch einmal fest.`, completion: "interact" }, ["speaking", "interaction"]);
  add({ id: `${id}-writing-plan`, type: "process", heading: "8 · Schreiben: planen, verbinden, prüfen", items: [{ title: "Inhalt und Adressat", body: `${chapter.writing} Notieren Sie jeden Inhaltspunkt und entscheiden Sie zwischen du und Sie.` }, { title: "Gedanken verbinden", body: index < 3 ? "Planen Sie Anlass, Erlebnis oder Ziel, Grund und Schluss." : index < 9 ? "Nennen Sie Anlass, konkrete Information, Grund, gewünschte Handlung und höflichen Schluss." : "Planen Sie Position, Grund, konkretes Beispiel, Einschränkung und Schluss beziehungsweise Lösung." }, { title: "Überarbeiten", body: "Prüfen Sie alle Inhaltspunkte, passende Anrede, Verbpositionen und einen klaren Schluss. Lesen Sie den Text laut." }] }, ["writing"]);
  const minWords = index < 3 || index === 6 || index === 9 || index === 14 ? 70 : index < 9 ? 80 : 90;
  add({ id: `${id}-writing`, type: "writing-practice", heading: !index ? "Schreiben · Ihr B1-Startprofil" : "Schreiben · ein eigener verbundener Text", prompt: chapter.writing, minWords, maxWords: minWords === 70 ? 110 : 140, checklist: ["Alle genannten Inhaltspunkte", "Mindestens zwei passende Verbindungen", "Grund oder konkretes Beispiel", "Passende Anrede und Schluss; du/Sie konsequent"], modelAnswer: chapter.writingModel, completion: "interact" }, ["writing"]);
  add({ id: `${id}-phrases`, type: "flashcards", heading: "9 · Redemittel für Ihre Kommunikation", items: chapter.redemittel.map(([title, body]) => ({ title, body: `${body}. Verwenden Sie den Ausdruck mit einer eigenen Information.` })), completion: "interact" }, ["vocabulary", "speaking", "writing"]);
  add({ id: `${id}-everyday`, type: "callout", heading: "10 · Deutsch im Alltag", body: chapter.everyday, tone: "teal" }, ["interaction", "mediation"]);
  add({ id: `${id}-mission`, type: "callout", heading: "11 · Ihre Mission", body: chapter.mission, tone: "navy" }, ["reading", "listening", "writing", "speaking", "interaction"]);
  const glimpseIndex = index % b1ExamReadingQuestions.length;
  const sourceKey = ["blog", "blog", "article", "adverts", "adverts", "adverts", "opinions", "rules"][glimpseIndex] as keyof typeof b1ExamReading;
  add({ id: `${id}-exam-text`, type: "text", heading: `12 · Prüfungsblick: ${index % 2 ? "telc" : "Goethe"}`, paragraphs: ["Diese kurze Originalaufgabe trainiert eine Prüfungsfertigkeit. Vollständige Formate und Strategien folgen nach der B1-Mastery im gewählten Prüfungsweg.", b1ExamReading[sourceKey]] }, ["reading"]);
  add(check(`${id}-exam-check`, "Prüfungsblick · gezielt lesen", b1ExamReadingQuestions[glimpseIndex]), ["reading"]);
  const reviewIndices = [...new Set([index - 1, index - 3, index - 7].filter((i) => i >= 0))];
  add({ id: `${id}-recall`, type: "flashcards", heading: "13 · Recall: heute, in drei Tagen, in einer Woche", items: (reviewIndices.length ? reviewIndices : [index]).flatMap((i) => germanB1Chapters[i].vocabulary.slice(0, 2).map(([title, meaning, example]) => ({ title: `Erinnern: ${meaning}`, body: `${title}. ${example} Decken Sie die Antwort zunächst ab und sprechen Sie einen eigenen Satz.` }))), completion: "interact" }, ["vocabulary"]);
  add({ id: `${id}-mastery`, type: "numbered-list", heading: "14 · Chapter Mastery: Nachweise statt Gefühl", items: [{ title: "Verstehen", body: "Geben Sie die Hauptaussage des Textes und eine wichtige Information der Aufnahme ohne Vorlage wieder." }, { title: "Produzieren", body: "Prüfen Sie den eigenen Text und die Aufnahme: Inhalt vollständig? Gründe und Beispiele? Verständliche Verbindungen?" }, { title: "Transfer", body: "Führen Sie die Mission mit eigenen Informationen durch. Wenn Sie Hilfe brauchen, wiederholen Sie die passende Aufgabe und verbessern Sie eine konkrete Stelle." }] }, ["reading", "listening", "writing", "speaking"]);
  add(check(`${id}-mastery-check`, "Chapter Mastery · in einer neuen Situation handeln", b1ChapterMastery[index]), ["grammar", "interaction"]);
  if (index === 15) {
    add({ id: `${id}-readiness`, type: "comparison-table", heading: "Ihr B1-Profil und die nächste Wiederholung", columns: ["Fertigkeit", "Beobachtbarer Nachweis", "Bei Schwierigkeiten"], rows: [["Lesen", "Hauptaussage und Details selbstständig finden", "Kapitel 6, 9 und 13"], ["Hören", "Änderungen, Zahlen und Handlungsauftrag verstehen", "Kapitel 3, 8 und 16"], ["Grammatik/Wortschatz", "Gedanken mit Gründen, Gegensatz und Zweck verbinden", "Kapitel 1, 6, 10 und 14"], ["Schreiben", "Einen verbundenen Text mit allen Punkten verfassen", "Kapitel 4, 5, 10 und 15"], ["Sprechen", "Planen, präsentieren und auf Rückfragen reagieren", "Kapitel 14, 15 und 16"]] }, ["reading", "listening", "grammar", "vocabulary", "writing", "speaking"]);
    add({ id: `${id}-exam-choice`, type: "callout", heading: "Bereit für Ihren Prüfungsweg", body: "Schließen Sie die Kernkapitel und den gemeinsamen Abschlusstest ab. Wählen Sie danach Goethe-Zertifikat B1 oder telc Deutsch B1. Ihr Kursprofil und die interne Bestehensgrenze dienen der Lernplanung; sie ersetzen keine offizielle Prüfungsbewertung. Lassen Sie offene Schreib- und Sprechaufgaben möglichst von einer Lehrkraft besprechen.", tone: "blue" }, ["writing", "speaking"]);
  }
  return { id: `${id}-lesson`, slug: id, sectionId: section.id, section: section.title, title: `${index + 1}. ${chapter.title}`, summary: chapter.outcome, durationMinutes: index === 15 ? 150 : 120, blocks };
}

type Track = "goethe" | "telc";
const examChapter = germanB1Chapters[15];
const trackNames: Record<Track, string[]> = {
  goethe: ["Die Goethe-Prüfung verstehen", "Lesen intensiv · fünf Teile", "Hören intensiv · vier Teile", "Schreiben intensiv · drei Aufgaben", "Sprechen intensiv · planen, präsentieren, reagieren", "Strategie und Zeitmanagement", "ScienceDojo Mini-Mock · alle vier Fertigkeiten", "Fehleranalyse und gezielte Wiederholung", "Offizielle Goethe-Prüfungschallenge"],
  telc: ["Die telc-Prüfung verstehen", "Lesen intensiv · drei Teile", "Sprachbausteine · Grammatik und Wortverbindungen", "Hören intensiv · drei Teile", "Schreiben · auf vier Leitpunkte antworten", "Sprechen · Kontakt, Thema und Planung", "Strategie und Zeitmanagement", "ScienceDojo Mini-Mock · alle Teilprüfungen", "Fehleranalyse und gezielte Wiederholung", "Offizielle telc-Prüfungschallenge"],
};

function examLesson(track: Track, index: number): AcademyLesson {
  const id = `de-b1-${track}-${number(index)}`;
  const section = sections[track === "goethe" ? 6 : 7];
  const title = trackNames[track][index];
  const blocks: LessonBlock[] = [];
  const add = (item: LessonBlock, skills: Skills) => blocks.push(tag({ ...examChapter, title, function: `prepare ${track} B1 examination` }, item, skills, track));
  const text = (suffix: string, heading: string, paragraphs: string[], skills: Skills) => add({ id: `${id}-${suffix}`, type: "text", heading, paragraphs }, skills);
  const reading = () => {
    text("reading-guide", "Lesestrategie und Aufgabenformate", track === "goethe" ? ["Teil 1: Blog mit Richtig/Falsch; Teil 2: Artikel mit Auswahlaufgaben; Teil 3: Situationen und Anzeigen zuordnen (auch keine passende Anzeige); Teil 4: Meinungen zum Thema erkennen; Teil 5: Regeln und Anweisungen verstehen.", "Die folgenden kurzen Texte sind eigene Übungsbeispiele, keine vollständige 65-Minuten-Prüfung. Lesen Sie jede Anforderung genau und suchen Sie einen Beleg, statt nur gleiche Wörter zuzuordnen."] : ["Teil 1: Überschriften Texten zuordnen (globales Lesen). Teil 2: Details eines Textes durch Auswahlaufgaben verstehen. Teil 3: Situationen passenden Anzeigen zuordnen (selektives Lesen).", "Diese Originalübungen sind verkürzt. Bei Zuordnungen prüfen Sie Person, Zeit, Zweck und Bedingungen gemeinsam; in der echten Prüfung gelten die dort angegebenen Zuordnungsregeln."], ["reading"]);
    for (const [key, body] of Object.entries(b1ExamReading)) text(`reading-${key}`, `Lesetext · ${key}`, [body], ["reading"]);
    if (track === "telc") add(check(`${id}-headline`, "Teil 1 · passende Überschrift", { prompt: `Lesen Sie den Artikel zur Bibliothek. Welche Überschrift passt zur gesamten Nachricht?\n\n${b1ExamReading.article}`, answer: "Sonntagsöffnung: Bibliothek testet ein begrenztes Angebot", distractors: ["Alle Bibliotheken öffnen jetzt täglich rund um die Uhr", "Neue persönliche Beratung an jedem Sonntag"], explanation: "Der Artikel beschreibt eine befristete monatliche Testöffnung; die anderen Überschriften widersprechen dem Text." }), ["reading"]);
    b1ExamReadingQuestions.forEach((question, i) => add(check(`${id}-read-${number(i)}`, "Lesen · Antwort mit Textbeleg", question), ["reading"]));
  };
  const listening = () => {
    text("listening-guide", "Hörstrategie und Aufgabenformate", track === "goethe" ? ["Teil 1: kurze Texte zweimal, Richtig/Falsch und Auswahl. Teil 2: ein längerer Beitrag einmal, Auswahl. Teil 3: Gespräch einmal, Richtig/Falsch. Teil 4: Diskussion zweimal, Aussagen den sprechenden Personen zuordnen.", "Unsere kurzen Aufnahmen trainieren diese Fertigkeiten. Sie bilden keine vollständige offizielle Hörprüfung ab. Spielen Sie Teil 1 und 4 zweimal, Teil 2 und 3 einmal; benutzen Sie das Transcript erst zur Analyse."] : ["Teil 1: globales Verstehen kurzer Beiträge. Teil 2: Detailverstehen eines längeren Gesprächs. Teil 3: selektives Verstehen von Ansagen und Nachrichten. Die offiziellen Aufnahmen und Anweisungen legen die Wiederholungen fest.", "Im Training hören Sie zunächst einmal für die Hauptaussage und danach bei Bedarf für Details. Für die spätere Prüfungssimulation folgen Sie ausschließlich den offiziellen Abspielanweisungen."], ["listening"]);
    b1ExamListening.forEach((recording, i) => {
      add({ id: `${id}-audio-${i}`, type: "audio", heading: recording.title, url: `/audio/german-b1/${recording.id}.m4a`, caption: "Originales Training mit synthetischen deutschen Stimmen. Transcript erst nach dem Antworten öffnen.", transcript: recording.segments.map((part) => part.text).join("\n\n") }, ["listening"]);
      recording.questions.forEach((question, j) => add(check(`${id}-listen-${i}-${j}`, "Hören · Hauptaussage und Details", question), ["listening"]));
    });
  };
  const writing = () => {
    const tasks = track === "goethe" ? [b1ExamWriting.personal, b1ExamWriting.opinion, b1ExamWriting.formal] : [b1ExamWriting.telc];
    text("writing-guide", "Schreiben: erst Punkte, dann Text", track === "goethe" ? ["Goethe B1: persönliche E-Mail (etwa 80 Wörter), Meinungsbeitrag (etwa 80 Wörter), kurze formelle Nachricht (etwa 40 Wörter). Insgesamt 60 Minuten. Planen Sie alle Punkte und halten Sie du/Sie konsequent ein."] : ["telc Deutsch B1: eine Antwort auf eine Nachricht mit vier Leitpunkten in 30 Minuten. Ordnen Sie die Punkte sinnvoll, verbinden Sie Sätze und wählen Sie passende Anrede und Schluss. Die Wortspanne im Training ist ein Kursziel. Folgen Sie im offiziellen Test dessen konkreter Aufgabenstellung."], ["writing"]);
    tasks.forEach((task, i) => add({ id: `${id}-writing-${i}`, type: "writing-practice", heading: track === "goethe" ? ["Persönliche E-Mail", "Meinungsbeitrag", "Kurze formelle Nachricht"][i] : "Antwort auf vier Leitpunkte", prompt: task.prompt, minWords: track === "telc" ? 90 : i === 2 ? 30 : 70, maxWords: track === "telc" ? 160 : i === 2 ? 60 : 110, checklist: ["Alle Inhaltspunkte bearbeitet", "Passendes Register, Anrede und Schluss", "Gedanken mit Gründen und Beispielen verbunden", "Verbpositionen und Wortformen kontrolliert"], modelAnswer: task.model, completion: "interact" }, ["writing"]));
  };
  const speaking = () => {
    const tasks = track === "goethe" ? [
      ["Gemeinsam etwas planen", "Planen Sie mit Ihrer Partnerin einen Lernnachmittag: wann, wo, Material, Essen, Aufgaben. Begründen Sie Vorschläge, reagieren Sie auf Einwände und bestätigen Sie das Ergebnis.", "A: Wir könnten uns samstags um zwei treffen, weil ich vorher arbeite. B: Das passt mir. Wie wäre es mit der Bibliothek? A: Dort ist es ruhig, aber wir dürfen nicht zusammen sprechen. Ich schlage den Gruppenraum vor. B: Gut, ich frage nach der Reservierung. A: Dann bringe ich Aufgaben und Getränke mit.", 180],
      ["Ein Thema präsentieren", "Wählen Sie Online lernen oder Lernen im Kurs. Gliedern Sie: Thema und Aufbau; eigene Erfahrung; Situation im Herkunftsland; Vorteile und Nachteile; Meinung und Schluss. Sprechen Sie frei mit Stichpunkten etwa drei Minuten.", "Ich spreche über Online-Lernen. In meinem Alltag ist es praktisch, weil ich in Schichten arbeite. In meiner Heimat besuchen viele Menschen feste Kurse. Ein Vorteil online ist die flexible Zeit. Ein Nachteil ist, dass man weniger spontan mit anderen spricht. Deshalb würde ich Onlineaufgaben mit einem Gesprächstreff verbinden. Vielen Dank fürs Zuhören.", 180],
      ["Über Präsentationen sprechen", "Geben Sie Rückmeldung zur Präsentation Ihrer Partnerin und stellen Sie eine inhaltliche Frage. Antworten Sie anschließend auf: Wie würden Sie beim Online-Lernen regelmäßiges Sprechen üben?", "Mir hat Ihr Beispiel mit der Schichtarbeit gefallen. Wie würden Sie den Kontakt zu anderen Lernenden organisieren? — Vielen Dank für die Frage. Ich würde einen festen wöchentlichen Gesprächstermin vereinbaren. So wäre ich beim Lernen flexibel und könnte trotzdem regelmäßig sprechen.", 120],
    ] as const : [
      ["Kontakt aufnehmen", "Lernen Sie Ihre Partnerin kennen: Herkunft, Alltag, Sprachen, Arbeit oder Lernen und Interessen. Stellen Sie Rückfragen und reagieren Sie auf ihre Antworten.", "Ich komme aus Chile und lebe in Leipzig. Ich arbeite im Service und lerne abends Deutsch. Was machen Sie beruflich? — Das klingt interessant. Wie sind Sie zu dieser Arbeit gekommen? In meiner Freizeit koche ich gern. Haben Sie auch ein Hobby, das wir gemeinsam ausprobieren könnten?", 180],
      ["Über ein Thema sprechen", "Input A: Lara lernt am liebsten allein zu Hause, weil sie flexibel sein möchte. Input B: Ben bevorzugt einen Kurs, weil er dort Fragen stellen kann. Geben Sie Ihren Input wieder, hören Sie den anderen an und sprechen Sie über Ihre eigenen Erfahrungen und Meinungen.", "Auf meinem Blatt steht, dass Lara gern allein lernt. Sie möchte ihre Zeit flexibel planen. Ich verstehe das, weil ich manchmal spät arbeite. Trotzdem finde ich einen Kurs hilfreich, denn dort kann ich sofort Fragen stellen. Was steht auf Ihrem Blatt? Welche Möglichkeit passt besser zu Ihrem Alltag?", 240],
      ["Gemeinsam etwas planen", "Planen Sie für Ihren Deutschkurs einen Ausflug: Ziel, Termin, Verkehr, Kosten, Essen und Aufgaben. Ihre Partnerin kann samstags erst ab Mittag. Einigen Sie sich und bestätigen Sie den Plan.", "Wir könnten am Samstag nach Bremen fahren. Da Sie vormittags arbeiten, nehmen wir den Zug am frühen Nachmittag. Ich würde ein Gruppenticket prüfen. Was möchten Sie dort machen? — Das Museum ist eine gute Idee. Dann reservieren Sie die Führung und ich frage die anderen nach ihrer Teilnahme.", 300],
    ] as const;
    text("speaking-guide", "Sprechen: Interaktion statt Monolog", track === "goethe" ? ["Drei Aufgaben: gemeinsam planen, etwa dreiminütige Präsentation und Rückmeldung/Fragen. Insgesamt etwa 15 Minuten als Paar; 15 Minuten individuelle Vorbereitung. Nutzen Sie Stichpunkte und sprechen Sie frei."] : ["Drei Teile: Kontakt aufnehmen, über ein Thema sprechen und gemeinsam planen. Die Paarprüfung dauert etwa 15 Minuten, mit 20 Minuten Vorbereitung. Beim Thema geben Sie Informationen aus Ihrem eigenen Aufgabenblatt wieder und tauschen Erfahrungen aus; eine auswendig gelernte Goethe-Präsentation ersetzt diesen Austausch nicht."], ["speaking", "interaction"]);
    tasks.forEach(([heading, prompt, modelAnswer, targetSeconds], i) => add({ id: `${id}-speaking-${i}`, type: "speaking-practice", heading, prompt: `${prompt} Üben Sie zu zweit oder nehmen Sie bei Einzelarbeit beide Rollen abwechselnd auf. Die Aufnahmezielzeit dient dem Training und ist keine individuelle offizielle Prüfungszeit.`, preparationSeconds: track === "goethe" && i === 1 ? 300 : 90, targetSeconds: Math.min(targetSeconds, 180), checklist: ["Auf die Partnerperson eingehen", "Vorschlag oder Meinung begründen", "Konkretes Beispiel", "Auf Rückfragen reagieren und Ergebnis bestätigen"], modelAnswer: `Kurzmodell; erweitern Sie es mit eigenen Informationen und spontanen Rückfragen.\n\n${modelAnswer}`, completion: "interact" }, ["speaking", "interaction"]));
  };
  const elements = () => {
    text("elements-guide", "Sprachbausteine · zwei unterschiedliche Entscheidungen", ["Teil 1: Grammatik und Wortwahl in einem zusammenhängenden Text mit Auswahlmöglichkeiten. Lesen Sie den ganzen Satz und prüfen Sie Fall, Verbform und Verbindung. Teil 2: passende Wörter aus einem Vorrat einsetzen; prüfen Sie Bedeutung und feste Verbindungen. Unsere Einzelfragen bereiten diese Entscheidungen vor; der offizielle Test verbindet sie in vollständigen Texten.", "Übungstext: Liebe Lea, ich kann morgen nicht kommen, ___ ich arbeiten muss. Ich freue mich ___ unser Treffen nächste Woche. Könntest du ___ bitte die Adresse schicken? Ich möchte einen Kurs besuchen, um besser Deutsch ___ sprechen. Vielen Dank für deine Rückmeldung."], ["grammar", "vocabulary"]);
    b1LanguageElements.forEach((question, i) => add(check(`${id}-element-${i}`, i < 4 ? "Teil 1 · Grammatik und Verbindungen" : "Teil 2 · Wortwahl und Kollokation", question), ["grammar", "vocabulary"]));
  };
  const strategyIndex = track === "goethe" ? 5 : 6;
  const mockIndex = strategyIndex + 1;
  if (index === 0 || index === strategyIndex) {
    add({ id: `${id}-format`, type: "comparison-table", heading: "Prüfungsformat und Zeitbudget", columns: ["Bereich", "Dauer", "Aufgabe"], rows: track === "goethe" ? [["Lesen", "65 Minuten", "5 Teile"], ["Hören", "etwa 40 Minuten", "4 Teile"], ["Schreiben", "60 Minuten", "3 Aufgaben"], ["Sprechen", "etwa 15 Minuten; 15 Minuten Vorbereitung", "3 Aufgaben, Paarprüfung"]] : [["Lesen + Sprachbausteine", "90 Minuten ohne Pause", "3 + 2 Teile"], ["Hören", "etwa 30 Minuten", "3 Teile"], ["Schreiben", "30 Minuten", "1 Aufgabe mit Leitpunkten"], ["Sprechen", "etwa 15 Minuten; 20 Minuten Vorbereitung", "3 Teile, Paarprüfung"]] }, ["reading", "listening", "writing", "speaking"]);
    text("orientation", "Ihr Prüfungsplan", track === "goethe" ? ["Die vier Goethe-Module können einzeln oder zusammen abgelegt werden. Üben Sie dennoch alle vier Fertigkeiten. Ein internes Kursresultat ist keine offizielle Modulbewertung."] : ["Dieser Weg bereitet auf die allgemeine Prüfung telc Deutsch B1 (Zertifikat Deutsch) vor. DTZ und telc Deutsch B1+ Beruf haben andere Anforderungen. Lesen und Sprachbausteine teilen sich ein Zeitbudget."], ["reading", "listening", "writing", "speaking"]);
    add({ id: `${id}-plan`, type: "process", heading: "Zeitmanagement üben", items: [{ title: "Vorbereiten", body: "Prüfen Sie Aufgaben und Zeiten. Nutzen Sie für die Simulation einen externen Timer und legen Sie Hilfsmittel weg." }, { title: "Bearbeiten", body: track === "goethe" ? "Lesen: zuerst sichere Aufgaben, schwierige markieren. Schreiben: etwa 20/25/15 Minuten für die drei Aufgaben; dabei jeweils Plan und Endkontrolle einrechnen." : "Teilen Sie die 90 Minuten zwischen Lesen und Sprachbausteinen auf; testen Sie etwa 55/35 Minuten als persönliche Strategie. Schreiben: 5 Minuten planen, 20 schreiben, 5 kontrollieren." }, { title: "Auswerten", body: "Notieren Sie Zeitverlust, falsche Entscheidungen und fehlende Inhaltspunkte. Wählen Sie eine konkrete Strategie für den nächsten Versuch." }] }, ["reading", "writing"]);
    if (index === strategyIndex) { writing(); speaking(); }
  } else if (index === 1) reading();
  else if (track === "telc" && index === 2) elements();
  else if (index === (track === "goethe" ? 2 : 3)) listening();
  else if (index === (track === "goethe" ? 3 : 4)) writing();
  else if (index === (track === "goethe" ? 4 : 5)) speaking();
  else if (index === mockIndex) {
    add({ id: `${id}-mock-scope`, type: "callout", heading: "ScienceDojo Mini-Mock · ehrliche Standortbestimmung", body: "Dieser verkürzte Originaltest trainiert alle relevanten Fertigkeiten. Er hat weniger Fragen und kürzere Hörtexte als die echte Prüfung und ergibt keine offizielle Prüfungsprognose. Die Texte sind aus dem Training bekannt; verwenden Sie den anschließenden offiziellen Test für eine Prüfung mit frischem Material. Lesen/Sprachbausteine: 20 Minuten; Hören nach angegebenem Abspielplan; Schreiben im vollständigen offiziellen Zeitbudget; Sprechen als Paar nach der Aufgabenstruktur. Die Plattform nutzt keinen automatischen Prüfungstimer.", tone: "amber" }, ["reading", "listening", "writing", "speaking"]);
    reading();
    if (track === "telc") elements();
    listening(); writing(); speaking();
  } else if (index === mockIndex + 1) {
    add({ id: `${id}-analysis`, type: "process", heading: "Fehleranalyse: Ursache, Übung, neuer Versuch", items: [{ title: "Belege vergleichen", body: "Notieren Sie Frage, eigene Antwort, richtigen Beleg und Fehlerursache: Wort nicht bekannt, Bedingung übersehen, Negation, Sprecher verwechselt oder Zeitdruck." }, { title: "Produktion prüfen", body: "Schreiben: alle Punkte, Register, Verbindungen und Verständlichkeit. Sprechen: Reaktion, Gründe, Beispiele und Gesprächsabschluss. Nutzen Sie die Bewertungsbeschreibungen des offiziellen Anbieters und Feedback einer Lehrkraft." }, { title: "Gezielt wiederholen", body: "Wählen Sie zwei Schwächen. Grammatik: Kapitel 1/6/10/14; formelle Texte: 4/5/9; Meinung: 10/15; Planung: 14/16. Bearbeiten Sie die Aufgabe erneut mit neuen eigenen Informationen." }, { title: "Erneut prüfen", body: "Vergleichen Sie erste und zweite Antwort. Prüfen Sie dann mit frischem offiziellem Material, ob die Verbesserung auch ohne bekannte Texte funktioniert." }] }, ["reading", "listening", "grammar", "writing", "speaking"]);
    add({ id: `${id}-reflection`, type: "writing-practice", heading: "Ihr konkreter Wiederholungsplan", prompt: "Notieren Sie zwei Fehler mit Beleg, je eine mögliche Ursache, eine passende Kapitelübung und einen überprüfbaren nächsten Schritt. Übungsziel 50–100 Wörter.", minWords: 40, maxWords: 130, checklist: ["Zwei konkrete Fehler", "Ursache mit Beispiel", "Passende Kapitelübung", "Termin und Nachweis des neuen Versuchs"], modelAnswer: "Ich habe beim Lesen eine Zeitbedingung übersehen. Ich werde in Kapitel 3 die Uhrzeiten markieren und jede Antwort mit einem Satz belegen. Beim Sprechen habe ich nur meinen eigenen Vorschlag genannt. Ich übe deshalb die Planung in Kapitel 14 mit einer Partnerin und stelle mindestens zwei Rückfragen. Am Sonntag nehme ich das Gespräch erneut auf und prüfe, ob wir zu einem gemeinsamen Ergebnis kommen.", completion: "interact" }, ["writing"]);
  } else {
    add({ id: `${id}-official`, type: "resources", heading: "Offizielle Prüfungsmaterialien", items: germanB1Sources.filter((item) => track === "goethe" ? item.title.startsWith("Goethe") : item.title.startsWith("telc")) }, ["reading", "listening", "writing", "speaking"]);
    add({ id: `${id}-official-process`, type: "process", heading: "Den vollständigen offiziellen Test durchführen", items: [{ title: "Material bereitstellen", body: "Öffnen Sie die Anbieterressourcen. Wählen Sie den allgemeinen B1-Test für Erwachsene und laden Sie Aufgaben, Lösungen und Audiodateien von dort. Offizielle Aufgaben werden hier nicht kopiert." }, { title: "Prüfungsbedingungen", body: "Setzen Sie die jeweiligen offiziellen Zeiten; legen Sie Wörterbuch, Notizen und Handy weg. Lesen Sie die Anweisungen und verwenden Sie nur die vorgesehenen Wiederholungen." }, { title: "Rezeptive Teile", body: "Bearbeiten Sie alle Aufgaben des vollständigen Tests. Öffnen Sie die Lösungen erst danach und ermitteln Sie die Ergebnisse nach dem offiziellen Schlüssel." }, { title: "Schreiben und Sprechen", body: "Schreiben Sie alle Aufgaben und üben Sie Sprechen mit einer Partnerperson. Nutzen Sie die offiziellen Kriterien und möglichst Rückmeldung einer Lehrkraft; die Kurschecks vergeben keine offiziellen Produktionspunkte." }, { title: "Entscheidung", body: "Vergleichen Sie mit den aktuellen Bestehensregeln des Anbieters. Wiederholen Sie schwache Bereiche und nutzen Sie danach einen weiteren offiziellen Übungssatz. Der Kurs garantiert kein Prüfungsergebnis." }] }, ["reading", "listening", "writing", "speaking"]);
  }
  return { id: `${id}-lesson`, slug: id, examTrack: track, sectionId: section.id, section: section.title, title: `${track === "goethe" ? "G" : "T"}${index + 1} · ${title}`, summary: `Originaltraining und Strategie für ${track === "goethe" ? "Goethe-Zertifikat B1" : "telc Deutsch B1"}: ${title}.`, durationMinutes: index === mockIndex || index === trackNames[track].length - 1 ? 240 : index === strategyIndex ? 120 : 75, blocks };
}

const core = germanB1Chapters.map(coreLesson);
const goethe = trackNames.goethe.map((_, index) => examLesson("goethe", index));
const telc = trackNames.telc.map((_, index) => examLesson("telc", index));
const quiz: QuizQuestion[] = [
  ...germanB1Chapters.slice(0, 6).map((chapter, i) => b1Choice(`b1-final-read-${number(i)}`, { ...chapter.readingCheck, prompt: `${chapter.reading}\n\n${chapter.readingCheck.prompt}` })),
  ...germanB1Chapters.slice(6, 12).map((chapter, i) => ({ ...b1Choice(`b1-final-listen-${number(i)}`, chapter.listeningCheck), audioUrl: `/audio/german-b1/de-b1-${number(i + 6)}.m4a`, audioTranscript: chapter.listening })),
  ...germanB1Chapters.slice(10, 16).map((chapter, i) => b1Choice(`b1-final-language-${number(i)}`, chapter.grammarCheck)),
];

export const germanB1Course: AcademyCourse = migrateAcademyCourse(styleGermanB1Course({
  key: GERMAN_B1_COURSE_KEY, title: "Deutsch B1 komplett: selbstständig im Alltag, sicher zur Prüfung", shortTitle: "Deutsch B1 komplett",
  description: "16 thematische Kapitel von der A2-Brücke bis zur B1-Mastery: Wortschatz, Hören, Lesen, Grammatik, Konnektoren, Redemittel, Schreiben, Sprechen und echte Alltagsszenarien. Nach dem gemeinsamen Abschlusstest wählen Sie Goethe-Zertifikat B1 oder telc Deutsch B1 mit eigenem Training, Mini-Mock, Fehleranalyse und offizieller Prüfungschallenge. Voraussetzung: Deutsch auf A2-Niveau.",
  estimatedMinutes: core.reduce((sum, lesson) => sum + lesson.durationMinutes, 0) + Math.min(...[goethe, telc].map((lessons) => lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0))),
  audienceRoles: ["student"], passMark: 70, quizRevision: 1, sections,
  examTracks: [{ id: "goethe", title: "Goethe-Zertifikat B1", description: "Vier Module; persönliche E-Mail, Meinungsbeitrag, formelle Nachricht; gemeinsam planen, präsentieren und reagieren." }, { id: "telc", title: "telc Deutsch B1", description: "Allgemeines Zertifikat Deutsch: Lesen, Sprachbausteine, Hören, Leitpunktbrief und drei mündliche Teile." }],
  theme: { preset: "journey", accent: "blue-citrus", typography: "friendly-sans", density: "comfortable", coverStyle: "minimal", lessonHeaderStyle: "editorial" },
  rules: { navigation: "linear", lessonCompletion: "required-blocks", requireFinalAssessment: true, attemptLimit: null, feedbackTiming: "after-submit" },
  lessons: [...core, ...goethe, ...telc], quiz,
}));
