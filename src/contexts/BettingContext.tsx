import React, { useState, createContext, useContext } from 'react';
import { trackBetAdded, trackBetRemoved, trackBetUpdated, trackBetPlaced } from '../utils/analytics';
interface Bet {
  id: string;
  eventId: string;
  selection: string;
  odds: number;
  stake?: number;
}
interface BettingContextType {
  selectedBets: Bet[];
  addBet: (bet: Bet) => void;
  removeBet: (betId: string) => void;
  updateStake: (betId: string, stake: number) => void;
  placeBets: () => void;
  totalStake: number;
  estimatedPayout: number;
}
const BettingContext = createContext<BettingContextType | undefined>(undefined);
export const BettingProvider: React.FC<{
  children: ReactNode;
}> = ({
  children
}) => {
  const [selectedBets, setSelectedBets] = useState<Bet[]>([]);
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
  const placeBets = () => {
    if (selectedBets.length === 0) return;
    // Track bet placed in analytics
    trackBetPlaced(selectedBets, totalStake, estimatedPayout);
    // In a real app, you would make an API call here
    // For the prototype, we'll just clear the bets
    alert(`Bet placed successfully! Total stake: $${totalStake.toFixed(2)}, Potential payout: $${estimatedPayout.toFixed(2)}`);
    setSelectedBets([]);
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
    totalStake,
    estimatedPayout
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