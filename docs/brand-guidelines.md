# ScienceDojo brand guidelines

The logo is the simple lowercase wordmark **sciencedojo.**: one continuous word followed by one dot. Piumal confirmed this rule on 14 October 2026. Apply it consistently to brochures, supporting documents, proposals, presentations and future branded materials.

- Use lowercase letters throughout the wordmark, with a trailing dot on the same baseline.
- Keep the wordmark typographic and simple. Do not add an icon, split it into separate words or use CamelCase for the logo.
- For existing business documents, preserve the established document palette: navy letters (`#12243A`) and a teal dot (`#006B70`). A descriptor such as For Business may sit separately from the logo.
- Keep legal company names and ordinary references in their appropriate written form. The lowercase wordmark rule does not alter the registered company name **ScienceDojo (Pvt) Ltd** or require every prose mention to become a logo.

References: the `BusinessBrand` component in `app/business/shared/BusinessBrand.tsx` and the existing lowercase wordmark in `components/Logo.tsx`. Both PDF generators must preserve this rule when documents are regenerated.

On 19 October 2026, Piumal requested restoring the original main-site palette specifically for the engineering page: primary blue `#0066FF`, navy `#001A44`, cyan `#00D2FF`, and white/pale-blue surfaces. Its continuous lowercase wordmark follows the main-site navy “science”, blue “dojo” and cyan trailing-dot treatment. The established learning/business-document navy-and-teal palette is unchanged.

On 19 October 2026, Piumal also authorised aligning the instructional-design website at `/business` with the original main-site palette. Both business arms now use navy `#001A44`, primary blue `#0066FF`, cyan accents `#00D2FF` and white/pale-blue surfaces. Use blue for links, buttons, focus and interactive states; reserve cyan for small decorative accents or accents on navy. The continuous website wordmark uses navy “science”, blue “dojo” and a cyan trailing dot. Retain the softer learning illustrations and structured layout. This supersedes the earlier website-only teal exception; existing downloadable learning materials and business documents retain their established palette and approved content.

On 20 October 2026, Piumal chose the engineering page’s visual style for both business arms. Reuse `app/business/shared/BusinessHeader.tsx`, `BusinessBrand.tsx` and `business.module.css`: Inter, 600-weight closely spaced responsive headings, identical wordmark size/position and uppercase arm descriptors, the same sticky-header height, engineering-derived 1240px content grid and native compact mobile disclosure. Preserve the separate learning artwork/content and existing offer/forms/routes. Keep the engineering page’s local section hierarchy; share the hero typography and header metrics.
