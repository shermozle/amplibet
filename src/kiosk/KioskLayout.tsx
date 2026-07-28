import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AwardIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useBetting } from '../contexts/BettingContext';
import { useLoyalty } from '../contexts/LoyaltyContext';
import { setSurface, setKioskContext, trackButtonClick } from '../utils/analytics';

// How long a kiosk sits untouched before it resets to the attract screen. Long
// enough to read a market list, short enough that a member who walked away does
// not leave their balance signed in for the next punter.
const IDLE_RESET_MS = 90_000;

interface KioskConfig {
  kiosk_id: string;
  venue: string;
}

const DEFAULT_KIOSK_CONFIG: KioskConfig = { kiosk_id: 'KIOSK-01', venue: 'Collingwood' };

// Which physical machine this is. Provisioned into localStorage by whoever set
// the kiosk up, as {"kioskId": "...", "venue": "..."}; falls back to a default so
// a freshly imaged demo machine still emits well-formed kiosk context rather
// than nothing.
const readKioskConfig = (): KioskConfig => {
  try {
    const stored = localStorage.getItem('amplibet_kiosk');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed?.kioskId === 'string' && typeof parsed?.venue === 'string') {
        return { kiosk_id: parsed.kioskId, venue: parsed.venue };
      }
    }
  } catch (error) {
    console.error('[Kiosk] Could not parse amplibet_kiosk config, using default:', error);
  }
  return DEFAULT_KIOSK_CONFIG;
};

// The shell every /kiosk route renders inside. It owns the two things that make
// the kiosk a distinct surface: the analytics context (surface='kiosk' plus
// kiosk_id/venue on every event) and the venue chrome (wordmark, member chip,
// balance, Finish) — deliberately not the web Header/Sidebar, which are built
// for mouse-and-keyboard browsing.
const KioskLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { getFormattedBalance } = useWallet();
  const { setBetMode } = useBetting();
  const { points, tier } = useLoyalty();

  // Read once per mount: the config identifies the physical machine, which does
  // not change mid-session.
  const [kioskConfig] = useState(readKioskConfig);

  // Stamp the analytics context synchronously on first render, not only in the
  // mount effect: child effects run before parent effects, so the attract page's
  // trackPageView would otherwise fire before this layout's effect and the first
  // kiosk event of every session would be missing kiosk_id/venue.
  const stamped = useRef(false);
  if (!stamped.current) {
    stamped.current = true;
    setSurface('kiosk');
    setKioskContext(kioskConfig);
  }

  useEffect(() => {
    // Re-asserted here as well (idempotent) so a StrictMode unmount/remount
    // cycle — whose cleanup resets to web — still ends in the kiosk state.
    setSurface('kiosk');
    setKioskContext(kioskConfig);
    // The kiosk is singles-only; a member may arrive with 'multi' persisted from
    // a web session, so normalise on entry rather than trusting prior state.
    setBetMode('singles');
    return () => {
      setSurface('web');
      setKioskContext(null);
    };
  }, [kioskConfig, setBetMode]);

  // Latest-value ref so the idle listeners can be attached exactly once but
  // still see the current auth state and route when the timer fires. Starts
  // undefined; assigned on every render below before any timer can fire.
  const handleIdleRef = useRef<(() => void) | undefined>(undefined);
  handleIdleRef.current = () => {
    if (isAuthenticated) {
      // A signed-in member walked away: end their session so the next person at
      // the machine cannot bet with their balance.
      trackButtonClick('Kiosk Idle Reset', 'Kiosk');
      logout();
      navigate('/kiosk');
    } else if (location.pathname !== '/kiosk') {
      // Nobody signed in but the screen was left mid-flow: just return to the
      // attract screen. No navigation when already there, so an untouched idle
      // kiosk does not pile up history entries.
      navigate('/kiosk');
    }
  };

  useEffect(() => {
    let timer = 0;

    const arm = () => {
      timer = window.setTimeout(() => {
        handleIdleRef.current?.();
        // Keep watching after a reset: the handler itself is a no-op when the
        // kiosk is already idle on the attract screen.
        arm();
      }, IDLE_RESET_MS);
    };

    const reset = () => {
      window.clearTimeout(timer);
      arm();
    };

    arm();
    // Passive: these listeners only manage a timer and must never be able to
    // add latency to touch handling.
    window.addEventListener('pointerdown', reset, { passive: true });
    window.addEventListener('keydown', reset, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('keydown', reset);
    };
  }, []);

  const handleFinish = () => {
    trackButtonClick('Finish Session', 'Kiosk');
    logout();
    navigate('/kiosk');
  };

  return (
    <div className="min-h-screen bg-ink text-white text-lg flex flex-col">
      <header className="bg-ink-deep border-b border-surface px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <span className="text-3xl font-extrabold tracking-tight flex-shrink-0">
            AMPLI<span className="text-brand">BET</span>
          </span>
          <span className="text-sm text-gray-400 truncate">
            {kioskConfig.venue} · {kioskConfig.kiosk_id}
          </span>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-surface rounded-full pl-4 pr-5 h-14">
              <AwardIcon size={26} className={tier.textClass} aria-hidden="true" />
              <span className="font-semibold">{user.firstName}</span>
              <span className="text-gray-400">{points.toLocaleString()} pts</span>
            </div>
            <div className="bg-surface rounded-full px-6 h-14 flex items-center font-bold text-accent">
              {getFormattedBalance()}
            </div>
            <button
              type="button"
              onClick={handleFinish}
              className="h-14 px-8 rounded-lg bg-brand hover:bg-brand-dark font-bold text-xl"
            >
              Finish
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default KioskLayout;
