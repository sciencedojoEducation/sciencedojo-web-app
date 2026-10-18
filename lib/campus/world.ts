import {isEnvironmentCommand,canSwitchGlass,startJourney,advanceJourney,jumpElevation,type Journey} from "./locomotion.ts";
import { floorHeight, schoolWalkable, walkSchool } from "./school-layout.ts";
import { createBasketball, advanceBasketball, basketballAction, basketballSnapshot } from "./basketball.ts";
import {
  SEATS,
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
  basketball = createBasketball();
  frosted=new Set<string>();
  private journeys=new Map<string,Journey>();
  private jumps=new Map<string,number>();
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
      rotation: 0, floor:0,elevation:0,stance:"stand",travel:null,
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
    this.rates.delete(id);this.journeys.delete(id);this.jumps.delete(id);
    if(!this.players.size)this.frosted.clear();
    if (!this.players.size) this.basketball = createBasketball();
  }
  input(id: string, data: unknown, now: number) {
    if (
      !this.allow(id, now) ||
      !isInput(data) ||
      data.seq <= (this.sequences.get(id) ?? -1)
    )
      return false;
    const p=this.players.get(id);
    if (p?.status !== "walking"||p.travel) return false;
    const last=this.inputs.get(id);
    if(now-(this.jumps.get(id)??-10000)>=850&&((data.stance??"stand")!=="prone"||schoolWalkable(p.x,p.z,p.floor,.9)))p.stance=data.stance??"stand";
    if(data.jump&&!last?.jump&&p.stance==="stand"&&now-(this.jumps.get(id)??-10000)>=1000)this.jumps.set(id,now);
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
      const journey=this.journeys.get(id);
      if(journey){if(!advanceJourney(p,journey,now))this.journeys.delete(id);continue;}
      p.elevation=jumpElevation(this.jumps.get(id),now,p.floor);
      const input = this.inputs.get(id);
      if (!input || now - input.at > 350 || p.status !== "walking") continue;
      Object.assign(p, walkSchool(p, input.x, input.z, seconds,p.stance,input.run));
      if (input.x || input.z) p.rotation = Math.atan2(input.x, input.z);
    }
    this.basketball = advanceBasketball(this.basketball, [...this.players.values()], now);
  }
  playBasketball(id: string, command: unknown, now: number) {
    if (!this.allow(id, now)) return false;
    const state = advanceBasketball(this.basketball, [...this.players.values()], now);
    const next = basketballAction(state, this.players.get(id), command, now);
    this.basketball = next ?? state;
    return next !== null;
  }
  environment(id:string,data:unknown,now:number){
    if(!this.allow(id,now)||!isEnvironmentCommand(data))return false;const p=this.players.get(id);if(!p)return false;
    if(data.action==="glass"){if(!canSwitchGlass(p,data.room))return false;if(this.frosted.has(data.room))this.frosted.delete(data.room);else this.frosted.add(data.room);return true;}
    const j=startJourney(p,data,now);if(!j)return false;this.inputs.delete(id);this.jumps.delete(id);this.journeys.set(id,j);advanceJourney(p,j,now);return true;
  }
  sit(id: string, seatId: unknown) {
    const p = this.players.get(id),
      seat = SEATS.find((s) => s.id === seatId);
    if (!p || !seat || p.seat || p.travel || (p.floor??0)!==(seat.floor??0) || Math.abs((p.elevation??0)-floorHeight(p.floor))>.05 || Math.hypot(p.x - seat.x, p.z - seat.z) > 2.1)
      return false;
    if ([...this.players.values()].some((other) => other.seat === seat.id))
      return false;
    Object.assign(p, {
      x: seat.x,
      z: seat.z,
      seat: seat.id,
      status: "seated",
      rotation: Math.PI,stance:"stand",elevation:floorHeight(p.floor),
    });
    this.inputs.delete(id);this.jumps.delete(id);
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
      frosted:[...this.frosted].sort(),
      basketball: basketballSnapshot(this.basketball, [...this.players.values()].filter(p => !blocked.has(p.id))),
    };
  }
}
