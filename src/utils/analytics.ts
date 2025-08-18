// Mock analytics implementation (no external dependencies)
// This replaces the Amplitude implementation until you can install the package
// Console logger for development
const logEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics] ${eventName}`, eventProperties);
  }
};
// Initialize function (would normally set up Amplitude)
export const initializeAnalytics = () => {
  console.log('[Analytics] Initialized mock analytics service');
  // In a real implementation, this would initialize Amplitude
  // amplitude.init('13436f4cc096d85812e7eaacc3fae258')
};
// Track page views
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  logEvent('Page Viewed', {
    page: pageName,
    ...properties
  });
};
// Track sport selection
export const trackSportSelected = (sportId: string, sportName: string) => {
  logEvent('Sport Selected', {
    sportId,
    sportName
  });
};
// Track event selection
export const trackEventSelected = (eventId: string, homeTeam: string, awayTeam: string, sportId: string) => {
  logEvent('Event Selected', {
    eventId,
    matchup: `${homeTeam} vs ${awayTeam}`,
    sportId
  });
};
// Track bet actions
export const trackBetAdded = (betId: string, eventId: string, selection: string, odds: number) => {
  logEvent('Bet Added', {
    betId,
    eventId,
    selection,
    odds
  });
};
export const trackBetRemoved = (betId: string) => {
  logEvent('Bet Removed', {
    betId
  });
};
export const trackBetUpdated = (betId: string, stake: number) => {
  logEvent('Bet Updated', {
    betId,
    stake
  });
};
export const trackBetPlaced = (bets: Array<{
  id: string;
  selection: string;
  odds: number;
  stake?: number;
}>, totalStake: number, estimatedPayout: number) => {
  logEvent('Bet Placed', {
    betCount: bets.length,
    totalStake,
    estimatedPayout,
    bets: bets.map(bet => ({
      id: bet.id,
      selection: bet.selection,
      odds: bet.odds,
      stake: bet.stake || 0
    }))
  });
};
// Set user properties
export const setUserProperties = (userId: string, properties: Record<string, any>) => {
  logEvent('User Properties Set', {
    userId,
    properties
  });
  // In a real implementation, this would use Amplitude's identify method
  // const identifyObj = new amplitude.Identify()
  // Object.entries(properties).forEach(([key, value]) => {
  //   identifyObj.set(key, value)
  // })
  // amplitude.identify(identifyObj, { user_id: userId })
};