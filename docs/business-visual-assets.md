# Business page visual assets

The visual upgrade adds an illustrated handover kit, four code-native process diagrams, and previews of the actual downloadable documents. The diagrams and excerpts are illustrative; they do not add testimonials, client results, certified assessments, or features outside the approved offer.

## Generated handover illustration

- Tool: built-in `image_gen` through the imagegen skill.
- Project asset: `public/images/business/module-handover-kit-v1.webp` (1536 × 1024).
- Usage: the offer section, with a visible illustration caption and descriptive alternative text.
- Original generated PNG was retained in the Codex generated-images directory. The project copy was converted to WebP for delivery without changing its composition.
- Existing hero and scenario assets were retained.

### Generation prompt

Use case: product-mockup. Asset type: editorial illustration for the handover section of ScienceDojo's corporate learning website. Create one refined landscape 3D still-life of a tangible learning module delivery kit on a matte light stone surface: a dark navy browser-window panel containing a restrained choice-and-feedback layout, next to three white paper documents with a branching storyboard, a four-row scoring guide, and a setup checklist represented by clean graphic lines. Physical paper edges, soft realistic shadows, tactile matte materials, disciplined architectural composition. Style: premium editorial product rendering, sharp and calm with daylight, matching an established navy #12243A, deep teal #006B70, ivory white and cool grey palette. Show the module and supporting documents clearly as one coherent kit, with generous spacing, no distracting props. The interface and papers are illustrative abstractions, not a dashboard. Landscape 3:2 composition that remains useful on mobile. No people, logos, readable text, random typography, numbers, charts, certificates, awards, robots, sparkles, glowing gradients, plant decoration, laptops or office stock-photo cliches. White/light background, not transparent.

## Code-native visuals

`app/business/BusinessProcess.tsx` contains four decorative SVG illustrations. Each has a matching text heading and explanation. The supporting-document previews in `BusinessEvidence.tsx` use real source excerpts and retain all download URLs. The scope disclosures preserve the original detailed inclusions.

## Verification

The production build passed compilation, TypeScript, and page generation. A feature-flag fetch warning during the sandboxed build was non-fatal; production flags are still read by the existing page logic. Scoped ESLint and whitespace checks passed. Browser checks covered the new image loading, keyboard-operated scope and process disclosures with visible 2px focus outlines, and all five download links. A document downloaded successfully and matched its source file byte for byte. The new visuals and download controls fit a 320px viewport with no horizontal page overflow; document-preview metadata was increased to 11px and excerpts to 13px for readability. These are basic usability checks, not accessibility certification.
