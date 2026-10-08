import { getNicosNextWritingCheck } from "./nicos-weg-next-answer-bank.ts";
import { nicosWegA1Units } from "./nicos-weg-a1-source.ts";
import { NICOS_WEG_A1_KEY } from "./academy-feedback-capabilities.ts";
import type { AnswerCheckSpec } from "./academy-answer-checker.ts";
import type { QuizQuestion } from "./tutor-academy.ts";

// One reviewed rule for each of the three exercises in each unit.
const rules: [string, string][][] = [
  [
    ["Wie geht es dir? The person takes the dative: du → dir. Use Ihnen formally.", "‘Wie geht es dir?’ යන වාක්‍යයේ පුද්ගලයාට Dativ යෙදේ: du → dir. ගෞරවාන්විතව අමතන විට Ihnen යොදන්න."],
    ["Die Tasche ist schön. In a statement, the conjugated verb ist is in position 2.", "ප්‍රකාශන වාක්‍යයක විෂයට අනුව වෙනස් කළ ක්‍රියා පදය දෙවන ස්ථානයේ යෙදේ: Die Tasche | ist | schön."],
    ["Wie geht es Ihnen? For a formal greeting, replace dir with Ihnen and keep the capital I.", "ගෞරවාන්විතව සුවදුක් විමසීමට dir වෙනුවට Ihnen යොදන්න. Ihnen හි I ලොකු අකුරකින් ලියන්න."],
  ],
  [
    ["Ich komme aus Sri Lanka. With ich, kommen becomes komme. Aus describes where you come from.", "ich සමඟ kommen ක්‍රියා පදය komme වේ. ඔබ පැමිණෙන්නේ කොහෙන්ද යන්න දැක්වීමට aus යොදන්න."],
    ["Ich wohne in Berlin. Use in for where you live; aus for where you come from. In describes a location here and takes the dative; Berlin has no article.", "පදිංචි ස්ථානය සඳහා in යොදන්න: Ich wohne in Berlin. පැමිණෙන රට හෝ ස්ථානය සඳහා aus යොදන්න. මෙහි in සමඟ Dativ යෙදෙන නමුත් Berlin සඳහා article එකක් නැත."],
    ["Sie kommt aus der Schweiz. Aus takes the dative: die Schweiz → der Schweiz.", "aus සමඟ Dativ යෙදේ. එබැවින් die Schweiz → der Schweiz වේ: Sie kommt aus der Schweiz."],
  ],
  [
    ["Meine Adresse ist hier. Adresse is feminine (die Adresse), so mein becomes meine.", "Adresse ස්ත්‍රී ලිංග නාම පදයකි: die Adresse. එබැවින් මෙහි mein වෙනුවට meine යොදන්න."],
    ["Können Sie mir helfen? Helfen takes the dative: ich → mir.", "helfen ක්‍රියා පදය සමඟ Dativ යෙදේ. ‘මට’ යන්න සඳහා ich → mir වේ: Können Sie mir helfen?"],
    ["Können Sie mir helfen? In this yes/no question, können comes first and helfen stays at the end.", "මෙම ඔව්/නැහැ ප්‍රශ්නයේ können මුලින් යෙදේ. අනෙක් ක්‍රියා පදය වන helfen අවසානයේ තබන්න."],
  ],
  [
    ["Ich möchte einen Tee. Tee is masculine and is the accusative object: ein → einen.", "Tee පුරුෂ ලිංග නාම පදයකි. මෙහි එය Akkusativ කර්මය වන නිසා ein → einen වේ."],
    ["Ich möchte eine Pizza. Möchte means would like. Keep the umlaut: möchte and mochte have different meanings.", "‘කැමතියි’ යන අදහසට möchte යොදන්න. ö අකුර වැදගත්ය: möchte සහ mochte යන වචනවල අර්ථ වෙනස්ය."],
    ["Was möchtest du essen? The question word was comes first, möchtest second, and essen last.", "ප්‍රශ්න පදය was මුලින්, möchtest දෙවන ස්ථානයේ සහ essen අවසානයේ යොදන්න."],
  ],
  [
    ["Practise können: Du kannst im Hotel bleiben. With du, können becomes kannst; bleiben stays at the end.", "මෙහි können පුහුණු කරන්න: du සමඟ kannst යෙදේ. bleiben වාක්‍යයේ අවසානයේ තබන්න."],
    ["Im Hotel means in dem Hotel. A location takes the dative; das Hotel → dem Hotel.", "im Hotel යනු in dem Hotel යන්නයි. ස්ථානය දක්වන විට Dativ යෙදේ: das Hotel → dem Hotel."],
    ["Ich brauche ein Zimmer. Zimmer is neuter (das Zimmer); its accusative indefinite article is ein.", "Zimmer නපුංසක ලිංග නාම පදයකි: das Zimmer. Akkusativ හිදී ද එයට ein යෙදේ."],
  ],
  [
    ["Der Kurs beginnt um neun Uhr. Use um with an exact clock time.", "නිශ්චිත වේලාවක් දැක්වීමට um යොදන්න: um neun Uhr — නවයට."],
    ["Halb neun means half an hour before nine: 08:30 or 20:30, depending on the context.", "halb neun යනු නවයට පැය භාගයකට පෙර වේලාවයි: 08:30 හෝ සවස 20:30. එය නවයයි තිහ නොවේ."],
    ["Morgen arbeite ich. / Ich arbeite morgen. The verb arbeite stays in position 2.", "Morgen arbeite ich සහ Ich arbeite morgen දෙකම නිවැරදියි. arbeite ක්‍රියා පදය දෙවන ස්ථානයේ තබන්න."],
  ],
  [
    ["Ich bin Lehrer. A profession after sein usually has no article when stated without an adjective.", "විශේෂණයක් නොමැතිව sein සමඟ රැකියාව පවසන විට සාමාන්‍යයෙන් article එකක් යොදන්නේ නැත: Ich bin Lehrer."],
    ["Sie arbeitet als Lehrerin. Use als to say the role or profession someone works in.", "කෙනෙකු වැඩ කරන රැකියාව හෝ භූමිකාව දැක්වීමට als යොදන්න: als Lehrerin — ගුරුවරියක් ලෙස."],
    ["Ich arbeite gern. / Gern arbeite ich. The conjugated verb stays in position 2; gern means gladly.", "Ich arbeite gern සහ Gern arbeite ich දෙකම නිවැරදියි. ක්‍රියා පදය දෙවන ස්ථානයේ තබන්න. gern යනු කැමැත්තෙන් යන්නයි."],
  ],
  [
    ["Ich bin in dem Laden. Location takes the dative: der Laden → dem Laden. In dem can become im.", "පවතින ස්ථානය සඳහා Dativ යෙදේ: der Laden → dem Laden. in dem යන්න im ලෙස කෙටි කළ හැකිය."],
    ["Ich gehe in den Laden. A destination takes the accusative: der Laden → den Laden.", "ගමන් කරන ගමනාන්තය සඳහා Akkusativ යෙදේ: der Laden → den Laden. Ich gehe in den Laden."],
    ["Zum Bahnhof means zu dem Bahnhof. Zu takes the dative: der Bahnhof → dem Bahnhof.", "zum Bahnhof යනු zu dem Bahnhof යන්නයි. zu සමඟ Dativ යෙදේ: der Bahnhof → dem Bahnhof."],
  ],
  [
    ["Die Äpfel kosten drei Euro. Äpfel is plural, so use kosten rather than kostet.", "Äpfel බහු වචනයකි. එබැවින් kostet වෙනුවට kosten යොදන්න: Die Äpfel kosten drei Euro."],
    ["Ich nehme einen Apfel. Apfel is masculine and is the accusative object: ein → einen.", "Apfel පුරුෂ ලිංග නාම පදයකි. මෙහි Akkusativ කර්මය වන නිසා ein → einen වේ."],
    ["3,20 € is drei Euro zwanzig. You can also say drei Euro zwanzig Cent or drei Euro und zwanzig Cent.", "3,20 € යනු යුරෝ තුනයි සත විස්සයි. drei Euro zwanzig, drei Euro zwanzig Cent හෝ drei Euro und zwanzig Cent යැයි පැවසිය හැකිය."],
  ],
  [
    ["Ich habe keinen Pullover. Pullover is masculine; its negative accusative article is keinen.", "Pullover පුරුෂ ලිංග නාම පදයකි. Akkusativ හි ‘නැත’ යන්න දැක්වීමට keinen යොදන්න."],
    ["Das Hemd ist blau. An adjective after ist has no ending. Compare: ein blaues Hemd.", "ist ට පසුව යෙදෙන විශේෂණයට අමතර අවසාන අකුරු නොයෙදේ: Das Hemd ist blau. නාම පදයට පෙර: ein blaues Hemd."],
    ["Ich suche meine Mütze. Mütze is feminine (die Mütze); use meine in the accusative.", "Mütze ස්ත්‍රී ලිංග නාම පදයකි: die Mütze. මෙහි Akkusativ හි meine යොදන්න."],
  ],
  [
    ["Haben Sie einen Termin? In this yes/no question, haben comes first. Formal Sie keeps its capital S.", "මෙම ඔව්/නැහැ ප්‍රශ්නයේ haben මුලින් යොදන්න. ගෞරවාන්විත Sie හි S ලොකු අකුරකින් ලියන්න."],
    ["Mein Fuß tut weh. Fuß is singular, so use tut. Wehtun expresses pain.", "Fuß ඒක වචන බැවින් tut යොදන්න. Mein Fuß tut weh යනු මගේ පාදය රිදෙනවා යන්නයි."],
    ["Mir tut der Fuß weh. The person experiencing pain takes the dative: ich → mir.", "වේදනාව දැනෙන පුද්ගලයා සඳහා Dativ යෙදේ: ich → mir. Mir tut der Fuß weh."],
  ],
  [
    ["Ich möchte Deutsch lernen. With möchte, the other verb stays in the infinitive at the end: lernen.", "möchte සමඟ අනෙක් ක්‍රියා පදය මූලික ස්වරූපයෙන් අවසානයේ තබන්න: Ich möchte Deutsch lernen."],
    ["Ich träume von einem Laden. Von takes the dative: ein Laden → einem Laden.", "von සමඟ Dativ යෙදේ: ein Laden → einem Laden. Ich träume von einem Laden."],
    ["Ich übe jeden Tag. / Jeden Tag übe ich. Both are valid; übe stays in position 2.", "Ich übe jeden Tag සහ Jeden Tag übe ich දෙකම නිවැරදියි. übe ක්‍රියා පදය දෙවන ස්ථානයේ තබන්න."],
  ],
];

const alternatives: Record<string, string[]> = {
  "6.2": ["08:30", "8:30", "20:30", "08:30 Uhr", "8:30 Uhr", "20:30 Uhr"],
  "6.3": ["Morgen arbeite ich.", "Ich arbeite morgen."],
  "7.3": ["Ich arbeite gern.", "Gern arbeite ich."],
  "9.3": ["drei Euro zwanzig", "drei Euro zwanzig Cent", "drei Euro und zwanzig Cent"],
  "12.3": ["Ich übe jeden Tag.", "Jeden Tag übe ich."],
};

export const nicosWegA1AnswerBank: Record<string, AnswerCheckSpec> = Object.fromEntries(
  nicosWegA1Units.flatMap(unit => unit.exercises.map((prompt, index): [string, AnswerCheckSpec] => {
    const id = `nico-a1-${String(unit.number).padStart(2, "0")}-exercise-${index + 1}`;
    const [explanation, explanationSinhala] = rules[unit.number - 1][index];
    return [id, { id, prompt, modelAnswer: unit.answers[index], acceptedAnswers: alternatives[`${unit.number}.${index + 1}`] || [unit.answers[index]], explanation, explanationSinhala }];
  })),
);

const normalizeExerciseContent = (value: string) => value.normalize("NFC").trim().replace(/\s+/gu, " ");

export function getNicosWritingCheck(courseKey: string | undefined, block: { id?: string; prompt: string; modelAnswer: string }): AnswerCheckSpec | null {
  if (courseKey !== NICOS_WEG_A1_KEY) return getNicosNextWritingCheck(courseKey, block);
  const spec = block.id ? nicosWegA1AnswerBank[block.id] : null;
  return spec && normalizeExerciseContent(spec.prompt) === normalizeExerciseContent(block.prompt)
    && normalizeExerciseContent(spec.modelAnswer) === normalizeExerciseContent(block.modelAnswer) ? spec : null;
}

export function getNicosChoiceCheck(courseKey: string | undefined, blockId: string | undefined, question: QuizQuestion): AnswerCheckSpec | null {
  const spec = courseKey === NICOS_WEG_A1_KEY && blockId ? nicosWegA1AnswerBank[blockId] : null;
  if (!spec || normalizeExerciseContent(spec.prompt) !== normalizeExerciseContent(question.prompt)) return null;
  const choices = spec.prompt.match(/\(([^()]+ \/ [^()]+)\)/)?.[1].split(" / ");
  if (!choices || question.type && question.type !== "single-choice" || choices.length !== question.options.length) return null;
  if (choices.some((choice, index) => normalizeExerciseContent(choice) !== normalizeExerciseContent(question.options[index].label))) return null;
  return question.options.find(option => option.id === question.correctOptionId)?.label === spec.modelAnswer ? spec : null;
}
