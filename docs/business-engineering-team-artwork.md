# Engineering team artwork

19 October 2026. Piumal requested three drawn team portraits and subsequently supplied his own appearance reference, completing the missing input. The images are illustrated likeness drafts for owner review, not real photographs or approval of final likenesses.

## Selected local assets

All three are 800×800 WebP files in `public/images/business/engineering/`:

- `piumal-cartoon-v1.webp`: curly black hair, round glasses, short beard/moustache and smile, powder-blue background.
- `tharindu-cartoon-v1.webp`: short wavy hair, beard/moustache and smile, lavender background; previously prepared from supplied references.
- `yelka-cartoon-v1.webp`: long hair over one shoulder, mint background; previously prepared from supplied references.

The existing lower team section uses the three matching assets with confirmed roles and reserved square dimensions. The problem-led hero is preserved. No raw reference photographs were copied to public assets, no new interests/biographies were invented and no photograph was uploaded to Lovable. This local implementation does not update the separate Lovable prototype, whose project-edit permission remains unresolved in its own record.

## Piumal generation record

Built-in image generation was used, then the selected PNG was resized/encoded with Sharp for web delivery. The photograph supplied by Piumal was an appearance reference; the prepared Tharindu/Yelka cartoons were style references. The generated source remains in Codex's generated-images directory; the website consumes the versioned repository asset.

Final submitted prompt:

> Use case: stylized-concept. Asset: one square editorial cartoon team portrait for ScienceDojo Engineering. Input image 1 is Piumal's appearance reference ONLY. Input images 2 and 3 are style/composition references ONLY, showing the other two team portraits. Draw ONLY Piumal as the same coherent series: clean navy ink contours, broad flat cel-shaded color planes, subtle pastel paper background, recognisably illustrated not painted photo or 3D. Preserve Piumal's dense short curly black hair, round dark/tortoiseshell glasses, thick brows, brown eyes, rounded full natural face, short stubble beard and moustache, warm tooth-showing smile. Adult proportions, no pinched or narrowed face and no giant head/eyes. Head and shoulders to upper chest, centered, eye-level, full hair visible with small top margin, match head size/crop of image 2 and 3. Wear a casual navy crewneck to match the team's friendly engineering-studio feel. Soft pale powder-blue background complements lavender and mint teammates. No suit, tie, objects, text, logo, border or watermark. Reference photograph must not appear in the output; produce an unmistakably drawn character with simplified curls and consistent linework.

## Verification

Scoped engineering lint, type checking, production build and whitespace checks passed. The maintained production-mode Chromium acceptance passed, including all three portrait loads and square framing at 1440/390 widths, existing responsive overflow checks at 320/390/768/1280/1440 and short-phone sizes, motion/reduced-motion, no-script reading, sample product views, synthetic decisions/recovery/cancellation, invalid enquiry retention and learning offer/download checks. No valid enquiry was submitted and no live email was attempted.

Evidence directory: `temporary sciencedojo-engineering-browser-wwF9LO`. Desktop/team and phone framing were visually inspected. The tall phone element capture contains the sticky navigation at its current viewport location; that capture artifact is not a misplaced navigation element in normal use. A desktop team reading copy is saved at `output/design/engineering-team-portraits-desktop.png`. The existing local production preview is running on port 3105. No owner likeness approval, publication, hosted CI or independent human usability is inferred.
