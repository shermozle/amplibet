import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { trackBetAdded, trackBetRemoved, trackBetUpdated, trackBetPlaced, trackBetPlacementFailed, trackBetSettled } from '../utils/analytics';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { useLoyalty } from './LoyaltyContext';
import { useNotifications } from './NotificationContext';
// A selection sitting in the bet slip. Stake is optional until the user types one.
export interface Bet {
  id: string;
  eventId: string;
  selection: string;
  odds: number;
  stake?: number;
}
// A bet that has been placed. Placement guarantees a stake, a timestamp, a
// status and a potential payout, so these are required here rather than
// optional — which is what let `undefined` leak into the history UI.
export interface PlacedBet extends Bet {
  stake: number;
  placedAt: Date;
  status: 'pending' | 'won' | 'lost';
  potentialPayout: number;
  actualPayout?: number;
  settledAt?: Date;
  // Optional so bets stored before multis existed still parse. Absent means a
  // single.
  betType?: 'single' | 'multi';
  // The legs of a multi, kept for display. A multi's own odds/selection fields
  // hold the combined odds and a summary label.
  legs?: Array<{ selection: string; odds: number; eventId: string }>;
}

export type BetMode = 'singles' | 'multi';

// Above this combined stake the responsible-gambling prompt interrupts
// placement. Exported so the modal and the slip agree on one number.
export const RESPONSIBLE_GAMBLING_THRESHOLD = 200;

// The PRD asks for a 10–20% bet-placement error rate so the demo generates
// analysable failure states. Applied after validation passes, before funds
// move, so a simulated failure never costs the user money.
const SIMULATED_FAILURE_RATE = 0.12;
const SIMULATED_FAILURES = [
  'Odds changed while placing your bet. Review the new price and try again.',
  'Market suspended by the bookmaker. Try again shortly.',
  'Timed out confirming your bet with the bookmaker.'
];
interface BettingContextType {
  selectedBets: Bet[];
  addBet: (bet: Bet) => void;
  removeBet: (betId: string) => void;
  updateStake: (betId: string, stake: number) => void;
  placeBets: () => Promise<void>;
  settleBet: (betId: string, status: 'won' | 'lost', actualPayout?: number) => void;
  settlePendingBets: () => { settled: number; won: number; lost: number; totalPayout: number };
  totalStake: number;
  estimatedPayout: number;
  betHistory: PlacedBet[];
  isPlacingBet: boolean;
  betMode: BetMode;
  setBetMode: (mode: BetMode) => void;
  multiStake: number;
  setMultiStake: (stake: number) => void;
  combinedOdds: number;
  multiPayout: number;
  // Human-readable reason the current slip cannot be placed as a multi, or ''
  // when it can. Computed here so the slip and placeBets cannot disagree.
  multiValidationError: string;
}
const BettingContext = createContext<BettingContextType | undefined>(undefined);
export const BettingProvider: React.FC<{
  children: ReactNode;
}> = ({
  children
}) => {
  const [selectedBets, setSelectedBets] = useState<Bet[]>([]);
  const [betHistory, setBetHistory] = useState<PlacedBet[]>([]);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betMode, setBetMode] = useState<BetMode>('singles');
  const [multiStake, setMultiStake] = useState(0);
  // Which member the slip and history in state belong to, or null before they have
  // been loaded. The save effects below key off this rather than `isAuthenticated`:
  // both a load and a save effect fire in the commit where `user` appears, the save
  // runs second, and it would otherwise write the still-empty pre-load arrays over
  // the stored slip and history, clearing them on every page load.
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { deductFunds, addPayout, balance } = useWallet();
  const { earnPointsForStake } = useLoyalty();
  const { notify } = useNotifications();
  const hydrated = hydratedFor !== null && hydratedFor === user?.id;

  // Load bets from localStorage when user changes or on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedBets = localStorage.getItem(`amplibet_bets_${user.id}`);
      const storedHistory = localStorage.getItem(`amplibet_history_${user.id}`);
      
      if (storedBets) {
        try {
          setSelectedBets(JSON.parse(storedBets));
        } catch (error) {
          console.error('Error parsing stored bets:', error);
        }
      }
      
      if (storedHistory) {
        try {
          setBetHistory(JSON.parse(storedHistory));
        } catch (error) {
          console.error('Error parsing bet history:', error);
        }
      }

      setHydratedFor(user.id);
    } else {
      // Clear bets when not authenticated
      setSelectedBets([]);
      setBetHistory([]);
      setHydratedFor(null);
    }
  }, [user, isAuthenticated]);

  // Save bets to localStorage whenever they change
  useEffect(() => {
    if (hydrated && user) {
      localStorage.setItem(`amplibet_bets_${user.id}`, JSON.stringify(selectedBets));
    }
  }, [selectedBets, hydrated, user]);

  // Save bet history to localStorage whenever it changes
  useEffect(() => {
    if (hydrated && user) {
      localStorage.setItem(`amplibet_history_${user.id}`, JSON.stringify(betHistory));
    }
  }, [betHistory, hydrated, user]);
  const addBet = (bet: Bet) => {
    // Keyed by bet id (event + selection), not by event: both sides of a match
    // may sit in the slip at once. As singles that is legitimate dutching; as a
    // multi it is exactly the incompatible combination the validation below
    // exists to reject — which it could never demonstrate if this replaced any
    // same-event selection on entry.
    const existingBetIndex = selectedBets.findIndex(b => b.id === bet.id);
    if (existingBetIndex >= 0) {
      const newBets = [...selectedBets];
      // Re-clicking a selection refreshes its odds but keeps the typed stake.
      newBets[existingBetIndex] = { ...bet, stake: newBets[existingBetIndex].stake };
      setSelectedBets(newBets);
    } else {
      setSelectedBets([...selectedBets, bet]);
    }
    trackBetAdded(bet.id, bet.eventId, bet.selection, bet.odds);
  };
  const removeBet = (betId: string) => {
    setSelectedBets(selectedBets.filter(bet => bet.id !== betId));
    // Track bet removed in analytics
    trackBetRemoved(betId);
  };
  const updateStake = (betId: string, stake: number) => {
    setSelectedBets(selectedBets.map(bet => bet.id === betId ? {
      ...bet,
      stake
    } : bet));
    // Track bet stake updated in analytics
    trackBetUpdated(betId, stake);
  };
  const totalStake = selectedBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  const estimatedPayout = selectedBets.reduce((sum, bet) => {
    if (!bet.stake) return sum;
    return sum + bet.stake * bet.odds;
  }, 0);

  // A multi multiplies the legs' odds into one price on a single stake.
  const combinedOdds = selectedBets.reduce((product, bet) => product * bet.odds, 1);
  const multiPayout = multiStake * combinedOdds;

  // Why a slip cannot be placed as a multi. Two selections from the same event
  // are incompatible: they cannot both win, so their product odds are
  // meaningless. Legitimate as singles (dutching), rejected as a multi.
  const multiValidationError = betMode !== 'multi' ? '' :
    selectedBets.length < 2 ? 'Add at least two selections for a multi.' :
    new Set(selectedBets.map(bet => bet.eventId)).size < selectedBets.length
      ? 'A multi cannot include two selections from the same event.'
      : '';

  // The stake actually in play depends on the mode: singles sum their stakes, a
  // multi has one stake across the combined odds.
  const stakeInPlay = betMode === 'multi' ? multiStake : totalStake;

  // Every rejection path emits 'Bet Placement Failed' before throwing, so the
  // error states the demo exists to showcase are visible in Amplitude.
  const fail = (reason: string): never => {
    trackBetPlacementFailed(reason, selectedBets, stakeInPlay);
    throw new Error(reason);
  };

  const placeBets = async (): Promise<void> => {
    if (selectedBets.length === 0) return;
    if (!isAuthenticated) {
      fail('Must be logged in to place bets');
    }

    if (betMode === 'multi' && multiValidationError) {
      fail(multiValidationError);
    }

    // Check if user has sufficient balance
    if (stakeInPlay > balance) {
      fail('Insufficient funds. Please deposit more money to place this bet.');
    }

    // Check stakes are set
    if (betMode === 'multi') {
      if (multiStake <= 0) fail('Please set a stake for your multi.');
    } else {
      const betsWithoutStake = selectedBets.filter(bet => !bet.stake || bet.stake <= 0);
      if (betsWithoutStake.length > 0) {
        fail('Please set stake amounts for all bets.');
      }
    }

    setIsPlacingBet(true);

    const description = betMode === 'multi'
      ? `${selectedBets.length}-leg multi`
      : `Bet on ${selectedBets.length} selection${selectedBets.length > 1 ? 's' : ''}`;

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulated bookmaker rejection, per the PRD's error-rate target — after
      // validation and before money moves, so a simulated failure never costs
      // the user funds.
      if (Math.random() < SIMULATED_FAILURE_RATE) {
        fail(SIMULATED_FAILURES[Math.floor(Math.random() * SIMULATED_FAILURES.length)]);
      }

      // Deduct funds from wallet
      const success = deductFunds(stakeInPlay, description);
      if (!success) {
        fail('Failed to deduct funds. Please try again.');
      }

      // Track bet placed in analytics
      if (betMode === 'multi') {
        trackBetPlaced(selectedBets, multiStake, multiPayout, 'multi', combinedOdds);
      } else {
        trackBetPlaced(selectedBets, totalStake, estimatedPayout, 'single');
      }

      // Add completed bets to history with timestamp and outcome. A multi lands
      // as one PlacedBet at the combined odds with its legs preserved.
      const completedBets: PlacedBet[] = betMode === 'multi' ? [{
        id: `multi-${Date.now()}`,
        eventId: 'multi',
        selection: `${selectedBets.length}-leg multi: ${selectedBets.map(bet => bet.selection).join(' / ')}`,
        odds: combinedOdds,
        stake: multiStake,
        placedAt: new Date(),
        status: 'pending' as const,
        potentialPayout: multiPayout,
        betType: 'multi' as const,
        legs: selectedBets.map(bet => ({ selection: bet.selection, odds: bet.odds, eventId: bet.eventId }))
      }] : selectedBets.map(bet => ({
        ...bet,
        stake: bet.stake ?? 0,
        placedAt: new Date(),
        status: 'pending' as const,
        potentialPayout: bet.stake ? bet.stake * bet.odds : 0,
        betType: 'single' as const
      }));
      
      setBetHistory(prev => [...completedBets, ...prev]);

      // Points are credited at placement, not at settlement, and on stake rather
      // than winnings — so a losing bet still earns. This is what lets the same
      // rule apply to a cash bet taken at a kiosk, where there is no account
      // balance to settle against.
      earnPointsForStake(stakeInPlay, description);

      // Clear the slip
      setSelectedBets([]);
      setMultiStake(0);

    } finally {
      setIsPlacingBet(false);
    }
  };

  // Resolve every pending bet with a simulated result: win probability is the
  // implied probability of the odds with a 5% house margin, so long shots lose
  // more often and the book holds — the histories this produces look like real
  // ones. Winners are paid into the wallet and every settlement is tracked and
  // toasted.
  const settlePendingBets = (): { settled: number; won: number; lost: number; totalPayout: number } => {
    const pending = betHistory.filter(bet => bet.status === 'pending');
    if (pending.length === 0) return { settled: 0, won: 0, lost: 0, totalPayout: 0 };

    const results = new Map<string, { status: 'won' | 'lost'; payout: number }>();
    let won = 0;
    let lost = 0;
    let totalPayout = 0;

    for (const bet of pending) {
      const winProbability = Math.min(0.95, 0.95 / bet.odds);
      const isWin = Math.random() < winProbability;
      const payout = isWin ? bet.potentialPayout : 0;
      results.set(bet.id, { status: isWin ? 'won' : 'lost', payout });

      trackBetSettled(bet.id, bet.selection, isWin ? 'won' : 'lost', bet.stake, payout);
      if (isWin) {
        won++;
        totalPayout += payout;
        addPayout(payout, `Winnings: ${bet.selection}`);
        notify('success', 'You won!', `${bet.selection} paid $${payout.toFixed(2)}.`);
      } else {
        lost++;
        notify('info', 'Bet settled', `${bet.selection} didn't get there this time.`);
      }
    }

    const settledAt = new Date();
    setBetHistory(prevHistory => prevHistory.map(bet => {
      const result = results.get(bet.id);
      return result
        ? { ...bet, status: result.status, actualPayout: result.payout, settledAt }
        : bet;
    }));

    return { settled: pending.length, won, lost, totalPayout };
  };
  
  const settleBet = (betId: string, status: 'won' | 'lost', actualPayout = 0): void => {
    setBetHistory(prevHistory => 
      prevHistory.map(bet => 
        bet.id === betId 
          ? {
              ...bet,
              status,
              actualPayout,
              settledAt: new Date()
            }
          : bet
      )
    );
  };
  return <BettingContext.Provider value={{
    selectedBets,
    addBet,
    removeBet,
    updateStake,
    placeBets,
    settleBet,
    settlePendingBets,
    totalStake,
    estimatedPayout,
    betHistory,
    isPlacingBet,
    betMode,
    setBetMode,
    multiStake,
    setMultiStake,
    combinedOdds,
    multiPayout,
    multiValidationError
  }}>
      {children}
    </BettingContext.Provider>;
};
export const useBetting = () => {
  const context = useContext(BettingContext);
  if (context === undefined) {
    throw new Error('useBetting must be used within a BettingProvider');
  }
  return context;
};