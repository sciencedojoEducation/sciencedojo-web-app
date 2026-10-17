import {
  SEATS,
  WORLD,
  isInput,
  type CampusIdentity,
  type Player,
  type Input,
  type Snapshot,
} from "./protocol.ts";

/** Pure server-authoritative simulation. Never store account or learning data here. */
export class CampusWorld {
  players = new Map<string, Player>();
  blocks = new Map<string, Set<string>>();
  private inputs = new Map<string, Input & { at: number }>();
  private sequences = new Map<string, number>();
  private rates = new Map<string, { at: number; count: number }>();
  join(identity: CampusIdentity) {
    if (this.players.has(identity.id))
      throw new Error("Already connected in another tab.");
    if (this.players.size >= 10)
      throw new Error("The library is full. Please try again later.");
    this.players.set(identity.id, {
      id: identity.id,
      pseudonym: identity.pseudonym,
      colour: identity.colour,
      x: (this.players.size % 5) - 2,
      z: 4,
      rotation: 0,
      status: "walking",
      seat: null,
    });
    this.blocks.set(identity.id, new Set(identity.blocked));
  }
  remove(id: string) {
    this.players.delete(id);
    this.blocks.delete(id);
    this.inputs.delete(id);
    this.sequences.delete(id);
    this.rates.delete(id);
  }
  input(id: string, data: unknown, now: number) {
    if (
      !this.allow(id, now) ||
      !isInput(data) ||
      data.seq <= (this.sequences.get(id) ?? -1)
    )
      return false;
    if (this.players.get(id)?.status !== "walking") return false;
    this.sequences.set(id, data.seq);
    this.inputs.set(id, { ...data, at: now });
    return true;
  }
  allow(id: string, now: number) {
    let rate = this.rates.get(id);
    if (!rate || now - rate.at >= 1000) {
      rate = { at: now, count: 0 };
      this.rates.set(id, rate);
    }
    return ++rate.count <= 30;
  }
  step(delta: number, now: number) {
    const seconds = Math.min(Math.max(delta, 0), 0.1);
    for (const [id, p] of this.players) {
      const input = this.inputs.get(id);
      if (!input || now - input.at > 350 || p.status !== "walking") continue;
      const length = Math.max(1, Math.hypot(input.x, input.z));
      p.x = Math.max(
        WORLD.minX,
        Math.min(WORLD.maxX, p.x + (input.x / length) * WORLD.speed * seconds),
      );
      p.z = Math.max(
        WORLD.minZ,
        Math.min(WORLD.maxZ, p.z + (input.z / length) * WORLD.speed * seconds),
      );
      if (input.x || input.z) p.rotation = Math.atan2(input.x, input.z);
    }
  }
  sit(id: string, seatId: unknown) {
    const p = this.players.get(id),
      seat = SEATS.find((s) => s.id === seatId);
    if (!p || !seat || p.seat || Math.hypot(p.x - seat.x, p.z - seat.z) > 2.1)
      return false;
    if ([...this.players.values()].some((other) => other.seat === seat.id))
      return false;
    Object.assign(p, {
      x: seat.x,
      z: seat.z,
      seat: seat.id,
      status: "seated",
      rotation: Math.PI,
    });
    this.inputs.delete(id);
    return true;
  }
  status(id: string, action: unknown) {
    const p = this.players.get(id);
    if (!p?.seat) return false;
    if (action === "stand") {
      p.z += 1;
      p.seat = null;
      p.status = "walking";
    } else if (action === "study") p.status = "studying";
    else if (action === "close") p.status = "seated";
    else return false;
    return true;
  }
  snapshot(id: string): Snapshot {
    const blocked = this.blocks.get(id) || new Set();
    return {
      self: id,
      players: [...this.players.values()]
        .filter((p) => !blocked.has(p.id))
        .map((p) => ({ ...p })),
      occupied: [...this.players.values()].flatMap((p) =>
        p.seat ? [p.seat] : [],
      ),
    };
  }
}
