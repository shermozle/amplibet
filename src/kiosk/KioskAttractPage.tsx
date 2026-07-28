import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trackPageView, trackButtonClick } from '../utils/analytics';

// The idle screen a venue kiosk shows between customers. The entire screen is
// one button: a person walking up to a kiosk taps wherever their eye landed, so
// anything smaller than everything is a missed touch.
const KioskAttractPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    trackPageView('Kiosk Attract');
  }, []);

  const handleStart = () => {
    trackButtonClick('Touch To Start', 'KioskAttract');
    // A member who stepped away and came back inside the idle window is still
    // signed in — skip the scan screen and put them straight onto the markets.
    navigate(isAuthenticated ? '/kiosk/home' : '/kiosk/scan');
  };

  return (
    <button
      type="button"
      onClick={handleStart}
      aria-label="Start"
      className="flex-1 w-full flex flex-col items-center justify-center gap-10 px-8 py-16 text-center focus:outline-none focus-visible:ring-4 focus-visible:ring-brand focus-visible:ring-inset"
    >
      <span className="text-7xl sm:text-8xl font-extrabold tracking-tight">
        AMPLI<span className="text-brand">BET</span>
      </span>

      <span className="text-2xl sm:text-3xl text-paper max-w-2xl">
        Back a winner without leaving the bar.
      </span>

      <span className="animate-pulse bg-brand rounded-2xl px-14 py-8 text-3xl font-bold shadow-lg">
        Touch to start
      </span>

      <span className="text-base text-gray-400 max-w-xl">
        Scan your AmpliBet loyalty card to bet with cash and earn points on every stake.
      </span>
    </button>
  );
};

export default KioskAttractPage;
