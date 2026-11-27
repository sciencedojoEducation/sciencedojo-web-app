# Lehrbuch source-activity repair

Owner request, 20 November 2026: activities and questions are incomplete, with Wissenschaft given as an example. The scope is the supplied 202-page book, including any activities on chapter-opening and appendix pages. The earlier native conversion and green structural checks do not prove activity completeness.

## Completion requirements

1. Inspect every source page, recording actual activity/subquestion identifiers, response counts, essential supporting text/images and the source layout. Reading-only pages need an explicit source-based classification.
2. Compare that inventory with the native book. Restore missing instructions, questions, choices, matching rows, grammar blanks and section boundaries. Do not invent answers, absent media or automatic grades.
3. Present actual source relationships clearly: quiz questions with their own choices, paragraph headings beside their paragraphs, aligned grammar tables, and independently saved fields for repeated numbering in separate sections. Check desktop and phone layouts.
4. Preserve saved answer identities when their meaning is unchanged. Retired/ambiguous fields remain accessible in the own-account journal/page notes. Do not reinterpret an old selection as a different option or silently replace a previous answer.
5. Validate the source inventory and independent field bindings, existing account/privacy/CAS behaviour, source packaging, types/build and actual rendered interactions. Complete the source audit across the book, not just a representative sample.
6. Publish the corrected private source/application in ScienceDojo and verify the actual current deployment and saving. Migration081 is already applied; no new schema or public/learner exposure is inferred.

## Evidence and ongoing status

The released native data and source overrides are preserved in ignored `private-materials/lehrbuch-audit-2026-11-20/baseline/`. This worktree now has its own private source copy; it no longer writes through the previous source-directory symlink into the original checkout.

The private `derived/source-activity-audit-2026-11-20.json` records the page inventory, independent expected response counts and remaining pages. The private authoring overrides contain source text and must stay out of Git. A page containing one native exercise is insufficient evidence that all of its source activities are present.

Initial confirmed Wissenschaft defects include: the opening ten-question quiz treated as noninteractive introductory content; three omitted matching rows; a missing passive-voice gap; an incomplete four-row transformation table; missing listening options; omitted heading selections/article fragments; missing pronoun/rule cells and a discussion task; and distinct listening sections sharing the same answer IDs. Those defects are being repaired against the source. The book-wide audit, browser acceptance and production release remain in progress. Do not mark the goal complete from this initial list or a partial chapter repair.

### Local repair checkpoint — 20 November 2026

All sixteen Wissenschaft pages (printed72–87) now have source-compared overrides. The corrections restore the ten-question opening quiz, matching rows, grammar tables, phrase groups, article paragraphs, writing points and omitted film/discussion questions. Eight other source-compared activity repairs address shared controls, omitted rewrite/matching items and the nineteen actual blanks in the lecture notes. Those eight pages still need their remaining activities audited.

The independent inventory now covers74 pages: chapter1, Wissenschaft, the eight front-matter pages and all34 appendix pages. The appendix contained two previously noninteractive portrait templates, now restored as14 separately saved fields. **128 pages remain pending full source comparison.** The33 other appendix pages have no response activities; their reference layouts still need review. This is not book-wide completion. The native package currently has546 exercises,1097 fields and165 referenced figures; totals are packaging evidence, not completeness evidence.

`scripts/audit-lehrbuch-activities.mjs` checks source-inventoried task/order/response counts, repeated controls, segmented references, deterministic answer UUIDs and documented retirements/choice changes against the preserved baseline. Its `--require-complete` flag rejects an incomplete source inventory. Current structural/compatibility audit: no errors;46 retired fields remain as editable original rows in page notes/journal, with explicit reasons. It does not independently proofread text or prove the remaining pages complete.

Local browser checks at desktop and390px verified expected fields on all sixteen Wissenschaft pages, unique control IDs and no document overflow. An answer to a restored quiz question survived save/reload/journal; a synthetic earlier broad answer remained editable in page notes and journal. Only the two exact synthetic rows were removed; ten earlier preview rows were unchanged. Viewport reset. TypeScript and scoped lint passed (existing source-image warning only); all496 regression tests passed. The production webpack build passed with the existing font/data network reads; its server traces contain no private source or environment files. Publication is pending at this checkpoint. The14 restored appendix fields also fit desktop/390px layouts; internal task identifiers are hidden in their headings. The strict completion command correctly exits nonzero with144 source pages and33 reference layouts still pending. Private authoring scripts, source inventory, baseline and browser evidence stay in ignored material.


### Chapter1 checkpoint — 20 November2026

All sixteen printed pages8–23 have source-compared overrides. Repairs restore full role cards, the map-colour and article-heading responses, missing forum content points and a final draft, listening headings/person cells, five discussion topics, named portrait-note boxes, five film-speaker matches, all six expression matches and the omitted GroupB question. Reading passages and phrase groups follow source order; source diagrams/reference tables are aligned and responsive. Earlier meaningful answer IDs remain; replaced broad responses stay in page notes/journal with reasons.

The older per-exercise OCR patches were overriding complete reviewed-page replacements and silently removing a restored question. Complete page overrides now take precedence. The independent local source-inventory regression covers generated response counts; the global source audit reports no binding/control/coverage errors for inventoried pages. This still leaves128 source pages and33 appendix reference layouts pending.

Desktop/390px browser checks matched fields on all sixteen chapter1 pages, with no duplicate control IDs or document overflow. The new forum draft passed save/reload/journal. Its single exactly guarded synthetic local row was removed; all ten earlier preview rows were unchanged. The final writing card spans the reading width and a polluted illustration crop was replaced. Viewport reset. All497 regressions, focused lint and the production webpack build pass. Publication of this verified repair batch is being prepared; it does not complete the whole-book audit.

Release preflight also found stale page-kind metadata for restored interactive pages. The manifest now uses each final page kind, and upload validation compares per-page identities, kinds and response/task counts. The synthetic stale-manifest regression passes; all498 regressions and focused lint pass on the final preparation change. Application runtime is unchanged from the passing local production build. Hosted verification of the updated release head remains required.

### Chapter 05 second review — 27 November 2026

The owner requested individual page review, prioritising chapter 05. All sixteen source images for printed pages 72–87 were inspected again against the generated native content. This is the **Lehrbuch**, chapter “Wer Wissen schafft, macht Wissenschaft”.

| Printed page | Source activities checked | Saved response fields |
| --- | --- | ---: |
| 72 | Quiz questions 1–5 and learning overview | 5 |
| 73 | Quiz 6–10, comparison, disciplines, discussion and own quiz | 11 |
| 74 | Five meaning matches, complete article and abbreviation help | 6 |
| 75 | Comprehension, discussion, passive blanks/annotations, replacement table and rewrites | 20 |
| 76 | Quotations, vocabulary, discussion and listening questions 1–5 | 10 |
| 77 | Listening questions 6–10, three illustrated situations and story writing | 7 |
| 78 | Prediction, full article and six heading matches | 7 |
| 79 | Change notes, pronoun/rule tables, dialogues, negation and discussion | 29 |
| 80 | Eight expressions, complete article and five reader questions | 14 |
| 81 | Article follow-up, listening topics, true/false, countries, questions and reflection | 17 |
| 82 | Complete news item, four heading groups and phrase selections | 8 |
| 83 | Letter, review, partner correction, arguments and roleplay | 8 |
| 84 | Complete portrait and research assignment | 1 |
| 85 | Grammar reference tables, examples and footnote; reading only | 0 |
| 86 | Senses, meaning matches, scale, discussion and film tasks | 22 |
| 87 | Discussion, film question, email, six idioms and dialogues | 11 |

The chapter contains 59 native tasks and 176 independently saved responses. Additional repairs correct article OCR/paragraphs and quotation punctuation, remove an OCR footer from the rewrite activity, clarify the printed cross-reference, restore the learning overview and add five source illustrations. Existing response bindings are unchanged. The source inventory records the option-label spelling correction explicitly; it changes no choice meaning. The inventory still covers 74/202 pages; 128 pages and 33 appendix reference layouts remain pending. A second chapter 05 review is not a full-book completion claim.

All sixteen pages matched expected task/field counts at desktop and in a confirmed 390px iframe (386px document width). No duplicate control IDs or horizontal document overflow were found. The browser viewport override did not apply in this session, so the earlier attempted resize was discarded as phone evidence; the embedded preview supplied the actual narrow layout check. The stacked passive table was visually inspected. All 503 regression tests and focused publisher lint pass. The temporary generic preview harness is removed before commit.

The former upload halted after an immediate read failed verification; a later read matched. That does not prove a cache root cause. The publisher now uploads illustrations first, page data next and the manifest last. Each object is verified with a unique authenticated no-store download, a 20-second read deadline and at most three attempts. Persistent mismatches fail with expected/actual hashes; access errors stop immediately. Synthetic tests cover ordering, stale/transient reads, terminal failures and stopping before dependent pages. Credentials and source bodies are excluded from errors/reports. Only the existing strict source allowlist is published; no learning records or authoring material are included.

Private publication completed on 27 November: all **373 objects / 9,040,463 bytes** were uploaded and downloaded with matching SHA-256 hashes; the manifest was last. The package has 202 pages, 546 tasks, 1,097 fields and 170 figures. No verification retry was needed in this run. The original private source baseline remains available for rollback.

PR27 is merged into main as `7516d1a`; its Vercel deployment status is successful. The existing-owner canonical browser opened every chapter 05 page, matching all expected task/field counts. The four pre-existing passive answers displayed in their corresponding fields. A new quiz answer and exercise-specific question survived save, reload and journal display and were confirmed in the database. Both exact synthetic rows were removed with owner/book/id/content/revision guards against their empty pre-test bindings. All 13 original rows matched the fresh baseline exactly afterward. The new reader was restored to printed page 75 with “All changes saved”; the older owner tab was untouched. Canonical anonymous content, illustration and entries requests all returned 401/no-store. Private evidence includes the full upload hash report, page checks, owned-fixture cleanup report and live quiz screenshot. Audio/video remains absent, review remains manual, and source text retains its OCR qualification. These checks establish this admin-only chapter release, not independent proofreading or completion of the remaining book.
