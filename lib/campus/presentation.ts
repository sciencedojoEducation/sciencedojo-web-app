import type { Player } from "./protocol.ts";

type Pose = Pick<Player, "x" | "z" | "rotation" | "seat">;
type Sample = Pose & { at: number };
// Cover the 200ms shared-room cadence plus normal arrival jitter. Display only:
// no extrapolation, client simulation or change to authoritative snapshots.
export const PRESENTATION_DELAY_MS = 300;
export function createPresentation(pose: Pose, now: number) {
  return { x: pose.x, z: pose.z, rotation: pose.rotation, seat: pose.seat,
    receivedAt: now, samples: [{ ...pose, at: now - PRESENTATION_DELAY_MS }, { ...pose, at: now }] as Sample[] };
}
export type Presentation = ReturnType<typeof createPresentation>;
const angleBetween = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export function advancePresentation(view: Presentation, now: number) {
  const at = now - PRESENTATION_DELAY_MS;
  const samples = view.samples;
  while (samples.length > 1 && samples[1].at <= at) samples.shift();
  const from = samples[0], to = samples[1] ?? from;
  const fraction = to.at > from.at ? Math.max(0, Math.min(1, (at - from.at) / (to.at - from.at))) : 1;
  view.x = from.x + (to.x - from.x) * fraction;
  view.z = from.z + (to.z - from.z) * fraction;
  const angle = from.rotation + angleBetween(from.rotation, to.rotation) * fraction;
  view.rotation = Math.atan2(Math.sin(angle), Math.cos(angle));
  return samples.some(s => Math.abs(s.x - view.x) > .000001 || Math.abs(s.z - view.z) > .000001 ||
    Math.abs(angleBetween(view.rotation, s.rotation)) > .000001);
}

export function receivePresentation(view: Presentation, pose: Pose, now: number) {
  const previous = view.samples.at(-1)!;
  const snap = pose.seat !== view.seat || now - view.receivedAt > 1000 ||
    Math.hypot(pose.x - previous.x, pose.z - previous.z) > 3;
  view.receivedAt = now;
  if (snap) {
    Object.assign(view, createPresentation(pose, now));
    return;
  }
  // Keep stationary samples: they mark when an authoritative stop occurred.
  if (previous.at === now) view.samples.pop();
  view.samples.push({ x: pose.x, z: pose.z, rotation: pose.rotation, seat: pose.seat, at: now });
  advancePresentation(view, now);
}
