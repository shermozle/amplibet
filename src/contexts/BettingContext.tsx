import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { trackBetAdded, trackBetRemoved, trackBetUpdated, trackBetPlaced, trackBetPlacementFailed } from '../utils/analytics';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { useLoyalty } from './LoyaltyContext';
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
}
interface BettingContextType {
  selectedBets: Bet[];
  addBet: (bet: Bet) => void;
  removeBet: (betId: string) => void;
  updateStake: (betId: string, stake: number) => void;
  placeBets: () => Promise<void>;
  settleBet: (betId: string, status: 'won' | 'lost', actualPayout?: number) => void;
  totalStake: number;
  estimatedPayout: number;
  betHistory: PlacedBet[];
  isPlacingBet: boolean;
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
  // Which member the slip and history in state belong to, or null before they have
  // been loaded. The save effects below key off this rather than `isAuthenticated`:
  // both a load and a save effect fire in the commit where `user` appears, the save
  // runs second, and it would otherwise write the still-empty pre-load arrays over
  // the stored slip and history, clearing them on every page load.
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { deductFunds, balance } = useWallet();
  const { earnPointsForStake } = useLoyalty();
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
    // Replace existing bet for same selection if it exists
    const existingBetIndex = selectedBets.findIndex(b => b.eventId === bet.eventId);
    if (existingBetIndex >= 0) {
      const newBets = [...selectedBets];
      newBets[existingBetIndex] = bet;
      setSelectedBets(newBets);
      // Track bet updated in analytics
      trackBetAdded(bet.id, bet.eventId, bet.selection, bet.odds);
    } else {
      setSelectedBets([...selectedBets, bet]);
      // Track bet added in analytics
      trackBetAdded(bet.id, bet.eventId, bet.selection, bet.odds);
    }
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
  // Every rejection path emits 'Bet Placement Failed' before throwing, so the
  // error states the demo exists to showcase are visible in Amplitude.
  const fail = (reason: string): never => {
    trackBetPlacementFailed(reason, selectedBets, totalStake);
    throw new Error(reason);
  };

  const placeBets = async (): Promise<void> => {
    if (selectedBets.length === 0) return;
    if (!isAuthenticated) {
      fail('Must be logged in to place bets');
    }

    // Check if user has sufficient balance
    if (totalStake > balance) {
      fail('Insufficient funds. Please deposit more money to place this bet.');
    }

    // Check if all bets have stakes
    const betsWithoutStake = selectedBets.filter(bet => !bet.stake || bet.stake <= 0);
    if (betsWithoutStake.length > 0) {
      fail('Please set stake amounts for all bets.');
    }

    setIsPlacingBet(true);

    try {
      // Deduct funds from wallet
      const success = deductFunds(totalStake, `Bet on ${selectedBets.length} selection${selectedBets.length > 1 ? 's' : ''}`);
      if (!success) {
        fail('Failed to deduct funds. Please try again.');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Track bet placed in analytics
      trackBetPlaced(selectedBets, totalStake, estimatedPayout);

      // Add completed bets to history with timestamp and outcome
      const completedBets: PlacedBet[] = selectedBets.map(bet => ({
        ...bet,
        stake: bet.stake ?? 0,
        placedAt: new Date(),
        status: 'pending' as const,
        potentialPayout: bet.stake ? bet.stake * bet.odds : 0
      }));
      
      setBetHistory(prev => [...completedBets, ...prev]);

      // Points are credited at placement, not at settlement, and on stake rather
      // than winnings — so a losing bet still earns. This is what lets the same
      // rule apply to a cash bet taken at a kiosk, where there is no account
      // balance to settle against.
      earnPointsForStake(
        totalStake,
        `Bet on ${selectedBets.length} selection${selectedBets.length > 1 ? 's' : ''}`
      );

      // Clear selected bets
      setSelectedBets([]);

    } finally {
      setIsPlacingBet(false);
    }
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
  const totalStake = selectedBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  const estimatedPayout = selectedBets.reduce((sum, bet) => {
    if (!bet.stake) return sum;
    return sum + bet.stake * bet.odds;
  }, 0);
  return <BettingContext.Provider value={{
    selectedBets,
    addBet,
    removeBet,
    updateStake,
    placeBets,
    settleBet,
    totalStake,
    estimatedPayout,
    betHistory,
    isPlacingBet
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