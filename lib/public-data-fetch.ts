export const PUBLIC_DATA_TIMEOUT_MS = 5_000;

type PublicDataFetchOptions = {
  timeoutMs?: number;
  fetcher?: typeof fetch;
};

/** Public reads must finish soon enough for prerendering and its safe fallbacks. */
export function createPublicDataFetch({ timeoutMs = PUBLIC_DATA_TIMEOUT_MS, fetcher }: PublicDataFetchOptions = {}): typeof fetch {
  return (input, init) => {
    const callerSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const deadline = AbortSignal.timeout(timeoutMs);
    const signal = callerSignal ? AbortSignal.any([callerSignal, deadline]) : deadline;
    // Resolve the framework's fetch at call time so its cache/tracing remain intact.
    return (fetcher ?? fetch)(input, { ...init, signal });
  };
}
