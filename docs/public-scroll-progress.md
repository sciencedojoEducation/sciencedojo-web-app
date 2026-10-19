# Public website scroll-progress line

19 October 2026. Owner request: adapt the engineering page's filling scroll line across public website pages, with no dashboard indicator.

One `PublicScrollProgress` component sits in the root layout, outside the normal public-header gate so both business pages are included. A pathname boundary excludes dashboard/admin, academy/workbook/campus, account/authentication, tutor onboarding/contract, booking and maintenance screens. This UI boundary grants no access and does not replace existing private-study, tracking or campus document boundaries. Public articles, legal pages, profiles, catalogues and marketing pages inherit the indicator automatically.

The 2px blue/cyan line follows the lower edge of the current public header; a non-sticky header can scroll away and the line then sits at the viewport top. Public header variants carry `data-public-site-header`, including the streamed/recovery fallback. The engineering-only line and scroll listener are removed to prevent duplicates.

The fraction uses the document's current scrollable distance. Passive scroll and viewport events schedule at most one pending animation frame. Resize observation handles changed content/viewport dimensions; child-list observation finds streamed/replaced headers and content changes. There is no idle animation loop. Hidden documents schedule no new frames; visibility restoration updates the position. All frames/listeners/observers are removed on unmount or private-route entry. The route change starts a fresh indicator, respecting the browser's subsequent scroll restoration or anchor jump.

This is decorative page position, with `aria-hidden` and no pointer interception. It stays hidden on non-scrollable pages and without JavaScript. It follows scroll directly, without easing or animation; reduced-motion and the engineering decorative-motion controls retain this accurate position feedback. It does not read form/learning text, send analytics, store a scroll history or represent course completion.

Verification covers meaningful public/private route boundaries plus actual browser empty/half/full positions, one indicator across public header variants, desktop/phone fit and header alignment, native FAQ height changes, short-page hiding, viewport resize, direct reduced-motion updates and private-path removal/return. The native-history private-path fixture checks the real indicator boundary without creating an account or rendering an authenticated dashboard. It is not evidence of real-account privacy/access-control testing. Existing engineering/navigation/browser checks remain required.

Actual results and publication are recorded in `docs/business-website-release.md`. B3/S1/R1 remain the three active tasks; the learning offer, paid-work permission and tested-delivery gates remain unchanged.

Local verification passed with 458 main-based regressions, type/lint/build, trace guard and expanded production-mode browser acceptance. Browser evidence: temporary `sciencedojo-engineering-browser-c2rGXY`. Hosted/public results remain separately recorded in the release record.
