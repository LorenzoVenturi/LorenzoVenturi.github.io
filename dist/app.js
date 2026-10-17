import { initObservatory } from './observatory.js?v=e74eec5f6bdd';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  document.documentElement.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .12 });
  revealElements.forEach(element => observer.observe(element));
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      document.documentElement.classList.remove('motion-ready');
      observer.disconnect();
    }
  });
}

for (const trigger of document.querySelectorAll('[data-case]')) {
  trigger.addEventListener('click', () => {
    const dialog = document.getElementById(trigger.dataset.case);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    dialog.showModal();
    document.body.classList.add('dialog-active');
    dialog.querySelector('.dialog-close').focus();
    const release = () => {
      document.body.classList.remove('dialog-active');
      trigger.focus({ preventScroll: true });
    };
    dialog.addEventListener('close', release, { once: true });
  });
}
for (const dialog of document.querySelectorAll('.case-dialog')) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
try {
  initObservatory({
    canvas: document.getElementById('thought-field'),
    button: document.getElementById('shift-perspective'),
    label: document.getElementById('field-label'),
    pauseButton: document.getElementById('pause-motion'),
  });
} catch {
  document.querySelector('.observatory').classList.add('canvas-unavailable');
  document.getElementById('field-label').textContent = 'A STATIC STUDY';
  document.getElementById('shift-perspective').textContent = 'Static 3D study';
  document.getElementById('shift-perspective').disabled = true;
  document.getElementById('pause-motion').hidden = true;
}
