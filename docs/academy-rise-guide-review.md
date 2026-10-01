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

## Preview runtime follow-up · 1 October 2026

The initial follow-up was blocked by a locked Mac. Access was subsequently restored; the dated live observations and verification below supersede that blocker and the initial pending statuses in the comparison table. The table distinguishes supplied screenshots, official documentation, and implementation choices.

### Evidence and adaptation

| Area | Evidence | ScienceDojo adaptation/status |
| --- | --- | --- |
| Desktop canvas | Supplied desktop screenshot fills the browser area rather than using a device bezel. | Desktop iframe fills the available preview stage; tablet/phone retain scaled device frames. Implemented, visual QA pending. |
| Course navigation | Screenshots show course title, progress, grouped lessons, completion circles and a separate active-lesson highlight. | Shared course outline uses actual saved learner state; draft/template preview shows zero progress rather than fabricated completions. Implemented, visual QA pending. |
| Desktop toggle | User clarified that the hamburger hides/reopens the sidebar. Official [navigation documentation](https://www.articulatesupport.com/article/Rise-360-Control-Course-Navigation) says the sidebar starts open and can be closed. | Desktop outline defaults open; accessible toggle hides/reopens it with a content-width transition. Reduced motion and Escape/focus return supported. Implemented, visual QA pending. |
| Small-device navigation | Official navigation documentation says small screens start collapsed to preserve reading space. | Tablet/phone outline starts collapsed; hamburger remains available from the beginning of the lesson. Implemented, visual QA pending. |
| Sections | Official navigation documentation distinguishes sidebar sections from an overlay menu. | Native expandable section groups in the course outline; active course lesson highlighted independently of completion. Implemented. |
| Entrance motion | Official [appearance documentation](https://www.articulatesupport.com/article/Rise-360-Personalize-the-Theme) says non-text blocks enter smoothly while scrolling. | Intersection-based, once-per-block entrances for media/interactions; ordinary text remains stable. Nested scrolling, reduced-motion preference changes and keyboard focus must remain safe. Exact movement/timing compared with the open Rise preview is pending. |
| Typography | Supplied tablet comparison shows our headings/cards disproportionately large. | Tablet body 18px, block headings 22px, more compact card padding; larger desktop body and title families retained. Live comparison pending. |
| Functional preview | Official [preview guide](https://www.articulatesupport.com/article/Rise-360-Preview-Content) requires responsiveness, actual interactions and navigation to be tested. | Draft and template studios use shared functional course rendering across cover/lesson/quiz. Browser QA is required in addition to source tests. |

### Verification checklist used for this pass

1. Inspect the currently open Rise course in desktop, tablet portrait/landscape and phone portrait/landscape; record the observed default outline state and exact toggle/reflow behaviour in each mode.
2. Scroll slowly through text, section transitions, images, galleries, interactive cards and lesson boundaries. Distinguish block entrances from parallax, hover effects, sticky controls and media playback; do not infer these from still screenshots.
3. Exercise outline section expansion, lesson navigation, completion indicators, previous/next controls and return-to-editor. Do not modify or publish the reference course.
4. Compare our draft and starter-template previews for the same behaviours across all five device modes, including a representative A1, A2, B1 and B2 lesson.
5. Check keyboard navigation, reduced motion, nested scrolling, menu focus, independent sidebar scroll, image fit, long headings and retained answers when changing device size.
6. Run relevant tests, typecheck, lint and production compilation. Confirm no preview interaction writes real learner completion or submissions.

No official Rise content, illustrations or recordings are being copied. Navigation and layout ideas are adapted to the Academy's existing structured content and completion rules.

### Live observations after unlocking · 1 October 2026

The Mac was unlocked and the open **Get to Know Articulate 360 AI** reference was inspected directly in Edge. All five device controls were exercised. These observations supersede the access blocker above, but do not close the remaining QA gates.

- Desktop: hamburger toggles the left outline, leaving the lesson available. The outline shows course title, percentage, collapsible section headers and individual lesson indicators. The reference distinguished `Completed`, partially viewed percentages and `Unstarted`; active lesson identity is separate from those states.
- Tablet portrait: the content is displayed in a portrait bezel with smaller, proportionate titles and a hamburger. Landscape uses a wider bezel and can show the outline beside the lesson. Device changes keep the reference's current lesson.
- Phone portrait/landscape: both device modes are functional, and the hamburger opens the grouped course navigation. A previously collapsed section remained collapsed after orientation changes.
- Scrolling within the reference's lesson kept the navigation control available. The image carousel has numbered slide controls, previous/next and captions. Selecting slide 2 changed the displayed caption and `2 of 3` position. The next-lesson link opened **Step 1: Create and customize training**. Viewing the reference updated its preview progress; this is not equivalent to Academy's saved required-activity completion.
- A screenshot taken during a media entrance showed the image at reduced opacity while surrounding text remained stable. Exact animation timing, replay behaviour and parallax were not measured; the implementation uses independently chosen subtle entrance timings, not a claim of a pixel-identical Rise effect. Image zoom was exercised, but its overlay dismissal was not conclusively verified.

**Academy browser checks:** A2 draft preview desktop outline was hidden and reopened successfully. In the course editor preview, `wohnt` was selected in Startdiagnose 1, then the device was changed desktop → tablet portrait → tablet landscape → phone portrait → phone landscape → desktop. The selected answer and active subsection remained intact. Phone outline opened, Escape closed it and returned focus to its toggle. The draft continued to show 0 saved required activities and disabled position saving.

**Repair from this pass:** both preview studios now use one stable iframe at the same React position. The former desktop-specific return branch remounted the iframe when switching to a tablet/phone and could discard in-progress answers.

**Build verification:** production compilation and its TypeScript phase passed. Unit and lint results are recorded separately; browser QA for starter templates, the other course levels, cover/assessment small-device navigation, and visual motion/image fit remains outstanding. In particular, the present small-device course menu is supplied by the lesson renderer, so cover/assessment parity needs a follow-up rather than being considered verified.

### Responsive outline parity and final checks · 1 October 2026

The follow-up above led to a second repair: draft and starter-template previews now own one responsive course outline across **cover, lesson and final assessment**. They no longer depend on the lesson-only navigator for small screens. The nested lesson course menu is hidden inside the preview shell, preventing duplicate navigation.

- Desktop starts with the full-height outline open. The hamburger closes/reopens it and the content reflows. Tablet/phone start closed; landscape tablets reflow alongside the open outline, while narrow screens use an overlay with outside-click dismissal. Hidden navigation is inert. Escape returns focus to the hamburger. A skip link bypasses the outline.
- Preview cover cards expose every lesson for author review, including alternative exam pathways. This does not change published learner prerequisites, exam-path selection, or saved completion rules.
- A1, B1 and B2 first-lesson draft pages were opened directly in Edge. Each showed its own grouped course title/lessons, active lesson, zero saved progress, disabled position saving, and a working desktop outline toggle. A1's desktop hero/content layout was inspected visually. A2's five-device answer-retention check is recorded above.
- The visual-story starter was exercised across all five device modes. Its desktop outline closes/reopens, and its outline assessment link opens the final reflection assessment. Phone assessment navigation starts closed; opening it and pressing Escape returns focus to the toggle. Draft cover and assessment phone navigation were also checked in the A2 editor preview.
- Scroll entrances are independent Academy effects, not copied Rise timings: non-text blocks gently enter once; ordinary text remains stable. Unit tests cover nested visibility, reduced motion, focus cancellation and cleanup. This pass does not claim frame-by-frame visual matching or a comprehensive crop audit of every course asset.

**Final local verification:** 215 tests passed; TypeScript and targeted lint passed; `git diff --check` passed. Production compilation, TypeScript and static-page generation passed on a network-enabled retry. The first build failed downloading the existing Google Fonts, not compiling the preview changes. Repository-wide lint still has pre-existing unrelated failures and is not reported as passing.

No course was published or deployed. Preview navigation/answers remain local review interactions; no learner completion or private submission was saved. Exact Rise animation measurements, image-zoom parity and broader authoring priorities above remain optional future work, not features represented as implemented by this preview adaptation.

### Shared block proportions · 1 October 2026

Reviewed shared text, callouts, tables, tabs, accordions, flashcards, process steps, carousels, practice panels, section transitions and lesson roadmaps for narrow reading widths. The main issues were compounded background padding, an icon column squeezing callout paragraphs, desktop minimum heights, long pagination rows and fixed-height flashcard faces.

- Blocks now use their actual available width for typography and compact padding, including inside background panels and beside the outline. Narrow callout headings are 20px; paragraphs are 16px with 1.6 line height and span the full card width below the heading. Mobile background padding is reduced separately.
- Narrow activities, phase illustrations, lists, table cells and transitions use compact proportions. Long step pagination uses a position counter on narrow screens, preserving previous/next controls. Carousel pagination wraps. Flip cards grow with their content instead of clipping a long back face.
- Long roadmap topic lists start collapsed and remain available through the native disclosure; short lists remain open. Phone phase links use compact horizontal icon/label rows.
- A1 chapter 2's goal card and surrounding reading content were inspected in Edge in all five preview modes: desktop, tablet portrait/landscape and phone portrait/landscape. The paragraph remained visible without horizontal clipping. This is representative shared-renderer QA, not a claim that every authored block in every chapter was visually inspected. Further process clicking was interrupted by concurrent user interaction with Edge and was not counted as browser verification.

Verification: TypeScript, 235 unit tests, targeted ESLint and diff whitespace checks passed. No production build was run for this sizing-only pass. Course content, publishing state, saved responses and completion rules were not changed.
