# German B1 course

Course key: `german-b1-complete`. Entry requirement: A2 German. The course uses the existing academy builder, learner submissions, chapter progression and exam-choice flow used by A1/B2.

The outcome is independent communication about familiar everyday, work, learning and travel situations: connected descriptions, reasons, opinions and collaborative decisions. There are 16 shared chapters, a shared 18-question assessment, and separate Goethe (9 lessons) and telc (10 lessons) routes. Core practice takes about 32.5 hours; exam-route practice is additional. These are activity estimates, not a claim that this alone supplies all instructional hours needed to reach B1.

## Chapter and grammar coverage

Every core chapter has contextual vocabulary, original reading (110+ words), original listening (90+ words), noticing, grammar practice, connectors, individual speaking, collaborative speaking, writing with a model, Redemittel, everyday transfer, a mission, an exam glimpse, retrieval and a new-situation mastery check.

| Chapter | Communication | Grammar and connections |
| --- | --- | --- |
| 1 · B1 bridge | Introductions beyond A2, experience, goals, starting profile | Present, Perfekt, common Präteritum, cases, modal verbs, weil/dass/denn/deshalb |
| 2 · People and life stories | Narrate encounters; describe character through actions | Perfekt/Präteritum, Plusquamperfekt, als/wenn/nachdem |
| 3 · Daily life and time | Priorities, habits, appointments | Reflexive verbs, seit/vor/in, bevor/während, sentence order |
| 4 · Housing and neighbours | Rules, defects, polite requests | Relative clauses in three cases, two-way prepositions, genitive recognition |
| 5 · Work | Applications, responsibilities, clarification | Modal verbs in present/past, polite könnte/würde, indirect questions with ob/W-words |
| 6 · Education | Choose a course and explain goals | um … zu, damit, infinitive with zu, purpose/reason/result |
| 7 · Health | Describe complaints, change appointments, give cautious advice | sollte/könnte, infinitive constructions, prepositional verbs |
| 8 · Travel | Disruptions, bookings, sequenced experiences | Plusquamperfekt, nachdem/bevor, tense selection, indirect questions |
| 9 · Shopping and services | Compare costs, contracts, complaints | Adjective endings, comparative/superlative, genitive, lassen |
| 10 · Media | Digital habits and advantages/disadvantages | obwohl/trotzdem, dass/ob, prepositional verbs and pronominal adverbs |
| 11 · Environment | Conditional plans and small measures | wenn/falls, present passive versus werden future, result |
| 12 · Community | Volunteering, perspectives, fair disagreement | Prepositional relatives, nicht nur … sondern auch, noun-verb combinations |
| 13 · Culture | Describe, review and recommend | Adjective/relative consolidation, comparisons, während |
| 14 · Decisions | Conflicts, options and compromises | würde/hätte/wäre/könnte/sollte, hypothetical wenn, lassen |
| 15 · Opinions/presentations | Experience, comparison, argument, questions | Sentence linking, opinion word order, reasons, examples, conclusions |
| 16 · Integrated mastery | Organize a real event from text and audio | Mixed tenses, relative clauses, Konjunktiv II, passive, connectors |

Block metadata records CEFR, domain, topic, skills, communication functions, chapter grammar and exam route. Chapter grammar describes the teaching context; it is not a numerical mastery score. No invented percentage coverage is shown.

## Learning progression

- Writing begins with approximately 80-word personal messages, then develops formal requests and complaints, reviews, opinion contributions and an integrated invitation. Model texts fit the displayed submission ranges. Exam prompts distinguish provider targets from flexible course practice ranges.
- Speaking starts with a supported 90-second account, builds to two-minute explanations and finishes with a three-minute presentation. Each chapter also contains a collaborative task. Single-person role alternation is available for practice; pair interaction remains the target.
- Connectors run through the whole course: reason, consequence, contrast, condition, purpose, sequence and opinion. Redemittel cards support agreement, disagreement, suggestions, clarification and presentation transitions.
- Recall returns to vocabulary from approximately one, three and seven chapters earlier. Learners are asked to revisit after three days and a week; this is guided retrieval, not an automatic scheduling feature.
- The bridge includes seven non-gating grammar diagnostic checks, reading/listening checks and productive submissions. The start profile and remediation plan are learner-led; the current platform does not generate an adaptive diagnostic or automatic five-skill score.

## Examination routes

The Goethe route covers reading's five parts, listening's four parts, personal email/opinion/formal writing, collaborative planning, presentation and responding to presentations. The telc route covers global/detail/selective reading, both language-elements parts, listening, four-point correspondence, contact, topic exchange and collaborative planning.

Goethe timing is reading 65 minutes, listening approximately 40, writing 60 and speaking approximately 15, with 15 minutes of speaking preparation. Modules can be taken separately. [Goethe exam information](https://www.goethe.de/ins/de/en/prf/prf/gzb1/inf.html), [Goethe speaking model instructions](https://bfu.goethe.de/b1_mod/sprechen.php).

General telc Deutsch B1 uses reading plus language elements in 90 minutes without a break, listening approximately 30, writing 30 and pair speaking approximately 15, with 20 minutes preparation. This route does not target DTZ or B1+ Beruf. [telc official exam information](https://www.telc.net/en/language-examinations/certificate-exams/german/certificate-german-telc-german-b1/).

Each route includes a **shortened original Mini-Mock**, explicitly identified as shorter than the real exam and using previously taught material. Matching, true/false and attribution decisions use the academy's choice controls; they are skill rehearsals, not exact replicas of official interfaces. External timers support practice; the course does not claim to enforce exam timing automatically. The final route stage directs learners to a complete fresh official test and its audio/solutions. Official assessment criteria and teacher review are needed for productive performance; a 70% internal knowledge-test pass mark is not an official Goethe/telc pass prediction.

Official resources checked on 30 September 2026:

- [Goethe adult B1 practice materials](https://www.goethe.de/ins/de/de/prf/prf/gzb1/ueb.html)
- [Goethe reading instructions](https://bfu.goethe.de/b1_mod/lesen.php)
- [Goethe listening instructions](https://bfu.goethe.de/b1_mod/hoeren.php)
- [Goethe writing instructions](https://bfu.goethe.de/b1_mod/schreiben.php)
- [telc B1 information and practice resources](https://www.telc.net/en/language-examinations/certificate-exams/german/certificate-german-telc-german-b1/)

## Authoring and deployment

Content lives in `lib/german-b1-curriculum.ts`, `lib/german-b1-exam-practice.ts`, `lib/german-b1-mastery.ts` and `lib/german-b1-course.ts`. All teaching texts are original. There are 20 listening recordings: one per chapter and four provider-skills recordings, including two with German speaker changes. Audio is synthetic and labelled accordingly.

`npm run academy:german-b1:audio` generates local recordings on macOS. An explicit German locale is used for the multilingual Eddy voice. Existing files are preserved unless `--force` is given; `--start` and `--count` support partial regeneration.

`npm run academy:german-b1:seed` validates the document and audio, then previews the database state without writing. `-- --apply` creates a new draft and uploads content-addressed audio to academy storage. Existing drafts require `--update` and a fresh `--expect-draft-sha256=…`; published courses cannot be overwritten. The seed does not publish or modify A1/B2.

## Visual design

The full-image cover and sixteen chapter illustrations use a consistent warm editorial style for adult learners. Every core chapter opens with a relevant scene and a German observation prompt; the Goethe and telc routes reuse suitable scenes with a clear practice-only caption. These image prompts support description, reasons, questions and negotiation without implying an official exam task.

Soft section colours distinguish listening, reading, language, speaking, writing and mastery. Images have descriptive German alt text. The source assets are in `public/images/academy/german-b1/`; the exact seventeen generation prompts and built-in ImageGen tool mode are recorded in `docs/german-b1-image-prompts.json`.

`npm run academy:german-b1:style` previews a visual-only update against the current saved draft. Applying requires `-- --apply --expect-draft-sha256=…` from a fresh preview. It uploads content-addressed images, snapshots the original draft and checks its revision before saving. Existing authored images, block backgrounds, teaching content, assessments and publication state are preserved.

The admin builder and preview use `/dashboard/admin/academy/german-b1-complete` and `/dashboard/admin/academy/german-b1-complete/preview`. Learner visibility follows the existing publication workflow.

Validation: B1 tests check document validity and IDs, chapter skills and model word ranges, distinct provider tasks, audio existence and speaker locale, assessment evidence and exam-branch progression. Run `node --experimental-strip-types --test tests/german-b1-course.test.mjs`, `npm run typecheck`, and targeted ESLint checks.
