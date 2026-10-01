import type { LessonBlock } from "./tutor-academy.ts";

/** Original formative practice. Existing portfolio IDs and completion gates stay intact. */
export function enrichA1ChapterTwo(blocks: LessonBlock[]): LessonBlock[] {
  const practice = (id: string, heading: string, prompt: string, modelAnswer: string,
    checklist: string[], minWords = 5, maxWords = 100): LessonBlock => ({
    id: `a1-route-02-guided-${id}`, type: "writing-practice", heading, prompt,
    minWords, maxWords, checklist, modelAnswer, completion: "view",
  });
  const insertions: Record<string, LessonBlock[]> = {
    "teil-2": [practice("dialog", "Selbst üben · ein Gespräch ordnen",
      "Bringen Sie die Zeilen in eine passende Reihenfolge und schreiben Sie das Gespräch: A: Ich heiße Nora. / B: Hallo! / C: Freut mich, Nora. Ich heiße Luis. / D: Wie heißt du? Speichern Sie zuerst Ihren Versuch, dann vergleichen Sie mit dem Beispiel. Auch andere natürliche Gespräche sind möglich.",
      "Hallo! Wie heißt du? Ich heiße Nora. Freut mich, Nora. Ich heiße Luis.",
      ["Ich beginne mit einer Begrüßung.", "Die Namensfrage steht vor der Antwort.", "Ich vergleiche nach dem Speichern; dies ist keine automatische Bewertung."], 10)],
    "teil-4": [practice("satzbau", "Selbst üben · Sätze bauen",
      "Schreiben Sie drei vollständige Sätze. Ordnen Sie alle Wörter: 1. heiße / ich / Nora. 2. du / woher / kommst? 3. wohnen / Sie / wo? Denken Sie an Großschreibung und Satzzeichen. Beispiel: aus Portugal / ich / komme → Ich komme aus Portugal.",
      "Ich heiße Nora. Woher kommst du? Wo wohnen Sie?",
      ["Im Aussagesatz steht das Verb an zweiter Stelle.", "Nach woher oder wo kommt das Verb.", "Sie als höfliche Anrede ist großgeschrieben."], 9)],
    "teil-6": [practice("formen", "Selbst üben · kommen und wohnen",
      "Ergänzen Sie die Lücken und schreiben Sie die ganzen Sätze: Ich ___ aus Portugal. Du ___ aus Italien. Wo ___ Sie? Ich ___ in Bremen. Wörter: komme, kommst, wohnen, wohne. Jedes Wort passt einmal. Danach ändern Sie Herkunft und Wohnort für eine erfundene Person.",
      "Ich komme aus Portugal. Du kommst aus Italien. Wo wohnen Sie? Ich wohne in Bremen. Ich komme aus Polen und wohne in Bonn.",
      ["Ich benutze komme und wohne mit ich.", "Mit du benutze ich kommst.", "Mit Sie benutze ich wohnen.", "Ich schreibe zum Schluss eigene Angaben."], 15)],
    "teil-8": [practice("fragen", "Selbst üben · die passende Frage finden",
      "Schreiben Sie zu jeder Antwort eine Frage mit du: 1. Ich heiße Nora. 2. Ich komme aus Portugal. 3. Ich wohne in Bremen. 4. Ich bin 26 Jahre alt. 5. Ich spreche Portugiesisch und Deutsch. Hilfe: Wie …? Woher …? Wo …? Wie alt …? Welche Sprachen …?",
      "Wie heißt du? Woher kommst du? Wo wohnst du? Wie alt bist du? Welche Sprachen sprichst du?",
      ["Name: Wie heißt du?", "Herkunft: Woher? Wohnort: Wo?", "Alter: Wie alt bist du?", "Ich prüfe sprichst mit du."], 15)],
    "teil-9": [practice("reparieren", "Selbst üben · höflich nachfragen",
      "Am Empfang der Sprachschule sprechen Sie mit Frau Berger. Verbessern Sie die zwei Sätze: Wo wohnst Sie? / Welche Sprachen sprechen du? Schreiben Sie beide Fragen höflich mit Sie. Ergänzen Sie danach eine Bitte um Wiederholung. Hilfe: bitte, noch einmal, langsam.",
      "Wo wohnen Sie? Welche Sprachen sprechen Sie? Sprechen Sie bitte noch einmal langsam.",
      ["Ich bleibe bei Sie und mische nicht du und Sie.", "Die Verbformen passen zu Sie.", "Meine Bitte ist höflich und verständlich."], 10)],
  };
  const result: LessonBlock[] = [];
  for (const block of blocks) {
    if (block.type === "divider") {
      const suffix = block.id?.match(/teil-\d+$/)?.[0];
      if (suffix && insertions[suffix]) result.push(...insertions[suffix]);
    }
    if (block.type === "writing-practice" && block.id?.endsWith("-schreiben")) {
      result.push({ id: "a1-route-02-guided-vom-profil-zum-text", type: "worked-example",
        heading: "Schreiben · vom Profil zum eigenen Text",
        problem: "Profil: Luis · 34 · Portugal · Bremen · Portugiesisch und Deutsch. Wie wird daraus eine Vorstellung?",
        steps: [
          { title: "Information auswählen", body: "Name → Ich heiße Luis. Herkunft → Ich komme aus Portugal." },
          { title: "Sätze ergänzen", body: "Wohnort → Ich wohne in Bremen. Alter → Ich bin 34 Jahre alt." },
          { title: "Verbinden und abschließen", body: "Ich spreche Portugiesisch und Deutsch. Schreiben Sie Hallo! am Anfang und Bis bald! am Ende." },
        ], answer: "Hallo! Ich heiße Luis. Ich komme aus Portugal und wohne in Bremen. Ich bin 34 Jahre alt. Ich spreche Portugiesisch und Deutsch. Bis bald!" });
    }
    if (block.type === "speaking-practice" && block.id?.endsWith("-sprechen")) {
      result.push({ id: "a1-route-02-guided-wechselgespraech", type: "accordion",
        heading: "Sprechen · nicht nur vorstellen, auch reagieren",
        items: [
          { title: "Mit einer Lernpartnerin oder einem Lernpartner", body: "A fragt nach Name, Herkunft und Wohnort. B antwortet und fragt zurück. Wechseln Sie danach die Rollen. Nutzen Sie echte oder erfundene Angaben." },
          { title: "Allein üben", body: "Lesen Sie eine Frage, schauen Sie weg und antworten Sie laut: Wie heißen Sie? Woher kommen Sie? Wo wohnen Sie? Sagen Sie anschließend eine eigene Rückfrage. Diese Textübung ersetzt noch kein Gespräch mit einer gesprochenen Partnerstimme." },
          { title: "Ein mögliches Gespräch", body: "A: Guten Tag! Wie heißen Sie? B: Ich heiße Nora. Und Sie? A: Ich heiße Luis. Woher kommen Sie? B: Aus Portugal. Und wo wohnen Sie? A: In Bremen. B: Ich auch!" },
        ] });
    }
    result.push(block);
  }
  return result;
}
