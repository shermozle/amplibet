import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SearchIcon, ReceiptIcon, WalletIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  trackOnboardingStarted,
  trackOnboardingStepViewed,
  trackOnboardingCompleted,
  trackOnboardingSkipped
} from '../../utils/analytics';

// The flag is keyed by loyalty ID, not stored globally, so a shared machine (a
// kiosk, a household laptop) does not suppress the tour for every member who
// signs in on it.
const storageKeyFor = (userId: string) => `amplibet_onboarded_${userId}`;

// The three ideas a new punter has to grasp, in the order they will meet them.
// The names double as the step_name analytics property, so renaming one renames
// the funnel step in Amplitude.
const STEPS: Array<{ name: string; description: string; Icon: typeof SearchIcon }> = [
  {
    name: 'Find your market',
    Icon: SearchIcon,
    description:
      'Browse sports from the home page or use search to jump straight to a team, league or race. Every price on the board is one tap away.'
  },
  {
    name: 'Build your slip',
    Icon: ReceiptIcon,
    description:
      'Tap any odds to add a selection to your slip. Keep it as a single, or combine picks into a multi for bigger combined odds — then set your stake and watch the potential payout update.'
  },
  {
    name: 'Cash in',
    Icon: WalletIcon,
    description:
      'Deposit to top up your wallet, earn AmpliBet Rewards points on every bet you place, and visit the results page to settle pending bets and collect your payouts.'
  }
];

const OnboardingOverlay: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  // Which member dismissed the tour this session. localStorage is written at the
  // same moment, but writing localStorage does not trigger a re-render — without
  // this state the overlay would sit on screen until something else re-rendered.
  // Keyed by ID rather than a boolean so a different member signing in on the
  // same device still gets their own tour.
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  // Rewind to the first step when the signed-in member changes. Done during
  // render rather than in an effect so the step-viewed effect below never fires
  // for the previous member's step position on the new member's tour.
  const [tourUserId, setTourUserId] = useState<string | null>(user ? user.id : null);
  if ((user ? user.id : null) !== tourUserId) {
    setTourUserId(user ? user.id : null);
    setStep(0);
  }

  const visible =
    isAuthenticated &&
    user !== null &&
    dismissedFor !== user.id &&
    localStorage.getItem(storageKeyFor(user.id)) === null;

  // Escape lives inside useFocusTrap, which may hold the onClose it was given at
  // activation. Reading the step out of a ref keeps the skipped step_index honest
  // even if that closure is stale.
  const stepRef = useRef(0);

  const dismiss = useCallback(() => {
    if (user) {
      localStorage.setItem(storageKeyFor(user.id), new Date().toISOString());
      setDismissedFor(user.id);
    }
  }, [user]);

  // Every way out that is not "Get started" — the Skip button, Escape, clicking
  // the backdrop — funnels through here, so Onboarding Skipped has exactly one
  // call site and cannot double-count.
  const handleSkip = useCallback(() => {
    trackOnboardingSkipped(stepRef.current);
    dismiss();
  }, [dismiss]);

  const handleFinish = () => {
    trackOnboardingCompleted();
    dismiss();
  };

  const dialogRef = useFocusTrap(visible, handleSkip);

  // Started fires once per appearance of the tour, not once per step.
  useEffect(() => {
    if (!visible) return;
    trackOnboardingStarted();
  }, [visible]);

  // One Step Viewed per step the member actually sees: on first appearance this
  // fires alongside Started for step 0, then once per Back/Next. This is the only
  // call site for the event.
  useEffect(() => {
    if (!visible) return;
    stepRef.current = step;
    trackOnboardingStepViewed(step, STEPS[step].name);
  }, [visible, step]);

  if (!visible) return null;

  const { name, description, Icon } = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={event => {
        // A backdrop click is a dismissal, and every dismissal that is not
        // "Get started" counts as a skip so the funnel stays two-outcome.
        if (event.target === event.currentTarget) handleSkip();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative w-full max-w-md bg-surface text-paper rounded-lg border border-ink p-6"
      >
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 text-sm text-paper/60 hover:text-grape"
        >
          Skip tour
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="bg-raised rounded-full p-4 mb-4">
            <Icon size={28} className="text-accent" aria-hidden="true" />
          </div>
          <h2 id="onboarding-title" className="text-xl font-bold text-accent mb-2">
            {name}
          </h2>
          <p className="text-sm text-paper/80 mb-6">{description}</p>
        </div>

        {/* The dots are decorative; position is announced via the hidden text so a
            screen reader hears "Step 2 of 3" instead of three unlabeled bullets. */}
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="flex justify-center gap-2 mb-6" aria-hidden="true">
          {STEPS.map((candidate, index) => (
            <span
              key={candidate.name}
              className={`w-2 h-2 rounded-full ${index === step ? 'bg-accent' : 'bg-raised-light'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(current => Math.max(0, current - 1))}
            disabled={step === 0}
            className="flex items-center bg-raised hover:bg-raised-light rounded px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon size={16} className="mr-1" aria-hidden="true" />
            Back
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={handleFinish}
              className="bg-brand hover:bg-brand-dark text-white rounded px-4 py-2 text-sm font-semibold"
            >
              Get started
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(current => Math.min(STEPS.length - 1, current + 1))}
              className="flex items-center bg-brand hover:bg-brand-dark text-white rounded px-4 py-2 text-sm font-semibold"
            >
              Next
              <ChevronRightIcon size={16} className="ml-1" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingOverlay;
