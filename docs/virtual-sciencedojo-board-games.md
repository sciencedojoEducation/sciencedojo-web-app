# sciencedojo. — Games Lounge plan

19 October 2026. Status: owner approved implementation on 19 October; software
work is in progress and games are not yet available to friends. This is a new campus software phase, not a change to
the business offer or permission to admit additional accounts.

## Requested result

The owner requested easy board games to test with friends, a dedicated room in
the Cube, and each joined player's profile picture and username beside the game.
Preserve the optional beta, existing dashboards and courses, and current owner
review. Do not replace requested pictures/names with campus pseudonyms inside
the game; keep the broader school's existing pseudonym boundary intact.

## First two games

1. **Four in a Row — two players.** A seven-column, six-row board. A turn drops
   one piece into a non-full column; four contiguous pieces horizontally,
   vertically or diagonally win. A full board without a winner is a draw.
2. **Dots & Boxes — two to four players.** A five-by-five dot grid containing
   sixteen boxes. A turn draws one unused horizontal or vertical edge. Closing
   one or two boxes awards them to that player and gives another turn. Otherwise
   play passes to the next player. Most boxes wins; tied totals remain ties.

Both have a waiting lobby, explicit ready/start, clear rules, turn indication,
visible legal actions, result, rematch by agreement and Leave table. No AI
opponent, prizes, persistent rankings or game chat are part of this phase.
Dots & Boxes may start with two, three or four ready players; the roster locks
at start. Four in a Row starts with exactly two ready players.

## Dedicated room and interaction

Use the existing Level 2 Sky Commons footprint (`commons`, centre x=26/z=26),
named **Sky Commons · Games Lounge**. Retain its plants, glazing and existing
routes, with two recognisable board-game tables, comfortable chairs and signs.
Reuse its two front side-table surfaces and beanbag seats, adding thin board
markings without changing any solid geometry or the deployed world revision.
Keep existing learning rooms, study desks, transport shafts and doors intact.
Derive added solid table geometry from the shared procedural layout and verify
server/SQL collision parity; do not create invisible or decorative extra floors.

Approach a table and press E, or use a visible accessible Games action. Open a
readable HTML game panel inside the existing fullscreen shell. Release pointer
capture, stop walking, isolate game keyboard input from world controls and
restore school focus on close. Use native keyboard/touch-operable board buttons,
text turn/result announcements, colour-independent piece labels and reduced
motion. Preserve mounted Study Hub/dashboard/course documents and unsent input.
The scene may pause while the panel is open, as it does for Study Hub.

## Player pictures and usernames

The existing profile stores `full_name` and `avatar_url`; no separate username
field was found in the inspected profile schema/dashboard. Before joining,
offer a bounded game username, initially suggested from the existing display
name, and preview the current profile picture. Explain that joining shares
these with the other seated players. Do not silently treat a full name as a
username or expose an email as a fallback. An unset/broken picture gets initials.
No new photo upload/customisation system is needed.

Display picture, username, piece colour/symbol, ready status and turn beside
each occupied game seat. Require a deliberate Join action after the preview;
opening a table alone shares no personal profile information. Only current
participants receive the game's roster; ordinary campus peers and unjoined
visitors retain pseudonymous presence and see no game profile roster.

Resolve profiles within the authenticated application/database boundary.
Never add profile names, pictures, account IDs, avatar storage paths or learning
data to Colyseus/shared-SQL world snapshots, authentication tickets or world
telemetry. Use opaque game participant identifiers. Serve supported profile
images through a same-origin, no-store participant-authorized image route rather
than revealing account-bearing storage/provider URLs. Restrict upstream image
sources and redirects, bytes, raster content types and timeouts; never fetch a
caller-supplied URL. Missing/unsupported sources retain the initials fallback.
Do not log names, raw photo URLs or identity-bearing game responses.

## Shared state and lifecycle

Use a common deterministic game-rules module and authenticated, same-origin
application game endpoints for both existing campus transports. Shared game
state belongs in additive RLS-protected database records, with atomic admission,
seat capacity, start, legal moves, result and rematch. Never use function-local
state as authority. The server assigns players and validates turns, board bounds,
phase, membership and version; clients cannot submit scores or another player.
Use bounded polling while a visible game panel is open, one request in flight,
no-store responses, strict payload limits and bounded commands. Idle/hidden
panels must not create an unbounded request loop.

Every roster/image/move access checks the real session, campus invitation,
accepted notice, release controls and current game membership. Blocked users
cannot share a table or fetch each other's identities. Enforce game limits and
block rules server-side, including simultaneous joins/starts/moves. Use a
version/round token to reject stale or repeated requests without duplicate moves.
Reopening after a brief panel close can recover an active session; explicit
Leave releases membership immediately. Define a bounded lease for lost clients,
expire inactive seats and abandon an active round rather than awarding a false
win when a participant leaves/disconnects/is revoked. Reset when empty. Retain
no durable individual game history or profile snapshots after session cleanup.
Keep the existing report/block/leave actions reachable from the panel.

## Verification and delivery

Before coding, read relevant installed Next.js server/client and route-handler
guides. Implement in small commits, preserving concurrent business work.

- Execute rules tests for wins in every direction, draws/full columns, illegal
  moves, two-box captures, retained turns, two/three/four-player rotation,
  end scores, ties and unanimous rematch.
- Exercise actual database grants/RLS and application authorization: anonymous,
  nonparticipant, revoked, blocked and other-table identities cannot obtain
  roster/photos or mutate games. Test simultaneous join/turn/version conflicts,
  retries, leave, expiry, cleanup and empty-room reset.
- Run a real two-browser Four in a Row match and a four-browser Dots & Boxes
  match with distinct synthetic profiles; verify the pictures and usernames
  actually render, share consistent turns/results, and cannot be fetched by an
  unjoined fifth client. Verify both campus transports, E/touch/keyboard,
  fullscreen, input isolation, report/block and retained course work.
- Preserve world-traffic privacy checks: synthetic game names/profile canaries
  must not appear in either transport's world frames. Maintain current scene
  draw-call/continuity and idle-quality checks, build/type/lint and service
  packaging checks if shared geometry/runtime dependencies change. Keep synthetic
  screenshots/evidence for the established seven-day CI period.
- Review/fix, then update Phase 0, ARCHITECTURE, the implementation runbook and
  AGENTS with actual results and remaining limits. A test pass does not prove
  friend usability or hosted integration.

## Hosted friend test

Prepare the complete software, additive migration and reviewable activation/
rollback procedure first. The currently approved hosted review admits exactly
the owner; do not repurpose that approval as permission to invite friends.
Before hosted changes or invitations, identify the intended test accounts and
environment, obtain the required environment-specific approval and complete the
applicable admission/operating requirements. Do not create accounts, infer
eligibility, accept notices, publish a bypass or send invitations on their behalf.
Use the existing protected Preview if approved; no new paid service is proposed.
Record a real completed multiplayer friend walkthrough before claiming the
requested friend test is delivered. Keep this goal open until that outcome,
or until the owner explicitly changes its scope.
