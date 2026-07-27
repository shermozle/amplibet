# AmpliBet

A clickable mockup of an Australian sports betting site, built to generate realistic
behavioural event data for **Amplitude platform demonstrations** — Analytics, Session Replay,
Experiment, Web Experiment, and Guides & Surveys.

**Live:** https://shermozle.github.io/amplibet/

There is no backend, no real money, no live odds, and no real accounts. All state is held in
the browser. See [SPECIFICATION.md](SPECIFICATION.md) for the full as-built spec and
[the PRD](https://app.notion.com/p/shermozle/AmpliBet-242e43a1dced80aebd8fe8b51199f324) for intent.

## Getting started

```bash
npm install
npm run dev
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | `tsc --noEmit` — **not** run by `build`, so run it before pushing |
| `npm run lint` | ESLint |

## Deployment

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which
type-checks, lints, builds, and publishes `dist/` to GitHub Pages. **There is no staging
environment — a push to `main` updates the live demo.**

Two things to know before changing routing or asset paths:

- `vite.config.ts` sets `base: '/amplibet/'` to match the Pages subpath.
- The app uses **`HashRouter`**, so deep links work on Pages without a server-side rewrite.
  URLs look like `…/amplibet/#/event/w1`. Always navigate with react-router's `Link` — a raw
  `<a href="/login">` bypasses the hash router and 404s.

## Amplitude setup

Initialisation lives in [src/utils/analytics.ts](src/utils/analytics.ts) and runs **at module
load**, not in a React effect, so landing-page events fire before any component mounts.

- `@amplitude/unified` with full autocapture (attribution, file downloads, form interactions,
  page views, sessions, element interactions)
- Session Replay at 100% sampling
- Guides & Surveys via `@amplitude/engagement-browser`, added as a plugin on the unified instance
- Web Experiment loaded synchronously in `<head>` in [index.html](index.html), before React, so
  visual changes apply without flicker

The browser API key is embedded in client source, which is expected for a browser SDK key. Do
not add a **server-side** key to this repo — the simulation scripts read theirs from the
environment.

### Conventions

- Never send PII beyond what the demo needs. Card brand and last four digits are tracked;
  cardholder name and full card number are deliberately not.
- Emit an event for failure paths as well as success paths. The demo exists partly to show
  error-state analysis, so a silent failure is a missing feature.
- Track an event in exactly one place. `Bet Added` is emitted inside `BettingContext.addBet`;
  callers must not also track it.

## Attribution

AFL fixture and result data is sourced from the [Squiggle API](https://api.squiggle.com.au/),
used with permission under its terms. Squiggle data is fetched only in CI and committed as
static JSON — never fetched from the client, per their terms of use.
