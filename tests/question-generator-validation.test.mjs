import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { compileFunction } from 'node:vm';
import { generateValidatedQuestionSet, validateGeneratedQuestionSet } from '../lib/question-generator-validation.ts';

const table = '| Day | Temperature (°C) |\n|---|---:|\n| Monday | 19 |\n| Tuesday | 15 |';
const question = (text = `The table shows temperatures.\n\n${table}\n\nFind the difference.`) => ({
  question: text, answer: '4°C', working: '19°C − 15°C = 4°C', skill: 'Temperature', difficulty: 'GCSE',
});
const validate = (item) => validateGeneratedQuestionSet({ questions: [item] }, 1);

test('rejects the missing-temperature regression', () => {
  const result = validate(question(`The table shows temperatures.\n${table.replace('19', '').replace('15', '')}`));
  assert.equal(result.valid, false);
  assert.match(result.issues.join(' '), /missing or placeholder/);
});

test('accepts full temperatures and a derived result absent from source data', () => {
  assert.equal(validate(question()).valid, true);
});

test('rejects malformed table structure and missing data', () => {
  for (const text of [
    '| Day | Temperature |\n|---|\n| Monday | 19 |',
    '| Day | Temperature |\n|---|---|---|\n| Monday | 19 |',
    '| Day | Temperature |\n|---|---|\n| Monday |',
    '| Day | Temperature |\n|---|---|\n| Monday | 19 | extra |',
    '| Day | Temperature |\n|---|---|',
    '| | Temperature |\n|---|---|\n| Monday | 19 |',
    '| Day | Temperature |\n|--|--|\n| Monday | 19 |',
    'Day | Temperature\n-- | --\nMonday | 19',
    '<table><tr><td>19</td></tr></table>',
  ]) assert.equal(validate(question(text)).valid, false, text);
});

test('rejects placeholders including intentionally incomplete tables', () => {
  for (const placeholder of ['', ' ', '?', '—', '...', 'TBD', 'N/A', '[value]', '\\(\\text{missing}\\)', '___']) {
    assert.equal(validate(question(table.replace('19', placeholder))).valid, false, placeholder);
  }
});

test('requires a referenced table in the question, even when it is in working', () => {
  assert.equal(validate({ ...question('Use the table below to find the difference.'), working: table }).valid, false);
  assert.equal(validate(question('The table shows the temperatures. Find the range.')).valid, false);
  assert.equal(validate(question('Calculate 6 times 7 using your multiplication tables.')).valid, true);
});

test('validates tables in answer and working too', () => {
  for (const field of ['answer', 'working']) {
    assert.equal(validate({ ...question(), [field]: table.replace('19', '') }).valid, false);
  }
});

test('accepts grouped-frequency, physics, alignment, CRLF, and optional outer pipes', () => {
  for (const text of [
    '| Height | Frequency |\n|---|---:|\n| \\(140 < h \\le 150\\) | 15 |\n| \\(150 < h \\le 160\\) | 30 |',
    'Force (N) | Acceleration (m/s²)\n:--- | :---:\n2 | 0.5\n4 | 1.0',
    table.replaceAll('\n', '\r\n'),
    table.replace('Temperature (°C)', 'Temperature'),
  ]) assert.equal(validate(question(text)).valid, true, text);
});

test('rejects malformed JSON shapes, empty fields, wrong counts, and any invalid item', () => {
  for (const value of [null, [], {}, { questions: null }, { questions: [] }, { questions: [null] },
    { questions: [{ ...question(), working: 19 }] }, { questions: [{ ...question(), answer: ' ' }] }]) {
    assert.equal(validateGeneratedQuestionSet(value, 1).valid, false);
  }
  assert.equal(validateGeneratedQuestionSet({ questions: [question(), question(table.replace('19', ''))] }, 2).valid, false);
});

function runner(responses, format = (q) => q) {
  const calls = [];
  const failures = [];
  return {
    calls, failures,
    run: () => generateValidatedQuestionSet({ count: 1, prompt: 'Generate a set.', format,
      generate: async (prompt) => { calls.push(prompt); const response = responses[calls.length - 1]; if (response instanceof Error) throw response; return response; },
      onFailure: (attempt, issues) => failures.push({ attempt, issues }),
    }),
  };
}
const validResponse = JSON.stringify({ questions: [question()] });
const invalidResponse = JSON.stringify({ questions: [question(table.replace('19', ''))] });

test('returns a valid first attempt without retry', async () => {
  const job = runner([validResponse]);
  assert.equal((await job.run()).length, 1);
  assert.equal(job.calls.length, 1);
});

test('retries a whole rejected set with concise validation feedback', async () => {
  const job = runner([invalidResponse, validResponse]);
  assert.equal((await job.run()).length, 1);
  assert.equal(job.calls.length, 2);
  assert.match(job.calls[1], /previous set failed validation.*missing or placeholder/);
});

test('two invalid attempts return null for fallback', async () => {
  const job = runner([invalidResponse, invalidResponse, validResponse]);
  assert.equal(await job.run(), null);
  assert.equal(job.calls.length, 2);
  assert.deepEqual(job.failures.map((f) => f.attempt), [1, 2]);
});

test('JSON and generation failures obey the same retry limit without leaking errors', async () => {
  for (const responses of [['not JSON', validResponse], [new Error('sensitive provider error'), validResponse]]) {
    const job = runner(responses);
    assert.equal((await job.run()).length, 1);
    assert.equal(job.calls.length, 2);
    assert.doesNotMatch(JSON.stringify(job.failures), /sensitive/);
  }
  const job = runner([new Error('failure'), 'not JSON', validResponse]);
  assert.equal(await job.run(), null);
  assert.equal(job.calls.length, 2);
});

test('validates formatted output before returning it', async () => {
  const job = runner([validResponse, validResponse], (q) => ({ ...q, question: table.replace('19', '') }));
  assert.equal(await job.run(), null);
  assert.equal(job.calls.length, 2);
});

// Exercise the real action with SDK/environment dependencies injected, without network calls.
function actionHarness(responses, apiKey = 'test-key') {
  const source = readFileSync(new URL('../app/ai-question-generator/actions.ts', import.meta.url), 'utf8');
  const body = stripTypeScriptTypes(source).replace(/import\s+[\s\S]*?\s+from\s+["'][^"']+["'];/g, '').replace('export async function', 'async function');
  let calls = 0;
  const GoogleGenerativeAI = class {
    getGenerativeModel() { return { generateContent: async () => {
      const response = responses[calls++];
      if (response instanceof Error) throw response;
      return { response: { text: () => response } };
    } }; }
  };
  const action = compileFunction(`${body}\nreturn generatePracticeQuestions;`, ['GoogleGenerativeAI', 'SchemaType', 'validateQuizSelection', 'normalizeMalformedLatexCommands', 'generateValidatedQuestionSet', 'process', 'console'])(
    GoogleGenerativeAI, { OBJECT: 'object', ARRAY: 'array', STRING: 'string' }, () => ({ valid: true }), (s) => s,
    generateValidatedQuestionSet, { env: { GEMINI_API_KEY: apiKey } }, { warn() {}, error() {} },
  );
  const form = new FormData();
  form.set('subject', 'Mathematics'); form.set('level', 'GCSE'); form.set('topic', 'Mixed Topics'); form.set('count', '4');
  return { run: () => action({ status: 'idle', questions: [] }, form), calls: () => calls };
}
const fullResponse = JSON.stringify({ questions: Array.from({ length: 4 }, () => question()) });

test('action returns llm success after valid retry and fallback after two failures', async () => {
  const retry = actionHarness([invalidResponse, fullResponse]);
  assert.equal((await retry.run()).source, 'llm');
  assert.equal(retry.calls(), 2);
  const fallback = actionHarness([invalidResponse, new Error('provider unavailable')]);
  const result = await fallback.run();
  assert.equal(result.source, 'fallback');
  assert.match(result.message, /built-in/);
  assert.equal(fallback.calls(), 2);
  assert.equal(result.questions.length, 4);
  assert.equal(validateGeneratedQuestionSet({ questions: result.questions }, 4).valid, true);
});

test('missing API key uses fallback without generation', async () => {
  const job = actionHarness([], '');
  assert.equal((await job.run()).source, 'fallback');
  assert.equal(job.calls(), 0);
});
