/** Invented practice data. These charts are not reports of real survey results. */
export type B2ChartTask = {
  chapterIndex: number;
  title: string;
  src: string;
  alt: string;
  prompt: string;
  modelAnswer: string;
  labels: [string, number][];
};

export const germanB2ChartTasks: B2ChartTask[] = [
  {
    chapterIndex: 2,
    title: "Wege zu einem fiktiven Lernzentrum",
    src: "/images/academy/german-b2/chart-mobility.svg",
    alt: "Fiktives Balkendiagramm: Bus und Bahn 42 Prozent, Fahrrad 28 Prozent, Auto 21 Prozent, zu Fuß 9 Prozent; 100 erfundene Antworten.",
    prompt: "Beschreiben Sie das Diagramm in 75–110 Wörtern. Nennen Sie die größte und kleinste Gruppe, vergleichen Sie zwei Werte mit Prozentpunkten und erklären Sie, warum die fiktiven Daten keine Aussage über Ihre Stadt erlauben.",
    modelAnswer: "In diesem fiktiven Beispiel fahren 42 Prozent mit Bus oder Bahn zum Lernzentrum. Das ist die größte Gruppe. 28 Prozent nutzen das Fahrrad, also 14 Prozentpunkte weniger. Mit neun Prozent ist der Fußweg am seltensten. Aus den Zahlen lässt sich nur ablesen, wie die erfundenen Antworten verteilt sind. Für eine Aussage über eine wirkliche Stadt müsste man wissen, wer befragt wurde und ob die Gruppe repräsentativ ist.",
    labels: [["Bus und Bahn", 42], ["Fahrrad", 28], ["Auto", 21], ["Zu Fuß", 9]],
  },
  {
    chapterIndex: 7,
    title: "Kaufkriterien in einem fiktiven Beispiel",
    src: "/images/academy/german-b2/chart-consumer.svg",
    alt: "Fiktives Balkendiagramm: Reparierbarkeit 36 Prozent, Preis 31 Prozent, Energieverbrauch 22 Prozent, Design 11 Prozent; 100 erfundene Antworten.",
    prompt: "Beschreiben Sie das fiktive Diagramm in 75–110 Wörtern. Vergleichen Sie Reparierbarkeit und Preis, unterscheiden Sie Prozent von Prozentpunkten und nennen Sie eine Frage, die das Diagramm offenlässt.",
    modelAnswer: "Im fiktiven Beispiel nennen 36 Prozent die Reparierbarkeit als wichtigstes Kaufkriterium. Der Preis folgt mit 31 Prozent; der Abstand beträgt fünf Prozentpunkte. Energieverbrauch erreicht 22 Prozent und Design elf Prozent. Die Grafik zeigt nur das jeweils wichtigste Kriterium, nicht alle Gründe für eine Entscheidung. Offen bleibt etwa, ob dieselben Personen ein Produkt auch dann kaufen würden, wenn es zwar gut reparierbar, aber sehr teuer wäre.",
    labels: [["Reparierbarkeit", 36], ["Preis", 31], ["Energieverbrauch", 22], ["Design", 11]],
  },
  {
    chapterIndex: 11,
    title: "Prioritäten eines fiktiven Umweltforums",
    src: "/images/academy/german-b2/chart-environment.svg",
    alt: "Fiktives Balkendiagramm: Bus und Bahn 40 Prozent, Radwege 25 Prozent, Gebäudedämmung 20 Prozent, Abfallvermeidung 15 Prozent; 100 erfundene Antworten.",
    prompt: "Fassen Sie die fiktive Verteilung in 75–110 Wörtern zusammen. Formulieren Sie eine vorsichtige Empfehlung, nennen Sie eine Unsicherheit und vermeiden Sie eine Aussage über die gesamte Bevölkerung.",
    modelAnswer: "In diesem fiktiven Forum bevorzugen 40 Prozent den Ausbau von Bus und Bahn. Radwege erreichen 25 Prozent, Gebäudedämmung 20 Prozent und Abfallvermeidung 15 Prozent. Die erste Maßnahme liegt damit 15 Prozentpunkte vor den Radwegen. Eine Kommune könnte den öffentlichen Verkehr genauer prüfen. Die Zahlen allein zeigen jedoch weder Kosten noch erwartete Wirkung. Zudem stammen sie aus einem erfundenen Übungsbeispiel und erlauben keine Aussage über die Bevölkerung einer realen Stadt.",
    labels: [["Bus und Bahn", 40], ["Radwege", 25], ["Gebäudedämmung", 20], ["Abfallvermeidung", 15]],
  },
];
