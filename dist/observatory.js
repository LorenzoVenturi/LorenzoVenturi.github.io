/** A procedural wireframe with rigid, cursor-controlled rotation. */

// Exact critical damping gives the same response at different frame rates.
export function stepPointerSpring(position, velocity, target, delta, angularFrequency = 18) {
  const elapsed = Number.isFinite(delta) ? Math.max(0, delta) : 0;
  const destination = Math.max(-1, Math.min(1, target));
  const displacement = position - destination;
  const impulse = velocity + angularFrequency * displacement;
  const decay = Math.exp(-angularFrequency * elapsed);
  const nextPosition = destination + (displacement + impulse * elapsed) * decay;
  const boundedPosition = Math.max(-1, Math.min(1, nextPosition));
  return {
    position: boundedPosition,
    velocity: boundedPosition === nextPosition ? (velocity - angularFrequency * impulse * elapsed) * decay : 0,
  };
}

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smoothstep = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function initObservatory({ canvas, button, label, pauseButton } = {}) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Canvas rendering is unavailable');

  const TAU = Math.PI * 2;
  const COLUMNS = 72;
  const ROWS = 32;
  const COUNT = COLUMNS * ROWS;
  const modes = ['SIGNAL', 'STRUCTURE', 'EMERGENCE'];
  const shapes = Array.from({ length: 3 }, () => new Float64Array(COUNT * 3));
  const projected = new Float64Array(COUNT * 3);
  const vertices = [];
  const edges = [];
  const weights = [1, 0, 0];
  const listeners = [];
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const styles = window.getComputedStyle?.(canvas);
  const ink = styles?.getPropertyValue('--ink').trim() || '#17121B';
  const accent = styles?.getPropertyValue('--canvas-accent').trim() || '#5200FF';
  let activeMode = 0;
  let motionEnabled = !preference.matches;
  let width = 1, height = 1, scale = 1;
  let pointerX = 0, pointerY = 0, velocityX = 0, velocityY = 0;
  let desiredX = 0, desiredY = 0;
  let pointerSample = null, pointerDirty = false;
  let frame = 0, previousTime = null;
  let intersecting = true, destroyed = false;

  const index = (u, v) => (u * ROWS + v) * 3;
  for (let uIndex = 0; uIndex < COLUMNS; uIndex++) {
    const u = uIndex / COLUMNS * TAU;
    for (let vIndex = 0; vIndex < ROWS; vIndex++) {
      const v = vIndex / ROWS * TAU;
      const n = index(uIndex, vIndex);
      const tube = 0.47 + 0.035 * Math.cos(u * 3);
      const radius = 1.02 + tube * Math.cos(v);
      shapes[0][n] = radius * Math.cos(u);
      shapes[0][n + 1] = radius * Math.sin(u);
      shapes[0][n + 2] = tube * Math.sin(v) + 0.08 * Math.sin(u * 3);
      const latitude = vIndex / (ROWS - 1) * Math.PI;
      shapes[1][n] = 1.2 * Math.sin(latitude) * Math.cos(u);
      shapes[1][n + 1] = 1.2 * Math.sin(latitude) * Math.sin(u);
      shapes[1][n + 2] = 1.2 * Math.cos(latitude);
      const twist = v + u * 2;
      const opening = 0.93 + 0.46 * Math.cos(twist);
      shapes[2][n] = opening * Math.cos(u) * 1.08;
      shapes[2][n + 1] = opening * Math.sin(u) * 1.08;
      shapes[2][n + 2] = 0.62 * Math.sin(twist) + 0.25 * Math.sin(u * 3);
      if (uIndex % 6 === 0 || vIndex % 4 === 0) vertices.push(n);
    }
  }

  // Curve resolution is independent of wire spacing. Project only vertices
  // used by the visible curves, rather than drawing a dense dotted mesh.
  for (let v = 0; v < ROWS; v += 4) {
    for (let u = 0; u < COLUMNS; u++) edges.push({ a: index(u, v), b: index((u + 1) % COLUMNS, v), seam: false });
  }
  for (let u = 0; u < COLUMNS; u += 6) {
    for (let v = 0; v < ROWS; v++) edges.push({ a: index(u, v), b: index(u, (v + 1) % ROWS), seam: v === ROWS - 1 });
  }

  function listen(target, event, handler, options) {
    if (!target) return;
    target.addEventListener(event, handler, options);
    listeners.push(() => target.removeEventListener(event, handler, options));
  }
  function canAnimate() { return motionEnabled && intersecting && !document.hidden && !destroyed; }
  function needsMotion() {
    return pointerDirty || Math.abs(pointerX - desiredX) > 0.00001 || Math.abs(pointerY - desiredY) > 0.00001
      || Math.abs(velocityX) > 0.0001 || Math.abs(velocityY) > 0.0001
      || weights.some((weight, mode) => Math.abs(weight - Number(mode === activeMode)) > 0.00001);
  }
  function queueFrame() { if (canAnimate() && !frame) frame = window.requestAnimationFrame(animate); }
  function releasePointer() {
    pointerSample = null; pointerDirty = false;
    desiredX = desiredY = 0;
    if (needsMotion()) queueFrame();
  }
  function samplePointer() {
    if (!pointerDirty || !pointerSample) return;
    pointerDirty = false;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) { releasePointer(); return; }
    desiredX = clamp(((pointerSample.x - rect.left) / rect.width - 0.5) * 2, -1, 1);
    desiredY = clamp(((pointerSample.y - rect.top) / rect.height - 0.5) * 2, -1, 1);
  }
  function syncControls() {
    if (label) label.textContent = `0${activeMode + 1} / ${modes[activeMode]}`;
    button?.setAttribute('aria-label', `Shift perspective. Current mode: ${modes[activeMode].toLowerCase()}`);
    if (pauseButton) {
      pauseButton.textContent = motionEnabled ? 'Pause motion' : 'Resume motion';
      pauseButton.setAttribute('aria-pressed', String(!motionEnabled));
    }
    canvas.dataset.mode = modes[activeMode].toLowerCase();
  }

  function draw() {
    if (destroyed || width < 2 || height < 2) return;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // A fixed centre, rigid form, and one controlled rotation follow the mouse.
    const angleX = 0.68 + pointerY * 0.18, angleY = -0.23 + pointerX * 0.24, angleZ = -0.43;
    const sx = Math.sin(angleX), cx = Math.cos(angleX);
    const sy = Math.sin(angleY), cy = Math.cos(angleY);
    const sz = Math.sin(angleZ), cz = Math.cos(angleZ);
    const centerX = width * 0.505, centerY = height * 0.485;
    for (const n of vertices) {
      let x = 0, y = 0, z = 0;
      for (let mode = 0; mode < 3; mode++) {
        x += shapes[mode][n] * weights[mode];
        y += shapes[mode][n + 1] * weights[mode];
        z += shapes[mode][n + 2] * weights[mode];
      }
      const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
      const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
      const perspective = 8 / (8 - z2);
      projected[n] = centerX + (x2 * cz - y1 * sz) * scale * perspective;
      projected[n + 1] = centerY + (x2 * sz + y1 * cz) * scale * perspective;
      projected[n + 2] = clamp((z2 + 1.75) / 3.5);
    }
    ctx.strokeStyle = ink; ctx.globalAlpha = 0.17; ctx.lineWidth = 0.65;
    const markX = width * 0.095, markY = height * 0.51;
    ctx.beginPath();
    for (const x of [markX, width - markX]) {
      ctx.moveTo(x - 4, markY); ctx.lineTo(x + 4, markY);
      ctx.moveTo(x, markY - 4); ctx.lineTo(x, markY + 4);
    }
    ctx.stroke();

    // Continuous depth fading and constant width prevent brightness popping.
    ctx.lineWidth = 0.75;
    const seamOpacity = (1 - weights[1]) ** 3;
    for (const edge of edges) {
      const depth = (projected[edge.a + 2] + projected[edge.b + 2]) / 2;
      ctx.globalAlpha = (0.10 + smoothstep(depth) * 0.47) * (edge.seam ? seamOpacity : 1);
      ctx.beginPath();
      ctx.moveTo(projected[edge.a], projected[edge.a + 1]);
      ctx.lineTo(projected[edge.b], projected[edge.b + 1]);
      ctx.stroke();
    }
    // The accent stays attached to the form, fading gently with depth.
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
    for (let u = 10; u < 36; u++) {
      const a = index(u, 8), b = index(u + 1, 8);
      const depth = (projected[a + 2] + projected[b + 2]) / 2;
      ctx.globalAlpha = 0.14 + 0.86 * smoothstep((depth - 0.1) / 0.8);
      ctx.beginPath();
      ctx.moveTo(projected[a], projected[a + 1]); ctx.lineTo(projected[b], projected[b + 1]);
      ctx.stroke();
    }
    ctx.fillStyle = accent;
    for (const u of [10, 23, 36]) {
      const n = index(u, 8);
      ctx.globalAlpha = 0.14 + 0.86 * smoothstep((projected[n + 2] - 0.1) / 0.8);
      ctx.beginPath(); ctx.arc(projected[n], projected[n + 1], 2.2, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function animate(stamp) {
    frame = 0;
    if (!canAnimate()) return;
    const delta = previousTime === null ? 1 / 60 : clamp((stamp - previousTime) / 1000, 0, 0.064);
    previousTime = stamp;
    samplePointer();
    const horizontal = stepPointerSpring(pointerX, velocityX, desiredX, delta);
    const vertical = stepPointerSpring(pointerY, velocityY, desiredY, delta);
    pointerX = horizontal.position; velocityX = horizontal.velocity;
    pointerY = vertical.position; velocityY = vertical.velocity;
    const morph = 1 - Math.exp(-delta * 6.5);
    for (let mode = 0; mode < 3; mode++) weights[mode] += (Number(mode === activeMode) - weights[mode]) * morph;
    const moving = needsMotion();
    if (!moving) {
      pointerX = desiredX; pointerY = desiredY; velocityX = velocityY = 0;
      weights.forEach((_, mode) => { weights[mode] = Number(mode === activeMode); });
    }
    draw();
    if (moving) queueFrame();
    else previousTime = null;
  }
  function reconcile() {
    if (!canAnimate()) {
      releasePointer();
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0; previousTime = null;
      draw();
    } else if (needsMotion()) queueFrame();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(width * 0.26, height * 0.29);
    pointerDirty = Boolean(pointerSample);
    draw();
    if (pointerDirty) queueFrame();
  }

  listen(button, 'click', () => {
    activeMode = (activeMode + 1) % 3;
    if (!motionEnabled) { weights.forEach((_, mode) => { weights[mode] = Number(mode === activeMode); }); draw(); }
    syncControls(); reconcile();
  });
  listen(pauseButton, 'click', () => { motionEnabled = !motionEnabled; syncControls(); reconcile(); });
  const pointerSurface = canvas.parentElement || canvas;
  listen(pointerSurface, 'pointermove', event => {
    if (event.pointerType === 'touch' || !canAnimate()) return;
    const samples = event.getCoalescedEvents?.();
    const latest = samples?.[samples.length - 1] || event;
    if (!Number.isFinite(latest.clientX) || !Number.isFinite(latest.clientY)) return;
    pointerSample = { x: latest.clientX, y: latest.clientY };
    pointerDirty = true; queueFrame();
  }, { passive: true });
  listen(pointerSurface, 'pointerleave', releasePointer, { passive: true });
  listen(pointerSurface, 'pointercancel', releasePointer, { passive: true });
  listen(window, 'blur', releasePointer);
  listen(window, 'scroll', () => { pointerDirty = Boolean(pointerSample); if (pointerDirty) queueFrame(); }, { passive: true, capture: true });
  listen(document, 'visibilitychange', reconcile);
  const onPreferenceChange = () => {
    motionEnabled = !preference.matches;
    if (!motionEnabled) {
      pointerX = pointerY = velocityX = velocityY = 0;
      weights.forEach((_, mode) => { weights[mode] = Number(mode === activeMode); });
    }
    syncControls(); reconcile();
  };
  if (preference.addEventListener) listen(preference, 'change', onPreferenceChange);
  else if (preference.addListener) {
    preference.addListener(onPreferenceChange);
    listeners.push(() => preference.removeListener(onPreferenceChange));
  }
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  resizeObserver?.observe(canvas);
  if (!resizeObserver) listen(window, 'resize', resize, { passive: true });
  const intersectionObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting; reconcile();
  }, { rootMargin: '100px' });
  intersectionObserver?.observe(canvas);

  syncControls(); resize();
  return function cleanup() {
    destroyed = true;
    if (frame) window.cancelAnimationFrame(frame);
    resizeObserver?.disconnect(); intersectionObserver?.disconnect();
    listeners.forEach(remove => remove());
  };
}
