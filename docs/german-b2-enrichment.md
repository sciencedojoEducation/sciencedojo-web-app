# German B2 enrichment: editorial map

The 18 shared B2 chapters remain the spine of `german-b2-complete`. The two supplied *Aspekte neu B2* volumes informed the teaching pattern: a topic opener, varied input, language work, productive transfer, focused workbook practice, and a learner self-check. All learner-facing passages, prompts, recordings, charts, and model answers added here were written or generated for ScienceDojo. The books' pages, images, exercises, audio, and answer keys are not included in the course.

## Topic coverage

| Reference theme | Closest ScienceDojo chapters | Enrichment emphasis |
| --- | --- | --- |
| Heimat ist … | 2 Identity; 9 Mobility; 14 Society | Experiences, belonging, and competing perspectives |
| Sprich mit mir! | 15 Argumentation; 17 Speaking | Listening to an objection, prosody, and negotiation |
| Arbeit ist das halbe Leben? | 7 Work; 16 Formal communication | Job advertisement and precise professional requests |
| Zusammen leben | 4 Community; 10 Digital life; 14 Society | Community consultation and balanced recommendations |
| Wer Wissen schafft | 5 Wellbeing; 11 Media; 12 Environment | Sources, uncertainty, and evidence-based conclusions |
| Fit für … | 8 Consumer choices; 9 Mobility; 18 Synthesis | Practical notices, contract comparison, and action plans |
| Kulturwelten | 13 Culture; 2 Identity | Qualified reviews and cultural perspectives |
| Das macht(e) Geschichte | 11 Media; 14 Society | Source attribution and multi-perspective reporting |
| Mit viel Gefühl … | 2 Relationships; 5 Wellbeing; 15 Argumentation | Cautious language, concession, and tone |
| Ein Blick in die Zukunft | 10 Digital life; 12 Environment; 18 Synthesis | Conditional recommendations and unresolved questions |

This is a thematic comparison, not a page-by-page conversion. The existing chapters use original situations and retain their own sequence, exam glimpses, grammar practice, and Goethe/telc routes.

## Additions to each shared chapter

1. A second, short German text in a distinct real-world genre. Learners choose an inference before opening an explanation and text-based answer.
2. A targeted note-taking task for the existing chapter audio, followed by a concise original model summary.
3. A short synthetic pronunciation model for an original sentence, followed by a recording task on pauses, sentence stress, and intelligibility.
4. A chapter-specific “Ich kann …” self-assessment with a concrete next step when the learner is unsure.

Chapters 3, 8, and 12 also have original bar charts and writing prompts. Every chart prominently labels its data as invented practice data. Learners compare percentages and percentage points, describe limits of the data, and avoid unsupported generalization.

## Exam alignment and publication checks

The Goethe route continues to use the four skill modules and links to [Goethe's current B2 practice material](https://www.goethe.de/en/spr/prf/ueb/pb2.html). The telc route retains its reading and language elements, listening, writing, and paired speaking practice and links to [telc's current B2 information and mock examination](https://www.telc.net/en/language-examinations/certificate-exams/german/telc-german-b2/). These official pages were checked on 1 October 2026. The ScienceDojo exercises are original preparation, not official model tests.

Each of the 22 exam-track lessons also ends with a short, task-specific confidence check and a reminder of the strategy to repeat when needed.

Publication should retain all 40 lesson IDs and the 18-question final assessment. The new inference tasks are unscored answer reveals, so they do not change the inline assessment fingerprint. The 18 new pronunciation audio files and three chart assets must be deployed before their references enter the Academy published version. Existing Academy audio URLs may point to storage and must be preserved when updating that version.

## Publication command

Run `npm run academy:german-b2:publish-enrichment` for a read-only preview against the current Academy version. After the PR is merged and the site deployment is live, check that the preview still reports the expected version and draft revision. Then run:

```sh
npm run academy:german-b2:publish-enrichment -- --apply --expect-version=<preview version> --expect-draft-revision=<preview revision> --asset-origin=https://<deployed-site>
```

The command checks all 21 new assets on the deployed site before writing, preserves published blocks and their stored media URLs, and rejects a changed draft or assessment fingerprint. Verify the new published version in Academy after activation.
