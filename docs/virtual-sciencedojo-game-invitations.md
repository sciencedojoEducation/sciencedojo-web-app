# sciencedojo. — room games and play invitations

20 October 2026. Status: concrete next-phase plan prepared for owner approval.
The owner clarified that games should exist inside a room, with invitations to
play when users meet in the world. This replaces the current global Games Lounge
panel shortcut. Existing board games, vocabulary content and owner review remain
available until the approved revision is implemented and verified.

## Experience to build

1. **Find the room.** Keep Level 2 Sky Commons · Games Lounge as the physical
   destination. The school map can show its location and guide walking/lift use.
   Remove the global action that opens games from anywhere. A map/navigation
   shortcut may locate the lounge; it cannot open a board or quiz.
2. **Meet someone.** When another available player is nearby on the same floor,
   show a keyboard/touch-accessible **Play together** action in the nearby-player
   controls. Use the existing campus pseudonym before either person joins a game.
   This works when meeting outside the lounge too; the game stays in the lounge.
3. **Choose and invite.** Offer Four in a Row (2), Dots & Boxes (2–4) and WortQuest
   (solo or 2–4). Send a fixed game invitation to that specific nearby person.
   This is an explicit player action, not a random automatic popup when walking
   past someone. No free-text message, new chat, friend directory or profile
   browsing is included.
4. **Receive an invitation.** A compact in-world card says, for example,
   “Quiet Maple invites you to Four in a Row.” Offer **Accept**, **Decline** and
   report/block access. Do not capture the mouse, interrupt a course or accept
   automatically. Studying/unavailable/blocked players cannot be targeted.
5. **Meet at the table.** Accepting shows a shared destination/table and an
   optional **Walk to the Games Lounge** navigation action. Neither avatar is
   teleported. Invitations expire after 30 seconds; accepted meeting places have
   a bounded two-minute reservation, subject to real table capacity. Explain and
   release a reservation if it expires or either person cancels/leaves.
6. **Join deliberately.** Inside the lounge, approach the selected table and
   press E or use its accessible interaction. Show the existing picture/username
   preview and explicit Join sharing notice. Accepting an invitation alone does
   not disclose the profile picture/name. Both people ready/start using the
   existing game rules; up to four may join the larger games.
7. **Room-only play.** Boards, study cards and quizzes open only at lounge tables.
   The server checks actual live presence, floor, room and table proximity;
   looking at the room with a camera does not qualify. Keep the existing 2.4m
   interaction radius. Leaving the room/table interaction, travelling, leaving
   school, disconnection or lost admission closes the panel and releases the
   game/reservation. An interrupted match ends without awarding a false win.
   Existing course/dashboard documents and unsent work stay mounted.

The room's existing tables, beanbags and game markings remain at their current
coordinates. No new floor, geometry revision, payment or course system is needed.
In-room signs and the map must make the destination discoverable. Keyboard,
touch, phone and fullscreen users get the same invitation/table actions.

## Authority, privacy and lifecycle

The current application game RPC checks admission and membership but does not
check live world location. Add authoritative location gating before exposing
rosters, photos or gameplay; a browser-supplied position/room is insufficient.

For the shared-SQL transport, validate the server-owned `campus_presence` row,
connection ownership, lease, floor and pose in the protected database boundary.
For Colyseus, add a narrowly authenticated room-service context/proof using its
actual world state and existing service authentication. Normalize that trusted
context for the application game authority; fail closed on unavailable/stale
proofs. Bind proofs to the current connection/generation and short expiry so an
old connection cannot preserve eligibility after leaving/reconnecting. Do not
relax the rule for one transport or treat a client snapshot as proof. Final
implementation must test room-exit races and real service restart/reconnection.

Store targeted invitations/reservations in additive, RLS-protected service-only
records and expose them only through admitted, recipient-bound application
endpoints. A forward migration extends the existing game authority; do not
replay 076/077 or edit their historical SQL. Invitation admission, accept/join,
seat reservations and capacity use the same transaction/locking discipline as
game membership. Keep one active multiplayer table per account. A reservation
cannot displace a joined player, overbook a table or start a round early.

Before joining, expose only the inviter's existing campus pseudonym, opaque
campus identifier and fixed game/table labels. After deliberate Join, retain the
existing participant-only picture/username projection and bounded photo proxy.
Invites, reservations, profiles, vocabulary levels/answers/scores and course data
stay out of world snapshots and telemetry. Fixed invitation messages use no
external messaging service. No new accounts or wider admission are implied.

Bound requests/polling: one pending outgoing/incoming invitation per person,
a send cooldown, recipient/pair backoff after decline, deduplicated delivery and
at most one displayed prompt. Provide a local invitation-mute control. Expire
pending invitations after 30 seconds and accepted reservations after two minutes.
Clean on cancellation, block/report resolution where applicable, revocation,
disconnection/lease expiry and campus switch-off. Stored stale entries must be
removed by bounded activity/cleanup paths; do not claim logical expiry erases
backups/logs. Suppress prompts while a course/Study Hub is in use. Restore focus
and release pointer capture when a user deliberately opens an invitation.

## Implementation and verification

After owner approval, read the installed Next.js client/route-handler guides,
then implement small commits with the existing website and unrelated work intact.

- Shared room/table math and server enforcement: outside the room, wrong floor,
  distant table, travelling, stale proof, spoofed coordinates and revoked users
  cannot open/read/join/play or retrieve game photos. Leaving during an open
  game must close and clean it. Private study cards follow the room rule too.
- Invitation authority: fixed actions only; reject unknown/blocked/studying/
  disconnected targets, self-invites, replay, expired/double accepts and spam.
  Exercise opposite simultaneous invites, two/four-player reservations, full
  tables, cancellation, multiple tabs and reconnection ownership.
- Real synthetic browser flows on both transports: meet → invite → accept →
  navigate to the room/table → preview/Join → ready/play → leave. Also direct
  table joins, declined/expired invitations, no outside-room shortcut, mobile,
  keyboard, fullscreen, accessible navigation and retained learning input.
- Preserve all board/vocabulary scoring/privacy tests and world-canary scans.
  Verify SQL parity, type/lint/build and the service package/restart if its
  context endpoint/runtime allowlist changes. Retain synthetic CI evidence for
  seven days. Observe hosted/device/human evidence separately.

Update Phase 0, architecture, runbook and AGENTS with actual results. Keep the
new SQL/local software separate from hosted approval. Prepare the exact next
migration, protected Preview procedure and rollback after local verification;
apply only after the environment-specific hosted step is approved. Existing
owner invitations, notice acceptance, roles/courses and hosting protection stay
within their recorded scope. This plan does not establish a completed human
friend match or a wider learner release.
