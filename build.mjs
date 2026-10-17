import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { themeCSS } from './theme.js';

const content = JSON.parse(await readFile(new URL('./content.json', import.meta.url), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const external = 'target="_blank" rel="noopener noreferrer"';
function svg(body, background) {
  const onAccent = background === '#d0f354';
  const colors = {
    '#1b1d19': onAccent ? 'accent-ink' : 'art-dark', '#d0f354': 'art-accent',
    '#f3f2ed': 'art-text', '#d5d9ca': 'art-text', '#c4c7b9': 'art-text',
    '#53584b': 'art-line', '#66734d': 'art-line', '#858e77': 'art-line', '#42483c': 'art-line',
    '#292d24': 'art-card', '#292d26': 'art-card', '#a4ac96': 'art-muted', '#8c9580': 'art-muted', '#aeb5a1': 'art-muted',
    '#c9cbbf': 'line', '#555b4c': 'art-dark', '#708b36': 'accent-ink', '#34451e': 'accent-ink',
  };
  const art = body.replace(/#[0-9a-f]{6}/gi, color => colors[color.toLowerCase()] ? `var(--${colors[color.toLowerCase()]})` : color);
  const surface = onAccent ? 'accent' : background === '#e1e3d9' ? 'art-soft' : 'art-surface';
  return `<svg viewBox="0 0 640 500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="500" fill="var(--${surface})"/>${art}</svg>`;
}

function artwork(type) {
  if (type === 'retrieval') return svg(`
    <defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#53584b"/></pattern></defs><rect width="640" height="500" fill="url(#dots)"/>
    <g stroke="#a4ac96" fill="none" stroke-width="1"><path class="flow-line" d="M90 250h104m97 0h71m75 0h108M242 207v-78h150v76m0 88v78H242v-76"/><path d="m184 244 10 6-10 6m168-12 10 6-10 6m98-12 10 6-10 6"/></g>
    <circle class="signal-ring" cx="242" cy="250" r="78" fill="none" stroke="#66734d" stroke-width=".6"/>
    <circle cx="242" cy="250" r="49" fill="#d0f354"/><path d="m224 250 12 12 25-27" stroke="#1b1d19" stroke-width="2" fill="none"/>
    <rect x="363" y="212" width="74" height="76" rx="4" fill="#292d24" stroke="#858e77"/>
    <g fill="none" stroke="#d5d9ca" stroke-width="1.3"><path d="M382 230h20l12 12v29h-32z"/><path d="M402 230v13h12m-25 7h18m-18 7h18m-18 7h11"/></g>
    <g fill="#f3f2ed" font-family="monospace" font-size="9" text-anchor="middle"><text x="80" y="227">QUESTION</text><text x="242" y="321">REFINE</text><text x="400" y="321">RETRIEVE</text><text x="550" y="278">EXPLORE</text><text x="320" y="117" fill="#a4ac96">HUMAN IN THE LOOP</text></g>
    <circle cx="80" cy="250" r="8" fill="none" stroke="#d0f354"/><circle cx="550" cy="250" r="8" fill="#d0f354"/>
    <text x="32" y="460" fill="#8c9580" font-family="monospace" font-size="9">QUESTION → SEARCH → SHORTLIST</text>`, '#1b1d19');
  if (type === 'verification') return svg(`
    <defs><pattern id="scanlines" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0h6" stroke="#c9cbbf" stroke-width=".5"/></pattern><clipPath id="truth-clip"><rect x="0" y="221" width="640" height="78"/></clipPath></defs>
    <text x="26" y="245" fill="#1b1d19" font-family="Arial,sans-serif" font-size="138" letter-spacing="-9" font-weight="700">TRUE?</text><text x="29" y="352" fill="none" stroke="#1b1d19" stroke-width="1" font-family="Arial,sans-serif" font-size="138" letter-spacing="-9" font-weight="700">FALSE?</text>
    <rect width="640" height="500" fill="url(#scanlines)"/>
    <g class="scan-line"><rect x="0" y="213" width="640" height="60" fill="#d0f354" opacity=".84"/><path d="M25 213h590" stroke="#1b1d19" stroke-width=".7"/><text x="35" y="250" font-family="monospace" font-size="10" fill="#1b1d19">CLAIM → EVIDENCE → VERDICT</text><circle cx="601" cy="243" r="5" fill="#1b1d19"/></g>
    <g font-family="monospace" font-size="9" fill="#555b4c"><text x="32" y="430">FIXED PIPELINES / TOOL USE</text><text x="32" y="446">MULTI-AGENT DEBATE</text></g>`, '#e1e3d9');
  if (type === 'cooperation') {
    let grid = '';
    for (let x = 135; x < 510; x += 74) for (let y = 106; y < 405; y += 74) grid += `<rect x="${x}" y="${y}" width="65" height="65" rx="3" fill="#292d26" stroke="#42483c" stroke-width=".8"/>`;
    return svg(`${grid}<path d="M168 139h148v148h148m-222 74h74V213h148" fill="none" stroke="#c4c7b9" stroke-width="1.2" stroke-dasharray="4 7"/>
      <rect x="283" y="180" width="65" height="65" rx="3" fill="#d0f354"/><path d="M304 202h24v21h-24zm6-4v4m12-4v4m-12 21v4m12-4v4" fill="none" stroke="#1b1d19" stroke-width="1.2"/>
      <g class="agent-dot"><circle cx="168" cy="139" r="17" fill="#f3f2ed"/><circle cx="162" cy="137" r="2" fill="#1b1d19"/><circle cx="174" cy="137" r="2" fill="#1b1d19"/></g>
      <g class="agent-dot" style="animation-delay:-4s"><circle cx="242" cy="287" r="17" fill="#d0f354"/><circle cx="236" cy="285" r="2" fill="#1b1d19"/><circle cx="248" cy="285" r="2" fill="#1b1d19"/></g>
      <text x="32" y="460" fill="#aeb5a1" font-family="monospace" font-size="9">MAPPO / MAA2C / OVERCOOKED-AI</text>`, '#1b1d19');
  }
  return svg(`<g fill="none" stroke="#708b36" stroke-width=".7" opacity=".4"><path d="M32 150h576m-576 95h576m-576 95h576M85 85v330m470-330v330"/></g>
    <text x="36" y="222" font-family="Georgia,serif" font-size="93" letter-spacing="-5" fill="#1b1d19" font-style="italic">Context</text><text x="178" y="313" font-family="Arial,sans-serif" font-weight="700" font-size="97" letter-spacing="-7" fill="#1b1d19">matters.</text>
    <path d="M52 244c105 12 232-24 322-9m-179 97c95 7 224-14 338-14" stroke="#1b1d19" stroke-width="1.5" fill="none"/>
    <g font-family="monospace" font-size="9" fill="#34451e"><text x="35" y="404">ONLINE SEXISM CLASSIFICATION</text><text x="35" y="421">ZERO-SHOT / FEW-SHOT PROMPTING</text></g>`, '#d0f354');
}

const projectHTML = content.projects.map((p, i) => `<article class="project" id="${escape(p.id)}">
  <button class="project-art-button" data-case="case-${escape(p.id)}" aria-label="Read case study: ${escape(p.title)}" aria-haspopup="dialog"><span class="project-art"><span class="art-caption"><span>EXPERIMENT 0${i + 1}</span><span>${escape(p.artLabel)} ↗</span></span>${artwork(p.art)}<span class="open-project" aria-hidden="true">↗</span></span></button>
  <div class="project-meta"><span>0${i + 1} / ${escape(p.category)}</span><span>${escape(p.type)}</span></div>
  <h3 class="project-title"><button data-case="case-${escape(p.id)}" aria-haspopup="dialog">${escape(p.title)}</button></h3>
  <p class="project-summary">${escape(p.summary)}</p>
  <div class="project-tags">${p.technologies.slice(0, 4).map(t => `<span>${escape(t)}</span>`).join('')}</div>
  <div class="project-actions"><button class="case-open" data-case="case-${escape(p.id)}" aria-haspopup="dialog">Read project details ↗</button><a class="project-repo" href="${escape(p.repository)}" ${external}>Repository ↗<span class="sr-only"> (opens in a new tab)</span></a></div>
</article>`).join('\n');

const dialogHTML = content.projects.map((p, i) => `<dialog class="case-dialog" id="case-${escape(p.id)}" aria-labelledby="case-title-${escape(p.id)}">
  <div class="dialog-header"><span class="case-eyebrow">EXPERIMENT 0${i + 1} / ${escape(p.category)}</span><button type="button" class="dialog-close" aria-label="Close project case study">×</button></div>
  <div class="dialog-body"><h2 id="case-title-${escape(p.id)}">${escape(p.title)}</h2><p class="case-intro">${escape(p.summary)}</p>
  <div class="case-details"><section><h3>Problem</h3><p>${escape(p.problem)}</p></section><section><h3>Approach</h3><p>${escape(p.approach)}</p></section><section><h3>Results</h3><p>${escape(p.results)}</p></section><section><h3>Built with</h3><p>${p.technologies.map(escape).join(' · ')}</p></section></div>
  <div class="case-sources"><a href="${escape(p.repository)}" ${external}>View repository ↗<span class="sr-only"> (opens in a new tab)</span></a><a href="${escape(p.readme)}" ${external}>Read the documentation ↗<span class="sr-only"> (opens in a new tab)</span></a>${p.demo ? `<a href="${escape(p.demo)}" ${external}>Open live demo ↗<span class="sr-only"> (opens in a new tab)</span></a>` : ''}</div><p class="case-source-note">Project details are based on the repository and its documentation.</p></div>
</dialog>`).join('\n');

const template = await readFile(new URL('./template.html', import.meta.url), 'utf8');
await mkdir(new URL('./dist', import.meta.url), { recursive: true });
await writeFile(new URL('./dist/index.html', import.meta.url), template.replace('</head>', `<style>${themeCSS}</style></head>`).replace('<!-- PROJECTS -->', projectHTML).replace('<!-- DIALOGS -->', dialogHTML));
console.log(`Built ${content.projects.length} evidence-based project studies → dist/index.html`);
