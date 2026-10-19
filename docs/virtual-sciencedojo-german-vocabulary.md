# sciencedojo. — WortQuest German vocabulary game

19 October 2026. Status: proposed software phase for owner approval; not
implemented or deployed. Extends the existing Games Lounge request. Existing
Four in a Row/Dots & Boxes verification and the pending hosted activation in
[the board-games plan](virtual-sciencedojo-board-games.md) remain valid.

## Player experience

Add **WortQuest · German vocabulary** to the Level 2 Games Lounge. Use the
existing accessible Games action and fullscreen HTML game panel; no new room,
floor, solid geometry or movement revision is needed. Retain the current website,
dashboards, courses and unsent Study Hub work.

Offer A1, A2, B1, B2, C1 and C2 as freely selectable practice decks, with two modes:

- **Study cards:** show a German word or expression, noun article/plural or
  useful verb form where applicable. Flip/reveal its original English explanation,
  a short German example and an English translation. Next/previous and shuffle
  are keyboard/touch accessible. Studying is unscored and private.
- **Play a quiz:** show a German word in a short sentence and four plausible
  English explanations. Choose one answer once per card. Ten distinct cards per
  game; ten points for each correct answer, zero for an incorrect answer or Skip,
  for a maximum of 100. No speed bonus or time penalty. Reveal the explanation
  and example after submission. Finish with score, missed-card review and replay.

Example study card: **die Entscheidung · die Entscheidungen** — “a decision:
a choice made after considering the available options.” Example: *Wir treffen
morgen eine Entscheidung.* — “We will make a decision tomorrow.” This example
illustrates the format, not an externally validated CEFR word assignment.

Solo play gives a private session score. A friend quiz supports two to four
joined players, using the existing deliberate picture/username sharing preview.
Everyone confirms the same level before starting and receives the same ten cards.
Each player answers independently; do not reveal the answer, correctness or
updated points to another participant until everyone has submitted or skipped
that card. Show the shared score at that point, then advance when everyone
selects Continue. Highest total wins; equal totals tie. Replay requires everyone's
agreement. No countdown that rewards connection speed.

## Content and level labels

Start with **180 original cards: 30 per level**. Every card has a stable ID,
deck level, German term, part of speech/forms, English explanation, original
German example and translation, and three unambiguously incorrect distractors
for the specific sense/context. Vary correct-option positions. Sample without
replacement within a game. Distractors must be grammatically plausible and must
not accidentally be synonyms of the correct answer in the example context.

Use everyday concrete language at A1/A2, familiar situations/opinions at B1,
more abstract vocabulary at B2, and nuanced register/expressions at C1/C2.
Difficulty assignments are editorial practice choices. Label the decks as
practice levels; the score does not establish proficiency or an exam result.
Thirty cards are a starter collection, not complete coverage of a CEFR level.

Consult [Council of Europe CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions)
and [the Companion Volume](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions)
for the progression. The CEFR describes multiple communicative competencies,
not just vocabulary recall. Use official Goethe word lists as lower-level
reference material, such as [A1](https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf),
without copying their examples or explanations into a deck. Do not claim Goethe
endorsement, certified level alignment, teacher review or validated learning
outcomes without actual evidence. Check sense, spelling, article, plural,
separability, register, translation and answer ambiguity during implementation.

## State and privacy

Keep solo study/answers/score in the mounted local game only, with an explicit
restart and no persistent learning profile or analytics. Friend quiz state uses
the authenticated application/database boundary, never Colyseus/world snapshots.
Only joined quiz participants see the selected deck and session scoreboard.
Chosen answer options and missed-card review remain private to the player;
aggregate points can still indicate how they performed, so disclose this before
Join. This is a narrow voluntary game-score extension, not permission to share
course answers, grades or progress. No dashboard progress integration, durable
leaderboards, cross-session statistics, chat or external AI API is proposed.

Reuse game admission, picture proxy, block/report/leave, bounded polling and
leases. Enforce one multiplayer table membership per account across all games.
Shared quiz answers/scores/advancement must be server validated and atomically
stored; the client cannot submit points, correct answers or another player's
identity. Accept one answer per opaque participant/card/round with idempotent
retries. Concurrent participants' valid answers must not overwrite each other or
be rejected merely because another player submitted. Do not send a current-card
answer key before that player commits an answer; public practice decks are not
a high-stakes anti-cheating system.

Prepare a new forward migration after 076 to extend the constrained game table
registry and service-only authority, with explicit RLS/grants and private quiz
answer storage/projections. Preserve 076 as reviewed, do not edit/replay prior
migrations. Never reuse the ordinary board snapshot to expose all private quiz
answers. A leave, block, revocation or lease expiry ends the incomplete friend
game without awarding a win. Clear quiz identities, answers and boards when the
table empties or the campus switch is disabled, including the existing switch
cleanup path. Keep no durable individual performance record. Verify actual
cleanup; do not equate lazy expiry with backup/log deletion.

## Implementation and verification sequence

1. Obtain approval for this software plan, then read the relevant installed
   Next.js route/client guides before coding. Use small scoped commits and
   preserve concurrent business work.
2. Author the six decks and deterministic quiz rules. Validate all 180 card IDs,
   counts/fields/forms, one correct option, unique choices, level isolation,
   shuffled option mapping, no repeated cards, score bounds, skips and replay.
   Review language content separately; automated schema tests cannot prove
   linguistic correctness or level suitability.
3. Extend the game application/SQL authority locally, keeping selected answers
   private and scores participant-only. Test simultaneous answers, retries,
   stale cards, two/three/four players, ties, level confirmation, one-table
   exclusion, unauthorized roster/photo/answer access, block and cleanup.
4. Exercise solo study and scored quizzes across all levels; run actual two-
   and four-browser friend quizzes on both maintained campus transports with
   synthetic profiles. Verify keyboard/touch/fullscreen, answer-reveal timing,
   private review, course retention and school exit/re-entry. Scan world traffic
   for deck, answer, score and identity canaries. Preserve existing game/movement,
   graphics and learning regressions; run type/lint/build checks.
5. Update Phase 0, architecture, runbook and AGENTS with actual evidence and
   limitations. Record local software completion separately from hosted checks
   and human review. Retain synthetic CI evidence for seven days.

Hosted SQL application, protected Preview publication and friend admission
remain the separate, concrete environment-specific approval step already
defined in the Games Lounge plan. No hosted migration, account invitation,
production app/settings change or paid infrastructure is authorized by this
proposed plan. The earlier hosted-activation approval question remains pending;
this feature request is not an answer to that question.
