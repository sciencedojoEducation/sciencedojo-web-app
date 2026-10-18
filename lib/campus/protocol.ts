import { SCHOOL_BOUNDS, STUDY_SEATS } from "./school-layout.ts";
export const CAMPUS_NOTICE = "campus-adult-pilot-v1";
export const CAMPUS_ROOM = "library";
export const WORLD = SCHOOL_BOUNDS;
export const SEATS = STUDY_SEATS;
export const AVATAR_COLOURS = [
  "#007f79",
  "#c88754",
  "#6a67a5",
  "#467bad",
  "#a45f70",
];
export type CampusIdentity = {
  id: string;
  pseudonym: string;
  colour: number;
  blocked: string[];
};
export type Player = {
  id: string;
  pseudonym: string;
  colour: number;
  x: number;
  z: number;
  rotation: number;
  status: "walking" | "seated" | "studying";
  seat: string | null;
};
export type Snapshot = { self: string; players: Player[]; occupied: string[] };
export type Input = { x: number; z: number; seq: number };
export function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const snapshot = value as Snapshot;
  if (Object.keys(value).sort().join(",") !== "occupied,players,self" ||
    typeof snapshot.self !== "string" || !Array.isArray(snapshot.players) || snapshot.players.length > 10 ||
    !Array.isArray(snapshot.occupied) || snapshot.occupied.length > SEATS.length ||
    new Set(snapshot.occupied).size !== snapshot.occupied.length ||
    !snapshot.occupied.every((id) => SEATS.some((seat) => seat.id === id))) return false;
  if (!snapshot.players.every((p) => p && typeof p === "object" &&
    Object.keys(p).sort().join(",") === "colour,id,pseudonym,rotation,seat,status,x,z" &&
    isIdentity({ id: p.id, pseudonym: p.pseudonym, colour: p.colour, blocked: [] }) &&
    Number.isFinite(p.x) && p.x >= WORLD.minX && p.x <= WORLD.maxX &&
    Number.isFinite(p.z) && p.z >= WORLD.minZ && p.z <= WORLD.maxZ &&
    Number.isFinite(p.rotation) && Math.abs(p.rotation) <= Math.PI + 0.000001 &&
    (p.seat === null ? p.status === "walking" :
      SEATS.some((seat) => seat.id === p.seat) && ["seated", "studying"].includes(p.status)))) return false;
  return new Set(snapshot.players.map((p) => p.id)).size === snapshot.players.length &&
    snapshot.players.some((p) => p.id === snapshot.self);
}
export function isInput(value: unknown): value is Input {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).sort().join(",") === "seq,x,z" &&
    typeof v.x === "number" &&
    Number.isFinite(v.x) &&
    Math.abs(v.x) <= 1 &&
    typeof v.z === "number" &&
    Number.isFinite(v.z) &&
    Math.abs(v.z) <= 1 &&
    Number.isSafeInteger(v.seq) &&
    Number(v.seq) >= 0
  );
}
export function isIdentity(value: unknown): value is CampusIdentity {
  if (!value || typeof value !== "object") return false;
  const v = value as CampusIdentity;
  return (
    typeof v.id === "string" &&
    /^[0-9a-f-]{36}$/i.test(v.id) &&
    typeof v.pseudonym === "string" &&
    /^[A-Za-z]+ [A-Za-z]+ [0-9a-f]{6}$/.test(v.pseudonym) &&
    Number.isInteger(v.colour) &&
    v.colour >= 0 &&
    v.colour < AVATAR_COLOURS.length &&
    Array.isArray(v.blocked) &&
    v.blocked.every(
      (id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id),
    )
  );
}
