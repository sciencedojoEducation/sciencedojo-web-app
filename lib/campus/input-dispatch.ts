import type { Input } from "./protocol.ts";

type Intent = Omit<Input, "seq">;
/** Local input timing only. Keep refreshes while moving; coalesce fast edges. */
export function createInputDispatcher(read: () => Intent | null, send: (input: Intent) => void, {
  now = () => performance.now(),
  later = (callback: () => void, ms: number) => setTimeout(callback, ms),
  cancel = (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
} = {}) {
  let previous: Intent | undefined, sentAt = -Infinity;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const request = () => {
    if (disposed) return;
    const input = read();
    if (!input) { previous = undefined; sentAt = -Infinity; return; }
    const at = now();
    const changed = !previous || input.x !== previous.x || input.z !== previous.z ||
      input.run !== previous.run || input.jump !== previous.jump || input.stance !== previous.stance;
    const refresh = (input.x !== 0 || input.z !== 0) && at - sentAt >= 100;
    if (!changed && !refresh) return;
    // At most 20 input messages/second, below the socket's total 30-message cap.
    // Normal held movement still refreshes at 10Hz. Idle does not consume slots.
    const wait = 50 - (at - sentAt);
    if (wait > 0) {
      if (timer === undefined) timer = later(() => { timer = undefined; request(); }, wait);
      return;
    }
    if (timer !== undefined) { cancel(timer); timer = undefined; }
    previous = { ...input }; sentAt = at; send(input);
  };
  return { request, dispose() { disposed = true; if (timer !== undefined) cancel(timer); } };
}
