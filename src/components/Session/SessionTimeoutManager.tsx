import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  trackSessionTimeoutWarningShown,
  trackSessionTimedOut,
  trackSessionExtended
} from '../../utils/analytics';

// Watches for inactivity while signed in and signs the member out after a
// warning. This exists as much for the event stream as for security: warning
// shown → extended vs timed out is a funnel the demo wants visible in Amplitude.

const IDLE_LIMIT_MS = 10 * 60 * 1000;
const WARNING_SECONDS = 60;
// Mousemove fires continuously; resetting a 10-minute timer more than once
// every 5 seconds is pure overhead.
const MOUSEMOVE_RESET_INTERVAL_MS = 5 * 1000;

const SessionTimeoutManager: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);

  // Timer handles live in refs so a re-render (the countdown ticks state every
  // second) can never schedule a second, orphaned timer alongside the first.
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirrors warningVisible for the DOM event handlers, which are bound once per
  // auth state and would otherwise close over a stale value.
  const warningVisibleRef = useRef(false);
  const lastMouseResetRef = useRef(0);

  // The idle-watching effect runs once per auth state, but logout/notify/navigate
  // are re-created by their providers on render; route timer callbacks through a
  // ref so a timeout firing 11 minutes later acts on current context, not a
  // snapshot from effect setup.
  const actionsRef = useRef({ logout, notify, navigate });
  useEffect(() => {
    actionsRef.current = { logout, notify, navigate };
  });

  // Populated by the idle effect so the button handler can reach the reset
  // logic without forcing the effect (and all its listeners) to re-run. Starts
  // undefined; the handler no-ops until the effect installs the real reset.
  const extendRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated) return;

    const clearIdleTimer = () => {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const clearCountdown = () => {
      if (countdownRef.current !== null) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };

    const handleTimedOut = () => {
      warningVisibleRef.current = false;
      setWarningVisible(false);
      trackSessionTimedOut();
      const { logout: doLogout, notify: doNotify, navigate: doNavigate } = actionsRef.current;
      doNotify('info', 'Signed out', 'You were signed out after 10 minutes of inactivity.');
      // logout() flips isAuthenticated, so this effect's cleanup tears down the
      // listeners and timers — no explicit disarm needed here.
      doLogout();
      doNavigate('/');
    };

    const showWarning = () => {
      warningVisibleRef.current = true;
      setWarningVisible(true);
      trackSessionTimeoutWarningShown();
      // A local counter drives the deadline rather than reading state back:
      // setState is async and re-reading it inside the interval risks missed or
      // doubled ticks. State only mirrors it for display.
      let remaining = WARNING_SECONDS;
      setSecondsLeft(remaining);
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearCountdown();
          handleTimedOut();
        }
      }, 1000);
    };

    const resetIdleTimer = () => {
      clearIdleTimer();
      idleTimerRef.current = setTimeout(showWarning, IDLE_LIMIT_MS);
    };

    extendRef.current = () => {
      warningVisibleRef.current = false;
      setWarningVisible(false);
      clearCountdown();
      resetIdleTimer();
    };

    const handleActivity = () => {
      // Once the warning is up, background activity must not silently dismiss
      // it — only the explicit 'Stay signed in' choice (or Escape / a click on
      // the dialog's overlay) extends, so the choice is always tracked.
      if (warningVisibleRef.current) return;
      resetIdleTimer();
    };

    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseResetRef.current < MOUSEMOVE_RESET_INTERVAL_MS) return;
      lastMouseResetRef.current = now;
      handleActivity();
    };

    // capture: true on scroll because scroll events do not bubble — without it,
    // scrolling an inner container (the events list, the slip) reads as idle.
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity, { capture: true, passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('visibilitychange', handleActivity);

    resetIdleTimer();

    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleActivity);
      clearIdleTimer();
      clearCountdown();
      warningVisibleRef.current = false;
      setWarningVisible(false);
    };
  }, [isAuthenticated]);

  // Single exit point for "the user is still here": the button, Escape via the
  // focus trap, and the overlay all land here, so 'Session Extended' is tracked
  // in exactly one place.
  const handleStaySignedIn = useCallback(() => {
    trackSessionExtended();
    extendRef.current?.();
  }, []);

  const dialogRef = useFocusTrap(warningVisible, handleStaySignedIn);

  if (!warningVisible) return null;

  return (
    // Clicking the overlay counts as proof of presence, so it extends rather
    // than leaving the countdown running behind a dismissed dialog.
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleStaySignedIn}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        className="bg-surface border border-salmon rounded-lg max-w-sm w-full p-6 text-center"
        onClick={event => event.stopPropagation()}
      >
        <ClockIcon size={32} className="text-salmon mx-auto mb-3" aria-hidden="true" />
        <h2 id="session-timeout-title" className="text-xl font-bold text-white mb-2">
          Still there?
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          You've been inactive for a while. For your security you'll be signed out in
        </p>
        {/* Deliberately no aria-live: announcing every second would drown a
            screen reader. The dialog announcement on open carries the intent. */}
        <div className="text-4xl font-bold text-salmon mb-5">{secondsLeft}s</div>
        <button
          onClick={handleStaySignedIn}
          className="w-full py-2.5 px-4 rounded font-medium bg-brand hover:bg-brand-dark text-white"
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
};

export default SessionTimeoutManager;
