const explanations: Record<string, string> = {
  "nico-a1-01-question-1": "Wie geht es dir? · How are you? In this expression, the person takes the dative form: du → dir. Use Ihnen when speaking formally.",
  "nico-a1-02-question-2": "Ich wohne in Berlin. · I live in Berlin. Use in for the place where you live. Use aus for where you come from: Ich komme aus Sri Lanka. With wohnen, in describes a location and takes the dative; Berlin has no article here.",
  "nico-a1-03-question-1": "Meine Adresse ist hier. · My address is here. Adresse is feminine: die Adresse. Before this feminine noun, mein becomes meine.",
  "nico-a1-04-question-1": "Ich möchte einen Tee. · I would like a tea. Tee is masculine: der Tee. As the object of möchte, it takes the accusative: ein → einen.",
  "nico-a1-05-question-3": "Ich brauche ein Zimmer. · I need a room. Zimmer is neuter: das Zimmer. As the accusative object of brauche, it uses ein. Einem is the dative form.",
  "nico-a1-08-question-1": "Ich bin in dem Laden. · I am in the shop. This describes a location, so in takes the dative: der Laden → dem Laden. In dem is commonly shortened to im.",
  "nico-a1-08-question-2": "Ich gehe in den Laden. · I am going into the shop. This describes a destination, so in takes the accusative: der Laden → den Laden.",
  "nico-a1-09-question-2": "Ich nehme einen Apfel. · I will take an apple. Apfel is masculine: der Apfel. As the object of nehme, it takes the accusative: ein → einen.",
  "nico-a1-10-question-2": "Das Hemd ist blau. · The shirt is blue. An adjective after ist has no adjective ending. Before a noun, it can take an ending: ein blaues Hemd.",
  "nico-a1-11-question-3": "Mir tut der Fuß weh. · My foot hurts. The person experiencing the pain takes the dative: ich → mir. Der Fuß is the subject, so the verb is tut.",
  "nico-a1-12-question-2": "Ich träume von einem Laden. · I dream of a shop. Von always takes the dative. Laden is masculine: ein Laden → einem Laden.",
};

export function nicosWegA1QuestionExplanation(questionId: string, fallback: string): string {
  return explanations[questionId] || fallback;
}

// Already published lessons retain their original explanation in the database.
// Replace only the old generated wording; preserve explanations edited by a teacher.
export function resolveNicosWegA1Feedback(questionId: string, explanation: string): string {
  return /^Coursebook answer: .+\. Read the grammar explanation above and try the sentence aloud\.$/.test(explanation)
    ? nicosWegA1QuestionExplanation(questionId, explanation)
    : explanation;
}
