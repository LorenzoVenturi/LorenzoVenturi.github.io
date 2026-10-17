import assert from 'node:assert/strict';
import test from 'node:test';
import { isDeepStrictEqual } from 'node:util';
import { initObservatory } from '../dist/observatory.js';

function eventTarget() {
  const listeners = new Map();
  return {
    textContent: '', attributes: {},
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    setAttribute(name, value) { this.attributes[name] = value; },
    dispatch(type, event = {}) { for (const callback of listeners.get(type) ?? []) callback(event); },
    listenerCount() { return [...listeners.values()].reduce((total, set) => total + set.size, 0); },
  };
}

// The fake canvas records rendered geometry, not a replacement projection.
// These checks exercise the production module without implying browser QA.
function harness({ width = 540, height = 460, reduced = false } = {}) {
  const saved = new Map(['window', 'document', 'ResizeObserver', 'IntersectionObserver']
    .map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const targets = [];
  const target = () => { const value = eventTarget(); targets.push(value); return value; };
  const preference = { ...target(), matches: reduced };
  const raf = new Map();
  let nextFrame = 0;
  let stamp = 100;
  let boundsReads = 0;
  let draws = 0;
  let points = [];
  let strokes = [];
  let resizeObserver;
  let intersectionObserver;
  const record = (method, values) => {
    assert(values.every(Number.isFinite), `${method} receives only finite coordinates`);
    points.push({ method, values });
  };
  const context = new Proxy({}, {
    get(object, method) {
      if (method in object) return object[method];
      if (method === 'clearRect') return () => { points = []; strokes = []; draws += 1; };
      if (method === 'stroke') return () => strokes.push({ alpha: object.globalAlpha, width: object.lineWidth });
      if (['moveTo', 'lineTo', 'arc'].includes(method)) return (...values) => record(method, values);
      if (method === 'createLinearGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
    set(object, property, value) { object[property] = value; return true; },
  });
  const window = {
    ...target(), devicePixelRatio: 2, matchMedia: () => preference,
    requestAnimationFrame(callback) { const id = ++nextFrame; raf.set(id, callback); return id; },
    cancelAnimationFrame(id) { raf.delete(id); },
    getComputedStyle: () => ({ getPropertyValue: name => name === '--ink' ? '#17121B' : '#5200FF' }),
  };
  const document = { ...target(), hidden: false };
  globalThis.window = window;
  globalThis.document = document;
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; resizeObserver = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; intersectionObserver = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  const rect = { width, height, left: 24, top: 180 };
  const surface = target();
  const canvas = {
    ...target(), dataset: {}, parentElement: surface,
    getContext: () => context,
    getBoundingClientRect() { boundsReads += 1; return rect; },
  };
  const button = target(), label = target(), pauseButton = target();
  const destroy = initObservatory({ canvas, button, label, pauseButton });
  let cleaned = false;
  const result = {
    window, document, canvas, surface, button, label, pauseButton, preference,
    get draws() { return draws; },
    get boundsReads() { return boundsReads; },
    get pendingFrames() { return raf.size; },
    snapshot() { return points.map(point => ({ method: point.method, values: [...point.values] })); },
    shading() { return strokes.map(stroke => ({ ...stroke })); },
    pointer(x, y, extras = {}) {
      return { pointerType: 'mouse', clientX: rect.left + (x + 1) * width / 2, clientY: rect.top + (y + 1) * height / 2, ...extras };
    },
    move(x, y, extras) { surface.dispatch('pointermove', this.pointer(x, y, extras)); },
    tick(delta = 1000 / 60) {
      stamp += delta;
      const next = raf.entries().next().value;
      if (!next) return false;
      raf.delete(next[0]);
      next[1](stamp);
      assert(raf.size <= 1, 'At most one animation frame may be queued');
      return true;
    },
    advance(milliseconds = 1500) {
      for (let elapsed = 0; elapsed < milliseconds; elapsed += 50) this.tick(50);
    },
    intersect(isIntersecting) { intersectionObserver.callback([{ isIntersecting }]); },
    listenerCount() { return targets.reduce((sum, value) => sum + value.listenerCount(), 0); },
    cleanup() {
      if (cleaned) return;
      destroy();
      cleaned = true;
    },
    restore() {
      this.cleanup();
      for (const [name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
    observersDisconnected() { return resizeObserver.disconnected && intersectionObserver.disconnected; },
  };
  return result;
}

function largestDisplacement(a, b) {
  assert.equal(a.length, b.length, 'A pointer tilt preserves the geometry topology');
  let largest = 0;
  for (let index = 0; index < a.length; index += 1) {
    assert.equal(a[index].method, b[index].method);
    largest = Math.max(largest, Math.hypot(a[index].values[0] - b[index].values[0], a[index].values[1] - b[index].values[1]));
  }
  return largest;
}

function sameGeometry(actual, expected, message) {
  assert(isDeepStrictEqual(actual, expected), message);
}

test('pointer samples wait for RAF, and the last coalesced sample controls the view', () => {
  let coalescedView;
  const coalesced = harness();
  try {
    coalesced.advance();
    const neutral = coalesced.snapshot();
    const reads = coalesced.boundsReads;
    coalesced.move(-1, -1, { getCoalescedEvents: () => [coalesced.pointer(-1, -1), coalesced.pointer(1, 0.5)] });
    assert.equal(coalesced.boundsReads, reads, 'Pointer events do not trigger synchronous layout reads');
    sameGeometry(coalesced.snapshot(), neutral, 'Pointer events do not redraw synchronously');
    coalesced.advance();
    assert(coalesced.boundsReads > reads, 'The queued sample is measured during rendering');
    coalescedView = coalesced.snapshot();
    assert(largestDisplacement(neutral, coalescedView) > 2, 'Mouse movement visibly changes the projected form');
  } finally { coalesced.restore(); }
  const direct = harness();
  try {
    direct.advance();
    direct.move(1, 0.5);
    direct.advance();
    sameGeometry(direct.snapshot(), coalescedView, 'Older coalesced samples cannot pull the form away from the final sample');
  } finally { direct.restore(); }
});

test('a settled view remains still and pointer exit returns smoothly to neutral', () => {
  const h = harness();
  try {
    h.advance();
    const neutral = h.snapshot();
    h.advance(1000);
    sameGeometry(h.snapshot(), neutral, 'Idle time does not deform or rotate the wireframe');
    for (const [target, event] of [[h.surface, 'pointerleave'], [h.surface, 'pointercancel'], [h.window, 'blur']]) {
      h.move(1, -1);
      h.advance();
      const tilted = h.snapshot();
      assert(largestDisplacement(neutral, tilted) > 2);
      target.dispatch(event);
      sameGeometry(h.snapshot(), tilted, `${event} does not snap to neutral`);
      let previous = tilted;
      for (let frame = 0; frame < 120; frame += 1) {
        h.tick();
        const current = h.snapshot();
        assert(largestDisplacement(previous, current) < 8, `${event} keeps frame-to-frame movement controlled`);
        previous = current;
      }
      assert(largestDisplacement(neutral, h.snapshot()) < 0.05, `${event} returns to the composed neutral view`);
      const settled = h.snapshot();
      h.advance(1000);
      sameGeometry(h.snapshot(), settled, 'Settled geometry stays exactly still');
    }
  } finally { h.restore(); }
});

test('touch, paused motion, and reduced motion do not track the cursor', () => {
  for (const reduced of [false, true]) {
    const h = harness({ reduced });
    try {
      h.advance();
      const neutral = h.snapshot();
      h.move(1, -1, { pointerType: 'touch' });
      h.advance();
      sameGeometry(h.snapshot(), neutral, 'Touch gestures leave the view stable');
      if (!reduced) h.pauseButton.dispatch('click');
      assert.equal(h.pauseButton.attributes['aria-pressed'], 'true');
      const reads = h.boundsReads, draws = h.draws;
      h.move(-1, 1);
      h.advance();
      assert.equal(h.boundsReads, reads, 'Disabled motion ignores pointer samples');
      assert.equal(h.draws, draws, 'Disabled motion does not render animation frames');
      sameGeometry(h.snapshot(), neutral, 'Disabled motion preserves the static view');
      if (reduced) {
        h.button.dispatch('click');
        assert.equal(h.label.textContent, '02 / STRUCTURE', 'Reduced-motion visitors can still choose a form');
        assert(!isDeepStrictEqual(h.snapshot(), neutral), 'Changing form produces a static alternative');
        assert.equal(h.pendingFrames, 0);
      }
    } finally { h.restore(); }
  }
});

test('small cursor sweeps keep lines in order with continuous shading and constant widths', () => {
  const h = harness();
  try {
    for (let mode = 0; mode < 3; mode++) {
      let previous, shading;
      for (const x of [-0.1, -0.05, 0, 0.05, 0.1]) {
        h.move(x, 0.3);
        h.advance(1800);
        const current = h.snapshot(), currentShading = h.shading();
        if (previous) {
          assert(largestDisplacement(previous, current) < 3, 'Small rotations cannot reorder or jump between mesh vertices');
          assert.equal(currentShading.length, shading.length, 'Depth changes retain a stable set of visible wires');
          for (let i = 0; i < shading.length; i++) {
            assert.equal(currentShading[i].width, shading[i].width, 'Rotation keeps each wire at its original width');
            assert(Math.abs(currentShading[i].alpha - shading[i].alpha) < 0.02, 'Wire opacity varies smoothly with depth');
          }
        }
        previous = current; shading = currentShading;
      }
      h.button.dispatch('click');
      h.advance(2200);
    }
  } finally { h.restore(); }
});

test('hidden and offscreen canvases stop work, then recover on pointer input', () => {
  const h = harness();
  try {
    h.advance();
    h.move(1, -1);
    h.tick();
    h.document.hidden = true;
    h.document.dispatch('visibilitychange');
    assert.equal(h.pendingFrames, 0, 'Hidden documents cancel their animation');
    let draws = h.draws;
    h.advance();
    assert.equal(h.draws, draws);
    h.document.hidden = false;
    h.document.dispatch('visibilitychange');
    h.advance();
    h.move(-1, 1);
    h.tick();
    h.intersect(false);
    assert.equal(h.pendingFrames, 0, 'Offscreen canvases cancel their animation');
    draws = h.draws;
    h.advance();
    assert.equal(h.draws, draws);
    h.intersect(true);
    h.advance();
    const before = h.snapshot();
    h.move(1, -1);
    h.advance();
    assert(largestDisplacement(before, h.snapshot()) > 2, 'The visible canvas accepts new pointer input');
  } finally { h.restore(); }
});

test('cleanup disconnects observers, listeners, and scheduled animation', () => {
  const h = harness();
  try {
    h.move(1, 1);
    assert(h.listenerCount() > 0);
    h.cleanup();
    assert.equal(h.pendingFrames, 0);
    assert.equal(h.listenerCount(), 0);
    assert(h.observersDisconnected());
    const draws = h.draws;
    h.move(-1, -1);
    h.window.dispatch('scroll');
    h.button.dispatch('click');
    h.advance();
    assert.equal(h.draws, draws, 'Detached controls and pointer events cannot restart rendering');
  } finally { h.restore(); }
});

test('all three forms keep finite, unclipped geometry at mobile and desktop pointer extremes', () => {
  for (const size of [{ width: 360, height: 288 }, { width: 540, height: 460 }]) {
    const h = harness(size);
    try {
      h.advance();
      for (let mode = 0; mode < 3; mode += 1) {
        for (const [x, y] of [[0, 0], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
          h.move(x, y);
          h.advance(1000);
          const geometry = h.snapshot();
          assert(geometry.length > 100, 'Each view contains a rendered wireframe');
          for (const point of geometry) {
            const [px, py, radius = 0] = point.values;
            const padding = point.method === 'arc' ? radius : 0;
            assert(px - padding >= -1 && px + padding <= size.width + 1, `Mode ${mode + 1}, pointer (${x}, ${y}): x=${px} stays within ${size.width}px`);
            assert(py - padding >= -1 && py + padding <= size.height + 1, `Mode ${mode + 1}, pointer (${x}, ${y}): y=${py} stays within ${size.height}px`);
          }
        }
        h.button.dispatch('click');
        h.advance(2000);
      }
    } finally { h.restore(); }
  }
});
