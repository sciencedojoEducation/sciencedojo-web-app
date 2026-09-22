# Academy authoring: Rise guide review and development brief

Reviewed 22 September 2026 against the current ScienceDojo source.

## Scope and evidence

This is a research and source-code audit, not a completed implementation or visual QA sign-off. I read all 41 articles linked directly from the [Rise 360 User Guide](https://www.articulatesupport.com/article/Rise-360-User-Guide), including the separate AI-enabled and AI-disabled dashboard flows. I then read 18 specialist articles covering templates, text layouts, galleries/carousels, statements, quotes, lists, processes, tabs/accordions, flashcards, knowledge checks, quiz policy, reusable block templates, media cropping, captions, keyboard behaviour and accessible-course design. I also inspected the official labelled blank-course editor screenshot and the two Articulate authoring screenshots supplied with this project.

The detailed coverage ledger is in [academy-rise-research-coverage.md](./academy-rise-research-coverage.md). The review intentionally stops at the boundary of Rise authoring: linked articles for account administration, the separate Storyline product, general LMS administration and every template-content catalogue entry were not recursively treated as authoring-interface documentation. Some tutorial videos were represented by the complete accompanying official article rather than a transcript; this is recorded in the ledger rather than implied to be visual inspection.

The strongest recommendation is to complete consistency across editing, preview and delivery before expanding the interaction catalogue. Existing controls and passing compilation tests do not prove that every stored setting affects every renderer.

## The authoring model to copy in principle

Rise feels focused because it uses progressive disclosure at three levels:

1. **Course level:** title, description and outline are edited inline. Global actions such as theme, settings, review, publish and preview remain in a thin toolbar.
2. **Lesson level:** the lesson remains visually close to learner output. Insertion controls appear at the empty state and between blocks, not as a permanent form.
3. **Block level:** direct text editing stays on the canvas; content, style and format controls appear contextually. A panel is used for structured fields such as multiple items, media and accessibility metadata.

This separation matters more than matching Articulate's icon positions. ScienceDojo should keep technical metadata, validation and advanced options available, but not visible all at once.

## Design principles confirmed across the guide

- **Preserve content while trying layouts.** Rise lets authors switch compatible quote, list, gallery, accordion/tab and flashcard variants. Gallery images that do not fit a smaller layout remain stored and reappear if the author switches back. Our presets should be nondestructive by default and warn before semantic conversions.
- **One data model, several presentations.** Block type, content and appearance are distinct. A layout switch changes presentation without silently replacing content.
- **Edit where meaning is visible.** Ordinary text is edited inline. Repeating structures, media, feedback and accessibility settings use a contextual panel.
- **Preview is functional, not a screenshot.** It opens at the current course location, runs the real interactions and navigation, and provides explicit desktop, tablet and phone widths.
- **Global style and local exceptions are separate.** Brand/theme supplies defaults; an individual block can change surface, spacing, content width and block-specific options.
- **Accessibility is part of authoring.** Alt text, decorative state, captions, transcripts, heading structure, contrast and interaction instructions belong in the editing flow and publishing checks.
- **Recovery is visible.** Undo/redo handles quick local changes; named and publish-triggered snapshots handle course-level recovery.
- **Reuse creates independent copies.** Reused block templates inherit the destination theme, retain intentional inline formatting and do not remain linked to their source.
- **Assessment content and assessment policy are distinct.** Questions, correct answers and feedback are edited separately from pass score, retries, timing, answer reveal and progression rules.

## Proposed ScienceDojo editor anatomy

| Surface | Persistent content | Contextual content |
| --- | --- | --- |
| Top bar | Back, course title/status, save state, undo/redo, preview, publish | Theme, readiness and history actions |
| Course rail | Sections, lessons, quiz, completion state | Add, duplicate, move, lesson settings |
| Canvas | Learner-like header and rendered blocks | Hover insertion points and selected-block outline |
| Block toolbar | None when idle | Drag, content, style, layout, duplicate, move, delete, more |
| Settings drawer | Closed by default | Structured content, design, accessibility and logic for selected block |
| Preview studio | Device and route controls | Functional draft learner runtime with isolated progress |

Desktop should keep the outline collapsible and the drawer temporary. Tablet should place the toolbar above the selected block. Mobile authoring should use bottom sheets/full-height sheets; it should not squeeze a desktop inspector next to a narrow canvas.

## Important differences from Rise

- ScienceDojo should keep the structured responsive block model. Rise's free-position custom block is explicitly non-responsive and has acknowledged accessibility limitations.
- We should expose fewer high-quality variants per block, each backed by a real learner renderer, rather than many choices whose previews are decorative.
- AI entries may remain visible as disabled future capabilities, but they must not dominate a workflow that currently needs reliable manual authoring.
- Native Academy delivery remains the publishing target. Review workflows, SCORM, public links, localization and multi-author locking should remain separate milestones.

## What to adopt from the guide

| Area | Documented pattern | Application to ScienceDojo |
| --- | --- | --- |
| Course structure | Inline outline editing, insertion between lessons, lesson duplication and reuse across courses. | Make building the outline fast; keep slugs and other technical fields in lesson settings. [Outline guide](https://www.articulatesupport.com/article/Rise-360-Outline-a-Course-with-Section-Headers-and-Lesson-Titles) |
| Block editing | Contextual content, style and format controls; bulk block management is a separate operation. | Keep the canvas calm and show only settings relevant to the current block. Add multiple-block actions after single-block editing is reliable. [Block management](https://www.articulatesupport.com/article/Rise-360-Manage-Block-Settings) |
| Text | Direct editing, selection formatting, internal lesson/block links, tables and equations. | Preserve selection while using the toolbar; make pasted formatting predictable and add stable internal links. Retain structured rich text. [Text guide](https://www.articulatesupport.com/article/Rise-360-Add-Text-Tables-and-More) |
| Themes | Cover, lesson header, navigation, fonts and accents have distinct settings. | Give every option an observable result through shared rendering components. [Appearance guide](https://www.articulatesupport.com/article/Rise-360-Personalize-the-Theme) |
| Branding | Reusable brand defaults apply to new content; an individual course can retain its own styling. | Start with ScienceDojo presets; avoid silently changing already-published courses when a default changes. [Brands](https://www.articulatesupport.com/article/Using-Brands-to-Style-Your-Content) |
| Media | Images and other media are edited from the relevant content context. | One media chooser, with usage-specific crop preview, alt text and captions; keep the existing storage restrictions. [Media guide](https://www.articulatesupport.com/article/Rise-360-Manage-Course-Media) |
| Preview | Starts from the current authoring location and exercises interactions and navigation at device sizes. | Preview the complete draft through the learner shell, with isolated preview progress and return to the same editing position. [Preview guide](https://www.articulatesupport.com/article/Rise-360-Preview-Content) |
| Recovery | Snapshots can be inspected before restoration; publishing events also produce snapshots. | Add snapshot preview and meaningful labels around the existing version history. [Snapshots](https://www.articulatesupport.com/article/Rise-360-Restore-Content-with-Snapshots) |
| Reuse | Saved groups of blocks become editable copies when inserted. | Create ScienceDojo patterns such as objective → explanation → worked example → practice → reflection. [Block templates](https://www.articulatesupport.com/article/Rise-Creating-Sharing-and-Reusing-Block-Templates) |
| Assessments | Question editing and quiz policy are separate, with explicit feedback and retry choices. | Make previews interactive, clarify attempts versus retries, and verify every exposed policy against server scoring. [Quiz settings](https://www.articulatesupport.com/article/Rise-Quiz-Settings) |
| Knowledge checks | Formative questions have feedback and interaction rules distinct from quiz lessons. | Keep practice feedback distinct from final course completion. [Knowledge checks](https://www.articulatesupport.com/article/Rise-How-to-Use-Knowledge-Check-Blocks) |
| Navigation | Free and restricted movement, sidebar visibility and in-lesson Continue gates are different controls. | Keep our present navigation rules clear; design Continue dependencies as a later feature. [Navigation guide](https://www.articulatesupport.com/article/Rise-360-Control-Course-Navigation) |
| Accessibility | Keyboard behaviour varies deliberately by interaction, including arrow navigation for tabs. | Test whole editing journeys and interactive blocks, including nested overlays. [Keyboard navigation](https://www.articulatesupport.com/article/Rise-Keyboard-Accessible-Navigation) |

## Gaps confirmed in our current source

These observations qualify the earlier Phase 2 completion summary. Several features exist as controls but are only partially connected to learner behaviour.

1. **Preview does not yet match the learner experience.** `app/dashboard/admin/academy/[courseKey]/preview/page.tsx` duplicates cover and lesson markup. Its cover has no real course contents/start flow, and its quiz options are plain divs. `AcademyPreviewStudio` defaults to the cover and first lesson, even when another lesson is selected. `maxWidth: "100%"` means its 1280px preset can shrink below 1280px. The iframe key changes on device switches, which resets local interaction state. `components/DashboardFrame.tsx` excludes learner Academy routes but not admin preview routes, so dashboard chrome also needs checking in the embedded document.

2. **Theme propagation is partial.** `lib/academy-theme.ts` provides variables, but `AcademyLessonBlocks`, `AcademyRichText`, `AcademyCarousel` and `AcademyQuiz` still contain fixed blue colours and serif font classes. The scoped typography CSS targets `academy-reading-copy`, which many reading elements do not use. The friendly font option currently changes letter spacing rather than selecting a distinct family. The media-led learner header applies a tint, without adding media. Navigation also needs the same theme values.

3. **Visual choices need meaningful previews.** `ThemeCardGroup` uses the same miniature graphic for every option; library thumbnails also repeat the same shape. Registry variants currently divide mostly into generic media/non-media groups. Text rendered directly through `AcademyRichTextEditor` bypasses the appearance wrapper used by `AcademyLessonBlocks`. Authors cannot reliably judge how each choice will look.

4. **Media workflow needs completion.** The chooser has no search, selected-image confirmation, upload progress or inline failure state. It does not update its library after upload. Item editors expose captions but `AcademyCarousel` does not render item captions. Cropping/focal controls and decorative flags are not unified across covers, carousel items and galleries. Upload exceptions need `finally` cleanup so the busy state cannot remain stuck.

5. **Overlay focus management needs consolidation.** `useDialogFocus` captures focusable elements only once, although tabs change the controls. It does not restore trigger focus generally. The nested media chooser registers a separate document key handler; stopping later handlers cannot cancel an outer handler that already ran. Its inline `onClose` dependency can also rerun the effect after parent changes. Use one tested overlay primitive with topmost-dialog ownership.

6. **Carousel editing can produce a rendering error.** `AcademyCarousel` accesses `items[activeIndex].src` without guarding empty items or an index made invalid by removing a slide. Publishing validation alone cannot protect an editor rendering an unfinished draft. Its slide dots also have very small hit areas. Handle empty and shortened arrays, then provide larger targets, keyboard controls and announcements. Swipe support is a proposed enhancement, not established by the current code.

7. **Readiness findings are not navigable.** Validation returns strings grouped by regular expressions. Authors should be able to click a finding and arrive at the relevant block/field. Structured issue paths would distinguish an inline knowledge check from a final quiz and allow errors to clear as authors fix them.

8. **Assessment preview is mostly static.** The per-question preview and full draft assessment display labels without a complete answer/submit/retry flow. Verify feedback timing policies individually; the inspected submit action explicitly handles after-pass suppression, which is not evidence that all three editor choices have different runtime behaviour.

## Proposed next implementation: complete the authoring loop

### Priority 1: trustworthy rendering and preview

- Extract shared cover, lesson header, course navigation and assessment presentation components.
- Use these components for published delivery and admin draft preview; keep draft access protected by the admin layout and server checks.
- Introduce a preview runtime with ephemeral progress and scoring. It must never call learner progress writes.
- Open preview at the selected lesson/block. Preserve scroll position and active block when returning.
- Maintain actual iframe dimensions independently of the host viewport. Scale the display or permit horizontal scrolling; do not silently reduce the advertised viewport width.
- Keep preview interactions intact when changing the device size. Add portrait/landscape only after the three existing sizes work accurately.
- Apply typography, palette, density, header and block appearance through one set of tokens. Keep semantic warning/success colours meaningful.
- Replace placeholder thumbnails with small previews of the actual layouts. Rename any option whose promised visual effect is not implemented.

Acceptance: a representative lesson and assessment look and behave consistently in editor preview and learner delivery at 1280×720, 768×1024 and 390×844. Device changes do not lose answers. No preview activity creates progress records.

### Priority 2: reliable contextual editing

- Move slug, duration and section metadata into lesson settings, leaving title, summary and content prominent.
- Use a shared overlay primitive for library, media chooser, settings, readiness and preview.
- Make pencil, style and layout controls open the appropriate surface consistently.
- Add structured validation findings: severity, lesson ID, block ID, field path and message.
- Make empty arrays, incomplete rich text and failed media loads safe to render while drafting.
- Support keyboard insertion, selection, movement and focus restoration across nested overlays.

Acceptance: an author can create an empty lesson, insert blocks at any position, edit them, undo/redo, preview, fix a validation finding and publish without losing selection or content.

### Priority 3: media and carousel authoring

- Add search, upload progress, inline errors and newly uploaded assets to the reusable chooser.
- Preview a candidate image before applying it. Capture alt text or an explicit decorative choice at placement time.
- Store shared media presentation fields where supported: caption, aspect, width and focal position. Render every exposed field.
- Add a carousel filmstrip for selecting/reordering slides, with duplicate/remove actions and accessible move buttons.
- Provide image-led, text-led and split slide layouts only after matching renderer variants exist.
- Show captions, maintain the active slide after editing and handle removal of the final slide gracefully.

Acceptance: upload once, reuse in a cover/gallery/carousel, replace it, change focal position and see the same crop/caption in preview and delivery. Failed uploads keep the previous selection intact.

### Priority 4: reusable learning patterns

- Save a block group or lesson as a named ScienceDojo template.
- Insert independent copies with fresh IDs; ordinary edits retain the existing IDs.
- Offer starter patterns for tutor onboarding, safeguarding examples, worked solutions and reflection.
- Add cross-lesson copying and bulk actions after clear single-block undo behaviour is established.

Acceptance: editing an inserted template never changes the source template or another course. Copied knowledge checks have independent identity and correct answer references.

## Remaining guide areas and scope decisions

The guide covers a much larger product family than our internal builder. These are research findings and future options, not additions to the current release scope.

- **Course library:** search, status filters and recently edited views are useful as our catalogue grows. Team folders and inherited permissions would belong to a later collaboration model. [Library guide](https://www.articulatesupport.com/article/Using-the-Library-to-Manage-Content)
- **Microlearning:** a short format centred on one objective could suit tutor refreshers; it should have explicit completion semantics rather than becoming an accidental special case of courses. [Microlearning guide](https://www.articulatesupport.com/article/Rise-360-Create-New-Microlearning)
- **Custom canvas/code blocks:** the documented custom canvas has responsiveness and accessibility limitations. Our structured blocks remain the appropriate default. [Custom blocks](https://www.articulatesupport.com/article/Rise-360-Create-Custom-Blocks)
- **Question banks:** reusable pools and question draws require versioning and stable scoring rules. Retain the current question types until the existing editor and previews are reliable. [Question banks](https://www.articulatesupport.com/article/Rise-360-Create-and-Manage-Question-Banks)
- **Review and collaboration:** Rise distinguishes feedback on a review version from editing privileges. A future ScienceDojo review system should pin comments to a version and stable lesson/block ID. Presence, locking and roles need their own design. [Review publishing](https://www.articulatesupport.com/article/Rise-360-Publish-Content-to-Review-360), [comments](https://www.articulatesupport.com/article/Rise-360-Manage-Integrated-Comments), [collaborators](https://www.articulatesupport.com/article/Rise-360-Work-on-Content-with-Other-Team-Members)
- **Distribution:** public sharing, hosted learning delivery and LMS export solve different problems. Keep our authenticated native Academy publishing as the immediate target. Public links, SCORM, PDF and web packages remain separate milestones. [Quick Share](https://www.articulatesupport.com/article/Articulate-360-AI-Deploying-Content-with-Quick-Share), [Reach](https://www.articulatesupport.com/article/Rise-360-Facilitate-Training-with-Reach-360), [export](https://www.articulatesupport.com/article/Rise-360-Export-to-LMS-PDF-and-the-Web)
- **Localization and labels:** translated content, navigation text and assistive labels all need coordinated language handling. Preserve stable structure now; implement language versions later. [Localization](https://www.articulatesupport.com/article/Articulate-Localization-Create-Multi-Language-Rise-360-Courses), [manual translation](https://www.articulatesupport.com/article/Rise-360-Manually-Translate-Your-Content), [labels](https://www.articulatesupport.com/article/Rise-360-Edit-Text-Labels)
- **AI and integrations:** source-driven outlines/imports could eventually reduce authoring work, with explicit human review before publication. The current AI entries should remain unavailable. Connector access and document provenance need a separate design. [AI authoring](https://www.articulatesupport.com/article/Rise-360-Create-Content-with-AI-Assistant), [MCP](https://www.articulatesupport.com/article/Using-Articulate-MCP), [OneDrive](https://www.articulatesupport.com/article/Importing-Content-from-OneDrive)
- **Generated deliverables:** the index includes guides, scenarios and training decks; these were surveyed at index level, not exhaustively evaluated. The interactive-video article shows chapters and checkpoints as a distinct editing workflow, which would warrant a separate milestone if adopted. [Interactive video](https://www.articulatesupport.com/article/Articulate-360-AI-Generating-an-Interactive-Video)

## Verification for the next build

Use a fixture course containing all 18 block types, incomplete drafts, long copy, portrait/landscape images, empty and multi-slide carousels, every theme choice and each supported question type. Test save failure, stale revisions, nested Escape handling, return focus, keyboard-only navigation, and preview isolation. Check theme parity and responsive layouts with an authenticated admin session. Existing passing unit tests and production compilation should remain necessary checks, alongside these workflow checks.

No application code, database, publication or deployment was changed during this research pass.
