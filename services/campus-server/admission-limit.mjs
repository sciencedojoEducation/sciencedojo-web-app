import { createHmac } from "node:crypto";

/** Bounded process-local counters; rotating process salt keeps addresses out of stored keys/logs. */
export function admissionLimiter(salt) {
  const buckets = new Map();
  let global = { at: 0, count: 0 };
  return (address, now = Date.now()) => {
    if (now - global.at >= 60000) global = { at: now, count: 0 };
    if (++global.count > 120) return false;
    const key = createHmac("sha256", salt)
      .update(address || "unknown")
      .digest("hex");
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.at >= 60000) {
      if (buckets.size >= 1024) buckets.delete(buckets.keys().next().value);
      bucket = { at: now, count: 0 };
      buckets.set(key, bucket);
    }
    return ++bucket.count <= 60;
  };
}
