import {SCHOOL_BOUNDS,SCHOOL_PLACES,SCHOOL_TRANSPORT_SHAFTS,movementSpeed,type Stance} from "./school-plan.ts";
import {furniture} from "./school-geometry.ts";
export * from "./school-plan.ts";
export type Point = { x: number; z: number; floor?:number };
export type Wall = { minX: number; maxX: number; minZ: number; maxZ: number;floor?:number };
export const SCHOOL_WALLS: readonly Wall[] = SCHOOL_PLACES.filter(p => !p.outdoor).flatMap(p => {
  const l = p.x - p.width / 2, r = p.x + p.width / 2, b = p.z - p.depth / 2, f = p.z + p.depth / 2, t = .18;
  return [
    { minX: l - t, maxX: r + t, minZ: b - t, maxZ: b + t },
    { minX: l - t, maxX: l + t, minZ: b, maxZ: f },
    { minX: r - t, maxX: r + t, minZ: b, maxZ: f },
    { minX: l, maxX: p.x - 2.4, minZ: f - t, maxZ: f + t },
    { minX: p.x + 2.4, maxX: r, minZ: f - t, maxZ: f + t },
  ].map(w=>({...w,floor:p.floor??0}));
});
export function schoolPlaceAt(point: Point) {
  return SCHOOL_PLACES.find(p => (p.floor??0)===(point.floor??0) && Math.abs(point.x - p.x) < p.width / 2 && Math.abs(point.z - p.z) < p.depth / 2);
}
export const SCHOOL_SOLIDS=[...SCHOOL_WALLS,...furniture,
  ...[0,1,2].flatMap(floor=>SCHOOL_TRANSPORT_SHAFTS.map(s=>({...s,floor})))
];
export function schoolWalkable(x: number, z: number,floor=0,radius=.34) {
  const b = SCHOOL_BOUNDS,edge=Math.max(.5,radius+.07);
  return Number.isInteger(floor)&&floor>=0&&floor<=2&&x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ &&
    !(floor>0 && (x< -64+edge||x>64-edge||z< -39+edge||z>42-edge)) &&
    !(floor>0 && x> -26-edge && x<26+edge && z>3-edge && z<22+edge) &&
    !SCHOOL_SOLIDS.some(w => (w.floor??0)===floor && x > w.minX - radius && x < w.maxX + radius && z > w.minZ - radius && z < w.maxZ + radius);
}
/** Axis sliding with bounded substeps prevents tunnelling; used by room authority. */
export function walkSchool(from: Point, dx: number, dz: number, seconds: number,stance:Stance="stand",run=false): Point {
  let { x, z } = from;
  const duration = Math.min(.35, Math.max(0, seconds)), steps = Math.max(1, Math.ceil(duration / .05));
  const divisor = Math.max(1, Math.hypot(dx, dz));
  const sx = dx / divisor * movementSpeed(stance,run) * duration / steps, sz = dz / divisor * movementSpeed(stance,run) * duration / steps;
  for (let i = 0; i < steps; i++) {
    const nx = Math.max(SCHOOL_BOUNDS.minX, Math.min(SCHOOL_BOUNDS.maxX, x + sx));
    if (schoolWalkable(nx, z,from.floor,stance==="prone"?.9:.34)) x = nx;
    const nz = Math.max(SCHOOL_BOUNDS.minZ, Math.min(SCHOOL_BOUNDS.maxZ, z + sz));
    if (schoolWalkable(x, nz,from.floor,stance==="prone"?.9:.34)) z = nz;
  }
  return { x, z };
}
/** Local wayfinding only. Following a route sends ordinary direction inputs, never positions/destinations. */
export function schoolRoute(from: Point, to: Point): Point[] {
  const b = SCHOOL_BOUNDS, width = b.maxX - b.minX + 1, height = b.maxZ - b.minZ + 1;
  const cell = (p: Point) => ({ x: Math.max(b.minX, Math.min(b.maxX, Math.round(p.x))), z: Math.max(b.minZ, Math.min(b.maxZ, Math.round(p.z))) });
  const floor=from.floor??0;
  if((to.floor??0)!==floor)return [];
  const closest=(p:Point)=>{const c=cell(p);if(schoolWalkable(c.x,c.z,floor))return c;for(let r=1;r<=2;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)if(schoolWalkable(c.x+dx,c.z+dz,floor))return {x:c.x+dx,z:c.z+dz};return c;};
  const start = closest(from), end = closest(to), index = (p: Point) => (p.z - b.minZ) * width + p.x - b.minX;
  if (!schoolWalkable(start.x, start.z,floor) || !schoolWalkable(end.x, end.z,floor)) return [];
  const previous = new Int32Array(width * height).fill(-1), queue = new Int32Array(width * height);
  let read = 0, write = 0;queue[write++] = index(start);previous[index(start)] = index(start);
  while (read < write && previous[index(end)] === -1) {
    const current = queue[read++], x = current % width + b.minX, z = Math.floor(current / width) + b.minZ;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: x + dx, z: z + dz };
      if (!schoolWalkable(next.x, next.z,floor)) continue;
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
