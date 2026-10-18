/** Shared public architecture only: no accounts, courses or learning activity. */
export const SCHOOL_REVISION = "school-v2-basketball";
export const SCHOOL_BOUNDS = { minX: -64, maxX: 64, minZ: -39, maxZ: 42, speed: 3 };
export type Place = { id: string; name: string; kind: string; x: number; z: number; width: number; depth: number; colour: string; accent: string; description: string; outdoor?: boolean };
export const SCHOOL_PLACES: readonly Place[] = [
  { id: "garden", name: "Quiet garden", kind: "garden", x: -52, z: -26, width: 20, depth: 18, colour: "#c1d3a7", accent: "#75946a", description: "A leafy place to take a quiet break.", outdoor: true },
  { id: "art", name: "Art studio", kind: "art", x: -26, z: -26, width: 20, depth: 18, colour: "#ead4c3", accent: "#b36d55", description: "Easels, colour and room for new ideas." },
  { id: "classroom-a", name: "Classroom A", kind: "classroom", x: 0, z: -26, width: 20, depth: 18, colour: "#d7dfcc", accent: "#6c8c72", description: "A bright classroom with laptop study stations." },
  { id: "music", name: "Music room", kind: "music", x: 26, z: -26, width: 20, depth: 18, colour: "#ddd3e5", accent: "#8b739b", description: "Pianos, practice spaces and a small performance corner." },
  { id: "greenhouse", name: "Greenhouse", kind: "greenhouse", x: 52, z: -26, width: 20, depth: 18, colour: "#d0dfc4", accent: "#6b9b79", description: "Explore the school's growing beds and botanical collection.", outdoor: true },
  { id: "auditorium", name: "Auditorium", kind: "auditorium", x: -52, z: 0, width: 20, depth: 18, colour: "#daccc0", accent: "#9a6358", description: "A tiered gathering space and stage." },
  { id: "science", name: "Science lab", kind: "science", x: -26, z: 0, width: 20, depth: 18, colour: "#d2e3df", accent: "#588f8a", description: "Laboratory benches, microscopes and a demonstration area." },
  { id: "library", name: "Library", kind: "library", x: 0, z: 0, width: 20, depth: 18, colour: "#ede9dc", accent: "#477a70", description: "Books, quiet company and the original four study computers." },
  { id: "computer", name: "Computer lab", kind: "computer", x: 26, z: 0, width: 20, depth: 18, colour: "#d6e0e6", accent: "#597f99", description: "Four connected workstations opening your existing learning." },
  { id: "sports", name: "Sports court", kind: "sports", x: 52, z: 0, width: 20, depth: 18, colour: "#bdcfc1", accent: "#668b77", description: "A playable shared basketball court. E picks up the ball; aim, hold E and release to shoot. Two hoops, rebounds and court scores.", outdoor: true },
  { id: "gym", name: "Sports hall", kind: "gym", x: -52, z: 26, width: 20, depth: 18, colour: "#d9c39e", accent: "#9b7a4e", description: "A school gym with court markings and training space." },
  { id: "classroom-b", name: "Classroom B", kind: "classroom", x: -26, z: 26, width: 20, depth: 18, colour: "#e4d8b9", accent: "#a18d54", description: "A second classroom for independent study and school life." },
  { id: "reception", name: "Reception", kind: "reception", x: 0, z: 26, width: 20, depth: 18, colour: "#e8dfd0", accent: "#917b61", description: "The school's welcome desk and central meeting point." },
  { id: "cafeteria", name: "Cafeteria", kind: "cafeteria", x: 26, z: 26, width: 20, depth: 18, colour: "#ead5bf", accent: "#b28460", description: "Shared tables, a serving counter and a relaxed break space." },
  { id: "courtyard", name: "Courtyard", kind: "courtyard", x: 52, z: 26, width: 20, depth: 18, colour: "#d7ddcf", accent: "#819578", description: "An open courtyard with seating, trees and a fountain.", outdoor: true },
];
export const STUDY_SEATS = [
  { id: "desk-1", x: -4.5, z: -3, name: "Desk 1", place: "library" },
  { id: "desk-2", x: -1.5, z: -3, name: "Desk 2", place: "library" },
  { id: "desk-3", x: 1.5, z: -3, name: "Desk 3", place: "library" },
  { id: "desk-4", x: 4.5, z: -3, name: "Desk 4", place: "library" },
  { id: "lab-1", x: 21.5, z: -3, name: "Lab computer 1", place: "computer" },
  { id: "lab-2", x: 24.5, z: -3, name: "Lab computer 2", place: "computer" },
  { id: "lab-3", x: 27.5, z: -3, name: "Lab computer 3", place: "computer" },
  { id: "lab-4", x: 30.5, z: -3, name: "Lab computer 4", place: "computer" },
  { id: "class-1", x: -3, z: -29, name: "Classroom laptop 1", place: "classroom-a" },
  { id: "class-2", x: 3, z: -29, name: "Classroom laptop 2", place: "classroom-a" },
] as const;
export type Point = { x: number; z: number };
export type Wall = { minX: number; maxX: number; minZ: number; maxZ: number };
export const SCHOOL_WALLS: readonly Wall[] = SCHOOL_PLACES.filter(p => !p.outdoor).flatMap(p => {
  const l = p.x - p.width / 2, r = p.x + p.width / 2, b = p.z - p.depth / 2, f = p.z + p.depth / 2, t = .18;
  return [
    { minX: l - t, maxX: r + t, minZ: b - t, maxZ: b + t },
    { minX: l - t, maxX: l + t, minZ: b, maxZ: f },
    { minX: r - t, maxX: r + t, minZ: b, maxZ: f },
    { minX: l, maxX: p.x - 2.4, minZ: f - t, maxZ: f + t },
    { minX: p.x + 2.4, maxX: r, minZ: f - t, maxZ: f + t },
  ];
});
export function schoolPlaceAt(point: Point) {
  return SCHOOL_PLACES.find(p => Math.abs(point.x - p.x) < p.width / 2 && Math.abs(point.z - p.z) < p.depth / 2);
}
export function schoolWalkable(x: number, z: number) {
  const b = SCHOOL_BOUNDS, radius = .34;
  return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ &&
    !SCHOOL_WALLS.some(w => x > w.minX - radius && x < w.maxX + radius && z > w.minZ - radius && z < w.maxZ + radius);
}
/** Axis sliding with bounded substeps prevents tunnelling; used by room authority. */
export function walkSchool(from: Point, dx: number, dz: number, seconds: number): Point {
  let { x, z } = from;
  const duration = Math.min(.35, Math.max(0, seconds)), steps = Math.max(1, Math.ceil(duration / .05));
  const divisor = Math.max(1, Math.hypot(dx, dz));
  const sx = dx / divisor * SCHOOL_BOUNDS.speed * duration / steps, sz = dz / divisor * SCHOOL_BOUNDS.speed * duration / steps;
  for (let i = 0; i < steps; i++) {
    const nx = Math.max(SCHOOL_BOUNDS.minX, Math.min(SCHOOL_BOUNDS.maxX, x + sx));
    if (schoolWalkable(nx, z)) x = nx;
    const nz = Math.max(SCHOOL_BOUNDS.minZ, Math.min(SCHOOL_BOUNDS.maxZ, z + sz));
    if (schoolWalkable(x, nz)) z = nz;
  }
  return { x, z };
}
/** Local wayfinding only. Following a route sends ordinary direction inputs, never positions/destinations. */
export function schoolRoute(from: Point, to: Point): Point[] {
  const b = SCHOOL_BOUNDS, width = b.maxX - b.minX + 1, height = b.maxZ - b.minZ + 1;
  const cell = (p: Point) => ({ x: Math.max(b.minX, Math.min(b.maxX, Math.round(p.x))), z: Math.max(b.minZ, Math.min(b.maxZ, Math.round(p.z))) });
  const start = cell(from), end = cell(to), index = (p: Point) => (p.z - b.minZ) * width + p.x - b.minX;
  if (!schoolWalkable(start.x, start.z) || !schoolWalkable(end.x, end.z)) return [];
  const previous = new Int32Array(width * height).fill(-1), queue = new Int32Array(width * height);
  let read = 0, write = 0;queue[write++] = index(start);previous[index(start)] = index(start);
  while (read < write && previous[index(end)] === -1) {
    const current = queue[read++], x = current % width + b.minX, z = Math.floor(current / width) + b.minZ;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: x + dx, z: z + dz };
      if (!schoolWalkable(next.x, next.z)) continue;
      const n = index(next);if (previous[n] !== -1) continue;
      previous[n] = current;queue[write++] = n;
    }
  }
  if (previous[index(end)] === -1) return [];
  const route: Point[] = [];let current = index(end);
  while (current !== index(start)) { route.push({ x: current % width + b.minX, z: Math.floor(current / width) + b.minZ });current = previous[current]; }
  route.reverse();
  return route.filter((p, i) => i === route.length - 1 || i === 0 ||
    (p.x - route[i - 1].x !== route[i + 1].x - p.x || p.z - route[i - 1].z !== route[i + 1].z - p.z));
}
