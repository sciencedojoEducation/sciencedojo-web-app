import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPublicDataFetch } from '../lib/public-data-fetch.ts';

function slowResponse(_input, init) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(Response.json({ ok: true })), 1_000);
    const abort = () => { clearTimeout(timer); reject(init.signal.reason); };
    if (init.signal.aborted) abort();
    else init.signal.addEventListener('abort', abort, { once: true });
  });
}

test('an unavailable public-data service reaches the caller fallback within its deadline', async () => {
  const request = createPublicDataFetch({ timeoutMs: 10, fetcher: slowResponse });
  let fallback = false;
  try { await request('https://example.test/data'); }
  catch (error) { assert.equal(error.name, 'TimeoutError'); fallback = true; }
  assert.equal(fallback, true);
});

test('caller cancellation remains effective for both init and Request signals', async () => {
  for (const viaRequest of [false, true]) {
    const controller = new AbortController();
    const request = createPublicDataFetch({ fetcher: slowResponse });
    const pending = viaRequest
      ? request(new Request('https://example.test/data', { signal: controller.signal }))
      : request('https://example.test/data', { signal: controller.signal });
    controller.abort(new Error('caller cancelled'));
    await assert.rejects(pending, /caller cancelled/);
  }
});

test('healthy public requests retain their data and fetch options', async () => {
  const headers = { apikey: 'public-test-key' };
  const request = createPublicDataFetch({ fetcher: async (input, init) => {
    assert.equal(input, 'https://example.test/catalog');
    assert.equal(init.method, 'POST');
    assert.equal(init.body, '{"course":"b2"}');
    assert.equal(init.headers, headers);
    assert.equal(init.cache, 'no-store');
    assert.equal(init.signal.aborted, false);
    return Response.json({ title: 'Available course' });
  } });
  const response = await request('https://example.test/catalog', { method: 'POST', headers, body: '{"course":"b2"}', cache: 'no-store' });
  assert.deepEqual(await response.json(), { title: 'Available course' });
});

test('the deadline also cancels a response whose body stalls after its headers arrive', async () => {
  const request = createPublicDataFetch({ timeoutMs: 10, fetcher: async (_input, init) => {
    return new Response(new ReadableStream({ start(stream) {
      const timer = setTimeout(() => stream.close(), 1_000);
      init.signal.addEventListener('abort', () => { clearTimeout(timer); stream.error(init.signal.reason); }, { once: true });
    } }));
  } });
  const response = await request('https://example.test/stalled-body');
  await assert.rejects(response.text(), error => error.name === 'TimeoutError');
});

test('Supabase returns a timed-out public read as an error for the existing fallback to handle', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient('https://example.test', 'public-test-key', {
    global: { fetch: createPublicDataFetch({ timeoutMs: 10, fetcher: slowResponse }) },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const result = await client.from('feature_flags').select('key,enabled');
  assert.equal(result.data, null);
  assert.ok(result.error);
  assert.match(result.error.message, /timeout|timed out/i);
});
