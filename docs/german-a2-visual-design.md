# German A2 visual design

Saved to the existing A2 draft on 30 September 2026, revision 3. The course remains a draft.

## Design and learning purpose

The split-image cover pairs an adult neighbourhood conversation with readable text on a separate panel. Editorial lesson headers retain clear titles and progress. Sixteen distinct chapter scenes introduce familiar situations; short German observation questions and sentence starters activate speaking before the main activities. The twenty exam lessons use the preparation illustration or a relevant everyday scene. Illustrations are explicitly separate from exam questions and factual listening/reading evidence.

Soft panels distinguish listening (blue), reading (sage), language (lavender), speaking (rose), writing (peach), missions (yellow) and review (mint). Written headings identify each activity independently of colour. Images have German alternative text. Dates, prices, instructions, answers and assessment evidence remain accessible text or audio.

## Assets and provenance

Created 18 original illustrations with the built-in ImageGen tool: one hero, sixteen chapter scenes and one exam preparation scene. Exact prompts and original generation paths are recorded in [german-a2-image-prompts.json](german-a2-image-prompts.json). Original generated PNG files remain in place. Optimised WebP copies are in `public/images/academy/german-a2/`, with a consistent landscape aspect ratio and no enlargement. Hosted copies use content-addressed paths in the existing Academy media bucket.

## Safe application and verification

`lib/german-a2-visual-design.ts` supplies the visual authoring defaults. It keeps existing image blocks and explicit author backgrounds, and is included in the course source for future imports.

`scripts/style-german-a2-course.mjs` modifies the existing draft without replacing learning content. It validates every existing activity, requires a fresh draft hash, stores a rollback snapshot and checks the revision before writing. Run without arguments for a read-only preview; use `--verify-assets` to check hosted images.

Validation: all eight existing A2 tests passed; TypeScript and targeted ESLint passed. All 18 hosted WebP assets fetched successfully and matched local bytes. A second visual migration preview reported no changes. Representative core and Goethe lessons were inspected with the actual Academy components on desktop and at 390 px mobile width: images loaded, captions remained readable and no horizontal overflow occurred. The temporary development review route was removed after inspection. [Cover screenshot](german-a2-cover-preview.jpg).
