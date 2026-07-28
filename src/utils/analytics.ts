import { initAll, add, track as amplitudeTrack, identify, setUserId } from '@amplitude/unified';
// Import Identify class from the underlying analytics package that unified uses
import { Identify } from '@amplitude/analytics-browser';
// Guides & Surveys (in-product engagement) plugin
import { plugin as engagementPlugin } from '@amplitude/engagement-browser';
import { detectSurface, type ClientSurface } from './surface';

const AMPLITUDE_API_KEY = '51a87354dce5f3a16ac6fe902c4c59a0';

// Initialize at module load so tracking calls on the landing page fire correctly
// before any React component effects run.
try {
  initAll(AMPLITUDE_API_KEY, {
    serverZone: 'US',
    instanceName: 'amplibet-demo',
    analytics: {
      autocapture: {
        attribution: true,
        fileDownloads: true,
        formInteractions: true,
        pageViews: true,
        sessions: true,
        elementInteractions: true
      },
      defaultTracking: {
        attribution: true,
        fileDownloads: true,
        formInteractions: true,
        pageViews: true,
        sessions: true
      }
    },
    sr: {
      sampleRate: 1
    },
    experiment: {
      source: 'amplibet-demo'
    }
  });

  // Add Amplitude Guides & Surveys (in-product engagement) as a plugin on the
  // unified analytics instance. In plugin mode the SDK boots itself off the
  // analytics instance's user/device — no separate init()/boot() needed.
  add(engagementPlugin({
    serverZone: 'US',
    autoRefreshIntervalSeconds: 3600
  }));
} catch (error) {
  console.error('[Analytics] Failed to initialize Amplitude:', error);
}

// The surface this session is running as. Read once at module load from the URL so
// it is set before the first event, then kept in sync by setSurface as the router
// moves in and out of /kiosk.
let currentSurface: ClientSurface = detectSurface();

export const setSurface = (surface: ClientSurface) => {
  currentSurface = surface;
};

export const getSurface = (): ClientSurface => currentSurface;

// Which physical kiosk this is. Set by KioskLayout while the kiosk routes are
// mounted; carried on every event alongside `surface` so venue-level analysis
// ("which store's kiosk converts best?") is possible without a separate join.
let kioskContext: { kiosk_id: string; venue: string } | null = null;

export const setKioskContext = (context: { kiosk_id: string; venue: string } | null) => {
  kioskContext = context;
};

// Every event goes through here so that `surface` cannot be forgotten on one call
// site and silently break the cross-surface comparison the whole demo is built
// around. Call this rather than the SDK's track directly.
const track = (eventName: string, properties?: Record<string, any>) => {
  amplitudeTrack(eventName, { surface: currentSurface, ...(kioskContext ?? {}), ...properties });
};

// Track page views
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  track('Page Viewed', {
    page_name: pageName,
    timestamp: new Date().toISOString(),
    ...properties
  });
};
// Track sport selection
export const trackSportSelected = (sportId: string, sportName: string) => {
  track('Sport Selected', {
    sport_id: sportId,
    sport_name: sportName,
    timestamp: new Date().toISOString()
  });
};
// Track event selection
export const trackEventSelected = (eventId: string, homeTeam: string, awayTeam: string, sportId: string) => {
  track('Event Selected', {
    event_id: eventId,
    home_team: homeTeam,
    away_team: awayTeam,
    matchup: `${homeTeam} vs ${awayTeam}`,
    sport_id: sportId,
    timestamp: new Date().toISOString()
  });
};
// Track bet actions
export const trackBetAdded = (betId: string, eventId: string, selection: string, odds: number) => {
  track('Bet Added', {
    bet_id: betId,
    event_id: eventId,
    selection: selection,
    odds: odds,
    timestamp: new Date().toISOString()
  });
};
export const trackBetRemoved = (betId: string) => {
  track('Bet Removed', {
    bet_id: betId,
    timestamp: new Date().toISOString()
  });
};
export const trackBetUpdated = (betId: string, stake: number) => {
  track('Bet Stake Updated', {
    bet_id: betId,
    stake: stake,
    timestamp: new Date().toISOString()
  });
};
export const trackBetPlaced = (bets: Array<{
  id: string;
  selection: string;
  odds: number;
  stake?: number;
}>, totalStake: number, estimatedPayout: number, betType: 'single' | 'multi' = 'single', combinedOdds?: number) => {
  track('Bet Placed', {
    bet_count: bets.length,
    bet_type: betType,
    combined_odds: combinedOdds,
    total_stake: totalStake,
    estimated_payout: estimatedPayout,
    potential_profit: estimatedPayout - totalStake,
    timestamp: new Date().toISOString(),
    bets: bets.map(bet => ({
      id: bet.id,
      selection: bet.selection,
      odds: bet.odds,
      stake: bet.stake || 0,
      potential_win: (bet.stake || 0) * bet.odds
    }))
  });
};

// A pending bet resolving to won or lost. Fired once per bet at settlement so
// win rate, hold and payout are analysable per selection rather than only in
// aggregate.
export const trackBetSettled = (
  betId: string,
  selection: string,
  result: 'won' | 'lost',
  stake: number,
  payout: number
) => {
  track('Bet Settled', {
    bet_id: betId,
    selection,
    result,
    stake,
    payout,
    net: payout - stake,
    timestamp: new Date().toISOString()
  });
};
// Identity
//
// The loyalty ID is the Amplitude user_id on every surface. That is the whole
// point of it: a bet placed at a kiosk, a phone call to the contact centre and a
// deposit on the web all resolve to one user only if they agree on the id, and the
// loyalty card is the only identifier a person physically carries between them.
//
// Email is a user property, not the identity. It is not available at a kiosk (the
// customer scans a card, they do not type an address), so using it as the user_id
// would make the kiosk a population of strangers.
//
// This replaces two conflicting schemes: signup identified by a random internal
// id while login identified by email, so one person accrued two user_ids
// depending on how they arrived. See the identity note in SPECIFICATION.md —
// events recorded under either old scheme do not stitch to loyalty IDs.
export const setUserProperties = (loyaltyId: string, properties: Record<string, any>) => {
  const identifyObj = new Identify();

  Object.entries(properties).forEach(([key, value]) => {
    identifyObj.set(key, value);
  });

  identify(identifyObj, { user_id: loyaltyId });
};

// Bind the SDK's user_id. Call this before tracking anything that should be
// attributed to the person, including on session restore.
export const identifyLoyaltyMember = (
  loyaltyId: string,
  properties?: Record<string, any>
) => {
  setUserId(loyaltyId);
  if (properties) setUserProperties(loyaltyId, properties);
};

export const trackUserSignup = (
  loyaltyId: string,
  email: string,
  firstName: string,
  lastName: string
) => {
  // Identify before tracking so the signup event itself is attributed to the new
  // loyalty ID rather than landing on the anonymous device.
  identifyLoyaltyMember(loyaltyId, {
    loyalty_id: loyaltyId,
    email,
    first_name: firstName,
    last_name: lastName,
    signup_date: new Date().toISOString(),
    user_type: 'demo_user',
    loyalty_tier: 'Bronze',
    loyalty_points: 0
  });

  track('User Signed Up', {
    loyalty_id: loyaltyId,
    signup_method: 'demo_form',
    timestamp: new Date().toISOString()
  });
};

export const trackUserLogin = (
  loyaltyId: string,
  email: string,
  loginMethod: 'demo_form' | 'loyalty_card_scan' = 'demo_form'
) => {
  identifyLoyaltyMember(loyaltyId, {
    loyalty_id: loyaltyId,
    // A kiosk scan knows only the card, not the address; don't overwrite a real
    // email property with an empty string.
    ...(email ? { email } : {}),
    last_login: new Date().toISOString()
  });

  track('User Logged In', {
    loyalty_id: loyaltyId,
    login_method: loginMethod,
    timestamp: new Date().toISOString()
  });
};

// A loyalty card read at a kiosk. Distinct from 'User Logged In' so scan volume
// is analysable even when the same member scans repeatedly.
export const trackLoyaltyCardScanned = (loyaltyId: string) => {
  track('Loyalty Card Scanned', {
    loyalty_id: loyaltyId,
    timestamp: new Date().toISOString()
  });
};

// Cash fed into a kiosk. Deliberately not 'Deposit Made' — that event means a
// card payment with brand/last-four; conflating them would corrupt the payment
// mix analysis.
export const trackCashInserted = (amount: number, balanceAfter: number) => {
  track('Cash Inserted', {
    amount,
    currency: 'USD',
    balance_after: balanceAfter,
    payment_method: 'cash',
    timestamp: new Date().toISOString()
  });
};

export const trackUserLogout = (loyaltyId: string) => {
  track('User Logged Out', {
    loyalty_id: loyaltyId,
    timestamp: new Date().toISOString()
  });
  // Clear the user_id so any subsequent anonymous browsing on this device is not
  // attributed to the member who just signed out.
  setUserId(undefined);
};

// Get card brand from card number (basic detection). Note we deliberately never
// send the cardholder name or full card number to analytics.
const getCardBrand = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.startsWith('4')) return 'Visa';
  if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'Mastercard';
  if (cleanNumber.startsWith('3')) return 'American Express';
  if (cleanNumber.startsWith('6')) return 'Discover';
  return 'Unknown';
};

// Track deposit events
export const trackDeposit = (userId: string, amount: number, cardInfo: { cardNumber: string }) => {
  const cardBrand = getCardBrand(cardInfo.cardNumber);
  const lastFourDigits = cardInfo.cardNumber.replace(/\s/g, '').slice(-4);

  track('Deposit Made', {
    user_id: userId,
    amount: amount,
    currency: 'USD',
    payment_method: 'credit_card',
    card_brand: cardBrand,
    card_last_four: lastFourDigits,
    timestamp: new Date().toISOString(),
    deposit_method: 'demo_form',
    transaction_type: 'deposit'
  });

  console.log(`[Analytics] Deposit tracked: $${amount} via ${cardBrand} ending in ${lastFourDigits}`);
};

// Track failed bet placement. The PRD calls for error states to be analysable;
// without this event the demo's failure paths are invisible in Amplitude.
export const trackBetPlacementFailed = (
  reason: string,
  bets: Array<{ id: string; selection: string; odds: number; stake?: number }>,
  totalStake: number
) => {
  track('Bet Placement Failed', {
    failure_reason: reason,
    bet_count: bets.length,
    total_stake: totalStake,
    timestamp: new Date().toISOString(),
    selections: bets.map(bet => bet.selection)
  });
};

// Track failed deposit.
export const trackDepositFailed = (amount: number, reason: string, cardNumber?: string) => {
  track('Deposit Failed', {
    amount,
    currency: 'USD',
    failure_reason: reason,
    payment_method: 'credit_card',
    card_brand: cardNumber ? getCardBrand(cardNumber) : undefined,
    timestamp: new Date().toISOString(),
    transaction_type: 'deposit'
  });
};

// Loyalty
//
// Points are earned on every surface, so these events carry the surface (added
// automatically by track) and the loyalty ID. 'Loyalty Points Earned' is the event
// that makes accrual attributable: without it you can see a balance but not where
// it came from.
export const trackLoyaltyPointsEarned = (
  loyaltyId: string,
  points: number,
  reason: string,
  balanceAfter: number,
  tier: string
) => {
  track('Loyalty Points Earned', {
    loyalty_id: loyaltyId,
    points_earned: points,
    earn_reason: reason,
    points_balance: balanceAfter,
    loyalty_tier: tier,
    timestamp: new Date().toISOString()
  });
};

export const trackLoyaltyTierChanged = (
  loyaltyId: string,
  fromTier: string,
  toTier: string,
  points: number
) => {
  track('Loyalty Tier Changed', {
    loyalty_id: loyaltyId,
    from_tier: fromTier,
    to_tier: toTier,
    points_balance: points,
    timestamp: new Date().toISOString()
  });
  // Tier is a user property as well as an event: most segmentation wants "all
  // Gold members" rather than "everyone who crossed into Gold in this window".
  setUserProperties(loyaltyId, { loyalty_tier: toTier, loyalty_points: points });
};

export const trackLoyaltyCardViewed = (loyaltyId: string, tier: string, points: number) => {
  track('Loyalty Card Viewed', {
    loyalty_id: loyaltyId,
    loyalty_tier: tier,
    points_balance: points,
    timestamp: new Date().toISOString()
  });
};

// Wallet
export const trackWithdrawal = (amount: number) => {
  track('Withdrawal Made', {
    amount,
    currency: 'USD',
    withdrawal_method: 'bank_transfer',
    timestamp: new Date().toISOString(),
    transaction_type: 'withdrawal'
  });
};

export const trackWithdrawalFailed = (amount: number, reason: string) => {
  track('Withdrawal Failed', {
    amount,
    currency: 'USD',
    failure_reason: reason,
    withdrawal_method: 'bank_transfer',
    timestamp: new Date().toISOString(),
    transaction_type: 'withdrawal'
  });
};

// Search
export const trackSearchPerformed = (
  query: string,
  resultCount: number,
  sportFilter: string | null,
  sortBy: string
) => {
  track('Search Performed', {
    query,
    result_count: resultCount,
    sport_filter: sportFilter ?? 'all',
    sort_by: sortBy,
    timestamp: new Date().toISOString()
  });
};

// Onboarding
export const trackOnboardingStarted = () => {
  track('Onboarding Started', { timestamp: new Date().toISOString() });
};

export const trackOnboardingStepViewed = (stepIndex: number, stepName: string) => {
  track('Onboarding Step Viewed', {
    step_index: stepIndex,
    step_name: stepName,
    timestamp: new Date().toISOString()
  });
};

export const trackOnboardingCompleted = () => {
  track('Onboarding Completed', { timestamp: new Date().toISOString() });
};

export const trackOnboardingSkipped = (stepIndex: number) => {
  track('Onboarding Skipped', {
    step_index: stepIndex,
    timestamp: new Date().toISOString()
  });
};

// Responsible gambling. The prompt and the choice are separate events so the
// funnel (prompted → continued vs cancelled) is analysable.
export const trackResponsibleGamblingPromptShown = (totalStake: number) => {
  track('Responsible Gambling Prompt Shown', {
    total_stake: totalStake,
    timestamp: new Date().toISOString()
  });
};

export const trackResponsibleGamblingChoice = (
  choice: 'continued' | 'cancelled',
  totalStake: number
) => {
  track('Responsible Gambling Choice', {
    choice,
    total_stake: totalStake,
    timestamp: new Date().toISOString()
  });
};

// Session timeout
export const trackSessionTimeoutWarningShown = () => {
  track('Session Timeout Warning Shown', { timestamp: new Date().toISOString() });
};

export const trackSessionTimedOut = () => {
  track('Session Timed Out', { timestamp: new Date().toISOString() });
};

export const trackSessionExtended = () => {
  track('Session Extended', { timestamp: new Date().toISOString() });
};

// In-app notifications (toasts)
export const trackNotificationShown = (notificationType: string, title: string) => {
  track('Notification Shown', {
    notification_type: notificationType,
    title,
    timestamp: new Date().toISOString()
  });
};

// Track UI interactions
export const trackButtonClick = (buttonName: string, location: string, additionalProperties?: Record<string, any>) => {
  track('Button Clicked', {
    button_name: buttonName,
    location: location,
    timestamp: new Date().toISOString(),
    ...additionalProperties
  });
};
