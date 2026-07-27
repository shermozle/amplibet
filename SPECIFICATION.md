# AmpliBet — Specification

**Status:** as-built, 2026-07-27
**Source of truth for intent:** [AmpliBet PRD (Notion)](https://app.notion.com/p/shermozle/AmpliBet-242e43a1dced80aebd8fe8b51199f324)
**Repository:** [shermozle/amplibet](https://github.com/shermozle/amplibet) (public, no licence)
**Live:** https://shermozle.github.io/amplibet/

---

## 1. Purpose

AmpliBet is a clickable, non-functional mockup of an Australian sports betting site. Its only
purpose is to generate realistic behavioural event data for demonstrating the Amplitude
platform — Analytics, Session Replay, Experiment / Web Experiment, and Guides & Surveys — in
sales demos, training, and internal testing.

There is no backend, no real money, no live odds, and no real accounts. All state is
client-side.

### In scope
- Browsing a fixed catalogue of sports, events, and races
- Adding selections to a bet slip, setting a stake, and "placing" bets
- Mock signup / login (any credentials succeed)
- A mock credit-card deposit flow with validation and a simulated failure rate
- A bet history page with simulated settlement
- Full Amplitude instrumentation on the above

### Explicitly out of scope (per PRD)
- Real money movement, payment providers, live sports feeds
- Server-side persistence or authentication
- Any collection of real PII

---

## 2. Deployment

| Aspect | Detail |
|---|---|
| Host | GitHub Pages (`shermozle.github.io/amplibet/`), HTTPS enforced |
| Build type | GitHub Actions workflow (not branch-serving) |
| Workflow | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |
| Trigger | `push` to `main` |
| Steps | `actions/checkout@v4` → `setup-node@v4` (Node 20, npm cache) → `npm ci` → `npm run build` → `upload-pages-artifact@v3` → `deploy-pages@v4` |
| Concurrency | group `pages`, `cancel-in-progress: false` |
| Artifact | `dist/` (Vite output; not committed — `dist` is gitignored) |
| Custom domain | none |
| Build time | ~35–50 s per run; all recent runs successful |

### Build configuration
- Vite 5 + `@vitejs/plugin-react`, `base: '/amplibet/'` ([vite.config.ts](vite.config.ts))
- **`HashRouter`** is used deliberately ([src/App.tsx:2](src/App.tsx#L2)) so deep links work on
  GitHub Pages without a server-side rewrite or 404 fallback. URLs look like
  `…/amplibet/#/event/w1`.
- Tailwind 3.4 + PostCSS/autoprefixer; no custom theme — all colours are arbitrary-value
  utilities inline in components.
- TypeScript 5.5; **`tsc` is not run in CI** — the build is Vite/esbuild only, so type errors
  do not fail a deploy.
- ESLint config exists ([.eslintrc.cjs](.eslintrc.cjs)) with an `npm run lint` script, but no CI
  step invokes it.

### Branches
- `main` — default; deploys on push.
- `deploy` — historical working branch, repeatedly merged into `main` ("Merge deploy into main").
  Now behind `main`; effectively dead.
- `add-guides-surveys` — merged via PR #1; retained.

### Local development
```bash
npm install && npm run dev
```

---

## 3. Architecture

Single-page React 18 app, no router-level code splitting, no backend.

```
index.html ──> Amplitude Web Experiment snippet (synchronous, pre-React)
   └─ src/index.tsx ──> ReactDOM.render(<App/>)      ← legacy React 17 API
        └─ src/utils/analytics.ts  (Amplitude init at module load)
        └─ AuthProvider ─> WalletProvider ─> BettingProvider ─> HashRouter
```

### Providers (nesting order matters — Betting depends on both Auth and Wallet)
| Provider | File | Responsibility |
|---|---|---|
| `AuthProvider` | [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) | Mock user, session restore, login/signup/logout |
| `WalletProvider` | [src/contexts/WalletContext.tsx](src/contexts/WalletContext.tsx) | Balance, transactions, deposit, deduct, payout |
| `BettingProvider` | [src/contexts/BettingContext.tsx](src/contexts/BettingContext.tsx) | Bet slip, stake, place, history, settle |

### Routes ([src/App.tsx](src/App.tsx))
| Path | Component | Layout | Notes |
|---|---|---|---|
| `/` | `RootRoute` | none | Renders `LandingPage` when signed out; redirects to `/home` when signed in |
| `/login` | `LoginPage` | none | |
| `/signup` | `SignupPage` | none | |
| `/home` | `HomePage` | `Layout` | |
| `/sport/:sportId` | `SportPage` | `Layout` | |
| `/event/:eventId` | `EventPage` | `Layout` | |
| `/my-bets` | `MyBetsPage` | `Layout` | |

`Layout` = `Header` + `Sidebar` + `<main>` + `BetSlip`, composed via an `Outlet` pattern so
providers and chrome are not remounted on navigation.

### Data
All content is hardcoded in [src/utils/mockData.tsx](src/utils/mockData.tsx):
- 16 sports/leagues (AFL, AFLW, NRL, NRLW, NZ NPC, MLB, WNBA, FBA Asia Cup, NFL Preseason,
  Premier League, Championship, La Liga, Ligue 1, MLS, Brazil Serie A, J League)
- 4 NRL/AFL events, 5 AFLW events, 3 "tennis" events (two of which are actually golf), 9 races
- Odds are static decimal numbers; no movement, no live updates

### Persistence (localStorage only)
| Key | Written by |
|---|---|
| `amplibet_user` | AuthContext |
| `amplibet_bets_{userId}` | BettingContext (open slip) |
| `amplibet_history_{userId}` | BettingContext (placed bets) |
| `amplibet_balance_{userId}` | WalletContext |
| `amplibet_transactions_{userId}` | WalletContext |

---

## 4. Functional behaviour (as built)

### Auth
- Signup accepts **any** input. No validation at all — no required fields, no email format
  check, and the two password fields are collected but never compared. Native HTML validation
  was deliberately removed (commits `1166a77`, `a798a9f`, `f4f156a`) so bots can submit
  arbitrary/blank forms.
- Login requires both fields non-empty; any values then succeed after a 500 ms fake delay.
  First/last name are derived from the email local part (`first.last@…`).
- User id is a random base-36 string. Amplitude `user_id` is set to the **email**, not this id.
- Session persists across reloads via `amplibet_user`; logout clears it.

### Wallet
- New accounts start at **$0.00** (changed from $100 in commit `7eb1ec6`) — the user must
  complete a deposit before they can bet, which is the point of the demo funnel.
- Deposit modal ([src/components/Wallet/DepositModal.tsx](src/components/Wallet/DepositModal.tsx)):
  quick amounts $25/$50/$100/$250/$500; min $10, max $10,000; card number 13–19 digits,
  expiry-not-past, 3–4 digit CVV, non-empty cardholder name — all validated client-side.
- 2 s simulated processing delay, then a **5% random failure** raising
  "Payment processing failed. Please try again."
- Transactions are typed `deposit` | `bet` | `payout` and prepended to a list. The list is
  surfaced nowhere in the UI.

### Betting
- Selecting a team on `EventPage` adds a selection to the slip. Only the **Match Result**
  market is wired; Handicap, Total Match Points, First Team to Score, and Race to 20 Points
  are rendered but inert.
- One selection per event: adding a second selection for the same `eventId` replaces the first.
- "Single Bets" only. Estimated payout is the **sum of individual payouts**, not a multiplied
  parlay. There is no multi-bet builder.
- Place Bet is blocked when: not signed in (redirects to `/login` preserving the target),
  any stake is 0/unset, or `totalStake > balance` ("Insufficient Funds").
- On success: funds deducted, 1 s fake delay, bets moved to history as `pending`, slip cleared.
- **Settlement is simulated only while `/my-bets` is mounted**: a bet older than 30 s is
  resolved with a **60% win** probability; wins credit `stake × odds` back to the wallet.
  A bet placed and never revisited stays `pending` indefinitely.
- Bet slip is collapsible to a 12-px rail with a selection count.

---

## 5. Amplitude instrumentation

**Project API key:** `51a87354dce5f3a16ac6fe902c4c59a0` (US server zone, instance name
`amplibet-demo`). The key is embedded in client source in two places —
[src/utils/analytics.ts:7](src/utils/analytics.ts#L7) and the Web Experiment `<script>` in
[index.html](index.html). This is expected for a browser SDK key.

### SDK setup
- `@amplitude/unified` `initAll()` is called at **module load**, not in a React effect, so
  landing-page events fire before any component mounts (commit `9444e73`).
- Autocapture and `defaultTracking` both fully enabled: attribution, file downloads, form
  interactions, page views, sessions, element interactions.
- **Session Replay** at `sampleRate: 1` (100% of sessions).
- **Experiment** initialised with `source: 'amplibet-demo'`.
- **Guides & Surveys** via `@amplitude/engagement-browser` added as a plugin on the unified
  instance (`autoRefreshIntervalSeconds: 3600`) — no separate init/boot.
- **Web Experiment** loads synchronously in `<head>` before React so visual changes apply
  without flicker.
- The whole init block is wrapped in try/catch; failures log and are swallowed.

### Custom events
| Event | Fired from | Key properties |
|---|---|---|
| `Page Viewed` | Landing, Login, Signup, Home, Sport, Event | `page_name`, `timestamp`, contextual ids |
| `Sport Selected` | SportPage | `sport_id`, `sport_name` |
| `Event Selected` | SportPage, EventPage | `event_id`, `home_team`, `away_team`, `matchup`, `sport_id` |
| `Bet Added` | EventPage + BettingContext | `bet_id`, `event_id`, `selection`, `odds` |
| `Bet Removed` | BetSlip | `bet_id` |
| `Bet Stake Updated` | BetSlip | `bet_id`, `stake` |
| `Bet Placed` | BettingContext | `bet_count`, `total_stake`, `estimated_payout`, `potential_profit`, `bets[]` |
| `User Signed Up` | AuthContext | `user_id`, `email`, `first_name`, `last_name`, `signup_method` |
| `User Logged In` | AuthContext | `user_id`, `email`, `login_method` |
| `User Logged Out` | AuthContext | `user_id` |
| `User Identified` | analytics.setUserProperties | `user_id`, `properties` |
| `Deposit Made` | WalletContext (success only) | `amount`, `currency`, `card_brand`, `card_last_four`, `cardholder_name`, `payment_method` |
| `Button Clicked` | Landing, Login, Signup, Header, BetSlip | `button_name`, `location`, plus ad-hoc props |
| `Experiment Variant Assigned` / `Experiment Exposure` | analytics.ts | never called from the app |

### User properties
Set via `Identify` on signup and login: `email`, `first_name`, `last_name`, `signup_date`,
`last_login`, `user_type: 'demo_user'`. `user_id` = email address.

---

## 6. Design

The implemented palette does **not** match the Amplitude palette specified in the PRD
(`#0052f2`, `#edf0f5`, `#001a4f`, `#6980ff`, `#a373ff`, `#ff7d78`, `#f23845`). As built:

| Token | Value | Use |
|---|---|---|
| Primary / brand | `#4F44E0` (hover `#3832A0`) | CTAs, active nav, "BET" in wordmark |
| Accent | `#50E3C2` | Headings, payout figures, hover text |
| Secondary accent | `#9B7BFD` | Link hover |
| App background | `#13294B` | Authenticated shell |
| Surface | `#1B3B6F` (raised `#2A4E8D`) | Cards, sidebar, bet slip |
| Landing background | `#0F1929` | Marketing page |
| Auth background | `#0F1419` | Login / signup |

Some Home components still use generic Tailwind greys (`bg-gray-800`, plus a non-existent
`hover:bg-gray-750`), so the home page is visually inconsistent with the rest of the shell.

---

## 7. Not implemented

### PRD requirements with no implementation
| PRD requirement | State |
|---|---|
| **Withdrawal flow** | Absent entirely. No UI, no context method. |
| **Results & settlements page** | Absent. Only `/my-bets`, and settlement runs solely while that page is open. |
| **Notifications** (win/loss/unsettled) | Absent. |
| **Multi-bet / parlay builder** | Absent. Slip is singles-only; no combination validation. |
| **Search & filter** by sport/date/popularity | Header search icon and all Filter icons are decorative — no handlers beyond a `Button Clicked` event. |
| **Bet-placement random failure** | Not implemented. Only deposits fail randomly (5%). Bet errors are deterministic (insufficient funds / no stake). PRD target was a 10–20% error rate. |
| **Onboarding overlay** for first-time users | Absent (could be delivered via Guides & Surveys instead). |
| **Responsible Gambling modal** on large bets | Absent. |
| **Simulated session timeout / forced logout** | Absent. |
| **Featured-events carousel** on landing | Static 4-up benefit grid instead. |
| **Account overview page** (profile, activity) | Absent. Only a header dropdown with name/email and Sign out. Transaction history is stored but never displayed. |
| **Keyboard navigation / screen-reader support** | Not addressed. No ARIA on the modal, no focus trap, no skip links, several `<a href="#">` placeholders. |
| **Mobile responsiveness** | Partial. Landing/auth pages are responsive; the authenticated shell is not — `Sidebar` is a fixed `w-48` and `BetSlip` a fixed `w-72`, with no hamburger or drawer. The PRD's "mobile user" persona is unserved. |
| **Bot-driven data generation** | No bot harness, script, or seeding tool in the repo. |
| **Amplitude brand palette** | Not applied (see §6). |
| **Racing** | 9 races render on the home page, but their links go to `/event/r{n}`, which has no matching event — `getEventById` returns undefined and `EventPage` silently falls back to `mockAFLWEvents[0]`. |
| **Esports** | Sidebar link exists; no data, falls through to the generic sport list. |

### Known defects
1. **Duplicate `Bet Added` events.** `EventPage.handleBetSelection` calls `trackBetAdded`
   ([src/pages/EventPage.tsx:39](src/pages/EventPage.tsx#L39)) *and* `BettingContext.addBet`
   calls it again ([src/contexts/BettingContext.tsx:90](src/contexts/BettingContext.tsx#L90)).
   Every selection is counted twice in Amplitude.
2. **Logout does not clear bets.** `AuthContext.logout` removes `amplibet_bets`, but
   `BettingContext` writes `amplibet_bets_{userId}`. Slip and history survive logout and are
   restored on next login with the same user id.
3. **`SportPage` ignores its route param for chrome.** The heading is hardcoded to
   "AFL Womens.", breadcrumbs to "Australian Rules → Australia", and team badges to SYD/RIC,
   regardless of `sportId`.
4. **`MyBetsPage` signed-out CTA is a raw `<a href="/login">`** — under `HashRouter` with base
   `/amplibet/` this navigates to a 404 rather than the login route.
5. **`Bet Placed` never fires on failure**, and deposit failures emit no event at all, so the
   error states the demo is meant to showcase are invisible in Amplitude.
6. **Wallet transactions never persist as empty** — the save effect is guarded on
   `transactions.length > 0`, so a reset leaves stale data in localStorage.
7. **`estimatedPayout` label is misleading** for multiple selections (sum of singles, not a
   multi).
8. **Duplicate `Event Selected` events.** `SportPage` tracks it on link click and `EventPage`
   tracks it again on mount, so every selection made from a sport page is counted twice. Found
   by counting events in the browser, not by reading the code.
9. **`EventPage` chrome is hardcoded to AFLW.** Breadcrumb ("Sport → Australian Rules →
   Australia", linking to `/sport/aflw`), heading ("AFL Womens."), and icon are fixed
   regardless of the event, so an NRL or MLB fixture claims to be Australian Rules and links
   to the wrong sport page. Same defect as 3, in the other page.
10. **`getEventById` falls back to an unrelated event.** `EventPage` used
    `getEventById(id) || mockAFLWEvents[0]`, so an unknown or stale id silently rendered a
    real AFLW fixture — a broken link looked like a working page and emitted an
    `Event Selected` for a selection the user never made.
11. **The deposit modal cannot be dismissed with Escape** and does not trap focus.

### Dead code
- [src/AppRouter.tsx](src/AppRouter.tsx) — a `BrowserRouter` wrapper, never imported.
- `initializeAnalytics()` — a no-op kept for compatibility, still called from `App`.
- `getExperimentVariant`, `getDepositButtonExperiment`, `getBetSlipLayoutExperiment`,
  `getWelcomeBonusExperiment`, `trackExperimentExposure`, `flushSessionReplay`,
  `startSessionReplay`, `stopSessionReplay`, `trackNavigation` — all exported from
  `analytics.ts`, none called anywhere. Server-side Experiment is therefore unused; only the
  `<head>` Web Experiment snippet is live.
- `setUserProperties` imported into `AuthContext` but not used there.

### Engineering gaps
- **No tests** of any kind — no runner, no test files.
- **No type-check or lint in CI**; a type error ships.
- `package.json` is still named `magic-patterns-vite-template` and [README.md](README.md) is
  still the unmodified Magic Patterns template — it does not mention AmpliBet, the demo
  purpose, the Amplitude setup, or deployment.
- Uses the legacy `ReactDOM.render` from `react-dom` rather than `createRoot`, so React 18
  concurrent features are off and a deprecation warning is logged.
- `@amplitude/unified` is pinned to a **beta** (`^1.0.0-beta.2`).
- Card details (including cardholder name and last four digits) are sent to Amplitude. Values
  are fake in demo use, but the flow would capture real input if anyone typed a real card, and
  the form has no warning against doing so.

---

## 8. Suggested priorities

1. Fix the duplicate `Bet Added` event and the logout key mismatch — both corrupt demo data.
2. Add error-state events (bet rejected, deposit failed) and a bet-placement failure rate;
   error handling is a headline PRD requirement and currently produces no analytics.
3. Make the authenticated shell responsive, or drop the mobile persona from the PRD.
4. Add a bot/seed script — "enable automated bots to generate diverse user journeys" is a
   stated business goal with nothing built for it.
5. Replace the README, and add `tsc --noEmit` + `npm run lint` to the deploy workflow.
6. Either wire the Experiment helpers to real flags or delete them.
