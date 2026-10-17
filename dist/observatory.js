/**
 * An optical instrument for the homepage. Every point is generated locally;
 * there are no image requests, dependencies, or WebGL requirements.
 */

/**
 * Exact critically damped response for a normalized pointer axis. The returned
 * position and velocity form the next state; inputs are never mutated. Unlike
 * a frame-based lerp, the same elapsed time gives the same settling response.
 */
export function stepPointerSpring(position, velocity, target, delta, angularFrequency = 14) {
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

export function initObservatory({ canvas, button, label, pauseButton } = {}) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Canvas rendering is unavailable');

  const TAU = Math.PI * 2;
  const COLUMNS = 84;
  const ROWS = 18;
  const COUNT = COLUMNS * ROWS;
  const colors = { ink: '#17121B', accent: '#5200FF' };
  const modes = ['SIGNAL', 'STRUCTURE', 'EMERGENCE'];
  const projected = new Float32Array(COUNT * 3);
  const shapes = Array.from({ length: 3 }, () => new Float32Array(COUNT * 3));
  const weights = [1, 0, 0];
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = [];
  let activeMode = 0;
  let motionEnabled = !preference.matches;
  let width = 1;
  let height = 1;
  let scale = 1;
  let time = 0;
  let previousTime = 0;
  let frame = 0;
  let intersecting = true;
  let destroyed = false;
  let pointerX = 0;
  let pointerY = 0;
  let desiredX = 0;
  let desiredY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let pointerSample = null;
  let pointerDirty = false;

  // The shared parametric grid lets three distinct surfaces morph without a
  // jump, including when a visitor changes mode during the previous morph.
  for (let uIndex = 0; uIndex < COLUMNS; uIndex += 1) {
    const u = (uIndex / COLUMNS) * TAU;
    for (let vIndex = 0; vIndex < ROWS; vIndex += 1) {
      const v = (vIndex / ROWS) * TAU;
      const offset = (uIndex * ROWS + vIndex) * 3;
      const tube = 0.47 + 0.055 * Math.cos(u * 3);
      const radius = 1.04 + tube * Math.cos(v);
      shapes[0][offset] = radius * Math.cos(u);
      shapes[0][offset + 1] = radius * Math.sin(u);
      shapes[0][offset + 2] = tube * Math.sin(v) + 0.15 * Math.sin(u * 3);

      // A folded sphere: the doubled meridians make a gently woven lattice.
      const latitude = v / 2;
      const lobe = 1.21 + 0.11 * Math.sin(u * 4) * Math.sin(latitude * 3);
      shapes[1][offset] = lobe * Math.sin(latitude) * Math.cos(u);
      shapes[1][offset + 1] = lobe * Math.sin(latitude) * Math.sin(u);
      shapes[1][offset + 2] = lobe * Math.cos(latitude) * 1.06;

      // The third surface opens into a twisted, continuous ribbon field.
      const twist = v + u * 2;
      const opening = 0.93 + 0.46 * Math.cos(twist);
      shapes[2][offset] = opening * Math.cos(u) * 1.08;
      shapes[2][offset + 1] = opening * Math.sin(u) * 1.08;
      shapes[2][offset + 2] = 0.62 * Math.sin(twist) + 0.25 * Math.sin(u * 3);
    }
  }

  function listen(target, event, handler, options) {
    if (!target) return;
    target.addEventListener(event, handler, options);
    listeners.push(() => target.removeEventListener(event, handler, options));
  }

  function refreshColors() {
    const styles = window.getComputedStyle?.(canvas);
    colors.ink = styles?.getPropertyValue('--ink').trim() || '#17121B';
    colors.accent = styles?.getPropertyValue('--canvas-accent').trim() || '#5200FF';
    draw();
  }

  function releasePointer() {
    pointerSample = null;
    pointerDirty = false;
    desiredX = 0;
    desiredY = 0;
  }

  function samplePointer() {
    if (!pointerDirty || !pointerSample) return;
    pointerDirty = false;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      releasePointer();
      return;
    }
    desiredX = Math.max(-1, Math.min(1, ((pointerSample.x - rect.left) / rect.width - 0.5) * 2));
    desiredY = Math.max(-1, Math.min(1, ((pointerSample.y - rect.top) / rect.height - 0.5) * 2));
  }

  function syncControls() {
    if (label) label.textContent = `0${activeMode + 1} / ${modes[activeMode]}`;
    if (button) {
      button.setAttribute('aria-label', `Shift perspective. Current mode: ${modes[activeMode].toLowerCase()}`);
    }
    if (pauseButton) {
      pauseButton.textContent = motionEnabled ? 'Pause motion' : 'Resume motion';
      pauseButton.setAttribute('aria-pressed', String(!motionEnabled));
    }
    canvas.dataset.mode = modes[activeMode].toLowerCase();
  }

  function draw() {
    if (destroyed || width < 2 || height < 2) return;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Fixed initial camera gives the still/reduced-motion version exactly the
    // same composed view as the animated version's first frame.
    // Cursor rotation is more expressive than the quiet, bounded idle motion.
    // Keeping yaw bounded also preserves the composition after a long visit.
    const angleX = 0.68 + pointerY * 0.29 + Math.sin(time * 0.14) * 0.02;
    const angleY = -0.23 + Math.sin(time * 0.12) * 0.105 + pointerX * 0.42;
    const angleZ = -0.43 + Math.sin(time * 0.09) * 0.015;
    const sx = Math.sin(angleX);
    const cx = Math.cos(angleX);
    const sy = Math.sin(angleY);
    const cy = Math.cos(angleY);
    const sz = Math.sin(angleZ);
    const cz = Math.cos(angleZ);
    const centerX = width * 0.505 + pointerX * Math.min(width * 0.018, 12);
    const centerY = height * 0.485 + pointerY * Math.min(height * 0.018, 9);

    for (let i = 0; i < COUNT; i += 1) {
      const n = i * 3;
      let x = 0;
      let y = 0;
      let z = 0;
      for (let mode = 0; mode < 3; mode += 1) {
        if (weights[mode] < 0.0001) continue;
        x += shapes[mode][n] * weights[mode];
        y += shapes[mode][n + 1] * weights[mode];
        z += shapes[mode][n + 2] * weights[mode];
      }
      const breath = 1 + Math.sin(time * 0.55 + x * 1.8 + y * 1.2) * 0.013;
      x *= breath;
      y *= breath;
      z *= breath;
      const y1 = y * cx - z * sx;
      const z1 = y * sx + z * cx;
      const x2 = x * cy + z1 * sy;
      const z2 = -x * sy + z1 * cy;
      const x3 = x2 * cz - y1 * sz;
      const y3 = x2 * sz + y1 * cz;
      const perspective = 5.8 / (5.8 - z2);
      projected[n] = centerX + x3 * scale * perspective;
      projected[n + 1] = centerY + y3 * scale * perspective;
      projected[n + 2] = Math.max(0, Math.min(0.999, (z2 + 1.75) / 3.5));
    }

    // Small registration marks frame the instrument without enclosing it.
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.17;
    ctx.lineWidth = 0.65;
    const registrationX = width * 0.095;
    const registrationY = height * 0.51;
    ctx.beginPath();
    ctx.moveTo(registrationX - 4, registrationY);
    ctx.lineTo(registrationX + 4, registrationY);
    ctx.moveTo(registrationX, registrationY - 4);
    ctx.lineTo(registrationX, registrationY + 4);
    ctx.moveTo(width - registrationX - 4, registrationY);
    ctx.lineTo(width - registrationX + 4, registrationY);
    ctx.moveTo(width - registrationX, registrationY - 4);
    ctx.lineTo(width - registrationX, registrationY + 4);
    ctx.stroke();

    // A handful of depth batches is considerably cheaper than sorting every
    // edge. Rear edges are quiet; front edges resolve as precise dark ink.
    for (let depth = 0; depth < 6; depth += 1) {
      const alpha = 0.075 + (depth / 5) * 0.34;
      ctx.strokeStyle = colors.ink;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = depth > 3 ? 0.7 : 0.55;
      ctx.beginPath();
      for (let u = 0; u < COLUMNS; u += 1) {
        for (let v = 0; v < ROWS; v += 1) {
          const n = (u * ROWS + v) * 3;
          if (Math.floor(projected[n + 2] * 6) !== depth) continue;
          const nextU = (((u + 1) % COLUMNS) * ROWS + v) * 3;
          const nextV = (u * ROWS + ((v + 1) % ROWS)) * 3;
          ctx.moveTo(projected[n], projected[n + 1]);
          ctx.lineTo(projected[nextU], projected[nextU + 1]);
          // Structure's sphere has two separate poles, so its final latitude
          // must not connect across the whole surface during that mode.
          if (v < ROWS - 1 || weights[1] < 0.5) {
            ctx.moveTo(projected[n], projected[n + 1]);
            ctx.lineTo(projected[nextV], projected[nextV + 1]);
          }
        }
      }
      ctx.stroke();
    }

    // The accent trace and highlighted nodes share the page's violet accent.
    const traceStart = Math.floor(time * 2.3) % COLUMNS;
    ctx.strokeStyle = colors.accent;
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let step = 0; step < 25; step += 1) {
      const u = (traceStart + step + 9) % COLUMNS;
      const v = 5;
      const n = (u * ROWS + v) * 3;
      const next = (((u + 1) % COLUMNS) * ROWS + v) * 3;
      if (projected[n + 2] < 0.38) continue;
      ctx.moveTo(projected[n], projected[n + 1]);
      ctx.lineTo(projected[next], projected[next + 1]);
    }
    ctx.stroke();

    for (let depth = 0; depth < 4; depth += 1) {
      ctx.fillStyle = colors.ink;
      ctx.globalAlpha = 0.17 + depth * 0.19;
      const radius = 0.38 + depth * 0.17;
      ctx.beginPath();
      for (let i = 0; i < COUNT; i += 2) {
        const n = i * 3;
        if (Math.floor(projected[n + 2] * 4) !== depth) continue;
        ctx.moveTo(projected[n] + radius, projected[n + 1]);
        ctx.arc(projected[n], projected[n + 1], radius, 0, TAU);
      }
      ctx.fill();
    }

    // Sparse, highlighted nodes visually anchor the moving trace.
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 1;
    for (const step of [0, 11, 23]) {
      const n = (((traceStart + step + 9) % COLUMNS) * ROWS + 5) * 3;
      if (projected[n + 2] < 0.38) continue;
      ctx.beginPath();
      ctx.arc(projected[n], projected[n + 1], 2.5, 0, TAU);
      ctx.fill();
    }
  }

  function canAnimate() {
    return motionEnabled && intersecting && !document.hidden && !destroyed;
  }

  function animate(stamp) {
    frame = 0;
    if (!canAnimate()) return;
    const delta = previousTime ? Math.min((stamp - previousTime) / 1000, 0.05) : 0;
    previousTime = stamp;
    time += delta;
    samplePointer();
    const horizontal = stepPointerSpring(pointerX, velocityX, desiredX, delta);
    const vertical = stepPointerSpring(pointerY, velocityY, desiredY, delta);
    pointerX = horizontal.position;
    pointerY = vertical.position;
    velocityX = horizontal.velocity;
    velocityY = vertical.velocity;
    const morph = 1 - Math.exp(-delta * 5.5);
    for (let mode = 0; mode < 3; mode += 1) {
      weights[mode] += ((mode === activeMode ? 1 : 0) - weights[mode]) * morph;
    }
    draw();
    frame = window.requestAnimationFrame(animate);
  }

  function reconcile() {
    if (canAnimate()) {
      if (!frame) {
        previousTime = 0;
        frame = window.requestAnimationFrame(animate);
      }
    } else {
      releasePointer();
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      draw();
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The sculpture fills mobile screens without losing its outer silhouette.
    scale = Math.min(width * 0.286, height * 0.325);
    pointerDirty = Boolean(pointerSample);
    draw();
  }

  listen(button, 'click', () => {
    activeMode = (activeMode + 1) % 3;
    if (!motionEnabled) {
      weights.forEach((_, index) => { weights[index] = index === activeMode ? 1 : 0; });
      draw();
    }
    syncControls();
    reconcile();
  });

  listen(pauseButton, 'click', () => {
    motionEnabled = !motionEnabled;
    syncControls();
    reconcile();
  });

  const pointerSurface = canvas.parentElement || canvas;
  listen(pointerSurface, 'pointermove', (event) => {
    if (event.pointerType === 'touch' || !canAnimate()) return;
    const samples = event.getCoalescedEvents?.();
    const latest = samples?.[samples.length - 1] || event;
    if (!Number.isFinite(latest.clientX) || !Number.isFinite(latest.clientY)) return;
    // Input events only record the newest position. Geometry reads and spring
    // updates happen once per animation frame, even on high-polling mice.
    pointerSample = { x: latest.clientX, y: latest.clientY };
    pointerDirty = true;
  }, { passive: true });
  listen(pointerSurface, 'pointerleave', releasePointer, { passive: true });
  listen(pointerSurface, 'pointercancel', releasePointer, { passive: true });
  listen(window, 'blur', releasePointer);
  listen(window, 'scroll', () => { pointerDirty = Boolean(pointerSample); }, { passive: true, capture: true });
  listen(document, 'visibilitychange', reconcile);
  const onPreferenceChange = () => {
    motionEnabled = !preference.matches;
    if (!motionEnabled) {
      pointerX = pointerY = velocityX = velocityY = 0;
    }
    syncControls();
    reconcile();
  };
  if (preference.addEventListener) {
    listen(preference, 'change', onPreferenceChange);
  } else if (preference.addListener) {
    preference.addListener(onPreferenceChange);
    listeners.push(() => preference.removeListener(onPreferenceChange));
  }

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  if (!resizeObserver) listen(window, 'resize', resize, { passive: true });
  const intersectionObserver = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      reconcile();
    }, { rootMargin: '100px' })
    : null;
  intersectionObserver?.observe(canvas);

  syncControls();
  refreshColors();
  resize();
  reconcile();

  return function cleanup() {
    destroyed = true;
    if (frame) window.cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    listeners.forEach((remove) => remove());
  };
}
