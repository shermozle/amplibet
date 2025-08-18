import React, { useState } from 'react';
import { useBetting } from '../../contexts/BettingContext';
import { ClipboardIcon, XIcon } from 'lucide-react';
const BetSlip: React.FC = () => {
  const {
    selectedBets,
    removeBet,
    updateStake,
    placeBets,
    totalStake,
    estimatedPayout
  } = useBetting();
  const [isCollapsed, setIsCollapsed] = useState(false);
  if (isCollapsed) {
    return <div className="w-12 bg-gray-800 border-l border-gray-700 flex flex-col items-center py-4">
        <button onClick={() => setIsCollapsed(false)} className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mb-2">
          <ClipboardIcon size={18} />
        </button>
        <div className="text-xs font-semibold">{selectedBets.length}</div>
      </div>;
  }
  return <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Single Bets</h3>
        <button onClick={() => setIsCollapsed(true)} className="text-gray-400 hover:text-white">
          <XIcon size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {selectedBets.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">
            No bets selected
          </div> : <div className="divide-y divide-gray-700">
            {selectedBets.map(bet => <div key={bet.id} className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-medium">{bet.selection}</div>
                    <div className="text-xs text-gray-400">Match Result</div>
                  </div>
                  <button onClick={() => removeBet(bet.id)} className="text-gray-400 hover:text-white">
                    <XIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex-1 mr-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                        $
                      </span>
                      <input type="number" value={bet.stake || ''} onChange={e => updateStake(bet.id, parseFloat(e.target.value) || 0)} className="w-full bg-gray-700 rounded py-1 pl-6 pr-2 text-sm" placeholder="0" />
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded py-1 px-3 text-sm">
                    {bet.odds.toFixed(2)}
                  </div>
                </div>
                {bet.stake && <div className="text-right text-xs mt-1">
                    Payout: ${(bet.stake * bet.odds).toFixed(2)}
                  </div>}
              </div>)}
          </div>}
      </div>
      <div className="border-t border-gray-700 p-3">
        <div className="flex justify-between text-sm mb-1">
          <span>TOTAL STAKE ({selectedBets.length})</span>
          <span>${totalStake.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>EST. PAYOUT</span>
          <span className="text-green-400">${estimatedPayout.toFixed(2)}</span>
        </div>
        <button className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded mt-3 font-medium" disabled={selectedBets.length === 0 || totalStake === 0} onClick={placeBets}>
          Place Bet
        </button>
      </div>
    </div>;
};
export default BetSlip;