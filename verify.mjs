import assert from 'node:assert/strict';
import { readFile, access, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initObservatory, stepPointerSpring } from './dist/observatory.js';
import { THEME_COLORS, themeCSS } from './theme.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
const css = await readFile(path.join(root, 'dist/styles.css'), 'utf8');
const data = JSON.parse(await readFile(path.join(root, 'content.json'), 'utf8'));
const app = await readFile(path.join(root, 'dist/app.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Every HTML ID must be unique');
for (const match of html.matchAll(/\b(?:href="#|aria-labelledby="|data-case=")([^"]+)"/g)) {
  assert(ids.includes(match[1]), `Missing link or dialog target: ${match[1]}`);
}
for (const match of html.matchAll(/\b(?:href|src)="\.\/([^"]+)"/g)) {
  await access(path.join(root, 'dist', match[1].split(/[?#]/)[0]));
}
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One page heading');
assert.equal((html.match(/<dialog\b/g) || []).length, data.projects.length, 'Each project has a case study');
assert(!/INSERT MY|placeholder|lorem ipsum|<!-- PROJECTS -->|<!-- DIALOGS -->/i.test(html), 'No unfinished content');
assert(css.includes('prefers-reduced-motion:reduce'), 'Reduced-motion styles are required');
assert(html.includes(`<style>${themeCSS}</style>`), 'Electropop colours are rendered before the page loads');
assert(!/palette|localStorage|URLSearchParams/.test(app), 'The site has no runtime colour options');
assert(!/data-palette|palette-toolbar|palettes\.html/.test(html + css), 'The site has no colour picker or comparison links');
assert.equal(THEME_COLORS['electric-lime'], '#CCFF00');
assert.equal(THEME_COLORS['electric-orange'], '#FF6B00');
assert.equal(THEME_COLORS['electric-magenta'], '#F900FF');
assert.equal(THEME_COLORS['electric-violet'], '#5200FF');
function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
// Check the foreground/background roles used by the actual page sections,
// project illustrations, hover controls, and project dialogs.
for (const [foreground, background] of [
  ['ink', 'paper'], ['muted', 'paper'], ['accent-ink', 'accent'],
  ['panel-text', 'panel-bg'], ['panel-muted', 'panel-bg'],
  ['art-text', 'art-surface'], ['art-muted', 'art-surface'],
  ['art-dark', 'art-soft'], ['impact-ink', 'work-paper'], ['work-muted', 'work-paper'],
  ['impact-ink', 'impact'], ['art-text', 'electric-violet'],
]) {
  assert(contrast(THEME_COLORS[foreground], THEME_COLORS[background]) >= 4.5, `${foreground} on ${background} must meet AA text contrast`);
}
for (const file of ['palettes.js', 'palettes.html', 'assets/palette-previews.svg']) {
  await assert.rejects(access(path.join(root, 'dist', file)), { code: 'ENOENT' }, 'Unused colour comparison assets are removed');
}
let springReference;
for (const rate of [30, 60, 120, 144]) {
  let state = { position: 0, velocity: 0 };
  for (let i = 0; i < rate; i++) state = stepPointerSpring(state.position, state.velocity, 1, 1 / rate);
  if (springReference) assert(Math.abs(state.position - springReference.position) < 1e-12, 'Cursor settling must be frame-rate independent');
  springReference = state;
  for (let i = 0; i < rate; i++) state = stepPointerSpring(state.position, state.velocity, 0, 1 / rate);
  assert(Math.abs(state.position) < .0001, 'Pointer returns gently to neutral');
}
let bounded = { position: 0, velocity: 0 };
for (let i = 0; i < 2000; i++) {
  bounded = stepPointerSpring(bounded.position, bounded.velocity, i % 2 ? 10 : -10, 1 / 144);
  assert(Number.isFinite(bounded.velocity) && Math.abs(bounded.position) <= 1, 'Rapid input remains finite and bounded');
}
for (const project of data.projects) {
  for (const field of ['title', 'problem', 'approach', 'results', 'summary']) assert(project[field]?.length > 12, `${project.id}: ${field} required`);
  assert(new URL(project.repository).hostname === 'github.com');
  assert(new URL(project.readme).protocol === 'https:');
  if (project.demo) assert(new URL(project.demo).protocol === 'https:');
}

// Exercise the actual sculpture module with both motion preferences. No
// browser screenshot is implied by this functional canvas smoke check.
function eventTarget() {
  const listeners = new Map();
  return {
    textContent: '', attributes: {},
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    setAttribute(key, value) { this.attributes[key] = value; },
    dispatch(type, event = {}) { for (const fn of listeners.get(type) ?? []) fn(event); },
  };
}
let checkedCoordinates = 0;
const context = new Proxy({}, { get(_, key) {
  if (['setTransform', 'clearRect', 'moveTo', 'lineTo', 'arc'].includes(key)) return (...values) => { assert(values.every(Number.isFinite), `Non-finite ${String(key)} coordinate`); checkedCoordinates += 1; };
  return () => {};
}, set() { return true; } });
for (const reduced of [false, true]) {
  const preference = { ...eventTarget(), matches: reduced };
  let animation;
  globalThis.window = { ...eventTarget(), devicePixelRatio: 3, matchMedia: () => preference, requestAnimationFrame: fn => { animation = fn; return 1; }, cancelAnimationFrame: () => { animation = null; } };
  globalThis.document = { ...eventTarget(), hidden: false };
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
  const canvas = { ...eventTarget(), dataset: {}, parentElement: eventTarget(), getContext: () => context, getBoundingClientRect: () => ({ width: 540, height: 460, left: 0, top: 0 }) };
  const button = eventTarget(), label = eventTarget(), pauseButton = eventTarget();
  const cleanup = initObservatory({ canvas, button, label, pauseButton });
  assert.equal(canvas.width, 1080, 'Device pixel ratio is capped at 2');
  assert.equal(label.textContent, '01 / SIGNAL');
  assert.equal(pauseButton.attributes['aria-pressed'], String(reduced));
  if (animation) animation(100);
  button.dispatch('click');
  if (animation) animation(150);
  assert.equal(label.textContent, '02 / STRUCTURE');
  button.dispatch('click');
  if (animation) animation(200);
  assert.equal(label.textContent, '03 / EMERGENCE');
  button.dispatch('click');
  assert.equal(label.textContent, '01 / SIGNAL');
  pauseButton.dispatch('click');
  assert.equal(pauseButton.attributes['aria-pressed'], String(!reduced));
  cleanup();
}
assert(checkedCoordinates > 1000, 'The sculpture renders actual geometry');
const files = ['index.html', 'styles.css', 'app.js', 'observatory.js', 'assets/manrope-regular.ttf', 'assets/manrope-bold.ttf'];
const totalBytes = (await Promise.all(files.map(file => stat(path.join(root, 'dist', file))))).reduce((total, file) => total + file.size, 0);
console.log(`Passed: content, local assets, anchor links, dialog targets, Electropop theme, AA text contrast, spring response at 30–144 Hz, bounded rapid input, reduced motion, 3 sculpture modes, pause controls, finite geometry. Initial assets: ${(totalBytes / 1024).toFixed(1)} KB uncompressed.`);
