/** Bounded court physics shared by both authorities. No account/learning data. */
export const COURT = { x: 52, minX: 42, maxX: 62, minZ: -9, maxZ: 9, floor: .15,
  radius: .22, rimRadius: .46, rimTube: .035, rimY: 3.05, gravity: 9.81, threePoint: 5.4 };
export const HOOPS = [
  { id: "north", name: "North hoop", x: 52, z: -6.6, boardZ: -7 },
  { id: "south", name: "South hoop", x: 52, z: 6.6, boardZ: 7 },
] as const;
export type HoopId = typeof HOOPS[number]["id"];
export type CourtPlayer = { id: string; x: number; z: number; rotation: number; status: string };
export type BasketballCommand = { action: "take" } | { action: "drop" } |
  { action: "shoot"; dx: number; dy: number; dz: number; power: number };
export type BasketballSnapshot = {
  x: number; y: number; z: number; holder: string | null;
  mode: "loose" | "held"; north: number; south: number; event: number;
  kind: "ready" | "pickup" | "shot" | "basket" | "drop" | "out";
  points: number; hoop: HoopId | null;
};
export type BasketballState = BasketballSnapshot & {
  vx: number; vy: number; vz: number; at: number; actionAt: number;
  shot: boolean; shotX: number; shotZ: number;
};
const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
const finite = (n: unknown, low: number, high: number): n is number => typeof n === "number" && Number.isFinite(n) && n >= low && n <= high;
const integer = (n: unknown, high: number) => finite(n, 0, high) && Number.isInteger(n);
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
export function isBasketballCommand(value: unknown): value is BasketballCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const c = value as BasketballCommand, keys = Object.keys(c).sort().join(",");
  if (c.action === "take" || c.action === "drop") return keys === "action";
  return c.action === "shoot" && keys === "action,dx,dy,dz,power" && finite(c.power, 0, 1) &&
    finite(c.dx, -1, 1) && finite(c.dy, -1, 1) && finite(c.dz, -1, 1) &&
    Math.abs(Math.hypot(c.dx, c.dy, c.dz) - 1) < .001;
}
export function isBasketballSnapshot(value: unknown): value is BasketballSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const b = value as BasketballSnapshot;
  return Object.keys(b).sort().join(",") === "event,holder,hoop,kind,mode,north,points,south,x,y,z" &&
    finite(b.x, COURT.minX - 1, COURT.maxX + 1) && finite(b.z, -10, 10) && finite(b.y, .36, 13) &&
    (b.holder === null || uuid(b.holder)) && ["loose", "held"].includes(b.mode) &&
    (b.mode === "held" || b.holder === null) && integer(b.north, 9999) && integer(b.south, 9999) && integer(b.event, 1000000000) &&
    ["ready", "pickup", "shot", "basket", "drop", "out"].includes(b.kind) && [0, 2, 3].includes(b.points) &&
    (b.hoop === null || HOOPS.some(h => h.id === b.hoop));
}
export function createBasketball(at = 0): BasketballState {
  return { x: COURT.x, y: COURT.floor + COURT.radius, z: 0, holder: null, mode: "loose",
    north: 0, south: 0, event: 0, kind: "ready", points: 0, hoop: null,
    vx: 0, vy: 0, vz: 0, at, actionAt: -1000, shot: false, shotX: COURT.x, shotZ: 0 };
}
export function isBasketballState(value: unknown): value is BasketballState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const b = value as BasketballState;
  const { vx, vy, vz, at, actionAt, shot, shotX, shotZ, ...publicState } = b;
  return isBasketballSnapshot(publicState) && (b.mode !== "held" || uuid(b.holder)) &&
    [vx, vy, vz].every(v => finite(v, -30, 30)) && finite(at, 0, Number.MAX_SAFE_INTEGER) &&
    finite(actionAt, -1000, Number.MAX_SAFE_INTEGER) && typeof shot === "boolean" &&
    finite(shotX, COURT.minX, COURT.maxX) && finite(shotZ, COURT.minZ, COURT.maxZ);
}
export function onCourt(p: { x: number; z: number }) {
  return p.x > COURT.minX && p.x < COURT.maxX && p.z > COURT.minZ && p.z < COURT.maxZ;
}
const eligible = (p?: CourtPlayer) => p && p.status === "walking" && onCourt(p);
export function canTakeBasketball(b: BasketballSnapshot, p: CourtPlayer) {
  return eligible(p) && b.mode === "loose" && b.y <= 2.3 && Math.hypot(p.x - b.x, p.z - b.z) <= 2.1;
}
function event(b: BasketballState, kind: BasketballSnapshot["kind"]) {
  b.event = (b.event + 1) % 1000000001; b.kind = kind; b.points = 0; b.hoop = null;
}
function drop(b: BasketballState, p?: CourtPlayer) {
  b.x = clamp(p?.x ?? b.x, COURT.minX + 1, COURT.maxX - 1);
  b.z = clamp(p?.z ?? b.z, COURT.minZ + 1, COURT.maxZ - 1);
  b.y = .9; b.holder = null; b.mode = "loose"; b.vx = 0; b.vz = 0; b.vy = 0; b.shot = false;
  event(b, "drop");
}
/** Public projection is explicit, with blocked owners removed just like avatars. */
export function basketballSnapshot(b: BasketballState, visible: readonly CourtPlayer[]): BasketballSnapshot {
  const owner = visible.find(p => p.id === b.holder);
  const hidden = b.mode === "held" && !owner;
  return { x: hidden ? COURT.x : owner?.x ?? b.x, y: hidden ? 1.1 : b.y, z: hidden ? 0 : owner?.z ?? b.z,
    holder: owner?.id ?? null, mode: b.mode, north: b.north, south: b.south,
    event: b.event, kind: b.kind, points: b.points, hoop: b.hoop };
}
export function shotVelocity(c: Extract<BasketballCommand, { action: "shoot" }>) {
  const speed = 4 + c.power * 9;
  return { x: c.dx * speed, y: c.dy * speed, z: c.dz * speed };
}
export function aimDirection(yaw: number, pitch: number) {
  return { dx: Math.sin(yaw) * Math.cos(pitch), dy: Math.sin(pitch), dz: -Math.cos(yaw) * Math.cos(pitch) };
}
/** Basketball is lofted above the sight line, so players can keep the rim in view. */
export function basketballAim(yaw: number, pitch: number) { return aimDirection(yaw, clamp(.75 + pitch, -.25, 1.4)); }
export function suggestedShot(p: {x: number; z: number}, eye = 1.67, target?: HoopId) {
  const hoop = HOOPS.find(h=>h.id===target) ?? [...HOOPS].sort((a,b) => Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
  const distance = Math.hypot(hoop.x-p.x,hoop.z-p.z), yaw = Math.atan2(hoop.x-p.x,p.z-hoop.z);
  const pitch = Math.atan2(COURT.rimY-eye,Math.max(.1,distance)), angle = clamp(.75+pitch,-.25,1.4);
  const d = distance-Math.cos(angle)*.45, dy = COURT.rimY-(1.55+Math.sin(angle)*.45);
  const denominator = 2*Math.cos(angle)**2*(d*Math.tan(angle)-dy);
  const speed = denominator>0?Math.sqrt(COURT.gravity*d*d/denominator):13;
  const clear = distance >= 1.5 && (hoop.id === "north" ? p.z > hoop.z + .8 : p.z < hoop.z - .8);
  return {hoop,yaw,pitch,power:clamp((speed-4)/9,.12,1),clear};
}
export type ShotControl = { started: number | null; power: number };
export function currentShotPower(control: ShotControl, now: number) { return control.started === null ? control.power : chargePower(control.started, now); }
export function chargePower(start: number, now: number) { return clamp((now - start) / 1400, .12, 1); }

/** A live aim guide only. It never awards points or changes authoritative state. */
export function shotGuide(p: {x: number; z: number}, c: Extract<BasketballCommand, { action: "shoot" }>, t: number) {
  const v = shotVelocity(c);
  return { x: p.x + c.dx * .45 + v.x * t, y: 1.55 + c.dy * .45 + v.y * t - COURT.gravity * t * t / 2,
    z: p.z + c.dz * .45 + v.z * t };
}
function reflect(b: BasketballState, nx: number, ny: number, nz: number, restitution: number) {
  const dot = b.vx * nx + b.vy * ny + b.vz * nz;
  if (dot < 0) { b.vx -= (1 + restitution) * dot * nx; b.vy -= (1 + restitution) * dot * ny; b.vz -= (1 + restitution) * dot * nz; }
}
function collideBoard(b: BasketballState, z: number) {
  const x = clamp(b.x, COURT.x - 1.25, COURT.x + 1.25), y = clamp(b.y, 2.65, 4.15), bz = clamp(b.z, z - .075, z + .075);
  const dx = b.x - x, dy = b.y - y, dz = b.z - bz, length = Math.hypot(dx, dy, dz);
  if (length >= COURT.radius) return;
  const nx = length ? dx / length : 0, ny = length ? dy / length : 0, nz = length ? dz / length : z > 0 ? -1 : 1;
  const push = COURT.radius - length + .001;
  b.x += nx * push; b.y += ny * push; b.z += nz * push; reflect(b, nx, ny, nz, .72);
}
function integrate(b: BasketballState, seconds: number) {
  const steps = Math.max(1, Math.ceil(seconds * 120)), dt = seconds / steps;
  for (let i = 0; i < steps; i++) {
    const previous = { x: b.x, y: b.y, z: b.z };
    b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt - COURT.gravity * dt * dt / 2; b.vy -= COURT.gravity * dt;
    for (const hoop of HOOPS) {
      // Count one downward crossing through the actual clear opening, never a near miss.
      if (b.shot && previous.y > COURT.rimY && b.y <= COURT.rimY && b.vy < 0) {
        const fraction = (previous.y - COURT.rimY) / (previous.y - b.y);
        const x = previous.x + (b.x - previous.x) * fraction, z = previous.z + (b.z - previous.z) * fraction;
        if (Math.hypot(x - hoop.x, z - hoop.z) < COURT.rimRadius - COURT.radius - COURT.rimTube) {
          const points = Math.hypot(b.shotX - hoop.x, b.shotZ - hoop.z) >= COURT.threePoint ? 3 : 2;
          event(b, "basket"); b.points = points; b.hoop = hoop.id; b[hoop.id] = Math.min(9999, b[hoop.id] + points); b.shot = false;
          b.vx *= .7; b.vz *= .7;
        }
      }
      const radial = Math.hypot(b.x - hoop.x, b.z - hoop.z);
      const ringX = hoop.x + (radial ? (b.x - hoop.x) / radial : 1) * COURT.rimRadius;
      const ringZ = hoop.z + (radial ? (b.z - hoop.z) / radial : 0) * COURT.rimRadius;
      const dx = b.x - ringX, dy = b.y - COURT.rimY, dz = b.z - ringZ, distance = Math.hypot(dx, dy, dz), radius = COURT.radius + COURT.rimTube;
      if (distance > 0 && distance < radius) {
        const push = radius - distance + .001;
        b.x += dx / distance * push; b.y += dy / distance * push; b.z += dz / distance * push;
        reflect(b, dx / distance, dy / distance, dz / distance, .65);
      }
      collideBoard(b, hoop.boardZ);
    }
    const floor = COURT.floor + COURT.radius;
    if (b.y < floor) {
      const bounce = Math.abs(b.vy) > .8;
      b.y = floor; b.vy = bounce ? Math.abs(b.vy) * .64 : 0;
      if (bounce) { b.vx *= .8; b.vz *= .8; }
    }
    if (b.y === floor && b.vy === 0) {
      const friction = Math.exp(-dt * 2.7); b.vx *= friction; b.vz *= friction;
      if (Math.hypot(b.vx, b.vz) < .08) b.vx = b.vz = 0;
    }
    if (b.x < COURT.minX || b.x > COURT.maxX || b.z < COURT.minZ || b.z > COURT.maxZ || b.y > 12) {
      b.x = COURT.x; b.y = floor; b.z = 0; b.vx = b.vy = b.vz = 0; b.shot = false; event(b, "out"); break;
    }
  }
}
export function basketballNeedsStep(b: BasketballState, players: readonly CourtPlayer[], now: number) {
  const owner = players.find(p => p.id === b.holder);
  if (b.mode === "held") return !eligible(owner) || (!!owner && now - b.at >= 200 && Math.hypot(owner.x - b.x, owner.z - b.z) > .05);
  return now - b.at >= 40 && (b.y > COURT.floor + COURT.radius + .001 || Math.hypot(b.vx, b.vy, b.vz) > .001);
}
export function advanceBasketball(b: BasketballState, players: readonly CourtPlayer[], now: number): BasketballState {
  const next = { ...b }, owner = players.find(p => p.id === b.holder);
  if (b.mode === "held") {
    if (!eligible(owner)) drop(next, owner);
    else { next.x = owner!.x; next.z = owner!.z; }
  } else integrate(next, Math.min(.5, Math.max(0, (now - b.at) / 1000)));
  next.at = now;
  return next;
}
export function basketballAction(b: BasketballState, actor: CourtPlayer | undefined, command: unknown, now: number): BasketballState | null {
  if (!actor || !eligible(actor) || !isBasketballCommand(command) || (command.action === "take" && now - b.actionAt < 250)) return null;
  const next = { ...b, at: now, actionAt: now };
  if (command.action === "take") {
    if (!canTakeBasketball(b, actor)) return null;
    next.holder = actor.id; next.mode = "held"; next.x = actor.x; next.z = actor.z; next.y = 1.1;
    next.vx = next.vy = next.vz = 0; next.shot = false; event(next, "pickup");
  } else {
    if (b.holder !== actor.id || b.mode !== "held") return null;
    if (command.action === "drop") drop(next, actor);
    else {
      const velocity = shotVelocity(command);
      next.x = actor.x + command.dx * .45; next.y = 1.55 + command.dy * .45; next.z = actor.z + command.dz * .45;
      next.vx = velocity.x; next.vy = velocity.y; next.vz = velocity.z;
      next.holder = null; next.mode = "loose"; next.shot = true; next.shotX = actor.x; next.shotZ = actor.z; event(next, "shot");
    }
  }
  return next;
}
