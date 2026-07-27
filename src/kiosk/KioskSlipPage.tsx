import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { XIcon, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useBetting, RESPONSIBLE_GAMBLING_THRESHOLD } from '../contexts/BettingContext';
import { trackPageView, trackButtonClick } from '../utils/analytics';
import ResponsibleGamblingModal from '../components/Betting/ResponsibleGamblingModal';
import KioskKeypad from './KioskKeypad';

// The kiosk bet slip: singles only (KioskLayout forces the mode), stakes typed
// on the on-screen keypad rather than a text input, and cash top-up offered
// inline the moment the stake outruns the balance. Everything is sized for a
// standing member jabbing a touchscreen — no field small enough to miss.

const KioskSlipPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { balance, getFormattedBalance, insertCash } = useWallet();
  const {
    selectedBets,
    removeBet,
    updateStake,
    placeBets,
    totalStake,
    estimatedPayout,
    isPlacingBet
  } = useBetting();
  const navigate = useNavigate();

  // Which bet the keypad edits. Falls back to the first selection below, so a
  // stale or null id (e.g. after removing the highlighted bet) never leaves the
  // keypad pointing at nothing.
  const [targetBetId, setTargetBetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRGModal, setShowRGModal] = useState(false);

  // A kiosk with no member is mid-walk-away; back to the scan screen. Waits for
  // the session restore to settle so a signed-in member isn't bounced during
  // the initial load.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/kiosk/scan', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Track the page view once, and only for a member who actually sees the slip
  // rather than one being redirected to scan.
  const trackedPageView = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !trackedPageView.current) {
      trackedPageView.current = true;
      trackPageView('Kiosk Slip');
    }
  }, [isAuthenticated]);

  const targetBet = selectedBets.find(bet => bet.id === targetBetId) ?? selectedBets[0];
  const keypadValue = Math.floor(targetBet?.stake ?? 0);

  const insufficientFunds = totalStake > balance;
  // Same rules as BetSlip, minus the multi and auth clauses that cannot apply
  // here: the route guard guarantees a member and the kiosk only does singles.
  const placeDisabled =
    selectedBets.length === 0 || totalStake === 0 || isPlacingBet || insufficientFunds;

  const handleStakeChange = (next: number) => {
    if (targetBet) updateStake(targetBet.id, next);
  };

  const handleRemoveBet = (betId: string) => {
    trackButtonClick('Remove Bet', 'KioskSlip', { bet_id: betId });
    removeBet(betId);
  };

  const doPlaceBets = async () => {
    setErrorMessage('');
    // placeBets clears the slip on success, so capture the stake now — the
    // confirmation page needs it for the points-earned message.
    const stakeAtPlacement = totalStake;
    trackButtonClick('Place Bet', 'KioskSlip', {
      bet_count: selectedBets.length,
      total_stake: stakeAtPlacement
    });
    try {
      await placeBets();
      navigate('/kiosk/done', { state: { stake: stakeAtPlacement } });
    } catch (error) {
      // Simulated bookmaker rejections land here. The slip is untouched on
      // failure, so the member can simply tap Place bet again.
      setErrorMessage((error as Error).message);
    }
  };

  const handlePlaceBets = () => {
    // Large stakes go through the responsible-gambling prompt before any money
    // moves. The modal tracks the prompt and the choice itself.
    if (totalStake > RESPONSIBLE_GAMBLING_THRESHOLD) {
      setShowRGModal(true);
      return;
    }
    void doPlaceBets();
  };

  if (!isAuthenticated) return null;

  if (selectedBets.length === 0) {
    return (
      <div className="min-h-screen bg-ink text-white flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold mb-3">Your bet slip is empty</h1>
        <p className="text-xl text-gray-400 mb-8">Pick a market to add a selection.</p>
        <Link
          to="/kiosk/home"
          className="h-16 px-10 rounded-lg bg-brand hover:bg-brand-dark text-xl font-bold flex items-center"
        >
          Back to markets
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Bet slip</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Selections. Tapping a row points the keypad at that bet's stake. */}
          <div className="flex-1 min-w-0">
            <ul className="space-y-4">
              {selectedBets.map(bet => {
                const isTarget = bet.id === targetBet?.id;
                return (
                  <li
                    key={bet.id}
                    className={`flex items-stretch gap-3 rounded-lg border-2 bg-surface p-4 ${
                      isTarget ? 'border-brand' : 'border-surface'
                    }`}
                  >
                    <button
                      onClick={() => setTargetBetId(bet.id)}
                      className="flex-1 min-w-0 text-left"
                      aria-pressed={isTarget}
                      aria-label={`Edit stake for ${bet.selection}`}
                    >
                      <div className="text-lg font-semibold mb-2 truncate">{bet.selection}</div>
                      <div className="flex items-center gap-4 text-lg">
                        <span className="bg-raised rounded px-3 py-1 font-bold">
                          {bet.odds.toFixed(2)}
                        </span>
                        <span className={isTarget ? 'text-accent font-bold' : 'text-gray-300'}>
                          Stake ${(bet.stake ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleRemoveBet(bet.id)}
                      className="w-16 h-16 self-center flex-shrink-0 flex items-center justify-center rounded-lg bg-raised hover:bg-raised-light"
                      aria-label={`Remove ${bet.selection}`}
                    >
                      <XIcon size={28} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="text-gray-400 text-lg mt-4">
              Tap a selection, then use the keypad to set its stake.
            </p>
          </div>

          {/* Keypad, totals and the place button. */}
          <div className="w-full lg:w-96 flex-shrink-0 space-y-4">
            <div className="bg-surface rounded-lg p-4">
              <div className="text-sm uppercase text-gray-400 mb-1">Stake for</div>
              <div className="text-lg font-semibold truncate mb-2">{targetBet?.selection}</div>
              <div className="text-4xl font-bold text-accent mb-4" aria-live="polite">
                ${keypadValue}
              </div>
              <KioskKeypad value={keypadValue} onChange={handleStakeChange} />
            </div>

            <div className="bg-surface rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-lg">
                <span>TOTAL STAKE ({selectedBets.length})</span>
                <span className={`font-bold ${insufficientFunds ? 'text-danger' : ''}`}>
                  ${totalStake.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span>EST. RETURN</span>
                <span className="text-accent font-bold">${estimatedPayout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg border-t border-ink pt-3">
                <span>BALANCE</span>
                <span className={`font-bold ${insufficientFunds ? 'text-danger' : 'text-accent'}`}>
                  {getFormattedBalance()}
                </span>
              </div>

              {/* The fix for a short balance is standing right in front of the
                  member: the cash acceptor. Offer it here rather than sending
                  them off to a deposit screen. insertCash emits the Cash
                  Inserted event itself. */}
              {insufficientFunds && (
                <div className="border-2 border-danger rounded-lg p-4">
                  <p className="text-lg mb-3">
                    Not enough balance for this stake. Insert cash to top up.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => insertCash(20)}
                      className="h-16 rounded-lg bg-raised hover:bg-raised-light text-xl font-bold"
                    >
                      +$20
                    </button>
                    <button
                      onClick={() => insertCash(50)}
                      className="h-16 rounded-lg bg-raised hover:bg-raised-light text-xl font-bold"
                    >
                      +$50
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-danger text-white text-lg p-4 rounded-lg flex items-start gap-3" role="alert">
                  <AlertCircleIcon size={24} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={handlePlaceBets}
                disabled={placeDisabled}
                className="w-full h-20 rounded-lg bg-brand hover:bg-brand-dark text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingBet
                  ? 'Placing bet…'
                  : insufficientFunds
                    ? 'Insufficient funds'
                    : 'Place bet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ResponsibleGamblingModal
        isOpen={showRGModal}
        totalStake={totalStake}
        onConfirm={() => {
          setShowRGModal(false);
          void doPlaceBets();
        }}
        onCancel={() => setShowRGModal(false)}
      />
    </div>
  );
};

export default KioskSlipPage;
