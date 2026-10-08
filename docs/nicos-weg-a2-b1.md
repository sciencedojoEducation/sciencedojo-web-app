# Nicos Weg A2 and B1

The two independent DW study companions use the existing academy document schema and renderer. Each has 76 episode lessons in DW order, 19 original English/Sinhala grammar reviews and a final writing/speaking review. A2 contains 608 German/English starter cards; B1 contains 586 cards with German definitions. Cards are selected sets, with the complete vocabulary and pronunciation linked per episode. Open writing and speaking use guided self-review; the 19 sentence-repair exercises per level have reviewed local answer checks. No new AI provider integration is required.

Sources: [DW A2](https://learngerman.dw.com/en/nicos-weg/c-36519797) and [DW B1](https://learngerman.dw.com/de/nicos-weg/c-36519718), retrieved 2026-10-08. Episode metadata lives in `lib/nicos-weg-a2-episodes.ts` and `lib/nicos-weg-b1-episodes.ts`. All 152 master manifests and media playlists were checked. B1 episode 1 has incorrect DW duration metadata (7 seconds); its actual complete playlist is approximately 101 seconds. Images and film are attributed to DW; original grammar examples are explicitly distinguished from dialogue. Full scripts remain at DW; each video includes a short excerpt and manuscript link.

Validate locally:

```sh
npm run academy:nicos-next:seed
node --experimental-strip-types --test tests/nicos-weg-next-courses.test.mjs
node --experimental-strip-types scripts/verify-nicos-weg-next-videos.mjs
```

Inspect stored courses with `npm run academy:nicos-next:seed -- --inspect`. To create drafts, use `--apply`; add `--publish` to publish. The seed script reads the existing Supabase configuration, uploads content-addressed WebP assets, validates resolved content, and refuses to overwrite edited courses. An identical course is left intact; a partial initial publication can be resumed. Each course has its own lesson/block IDs, assessment fingerprint and version snapshot.

Course data is stored in Supabase and becomes available through the existing learner and admin routes without a code deployment. Extensions of A1-specific presentation controls and local sentence-repair checking require deployment of the accompanying shared renderer changes.
