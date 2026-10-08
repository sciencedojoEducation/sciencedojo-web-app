import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function playerHarness() {
  const source = readFileSync(new URL('../components/tutor-academy/AcademyVideoPlayer.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const hooks = [];
  let cursor = 0;
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  runInNewContext(compiled, { exports, require: name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useEffect: () => {}, useRef: () => ({ current: null }), useState: initial => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value; }];
    } };
    if (name === 'next/dynamic') return { default: () => 'stream-player' };
    if (name === 'lucide-react') return {};
    throw new Error(`Unexpected import ${name}`);
  } });
  return props => { cursor = 0; return exports.default(props); };
}
function elements(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(node => elements(node, predicate));
  return [...(predicate(tree) ? [tree] : []), ...elements(tree.props?.children, predicate)];
}
const props = { embedUrl: 'https://www.youtube.com/embed/23VZ4EpyENo?start=55&end=88', sourceUrl: 'https://www.youtube.com/watch?v=23VZ4EpyENo', title: 'Memory song', german: true };

test('click-to-load creates no iframe before Play; playback retains boundaries and has a permanent fallback', () => {
  const render = playerHarness();
  let tree = render({ ...props, clickToLoad: true });
  assert.equal(elements(tree, node => node.type === 'iframe').length, 0);
  assert.equal(elements(tree, node => node.type === 'a' && node.props.href === props.sourceUrl).length, 1);
  const [play] = elements(tree, node => node.type === 'button' && node.props['data-academy-action'] === 'primary');
  play.props.onClick();
  tree = render({ ...props, clickToLoad: true });
  const [iframe] = elements(tree, node => node.type === 'iframe');
  assert.equal(iframe.props.src, props.embedUrl);
  assert.equal(new URL(iframe.props.src).searchParams.get('autoplay'), null);
  iframe.props.onError();
  tree = render({ ...props, clickToLoad: true });
  assert.equal(elements(tree, node => node.props?.role === 'alert').length, 1);
  assert.equal(elements(tree, node => node.type === 'a' && node.props.href === props.sourceUrl).length, 1);
  const [hide] = elements(tree, node => node.type === 'button' && node.props.children === 'Hide video · Video schließen');
  hide.props.onClick();
  tree = render({ ...props, clickToLoad: true });
  assert.equal(elements(tree, node => node.type === 'iframe').length, 0);
});

test('existing video blocks mount the player as before when click-to-load is omitted', () => {
  const tree = playerHarness()(props);
  assert.equal(elements(tree, node => node.type === 'iframe').length, 1);
  assert.equal(elements(tree, node => node.type === 'button' && node.props['data-academy-action'] === 'primary').length, 0);
});
