import type { Player } from "./protocol.ts";

type Pose = Pick<Player, "x" | "z" | "rotation" | "seat">;
/** Local visual state only. It never changes the authoritative snapshot or sends positions. */
export function createPresentation(pose: Pose, now: number) {
  return { x: pose.x, z: pose.z, rotation: pose.rotation,
    fromX: pose.x, fromZ: pose.z, fromRotation: pose.rotation,
    toX: pose.x, toZ: pose.z, toRotation: pose.rotation,
    seat: pose.seat, startedAt: now, receivedAt: now, duration: 0 };
}
export type Presentation = ReturnType<typeof createPresentation>;

export function advancePresentation(view: Presentation, now: number) {
  const t = view.duration ? Math.max(0, Math.min(1, (now - view.startedAt) / view.duration)) : 1;
  view.x = view.fromX + (view.toX - view.fromX) * t;
  view.z = view.fromZ + (view.toZ - view.fromZ) * t;
  const angle = view.fromRotation + (view.toRotation - view.fromRotation) * t;
  view.rotation = Math.atan2(Math.sin(angle), Math.cos(angle));
  return t < 1;
}

export function receivePresentation(view: Presentation, pose: Pose, now: number) {
  advancePresentation(view, now);
  const gap = now - view.receivedAt;
  view.receivedAt = now;
  const angle = Math.atan2(Math.sin(pose.rotation - view.rotation), Math.cos(pose.rotation - view.rotation));
  const snap = pose.seat !== view.seat || gap > 1000 || Math.hypot(pose.x - view.x, pose.z - view.z) > 3;
  if (!snap && pose.x === view.toX && pose.z === view.toZ &&
    Math.abs(Math.atan2(Math.sin(pose.rotation - view.toRotation), Math.cos(pose.rotation - view.toRotation))) < .00001) return;
  view.fromX = snap ? pose.x : view.x;
  view.fromZ = snap ? pose.z : view.z;
  view.fromRotation = snap ? pose.rotation : view.rotation;
  view.toX = pose.x; view.toZ = pose.z;
  view.toRotation = snap ? pose.rotation : view.rotation + angle;
  view.seat = pose.seat; view.startedAt = now;
  view.duration = snap ? 0 : Math.max(50, Math.min(250, gap));
  advancePresentation(view, now);
}
