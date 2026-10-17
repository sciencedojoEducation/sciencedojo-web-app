export const CAMPUS_NOTICE = "campus-adult-pilot-v1";
export const CAMPUS_ROOM = "library";
export const WORLD = { minX: -9, maxX: 9, minZ: -7, maxZ: 7, speed: 3 };
export const SEATS = [
  { id: "desk-1", x: -4.5, z: -3 },
  { id: "desk-2", x: -1.5, z: -3 },
  { id: "desk-3", x: 1.5, z: -3 },
  { id: "desk-4", x: 4.5, z: -3 },
] as const;
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
