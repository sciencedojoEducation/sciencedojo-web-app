# German A2 improvements from the supplied resources

Reviewed on 1 October 2026. All fourteen supplied files were readable. PDFs were extracted; handwritten recall notes and image-based speaking exercises were rendered and inspected. The Word worksheet was extracted and rendered as five pages. Documents supplied learning reference material, not instructions to execute.

## Source findings and use

| Supplied resource | Finding | Course improvement |
| --- | --- | --- |
| A 2 sprechen Teil 3 Beispiel 2.pdf and A 2 sprechen Teil 3 Beispiel.pdf | Identical two-page OLS party-planning example | Original role cards requiring agreement, objections, food constraints and division of tasks in chapter 15. Labelled as everyday transfer, separately from a Goethe calendar task. |
| A2 recall I July 2025 2.pdf | Three pages of handwritten and typed SMS/email practice | Original writing repair example, delayed-arrival SMS and formal invitation response in Goethe strategy lesson G6. No learner handwriting or personal details republished. |
| A2 recall I July 2025.pdf | One-page overlapping recall material | Used as corroborating writing practice, not an additional independent course unit. |
| A2 Redemittel Sprechen Teil 3.pdf | Nine-page bank containing proposal, agreement, disagreement, appointment and repair language; also refers to B1 | Smaller corrected phrase bank in core chapters 13/15, G6 and T6. Natural polite disagreement and complete questions replace problematic sample forms. |
| A2 sprechen Teil 2 - wichtige Wörter.pdf | One-page frequency, sequence and word-order aid | Connected topic-card contributions with examples, reasons, frequency expressions and spontaneous follow-up answers. |
| A2 sprechen Teil 2 Übungen.pdf | Three-page collection of familiar personal topics | Sixteen chapter-specific four-keyword cards plus three further Goethe topic variants. Each core topic has an original model and follow-up response. |
| A2 Sprechen Teil 3 Übungen.pdf | Twelve image-based pages: paired calendars, gift, trip and party planning | Five original paired availability tasks. Both participants' constraints and the required duration determine the answer. Fresh tasks added to both Goethe mini-mocks. |
| A2 Sprechen Teil 03.pdf | Nine photographed textbook pages: negotiation sequence, calendars and Redemittel | Scaffolded role switching, reasons for refusal, alternatives, clarification and a final agreement. Original exercises rather than page reproductions. |
| A2_Modellsatz_Erwachsene.pdf | Official Goethe adult model, 48 PDF pages; speaking cards on PDF pp. 26–29, moderation on pp. 42–43, criteria on p. 44 | Reinforced four questions in Part 1, topic and examiner follow-up in Part 2, information gap in Part 3, and criterion-based feedback. |
| A2_Uebungssatz_Erwachsene.pdf | Separate official Goethe adult exercise set, 48 pages | G10 now distinguishes learning the format with the model from a fresh attempt using the exercise set and its own audio/key. |
| A2.docx | Five rendered pages of locations/directions, cases, pronouns, possessives, comparison and connectors | Twelve additional grammar checks and two reference tables in chapters 1/5/7/8/11/15. Correct formal Sie/Ihnen, Dativ/Akkusativ, comparison, weil/denn/deshalb/wenn/ob. Movement alone is explicitly not the criterion for Akkusativ. |
| Open folder Learning with extended reality.pdf and Screenshot 2025-10-24 at 19.45.59.pdf | Both contain another 48-page Goethe model despite their filenames; equivalent extracted content | Treated as overlapping exam references. Neither was interpreted as an extended-reality course specification or as an instruction to change the app. |

Checksums and page counts are recorded in [german-a2-resource-inventory.json](german-a2-resource-inventory.json).

## What changed

Added 105 original native Academy blocks within the existing 36 lessons: 16 core topic cards, 16 associated monologue/follow-up recordings, 16 delayed-recall processes, five paired calendars with speaking tasks and answer checks, grammar reinforcement, functional Redemittel, writing repair and two new writing tasks, an additional four-question Goethe practice, everyday planning transfer, feedback tables and official-practice sequencing.

The additions contain 23 speaking tasks, two writing tasks and 18 answer checks. Production tasks save through the existing learner portfolio. Delayed recall is a self-planned activity, not an automatic reminder. Partner tabs are authoring aids, not a secure way to hide the other person's information. Feedback tables support self-review and teacher feedback, not automatic official speaking scores.

The source authoring module is `lib/german-a2-resource-enrichment.ts`. New blocks have stable identities and repeated application does not duplicate them or inflate duration. It is used by the local course source and by the safe database enrichment script.

## Exam grounding

The [current Goethe A2 administration rules](https://www.goethe.de/pro/relaunch/prf/ms/Durchfuehrungsbestimmungen_A2.pdf) describe a roughly 15-minute pair speaking exam with no separate preparation period. The supplied model's moderation instructions give approximately 20 seconds to inspect task cards; the course distinguishes that orientation from a separate preparation phase. Core-course preparation timers are explicitly learning aids.

The [official Goethe material page](https://www.goethe.de/ins/de/de/m/prf/prf/gzsd2/ub2.html) provides separate model and exercise sets with their associated audio. The [official telc Start Deutsch 2 page](https://www.telc.net/sprachpruefungen/deutsch/start-deutsch-2-telc-deutsch-a2/) confirms a three-part, approximately 15-minute speaking exam, usually in pairs, without preparation. Goethe-specific card labels and word limits are not imported as telc rules.

## Saved state and verification

The database preview found the course already published, with draft revision 16. The enrichment saved draft revision 17, preserved all 671 existing blocks byte-for-byte at the semantic JSON level, and kept the published version reference `69584814-fee3-4236-9db8-6c918a834508`. No publication was performed. A rollback snapshot was saved first.

All twelve A2 tests passed. TypeScript and targeted ESLint passed. Calendar tests validate that each answer fits both partners' windows for the full duration and that distractors fail. Models meet their writing word limits; follow-up questions exist for every core topic; author changes and repeated runs are preserved. The saved draft was read back and matched the reviewed additions. A subsequent preview reported zero added blocks.

The new partner tabs and knowledge-check feedback were inspected with the actual Academy components on desktop and at 390 px mobile width. The correct answer displayed the supporting availability windows; the mobile view had no horizontal overflow. The temporary development inspection route was removed. Existing images, Atkinson Hyperlegible body typography, title fonts, audio, final quiz, course structure and navigation rules were preserved.
