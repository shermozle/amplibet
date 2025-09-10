import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBetting } from '../../contexts/BettingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { ClipboardIcon, XIcon, AlertCircle } from 'lucide-react';
import { trackButtonClick } from '../../utils/analytics';
const BetSlip: React.FC = () => {
  const {
    selectedBets,
    removeBet,
    updateStake,
    placeBets,
    totalStake,
    estimatedPayout,
    isPlacingBet
  } = useBetting();
  const { isAuthenticated } = useAuth();
  const { getFormattedBalance, balance } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePlaceBets = async () => {
    if (!isAuthenticated) {
      trackButtonClick('Place Bet - Not Authenticated', 'BetSlip', {
        bet_count: selectedBets.length,
        total_stake: totalStake
      });
      // Redirect to login with current location as redirect target
      navigate('/login', { state: { from: location } });
      return;
    }

    trackButtonClick('Place Bet', 'BetSlip', {
      bet_count: selectedBets.length,
      total_stake: totalStake,
      estimated_payout: estimatedPayout
    });

    setErrorMessage('');
    try {
      await placeBets();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      const errorMsg = (error as Error).message;
      console.error('Error placing bets:', errorMsg);
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    }
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
  if (isCollapsed) {
    return <div className="w-12 bg-[#1B3B6F] border-l border-[#13294B] flex flex-col items-center py-4">
        <button onClick={handleExpandBetSlip} className="w-10 h-10 bg-[#2A4E8D] rounded-full flex items-center justify-center mb-2">
          <ClipboardIcon size={18} />
        </button>
        <div className="text-xs font-semibold">{selectedBets.length}</div>
      </div>;
  }
  return <div className="w-72 bg-[#1B3B6F] border-l border-[#13294B] flex flex-col" style={{height: 'calc(100vh - 70px)'}}>
      <div className="p-3 border-b border-[#13294B] flex justify-between items-center flex-shrink-0">
        <h3 className="font-semibold">Single Bets</h3>
        <button onClick={handleCollapseBetSlip} className="text-gray-400 hover:text-white">
          <XIcon size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {selectedBets.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">
            No bets selected
          </div> : <div className="divide-y divide-[#13294B]">
            {selectedBets.map(bet => <div key={bet.id} className="p-2">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="text-sm font-medium">{bet.selection}</div>
                    <div className="text-xs text-gray-400">Match Result</div>
                  </div>
                  <button onClick={() => handleRemoveBet(bet.id)} className="text-gray-400 hover:text-white">
                    <XIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex-1 mr-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                        $
                      </span>
                      <input type="number" value={bet.stake || ''} onChange={e => updateStake(bet.id, parseFloat(e.target.value) || 0)} className="w-full bg-[#2A4E8D] rounded py-1 pl-6 pr-2 text-sm" placeholder="0" />
                    </div>
                  </div>
                  <div className="bg-[#2A4E8D] rounded py-1 px-2 text-sm">
                    {bet.odds.toFixed(2)}
                  </div>
                </div>
                {bet.stake && <div className="text-right text-xs mt-0.5">
                    Payout: ${(bet.stake * bet.odds).toFixed(2)}
                  </div>}
              </div>)}
          </div>}
      </div>
      <div className="border-t border-[#13294B] p-2 flex-shrink-0 bg-[#1B3B6F]">
        {/* Balance Display */}
        {isAuthenticated && (
          <div className="flex justify-between text-xs mb-1 pb-1 border-b border-[#13294B]">
            <span>BALANCE</span>
            <span className={balance < totalStake ? 'text-red-400' : 'text-green-400'}>
              {getFormattedBalance()}
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-xs mb-1">
          <span>TOTAL STAKE ({selectedBets.length})</span>
          <span className={totalStake > balance && isAuthenticated ? 'text-red-400' : ''}>
            ${totalStake.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs mb-2">
          <span>EST. PAYOUT</span>
          <span className="text-[#50E3C2]">${estimatedPayout.toFixed(2)}</span>
        </div>
        {showSuccessMessage && (
          <div className="bg-green-600 text-white text-xs p-2 rounded mb-2">
            Bets placed successfully!
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-600 text-white text-xs p-2 rounded mb-2 flex items-start space-x-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        <button 
          className="w-full bg-[#4F44E0] hover:bg-[#3832A0] text-white py-2 rounded mt-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={selectedBets.length === 0 || totalStake === 0 || isPlacingBet || (isAuthenticated && totalStake > balance)} 
          onClick={handlePlaceBets}
        >
          {isPlacingBet ? 'Placing Bet...' : 
           !isAuthenticated ? 'Login to Place Bet' :
           totalStake > balance ? 'Insufficient Funds' :
           'Place Bet'}
        </button>
      </div>
    </div>;
};
export default BetSlip;