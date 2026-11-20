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
