import { advanceBasketball, basketballAction, basketballNeedsStep, basketballSnapshot, isBasketballCommand,
  isBasketballState, type BasketballState, type CourtPlayer } from "./basketball.ts";
import type { RuntimeCall, RuntimeResult } from "./vercel-session.ts";

/** Service-only envelope. Never send this object or its version/time to a browser. */
export type BasketballEnvelope = { version: number; now: number; state: BasketballState; players: CourtPlayer[] };
type Commit = (args: { game_connection: string; game_version: number; game_state: BasketballState }) =>
  Promise<{ applied?: boolean; ended?: boolean; game?: BasketballEnvelope }>;
function validEnvelope(e: BasketballEnvelope) {
  return e && Number.isSafeInteger(e.version) && e.version >= 0 && Number.isFinite(e.now) && e.now >= 0 &&
    isBasketballState(e.state) && Array.isArray(e.players) && e.players.length <= 10 && e.players.every(p =>
      p && /^[0-9a-f-]{36}$/i.test(p.id) && Number.isFinite(p.x) && Number.isFinite(p.z) && Number.isFinite(p.rotation) &&
      ["walking", "seated", "studying"].includes(p.status));
}
/** Pure physics runs in the trusted service, while SQL CAS owns shared ordering. */
export function withBasketballRuntime(base: RuntimeCall, commit: Commit): RuntimeCall {
  return async args => {
    const raw = await base(args) as RuntimeResult & { game?: BasketballEnvelope };
    const { game, ...result } = raw;
    if (!result.snapshot || !game) return result;
    const commands = (args.runtime_commands ?? []).filter(c => c.type === "basketball" && isBasketballCommand(c.data));
    let envelope = game;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!validEnvelope(envelope)) throw new Error("Court runtime unavailable");
      let next = envelope.state, changed = false;
      if (basketballNeedsStep(next, envelope.players, envelope.now)) {
        next = advanceBasketball(next, envelope.players, envelope.now); changed = true;
      }
      const actor = envelope.players.find(p => p.id === result.snapshot!.self);
      for (const command of commands) {
        const action = basketballAction(next, actor, command.data, envelope.now);
        if (action) { next = action; changed = true; }
      }
      if (!changed) return { ...result, snapshot: { ...result.snapshot, basketball: basketballSnapshot(next, result.snapshot.players) } };
      const saved = await commit({ game_connection: args.runtime_connection, game_version: envelope.version, game_state: next });
      if (saved.ended || !saved.game) return { ended: true };
      if (saved.applied) {
        if (!validEnvelope(saved.game)) throw new Error("Court runtime unavailable");
        return { ...result, snapshot: { ...result.snapshot, basketball: basketballSnapshot(saved.game.state, result.snapshot.players) } };
      }
      // A lost CAS never applied this command. Recompute against current shared
      // ownership/geometry instead of overwriting a winner or double-counting.
      envelope = saved.game;
    }
    return { ...result, snapshot: { ...result.snapshot, basketball: basketballSnapshot(envelope.state, result.snapshot.players) },
      ...(commands.length ? { notice: "Court busy. Try E again." } : {}) };
  };
}
