import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  tierFor,
  nextTierFor,
  pointsToNextTier,
  tierProgress,
  pointsForStake,
  type LedgerEntry,
  type Tier
} from '../utils/loyalty';
import type { Surface } from '../utils/surface';
import {
  getSurface,
  trackLoyaltyPointsEarned,
  trackLoyaltyTierChanged
} from '../utils/analytics';

interface LoyaltyContextType {
  points: number;
  tier: Tier;
  nextTier: Tier | null;
  pointsToNext: number;
  progress: number;
  ledger: LedgerEntry[];
  // Credit points and record where they came from. `surface` defaults to the
  // surface this session is running as; the simulation script passes 'in_store'
  // or 'call_centre' explicitly for backfilled activity.
  earnPoints: (points: number, reason: string, surface?: Surface) => void;
  // Convenience wrapper for the common case: points from a bet's stake.
  earnPointsForStake: (stake: number, reason: string, surface?: Surface) => void;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

const ledgerKey = (loyaltyId: string) => `amplibet_loyalty_${loyaltyId}`;

export const LoyaltyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // The ledger is stored together with the id of the member it belongs to, rather
  // than as a bare array. This is what makes persistence safe: a load effect and a
  // save effect both fire in the commit where `user` appears, the save runs second,
  // and it would otherwise write the still-empty pre-load array straight over the
  // stored ledger — wiping the member's points on every page load. Keeping the
  // owner in the same state value lets the save recognise un-hydrated state and
  // skip it, with no window between the two.
  const [state, setState] = useState<{ userId: string | null; ledger: LedgerEntry[] }>({
    userId: null,
    ledger: []
  });

  const hydrated = state.userId !== null && state.userId === user?.id;
  // Only trust the ledger once it belongs to the current member; otherwise a
  // signed-in member would briefly render the previous member's points.
  const ledger = hydrated ? state.ledger : [];

  // The balance is derived from the ledger rather than stored alongside it. Two
  // sources of truth for the same number drift, and the ledger is the one that has
  // to be right because it is what the surface breakdown is computed from.
  const points = ledger.reduce((total, entry) => total + entry.points, 0);
  const tier = tierFor(points);

  // Load this member's ledger when they sign in, and clear it when they sign out
  // so the next member on a shared kiosk does not inherit a stranger's balance.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState({ userId: null, ledger: [] });
      return;
    }
    const stored = localStorage.getItem(ledgerKey(user.id));
    if (!stored) {
      setState({ userId: user.id, ledger: [] });
      return;
    }
    try {
      setState({ userId: user.id, ledger: JSON.parse(stored) });
    } catch (error) {
      console.error('[Loyalty] Could not parse stored ledger, starting empty:', error);
      localStorage.removeItem(ledgerKey(user.id));
      setState({ userId: user.id, ledger: [] });
    }
  }, [user, isAuthenticated]);

  // No length guard here, deliberately: guarding on a non-empty ledger means a
  // cleared balance is never written and the old one reloads later. The hydration
  // check above is what prevents the empty-overwrite instead.
  useEffect(() => {
    if (hydrated && user) {
      localStorage.setItem(ledgerKey(user.id), JSON.stringify(state.ledger));
    }
  }, [state, hydrated, user]);

  const earnPoints = useCallback(
    (amount: number, reason: string, surface?: Surface) => {
      if (!user || amount <= 0) return;

      const entry: LedgerEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        points: amount,
        reason,
        surface: surface ?? getSurface(),
        earnedAt: new Date().toISOString()
      };

      // Compute the crossing from the balance we are about to have, not from
      // state — setLedger has not committed yet, so reading `points` here would
      // miss a tier change on the very bet that caused it.
      const balanceAfter = points + amount;
      const tierBefore = tierFor(points);
      const tierAfter = tierFor(balanceAfter);

      setState(previous => ({ userId: user.id, ledger: [entry, ...previous.ledger] }));

      trackLoyaltyPointsEarned(user.id, amount, reason, balanceAfter, tierAfter.name);
      if (tierAfter.name !== tierBefore.name) {
        trackLoyaltyTierChanged(user.id, tierBefore.name, tierAfter.name, balanceAfter);
      }
    },
    [user, points]
  );

  const earnPointsForStake = useCallback(
    (stake: number, reason: string, surface?: Surface) => {
      earnPoints(pointsForStake(stake), reason, surface);
    },
    [earnPoints]
  );

  const value: LoyaltyContextType = {
    points,
    tier,
    nextTier: nextTierFor(points),
    pointsToNext: pointsToNextTier(points),
    progress: tierProgress(points),
    ledger,
    earnPoints,
    earnPointsForStake
  };

  return <LoyaltyContext.Provider value={value}>{children}</LoyaltyContext.Provider>;
};

export const useLoyalty = (): LoyaltyContextType => {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};
