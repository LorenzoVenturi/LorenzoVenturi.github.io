# Lorenzo Venturi — personal portfolio

Live website: **https://lorenzoventuri.github.io/**

A portfolio with oversized typography, an interactive 3D wireframe, and four projects based on repository documentation. Homepage and About copy use direct descriptions of Lorenzo’s work and NII Tokyo research internship.

## Run locally

Requires Node.js and Python 3. No package installation is needed.

```sh
npm run build
npm run check
npm run dev
```

Open `http://127.0.0.1:4173`. Deploy the `dist/` folder to any static host.

## Update content

- Edit `content.json` for project titles, summaries, technologies, documented results, source links, and optional `demo` URLs. Run `npm run build` afterward.
- Edit `template.html` for provisional homepage and About copy, navigation, and contact links. Run `npm run build` afterward.
- Edit `dist/styles.css` for the visual system and responsive styles.
- Edit `dist/observatory.js` for the three procedural sculpture forms.
- Edit `build.mjs` for the four original project illustrations and case-study markup.
- Edit `theme.js` for the Electropop colour roles: lime `#CCFF00`, orange `#FF6B00`, magenta `#F900FF`, and violet `#5200FF`. The hero is lime, the About section violet, the closing section magenta, and the project illustrations carry all four colours. Neutral project text backgrounds keep longer descriptions readable. Run `npm run build` after changing the theme. The site uses this single colour scheme, with no colour selector or stored colour preference.

Project content is based on public repository documentation, linked in every case study. Abstract exhibition graphics illustrate project ideas; they are not product screenshots or reported measurements. No live demo or private contact details are invented.

## Accessibility and performance

The site uses semantic sections, one main heading, a skip link, native buttons and dialogs, visible focus styles, dialog focus restoration, and descriptive link labels. System reduced-motion preferences disable automatic motion; the sculpture also has a pause control and touch-friendly mode selection. Content is rendered into HTML during the build.

No analytics, trackers, runtime framework, package dependencies, external font requests, or image requests. Fonts are served locally under the SIL Open Font License in `dist/assets/OFL.txt`. The procedural canvas caps pixel density and pauses when offscreen or when the tab is hidden.

The cursor uses a critically damped spring for consistent tracking across frame rates. Rotation is bounded to approximately ±24° horizontally and ±17° vertically, with up to 12 px of translation. The wireframe returns smoothly to centre when the cursor leaves.

`npm run check` validates content, local assets, fragment links, dialog references, Electropop text contrast, spring response at several frame rates, and sculpture behavior using a mocked canvas. It does not replace visual browser verification.

## Publish updates

Push changes to `main`. The GitHub Actions workflow builds the static website, runs the content, link, contrast, and interaction checks, and deploys `dist/` to GitHub Pages. Deployment uses the `github-pages` environment. No install step or repository secrets are required.

This repository replaces the previous Nuxt site. Its earlier implementation remains in Git history.
