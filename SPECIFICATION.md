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

### Providers (nesting order is load-bearing)
| Provider | File | Responsibility |
|---|---|---|
| `AuthProvider` | [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) | Mock user, loyalty ID, session restore, login/signup/logout |
| `WalletProvider` | [src/contexts/WalletContext.tsx](src/contexts/WalletContext.tsx) | Balance, transactions, deposit, withdraw, deduct, payout |
| `LoyaltyProvider` | [src/contexts/LoyaltyContext.tsx](src/contexts/LoyaltyContext.tsx) | Points ledger, tiers, earn-on-stake |
| `NotificationProvider` | [src/contexts/NotificationContext.tsx](src/contexts/NotificationContext.tsx) | Toasts (`ToastViewport`), `Notification Shown` events |
| `BettingProvider` | [src/contexts/BettingContext.tsx](src/contexts/BettingContext.tsx) | Bet slip, singles/multi, place, history, settlement |

Betting sits innermost because placement credits points (Loyalty), moves money
(Wallet) and settlement raises toasts (Notification).

### Routes ([src/App.tsx](src/App.tsx))
| Path | Component | Layout | Notes |
|---|---|---|---|
| `/` | `RootRoute` | none | Renders `LandingPage` when signed out; redirects to `/home` when signed in |
| `/login` | `LoginPage` | none | |
| `/signup` | `SignupPage` | none | |
| `/home` | `HomePage` | `Layout` | |
| `/sport/:sportId` | `SportPage` | `Layout` | Head-to-head sports incl. esports |
| `/event/:eventId` | `EventPage` | `Layout` | |
| `/racing` | `RacingPage` | `Layout` | Race cards index |
| `/race/:raceId` | `RacePage` | `Layout` | Win market per runner |
| `/my-bets` | `MyBetsPage` | `Layout` | |
| `/results` | `ResultsPage` | `Layout` | Pending bets + simulated settlement |
| `/account` | `AccountPage` | `Layout` | Profile, withdraw, transaction history |
| `/rewards` | `LoyaltyPage` | `Layout` | Loyalty card, barcode, ledger |
| `/kiosk` (+ `scan`, `home`, `slip`, `done`) | `Kiosk*` pages | `KioskLayout` | In-venue touchscreen surface — see § Kiosk |

`Layout` = `Header` + `Sidebar` + `<main>` + `BetSlip`, composed via an `Outlet` pattern so
providers and chrome are not remounted on navigation. It is responsive: below `lg` the
sidebar becomes a hamburger-opened drawer and the bet slip a bottom sheet behind a floating
toggle. `Layout` also mounts `ToastViewport`, `SessionTimeoutManager` (10-minute idle
warning → sign-out) and `OnboardingOverlay` (3-step first-visit tour, per-member flag).

### Data
All content is hardcoded in [src/utils/mockData.tsx](src/utils/mockData.tsx):
- 17 sports/leagues (adds Esports to the original 16)
- 4 NRL/AFL events, 5 AFLW events, 3 "tennis" events (two of which are actually golf),
  3 esports fixtures, and 4 full race cards (venue, distance, 5–6 runners with win odds);
  the legacy 9-race ticker list remains for the home page rail
- Odds are static decimal numbers; no movement, no live updates

### Persistence (localStorage only)
| Key | Written by |
|---|---|
| `amplibet_user` | AuthContext |
| `amplibet_bets_{userId}` | BettingContext (open slip) |
| `amplibet_history_{userId}` | BettingContext (placed bets) |
| `amplibet_balance_{userId}` | WalletContext |
| `amplibet_transactions_{userId}` | WalletContext |
| `amplibet_loyalty_{userId}` | LoyaltyContext (points ledger) |
| `amplibet_onboarded_{userId}` | OnboardingOverlay (tour completed/skipped) |

Every per-user writer keeps an ownership marker in state and persists only once its state
provably belongs to the signed-in member — see defect 12 for why.

---

## 4. Functional behaviour (as built)

### Auth
- Signup accepts **any** input. No validation at all — no required fields, no email format
  check, and the two password fields are collected but never compared. Native HTML validation
  was deliberately removed (commits `1166a77`, `a798a9f`, `f4f156a`) so bots can submit
  arbitrary/blank forms.
- Login requires both fields non-empty; any values then succeed after a 500 ms fake delay.
  First/last name are derived from the email local part (`first.last@…`).
- User id **is** the loyalty ID (`AB-XXXXXXXX`), which is also the Amplitude `user_id` —
  see § Identity.
- Session persists across reloads via `amplibet_user`; logout clears it and every per-user
  key. A 10-minute idle timeout (`SessionTimeoutManager`) warns with a 60-second countdown,
  then signs the member out.
- First visit after signup shows a 3-step onboarding tour (per-member localStorage flag;
  completing or skipping it is tracked).

### Wallet
- New accounts start at **$0.00** (changed from $100 in commit `7eb1ec6`) — the user must
  complete a deposit before they can bet, which is the point of the demo funnel.
- Deposit modal ([src/components/Wallet/DepositModal.tsx](src/components/Wallet/DepositModal.tsx)):
  quick amounts $25/$50/$100/$250/$500; min $10, max $10,000; card number 13–19 digits,
  expiry-not-past, 3–4 digit CVV, non-empty cardholder name — all validated client-side.
- 2 s simulated processing delay, then a **5% random failure** raising
  "Payment processing failed. Please try again."
- **Withdrawals** (`/account`): amount validated against balance, 1.2 s delay, **8% random
  provider decline**. Success and failure both tracked (`Withdrawal Made` / `Withdrawal
  Failed`) and toasted.
- Transactions are typed `deposit` | `bet` | `payout` | `withdrawal` and rendered as the
  transaction history on `/account`.

### Betting
- Selecting a team on `EventPage` (or a runner on `RacePage`) adds a selection to the slip.
  Only the **Match Result** / **Win** markets are wired; the other rendered markets are inert.
- Selections are keyed by event **and** selection, so both sides of a match can sit in the
  slip at once — legitimate as singles (dutching), rejected as a multi.
- The slip has **Singles** and **Multi** modes. Multi multiplies the legs' odds into one
  price on a single stake; validation requires ≥ 2 legs and rejects two selections from the
  same event ("incompatible selections"). A multi lands in history as one `PlacedBet` with
  `betType: 'multi'` and its `legs` preserved.
- Place Bet is blocked when: not signed in (redirects to `/login` preserving the target),
  stakes unset, multi validation failing, or stake > balance ("Insufficient Funds").
- Stakes above **$200** (`RESPONSIBLE_GAMBLING_THRESHOLD`) interrupt placement with a
  responsible-gambling prompt (gambling help line shown); both the prompt and the
  continued/cancelled choice are tracked.
- After validation and before money moves, placement fails randomly at **12%**
  (`SIMULATED_FAILURE_RATE`) with one of three bookmaker-style reasons — the PRD's 10–20%
  error-rate target. A simulated failure never costs the user funds.
- On success: funds deducted, bets land in history as `pending`, slip cleared, loyalty
  points credited on the stake.
- **Settlement** is explicit: the `/results` page's "Settle pending bets" button runs
  `BettingContext.settlePendingBets()`, which resolves each pending bet with win probability
  `0.95 / odds` (implied probability with a 5% house margin, so long shots lose more often
  and the book holds), pays winners into the wallet, emits `Bet Settled` per bet and raises
  win/loss toasts. The old 30-second 60% coin flip on `/my-bets` is removed.
- Bet slip is collapsible to a rail on desktop; on small screens it is a bottom sheet behind
  a floating toggle showing the selection count.

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

**Every** custom event carries `surface` (`web` | `kiosk` | `in_store` | `call_centre`). It is
added centrally by the `track` wrapper in `analytics.ts` rather than at each call site, so it
cannot be forgotten on one event and silently break the cross-surface comparison the demo is
built around. Call that wrapper, never the SDK's `track` directly.

| Event | Fired from | Key properties |
|---|---|---|
| `Page Viewed` | Landing, Login, Signup, Home, Sport, Event, Loyalty | `page_name`, `timestamp`, contextual ids |
| `Sport Selected` | SportPage | `sport_id`, `sport_name` |
| `Event Selected` | EventPage (on mount only) | `event_id`, `home_team`, `away_team`, `matchup`, `sport_id` |
| `Bet Added` | BettingContext | `bet_id`, `event_id`, `selection`, `odds` |
| `Bet Removed` | BetSlip | `bet_id` |
| `Bet Stake Updated` | BetSlip | `bet_id`, `stake` |
| `Bet Placed` | BettingContext | `bet_count`, `bet_type` (`single`\|`multi`), `combined_odds`, `total_stake`, `estimated_payout`, `potential_profit`, `bets[]` |
| `Bet Placement Failed` | BettingContext (every rejection path, incl. the 12% simulated bookmaker failures) | `failure_reason`, `bet_count`, `total_stake`, `selections` |
| `Bet Settled` | BettingContext.settlePendingBets (once per bet) | `bet_id`, `selection`, `result`, `stake`, `payout`, `net` |
| `User Signed Up` | AuthContext | `loyalty_id`, `signup_method` |
| `User Logged In` | AuthContext | `loyalty_id`, `login_method` |
| `User Logged Out` | AuthContext | `loyalty_id` |
| `Loyalty Points Earned` | LoyaltyContext | `loyalty_id`, `points_earned`, `earn_reason`, `points_balance`, `loyalty_tier` |
| `Loyalty Tier Changed` | LoyaltyContext | `loyalty_id`, `from_tier`, `to_tier`, `points_balance` |
| `Loyalty Card Viewed` | LoyaltyPage | `loyalty_id`, `loyalty_tier`, `points_balance` |
| `Deposit Made` | WalletContext (success only) | `amount`, `currency`, `card_brand`, `card_last_four`, `payment_method` |
| `Deposit Failed` | WalletContext | `amount`, `failure_reason`, `card_brand` |
| `Withdrawal Made` | WalletContext | `amount`, `currency`, `withdrawal_method` |
| `Withdrawal Failed` | WalletContext (validation + 8% simulated declines) | `amount`, `failure_reason` |
| `Search Performed` | SearchModal (debounced 400 ms) | `query`, `result_count`, `sport_filter`, `sort_by` |
| `Onboarding Started` / `Step Viewed` / `Completed` / `Skipped` | OnboardingOverlay | `step_index`, `step_name` |
| `Responsible Gambling Prompt Shown` / `Choice` | ResponsibleGamblingModal | `total_stake`, `choice` (`continued`\|`cancelled`) |
| `Session Timeout Warning Shown` / `Session Extended` / `Session Timed Out` | SessionTimeoutManager | — |
| `Notification Shown` | NotificationContext | `notification_type`, `title` |
| `Loyalty Card Scanned` | KioskScanPage | `loyalty_id` (+ kiosk context) |
| `Cash Inserted` | WalletContext.insertCash | `amount`, `balance_after`, `payment_method: cash` |
| `Button Clicked` | Landing, Login, Signup, Header, BetSlip, pages | `button_name`, `location`, plus ad-hoc props |

### Loyalty programme

- **Points:** 1 per whole dollar **staked**, credited at placement, not settlement. A losing bet
  still earns. Accruing on stake rather than winnings is what lets the identical rule apply to a
  cash bet taken over a counter, where there is no account balance to settle against.
- **Tiers:** Bronze 0, Silver 1,000, Gold 5,000, Platinum 20,000.
- **Ledger:** every credit records the originating `surface`, which is what makes "how much of
  our accrual comes from in-venue?" answerable. The balance is derived from the ledger rather
  than stored beside it, so the two cannot drift.
- **Card:** Code 39 barcode rendered as inline SVG (`components/Loyalty/Barcode.tsx`). Code 39
  covers `A-Z`, `0-9` and `-` with no check digit and no dependency, so it encodes the ID
  exactly and any retail scanner reads it unconfigured. The ID alphabet omits `0/O` and `1/I/L`,
  which are ambiguous both read aloud to call centre staff and printed as bars.

### User properties
Set via `Identify` on signup, login and session restore: `loyalty_id`, `email`, `first_name`,
`last_name`, `signup_date`, `last_login`, `user_type: 'demo_user'`, `loyalty_tier`,
`loyalty_points`.

### Identity

`user_id` is the **loyalty ID** (`AB-XXXXXXXX`) on every surface.

This is the feature the loyalty programme exists to enable, not an incidental choice. A bet
placed at a kiosk, a call to the contact centre and a deposit on the web only resolve to one
person if they agree on the identifier, and the loyalty card is the only identifier a customer
physically carries between them. Email cannot serve: at a kiosk the customer scans a card
rather than typing an address, so an email-keyed kiosk is a population of strangers.

The loyalty ID is also the account id (`User.id`) and the localStorage key suffix. That is
deliberate — one value rather than an internal id plus a separate loyalty number, because two
ids for one person is exactly what stops surfaces joining up.

**This is a breaking identity change.** Before it, the app used two conflicting schemes: signup
identified by a random internal id while login identified by email, so the same person accrued
two `user_id`s depending on how they arrived. Neither stitches to a loyalty ID. Consequences:

- Historical events keep their old `user_id` and will not join to post-change events for the
  same person. Cross-surface funnels should start from the release date.
- A session stored before the change has a random id; on restore it is migrated to a freshly
  minted loyalty ID, which orphans that browser's existing per-user localStorage keys.
- `setUserId(undefined)` now runs on logout, so anonymous browsing after sign-out is no longer
  attributed to the member who just left.

---

## 6. Design

The UI uses the **Amplitude brand palette from the PRD**, expressed as semantic tokens in
[tailwind.config.js](tailwind.config.js) — components reference token classes
(`bg-surface`, `text-accent`, …) rather than hex utilities, so the palette lives in one file.

| Token | Value | Use |
|---|---|---|
| `brand` / `brand-dark` | `#0052f2` / `#0041c2`* | CTAs, active nav, "BET" in wordmark |
| `ink` / `ink-deep` | `#001a4f` / `#001238`* | App shell / marketing & auth backgrounds |
| `surface` | `#002570`* | Cards, sidebar, bet slip |
| `raised` / `raised-light` | `#003398` / `#0f47c4`* | Inputs, chips, hover elevation |
| `accent` | `#6980ff` | Payouts, positive money, success, headings |
| `grape` | `#a373ff` | Link hover, esports chip |
| `salmon` | `#ff7d78` | Warnings (responsible gambling, failed withdrawals) |
| `danger` | `#f23845` | Errors, insufficient funds |
| `paper` | `#edf0f5` | Light text surfaces, Platinum tier |

\* Derived tints/shades — the PRD gives seven flat colours and a UI needs elevation steps and
hover states; derivations are documented in the config. Sport-chip colours in `mockData` and
the Bronze/Silver/Gold metals are data, not chrome, and keep their own values.

---

## 7. PRD delivery status and remaining gaps

### PRD requirements — delivered
| PRD requirement | State |
|---|---|
| **Withdrawal flow** | ✅ `/account`: validated amount, 8% simulated decline, tracked + toasted. |
| **Results & settlements page** | ✅ `/results`: pending list, explicit settlement from odds-implied probabilities, `Bet Settled` per bet. |
| **Notifications** (win/loss) | ✅ Toasts via `NotificationContext`, each emitting `Notification Shown`. |
| **Multi-bet / parlay builder** | ✅ Slip Singles/Multi modes, combined odds, incompatible-selection validation. |
| **Search & filter** by sport/date/popularity | ✅ Header search modal: text query, sport chips, soonest/most-markets sort, debounced `Search Performed`. Races are not searchable (head-to-head events only). |
| **Bet-placement random failure** (10–20% target) | ✅ 12% simulated bookmaker failure after validation, before funds move. |
| **Onboarding overlay** | ✅ 3-step first-visit tour, per-member flag, full started/step/completed/skipped funnel. |
| **Responsible Gambling modal** on large bets | ✅ Interrupts stakes > $200; prompt and choice tracked; helpline shown. |
| **Simulated session timeout** | ✅ 10-min idle → 60 s warning countdown → sign-out; warning/extended/timed-out tracked. |
| **Account overview page** | ✅ `/account`: profile, loyalty ID, withdraw, full transaction history. |
| **Keyboard navigation / screen-reader support** | ✅ (baseline) `useFocusTrap` on every dialog (trap, initial focus, Escape, focus restore), `aria-modal`/labels, `aria-live` toasts, labelled icon buttons. No skip links yet. |
| **Mobile responsiveness** | ✅ Below `lg`: sidebar drawer behind a hamburger, bet slip bottom sheet behind a floating toggle. |
| **Amplitude brand palette** | ✅ See §6. |
| **Racing** | ✅ `/racing` index + `/race/:raceId` win markets; home-page race rail repointed. |
| **Esports** | ✅ Three fixtures behind the existing sidebar link via the generic sport page. |

### Kiosk surface (Release 2)

Routes under `/kiosk`, same bundle and providers, own chrome (`KioskLayout` — no header,
sidebar, bet slip panel, onboarding or web session timeout). Designed for venue touchscreens:
large type, ≥ 64 px tap targets, no hover states.

- **Flow:** attract screen → scan rewards card → browse markets with giant odds buttons →
  slip with on-screen numeric keypad → confirmation showing points earned → finish.
- **Identity by card scan.** Barcode scanners are keyboard wedges (they type the code and
  press Enter), so the scan screen is a permanently-focused input that accepts scanner or
  manual entry, validates the `AB-XXXXXXXX` format, then `identifyAsMember(loyaltyId)` —
  no email, no password, because a card reader can produce neither. Any well-formed id is
  accepted (the mock has no member registry). `Loyalty Card Scanned` is tracked distinctly
  from `User Logged In` (`login_method: loyalty_card_scan`).
- **Cash, not cards.** The kiosk tops up with `insertCash` ($20/$50 acceptor buttons):
  instant, no simulated decline, tracked as `Cash Inserted` — deliberately not
  `Deposit Made`, which means a card payment with brand/last-four; conflating them would
  corrupt payment-mix analysis.
- **Singles only** (`setBetMode('singles')` on mount); the responsible-gambling gate and the
  12% simulated placement failures apply exactly as on the web.
- **Idle reset:** 90 s without touch signs the member out and returns to the attract screen —
  a shared venue terminal must never leave one member's session for the next walker-up.
- While kiosk routes are mounted, every event carries `surface: 'kiosk'` plus `kiosk_id` and
  `venue` (from localStorage `amplibet_kiosk`, defaulting to `KIOSK-01` / Collingwood),
  injected by the central `track` wrapper.

### Still not implemented
| Item | State |
|---|---|
| **Bot-driven data generation** | Planned as the cross-surface simulation script (Release 2, PR5). |
| **Featured-events carousel** on landing | Static 4-up benefit grid instead. |
| **Markets beyond Match Result / Win** | Handicap, totals etc. render but are inert. |
| **Theme toggle** | Header button emits `Button Clicked` only. |
| **Live odds movement** | All odds static until the fixture-sync work (PR5). |

### Known defects — all fixed (kept as a log; numbers are referenced elsewhere)

Every defect below is **fixed** (1–7, 10 in PR #2's branch; 8–9 likewise; 11–12 in the
loyalty and PRD-features work). Two more were found and fixed during the PRD-features pass:

13. **Two settlement engines.** `MyBetsPage` kept its original 30-second 60% coin flip after
    `settlePendingBets()` landed — untracked, untoasted, and racing the real engine, which
    could settle the same bet twice and double-pay a winner. The page-level settler is
    removed; settlement is only `BettingContext.settlePendingBets()`.
14. **`Event Selected` on unknown-id fallback** (see 10) would have returned via the race
    pages had `RacePage` reused the fallback pattern; it renders a not-found state instead.

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
12. **Persisted state was wiped on every page load.** In `WalletContext` and
    `BettingContext` the load effect and the save effect both fire in the commit where
    `user` first appears. The save runs second and wrote the still-empty pre-load state
    straight over storage, so a balance, slip and bet history did not survive a reload.
    Fixed by recording in state which member the state belongs to and only persisting
    once it matches the signed-in user. `LoyaltyContext` uses the same guard.
    Only found by placing a bet and reloading — it is invisible in review, and the
    length guard removed as defect 6 was masking it for transactions.

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
