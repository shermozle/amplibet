import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useLoyalty } from '../contexts/LoyaltyContext';
import { trackPageView, trackButtonClick } from '../utils/analytics';

// Confirmation after a kiosk bet lands: the points just earned (one per whole
// dollar staked, mirroring pointsForStake), the running loyalty balance and
// tier, and what's left in the wallet. Two exits only — back to the markets,
// or Finish, which signs the member out so the next walk-up doesn't inherit
// their session.

const KioskDonePage: React.FC = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { getFormattedBalance } = useWallet();
  const { points, tier } = useLoyalty();
  const navigate = useNavigate();
  const location = useLocation();

  // The stake travels in navigation state from the slip: by the time this page
  // renders, the slip has been cleared, so it cannot be re-derived here.
  const stake = (location.state as { stake?: number } | null)?.stake ?? 0;
  const pointsEarned = Math.floor(stake);

  // No member, no confirmation — back to the attract screen. Waits for the
  // session restore to settle so a refresh mid-session isn't bounced.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/kiosk', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Track once, and only for a member actually seeing the confirmation.
  const trackedPageView = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !trackedPageView.current) {
      trackedPageView.current = true;
      trackPageView('Kiosk Confirmation');
    }
  }, [isAuthenticated]);

  const handleFinish = () => {
    trackButtonClick('Finish Session', 'KioskDone');
    logout();
    navigate('/kiosk');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col items-center justify-center p-8 text-center">
      <CheckCircleIcon size={96} className="text-accent mb-6" aria-hidden="true" />
      <h1 className="text-4xl font-bold mb-3">Bets placed!</h1>
      <p className="text-2xl text-accent font-semibold mb-8">
        You earned {pointsEarned} point{pointsEarned === 1 ? '' : 's'}
      </p>

      <div className="bg-surface rounded-lg p-6 w-full max-w-md space-y-4 mb-10">
        <div className="flex justify-between items-center text-lg">
          <span className="text-gray-400">Points balance</span>
          <span className="font-bold">
            {points.toLocaleString()} <span className={tier.textClass}>· {tier.name}</span>
          </span>
        </div>
        <div className="flex justify-between items-center text-lg">
          <span className="text-gray-400">Balance remaining</span>
          <span className="font-bold text-accent">{getFormattedBalance()}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        <button
          onClick={() => navigate('/kiosk/home')}
          className="flex-1 h-20 rounded-lg bg-brand hover:bg-brand-dark text-xl font-bold"
        >
          Place another bet
        </button>
        <button
          onClick={handleFinish}
          className="flex-1 h-20 rounded-lg bg-raised hover:bg-raised-light text-xl font-bold"
        >
          Finish
        </button>
      </div>
    </div>
  );
};

export default KioskDonePage;
