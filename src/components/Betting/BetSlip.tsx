import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBetting, RESPONSIBLE_GAMBLING_THRESHOLD } from '../../contexts/BettingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { ClipboardIcon, XIcon, AlertCircle } from 'lucide-react';
import { trackButtonClick } from '../../utils/analytics';
import ResponsibleGamblingModal from './ResponsibleGamblingModal';

interface BetSlipProps {
  // 'panel' is the desktop right-hand column; 'sheet' fills the mobile bottom
  // sheet Layout opens on small screens. Same slip, two frames — the state all
  // lives in BettingContext, so both render the identical slip.
  variant?: 'panel' | 'sheet';
  onClose?: () => void;
}

const BetSlip: React.FC<BetSlipProps> = ({ variant = 'panel', onClose }) => {
  const {
    selectedBets,
    removeBet,
    updateStake,
    placeBets,
    totalStake,
    estimatedPayout,
    isPlacingBet,
    betMode,
    setBetMode,
    multiStake,
    setMultiStake,
    combinedOdds,
    multiPayout,
    multiValidationError
  } = useBetting();
  const { isAuthenticated } = useAuth();
  const { getFormattedBalance, balance } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRGModal, setShowRGModal] = useState(false);

  const isMulti = betMode === 'multi';
  const stakeInPlay = isMulti ? multiStake : totalStake;
  const payoutInPlay = isMulti ? multiPayout : estimatedPayout;

  const doPlaceBets = async () => {
    setErrorMessage('');
    try {
      await placeBets();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      const errorMsg = (error as Error).message;
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handlePlaceBets = () => {
    if (!isAuthenticated) {
      trackButtonClick('Place Bet - Not Authenticated', 'BetSlip', {
        bet_count: selectedBets.length,
        total_stake: stakeInPlay
      });
      // Redirect to login with current location as redirect target
      navigate('/login', { state: { from: location } });
      return;
    }

    trackButtonClick('Place Bet', 'BetSlip', {
      bet_count: selectedBets.length,
      bet_mode: betMode,
      total_stake: stakeInPlay,
      estimated_payout: payoutInPlay
    });

    // Large stakes go through the responsible-gambling prompt before any money
    // moves. The modal tracks the prompt and the choice itself.
    if (stakeInPlay > RESPONSIBLE_GAMBLING_THRESHOLD) {
      setShowRGModal(true);
      return;
    }

    void doPlaceBets();
  };

  const handleModeChange = (mode: 'singles' | 'multi') => {
    trackButtonClick(mode === 'multi' ? 'Multi Mode' : 'Singles Mode', 'BetSlip', {
      bet_count: selectedBets.length
    });
    setBetMode(mode);
  };

  const handleRemoveBet = (betId: string) => {
    trackButtonClick('Remove Bet', 'BetSlip', { bet_id: betId });
    removeBet(betId);
  };

  const handleCollapseBetSlip = () => {
    trackButtonClick('Collapse Bet Slip', 'BetSlip');
    setIsCollapsed(true);
  };

  const handleExpandBetSlip = () => {
    trackButtonClick('Expand Bet Slip', 'BetSlip');
    setIsCollapsed(false);
  };

  if (variant === 'panel' && isCollapsed) {
    return <div className="w-12 bg-surface border-l border-ink flex flex-col items-center py-4">
        <button
          onClick={handleExpandBetSlip}
          className="w-10 h-10 bg-raised rounded-full flex items-center justify-center mb-2"
          aria-label={`Expand bet slip (${selectedBets.length} selections)`}
        >
          <ClipboardIcon size={18} />
        </button>
        <div className="text-xs font-semibold">{selectedBets.length}</div>
      </div>;
  }

  const insufficientFunds = isAuthenticated && stakeInPlay > balance;
  const placeDisabled =
    selectedBets.length === 0 ||
    stakeInPlay === 0 ||
    isPlacingBet ||
    insufficientFunds ||
    (isAuthenticated && isMulti && !!multiValidationError);

  const frameClass = variant === 'sheet'
    ? 'w-full h-full bg-surface flex flex-col'
    : 'w-72 bg-surface border-l border-ink flex flex-col';

  return <div className={frameClass} style={variant === 'panel' ? { height: 'calc(100vh - 70px)' } : undefined}>
      <div className="p-3 border-b border-ink flex justify-between items-center flex-shrink-0">
        {/* Singles/multi toggle. The modes share the slip's selections; only the
            staking model differs. */}
        <div className="flex rounded overflow-hidden" role="group" aria-label="Bet type">
          <button
            onClick={() => handleModeChange('singles')}
            className={`px-3 py-1 text-sm font-semibold ${!isMulti ? 'bg-brand text-white' : 'bg-raised text-gray-300 hover:bg-raised-light'}`}
            aria-pressed={!isMulti}
          >
            Singles
          </button>
          <button
            onClick={() => handleModeChange('multi')}
            className={`px-3 py-1 text-sm font-semibold ${isMulti ? 'bg-brand text-white' : 'bg-raised text-gray-300 hover:bg-raised-light'}`}
            aria-pressed={isMulti}
          >
            Multi
          </button>
        </div>
        <button
          onClick={variant === 'sheet' ? onClose : handleCollapseBetSlip}
          className="text-gray-400 hover:text-white"
          aria-label={variant === 'sheet' ? 'Close bet slip' : 'Collapse bet slip'}
        >
          <XIcon size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {selectedBets.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">
            No bets selected
          </div> : <div className="divide-y divide-ink">
            {selectedBets.map(bet => <div key={bet.id} className="p-2">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="text-sm font-medium">{bet.selection}</div>
                    <div className="text-xs text-gray-400">Match Result</div>
                  </div>
                  <button
                    onClick={() => handleRemoveBet(bet.id)}
                    className="text-gray-400 hover:text-white"
                    aria-label={`Remove ${bet.selection}`}
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  {/* In multi mode individual stakes are meaningless — one stake
                      rides on the combined odds — so the input only renders for
                      singles. */}
                  {!isMulti && <div className="flex-1 mr-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={bet.stake || ''}
                        onChange={e => updateStake(bet.id, parseFloat(e.target.value) || 0)}
                        className="w-full bg-raised rounded py-1 pl-6 pr-2 text-sm"
                        placeholder="0"
                        aria-label={`Stake for ${bet.selection}`}
                      />
                    </div>
                  </div>}
                  <div className={`bg-raised rounded py-1 px-2 text-sm ${isMulti ? 'ml-auto' : ''}`}>
                    {bet.odds.toFixed(2)}
                  </div>
                </div>
                {!isMulti && bet.stake ? <div className="text-right text-xs mt-0.5">
                    Payout: ${(bet.stake * bet.odds).toFixed(2)}
                  </div> : null}
              </div>)}
          </div>}
      </div>
      <div className="border-t border-ink p-2 flex-shrink-0 bg-surface">
        {/* Balance Display */}
        {isAuthenticated && (
          <div className="flex justify-between text-xs mb-1 pb-1 border-b border-ink">
            <span>BALANCE</span>
            <span className={balance < stakeInPlay ? 'text-danger' : 'text-accent'}>
              {getFormattedBalance()}
            </span>
          </div>
        )}

        {isMulti ? <>
          {multiValidationError && selectedBets.length > 0 && (
            <div className="border border-salmon text-salmon text-xs p-2 rounded mb-2">
              {multiValidationError}
            </div>
          )}
          <div className="flex justify-between text-xs mb-1">
            <span>COMBINED ODDS ({selectedBets.length} legs)</span>
            <span>{selectedBets.length > 0 ? combinedOdds.toFixed(2) : '—'}</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span>MULTI STAKE</span>
            <div className="relative w-24">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={multiStake || ''}
                onChange={e => setMultiStake(parseFloat(e.target.value) || 0)}
                className="w-full bg-raised rounded py-1 pl-5 pr-2 text-sm"
                placeholder="0"
                aria-label="Multi stake"
              />
            </div>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span>EST. RETURN</span>
            <span className="text-accent">${multiPayout.toFixed(2)}</span>
          </div>
        </> : <>
          <div className="flex justify-between text-xs mb-1">
            <span>TOTAL STAKE ({selectedBets.length})</span>
            <span className={insufficientFunds ? 'text-danger' : ''}>
              ${totalStake.toFixed(2)}
            </span>
          </div>
          {/* Singles: this is the sum of each selection's individual return, not
              a combined multi. Labelled explicitly so it is not mistaken for
              parlay odds. */}
          <div className="flex justify-between text-xs mb-2">
            <span>EST. RETURN{selectedBets.length > 1 ? ' (SINGLES)' : ''}</span>
            <span className="text-accent">${estimatedPayout.toFixed(2)}</span>
          </div>
        </>}

        {showSuccessMessage && (
          <div className="bg-brand text-white text-xs p-2 rounded mb-2">
            Bets placed successfully!
          </div>
        )}

        {errorMessage && (
          <div className="bg-danger text-white text-xs p-2 rounded mb-2 flex items-start space-x-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          className="w-full bg-brand hover:bg-brand-dark text-white py-2 rounded mt-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={placeDisabled}
          onClick={handlePlaceBets}
        >
          {isPlacingBet ? 'Placing Bet...' :
           !isAuthenticated ? 'Login to Place Bet' :
           insufficientFunds ? 'Insufficient Funds' :
           isMulti ? `Place ${selectedBets.length}-Leg Multi` :
           'Place Bet'}
        </button>
      </div>

      <ResponsibleGamblingModal
        isOpen={showRGModal}
        totalStake={stakeInPlay}
        onConfirm={() => {
          setShowRGModal(false);
          void doPlaceBets();
        }}
        onCancel={() => setShowRGModal(false)}
      />
    </div>;
};
export default BetSlip;
