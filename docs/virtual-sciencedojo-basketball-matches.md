# Basketball breaks: proposed two- and four-player games

Status: plan for owner review, 18 October 2026. The existing court already shares one physical ball and court totals between admitted peers. The first learner pilot remains invite-only for 5–10 EU/EEA adults aged 18+, subject to the existing operational gates. Team selection, passing, match rules and four-player match acceptance below are proposed work; they are not implemented or verified. The immediate shot-power correction is separate.

## The student experience

Students walk to the Sports court and choose **Free play**, **1 vs 1** (two players) or **2 vs 2** (four players). Free play remains available without starting a match. A short court panel shows open places, campus pseudonyms and a Ready button. A match begins only when every required participant is ready. No learner is pulled out of their course automatically.

A simple coloured shirt marker distinguishes two constrained teams. A five-minute game ends earlier at 11 points with a two-point lead; at five minutes the higher score wins and a tie is a draw. There is no overtime, public ranking, saved win/loss history or pressure to finish a game before returning to study. End/Leave and the retained Study Hub remain available throughout. The result is visible only for the current court session and clears after the court empties or everyone chooses a new game.

The HUD shows team score, remaining time, possession and the current E action inside fullscreen. Buttons provide the same actions on phones and for keyboard/assistive users. The room stays within its existing ten-person admission cap: at most four active court players, with remaining admitted participants able to watch. A voluntary queue offers a vacant slot; nobody is enrolled into a match automatically.

## Controls and casual rules

- Movement and mouse aiming keep the current controls. Hold E to cycle shot power up and down; release to shoot. Escape cancels a pending shot and retains possession.
- For a teammate under the crosshair, a short E tap offers a contextual pass; holding E still starts a shot. The prompt identifies the action before it happens. A visible Pass button is always available in team mode, avoiding a timing requirement for touch/assistive input. This needs an interaction threshold and usability check before shipping.
- Passes use bounded physical ball flight. Teammates or opponents may catch reachable loose passes and rebounds; players cannot snatch a held ball. Start without fouls, tackling, stamina or complex sports simulation.
- Each team attacks one marked hoop. Physical baskets earn two or three points from the existing distance rule; an accidental own basket awards two points to the other team. The server associates the release and hoop with the match, rather than trusting client scores.
- After a basket or out-of-bounds event, the other team checks the ball in at a marked baseline spot. Its nearby player takes possession through the ordinary reach check; there is no avatar teleport. Outsiders can watch but cannot take an active match ball. Free-play rules resume when the match ends.

## Shared authority, privacy and leaving

Reuse the current common physics module, exclusive ownership and database-time/versioned authority in both Colyseus and shared SQL. Add only constrained mode, team/ready slots, phase, score, coarse remaining time and possession/check-in state tied to opaque campus IDs. Aim preferences, course choices, answers, learning progress and account IDs remain private. New exact commands would be join/leave/ready/pass, with server checks for eligibility, match membership, target team/range, rate limits and ownership. Browser clocks and claimed teams/scores never decide outcomes.

All queue, match and result state is ephemeral, reset on empty room, and subject to existing admission/revocation, RLS, blocking and duration handover. A disconnected or studying participant immediately loses ball possession. Pause play for up to 15 seconds while a slot reconnects or an admitted volunteer explicitly accepts it; otherwise end the match without recording a loss. An explicit Leave ends/pause-handles the game immediately and never traps the participant. Timer behavior during pause must be specified consistently in both authorities (five minutes counts active play; at most one 15-second reconnection pause per game).

Do not pair participants if either has blocked the other. A later block between active opponents ends the pairing with a neutral availability message; never reveal who blocked whom. Hidden players cannot be competitive targets or covertly control a match ball. Report/Block/Leave remain available; real learner sessions still require the existing operational gates.

## Implementation order and acceptance

1. Add an opt-in authoritative match state machine for free play/1v1/2v2, voluntary slots/ready, fixed teams/hoops, timer, score attribution, check-in and cleanup. Prepare any new service-only SQL migration and world revision locally; do not apply hosted schemas without the separately required approval. Both transports must have identical rules and bounded conflict behavior.
2. Add the court join/ready/team/clock panels, readable markers and E/button pass interaction. Reuse the existing world, physical ball, cameras, fullscreen and retained courses. Validate keyboard/touch and reduced-motion behavior; no new service or paid infrastructure is needed for this design.
3. Verify actual two- and four-browser sessions on each transport: ready/slot races, two teammates versus two opponents, passing/interception, physical makes/misses and team agreement, check-in, five-minute timeout, leave/block/revocation and duration handover. Keep existing command privacy/canary, admission/capacity, course retention and graphics limits. Record normal/reduced-motion/device-width results separately from actual phone hardware or human acceptance.

The owner has asked for this plan. Before implementing matches, confirm the proposed casual 1v1/2v2 scope through the normal next-step owner direction. Current private-beta and hosted/learner-release boundaries stay unchanged.
