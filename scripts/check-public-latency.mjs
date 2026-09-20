const baseUrl = (process.env.LATENCY_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const sampleCount = Number(process.env.LATENCY_SAMPLE_COUNT || 5);
const routes = ["/", "/ai-practice-studio", "/focus-dojo"];

function percentile(values, value) {
  const ordered = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil((value / 100) * ordered.length) - 1);
  return ordered[index];
}

let failed = false;

for (const route of routes) {
  const samples = [];

  for (let sample = 0; sample < sampleCount; sample += 1) {
    const startedAt = performance.now();
    const response = await fetch(`${baseUrl}${route}`, {
      cache: "no-store",
      headers: { "user-agent": "ScienceDojo latency gate" },
      signal: AbortSignal.timeout(30_000),
    });
    const ttfb = performance.now() - startedAt;
    await response.arrayBuffer();

    if (!response.ok) {
      throw new Error(`${route} returned HTTP ${response.status}`);
    }
    samples.push(ttfb);
  }

  const p75 = percentile(samples, 75);
  const p95 = percentile(samples, 95);
  const routeFailed = p75 >= 1_000 || (route === "/" && p95 >= 2_000);
  failed ||= routeFailed;

  console.log(
    `${route} p75=${Math.round(p75)}ms p95=${Math.round(p95)}ms samples=${sampleCount}${routeFailed ? " FAIL" : " PASS"}`,
  );
}

if (failed) process.exitCode = 1;
