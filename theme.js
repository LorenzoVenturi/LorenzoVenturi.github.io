// Electropop colour roles shared by the page, artwork, and canvas.
export const THEME_COLORS = Object.freeze({
  paper: '#CCFF00', ink: '#17121B', muted: '#39341F', line: '#7E9000',
  accent: '#5200FF', 'accent-ink': '#FFFFFF', 'art-accent': '#CCFF00', 'canvas-accent': '#5200FF',
  'panel-bg': '#5200FF', 'panel-text': '#FFFFFF', 'panel-muted': '#EEE6FF', 'panel-line': '#FFFFFF66',
  'art-surface': '#17121B', 'art-text': '#FFFFFF', 'art-muted': '#D7D1DE', 'art-line': '#72617F',
  'art-card': '#2B2131', 'art-soft': '#FF6B00', 'art-dark': '#17121B',
  impact: '#F900FF', 'impact-ink': '#17121B',
  'work-paper': '#F6F3F8', 'work-muted': '#665C70', 'work-line': '#D4CADC',
  'electric-lime': '#CCFF00', 'electric-orange': '#FF6B00', 'electric-magenta': '#F900FF', 'electric-violet': '#5200FF',
});

export const themeCSS = `:root{${Object.entries(THEME_COLORS).map(([name, value]) => `--${name}:${value}`).join(';')};--acid:var(--accent);color-scheme:light}`;
