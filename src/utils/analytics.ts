import { initAll, add, track, identify } from '@amplitude/unified';
// Import Identify class from the underlying analytics package that unified uses
import { Identify } from '@amplitude/analytics-browser';
// Guides & Surveys (in-product engagement) plugin
import { plugin as engagementPlugin } from '@amplitude/engagement-browser';

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
}>, totalStake: number, estimatedPayout: number) => {
  track('Bet Placed', {
    bet_count: bets.length,
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
// Set user properties
export const setUserProperties = (userId: string, properties: Record<string, any>) => {
  const identifyObj = new Identify();
  
  Object.entries(properties).forEach(([key, value]) => {
    identifyObj.set(key, value);
  });
  
  identify(identifyObj, { user_id: userId });
  
  // Also track the user identification event
  track('User Identified', {
    user_id: userId,
    timestamp: new Date().toISOString(),
    properties
  });
};

// New authentication tracking functions
export const trackUserSignup = (userId: string, email: string, firstName: string, lastName: string) => {
  track('User Signed Up', {
    user_id: userId,
    email: email,
    first_name: firstName,
    last_name: lastName,
    signup_method: 'demo_form',
    timestamp: new Date().toISOString()
  });
  
  // Set user properties
  setUserProperties(userId, {
    email,
    first_name: firstName,
    last_name: lastName,
    signup_date: new Date().toISOString(),
    user_type: 'demo_user'
  });
};

export const identifyUser = (email: string, firstName?: string, lastName?: string) => {
  // Use email as the user ID in Amplitude
  const identifyObj = new Identify();
  
  // Set user properties
  identifyObj.set('email', email);
  if (firstName) identifyObj.set('first_name', firstName);
  if (lastName) identifyObj.set('last_name', lastName);
  identifyObj.set('last_login', new Date().toISOString());
  
  // Identify the user with email as user_id
  identify(identifyObj, { user_id: email });
  
  console.log(`[Analytics] User identified with email: ${email}`);
};

export const trackUserLogin = (userId: string, email: string) => {
  // Identify the user first
  identifyUser(email);
  
  track('User Logged In', {
    user_id: userId,
    email: email,
    login_method: 'demo_form',
    timestamp: new Date().toISOString()
  });
};

export const trackUserLogout = (userId: string) => {
  track('User Logged Out', {
    user_id: userId,
    timestamp: new Date().toISOString()
  });
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

// Track UI interactions
export const trackButtonClick = (buttonName: string, location: string, additionalProperties?: Record<string, any>) => {
  track('Button Clicked', {
    button_name: buttonName,
    location: location,
    timestamp: new Date().toISOString(),
    ...additionalProperties
  });
};
