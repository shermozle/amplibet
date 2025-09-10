import React, { useState, useEffect } from 'react';
import { useBetting } from '../contexts/BettingContext';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Clock, CheckCircle, XCircle, DollarSign, Calendar, Filter } from 'lucide-react';

interface BetWithDetails {
  id: string;
  eventId: string;
  selection: string;
  odds: number;
  stake: number;
  placedAt: Date;
  status: 'pending' | 'won' | 'lost';
  potentialPayout: number;
  actualPayout?: number;
  settledAt?: Date;
}

const MyBetsPage: React.FC = () => {
  const { betHistory, settleBet } = useBetting();
  const { isAuthenticated } = useAuth();
  const { addPayout } = useWallet();
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');
  const [processedBetIds, setProcessedBetIds] = useState<Set<string>>(new Set());

  // Simulate bet outcomes for demo purposes
  useEffect(() => {
    betHistory.forEach(bet => {
      // If bet is pending, was placed more than 30 seconds ago, and hasn't been processed yet
      if (bet.status === 'pending' && bet.placedAt && !processedBetIds.has(bet.id)) {
        const timeSincePlaced = Date.now() - new Date(bet.placedAt).getTime();
        if (timeSincePlaced > 30000) { // 30 seconds
          // 60% chance to win for demo
          const won = Math.random() > 0.4;
          
          if (won) {
            const actualPayout = bet.potentialPayout || 0;
            // Add winnings to wallet
            addPayout(actualPayout, `Bet win: ${bet.selection}`);
            // Settle bet as won
            settleBet(bet.id, 'won', actualPayout);
          } else {
            // Settle bet as lost
            settleBet(bet.id, 'lost', 0);
          }
          
          // Mark this bet as processed
          setProcessedBetIds(prev => new Set(prev).add(bet.id));
        }
      }
    });
  }, [betHistory, addPayout, settleBet, processedBetIds]);

  const filteredBets = betHistory.filter(bet => {
    if (filter === 'all') return true;
    return bet.status === filter;
  });

  const getStatusIcon = (status: 'pending' | 'won' | 'lost') => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-400" size={16} />;
      case 'won':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'lost':
        return <XCircle className="text-red-400" size={16} />;
    }
  };

  const getStatusText = (status: 'pending' | 'won' | 'lost') => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'won':
        return 'Won';
      case 'lost':
        return 'Lost';
    }
  };

  const getStatusColor = (status: 'pending' | 'won' | 'lost') => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400';
      case 'won':
        return 'text-green-400';
      case 'lost':
        return 'text-red-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const activeBets = betHistory.filter(bet => bet.status === 'pending');
  const settledBets = betHistory.filter(bet => bet.status !== 'pending');

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">My Bets</h1>
        <div className="bg-[#1B3B6F] rounded-lg p-8">
          <p className="text-gray-300 mb-4">Please log in to view your bet history</p>
          <a href="/login" className="bg-[#4F44E0] hover:bg-[#3832A0] text-white px-6 py-2 rounded-md">
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">My Bets</h1>
        <p className="text-gray-400">Track your active and historical bets</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1B3B6F] rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="text-yellow-400" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Active Bets</p>
              <p className="text-2xl font-bold text-white">{activeBets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1B3B6F] rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-400" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Won Bets</p>
              <p className="text-2xl font-bold text-green-400">
                {settledBets.filter(bet => bet.status === 'won').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1B3B6F] rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="text-green-400" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Total Winnings</p>
              <p className="text-2xl font-bold text-green-400">
                ${settledBets
                  .filter(bet => bet.status === 'won')
                  .reduce((sum, bet) => sum + (bet.actualPayout || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-400" />
          <span className="text-gray-400 text-sm">Filter:</span>
        </div>
        <div className="flex space-x-2">
          {['all', 'pending', 'won', 'lost'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                filter === filterOption
                  ? 'bg-[#4F44E0] text-white'
                  : 'bg-[#1B3B6F] text-gray-300 hover:bg-[#2A4A7F]'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </div>

      {/* Bets List */}
      {filteredBets.length === 0 ? (
        <div className="bg-[#1B3B6F] rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            {filter === 'all' ? 'No bets found' : `No ${filter} bets found`}
          </div>
          {filter === 'all' && (
            <p className="text-gray-500 text-sm">
              Place your first bet to see it here!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBets.map((bet) => (
            <div key={bet.id} className="bg-[#1B3B6F] rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(bet.status)}
                    <span className={`font-medium ${getStatusColor(bet.status)}`}>
                      {getStatusText(bet.status)}
                    </span>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center space-x-1 text-gray-400 text-sm">
                      <Calendar size={14} />
                      <span>Placed {formatDate(bet.placedAt)}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {bet.selection}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-3">Match Result</p>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-gray-400">Stake: </span>
                      <span className="text-white font-medium">${bet.stake?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Odds: </span>
                      <span className="text-white font-medium">{bet.odds.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">
                        {bet.status === 'pending' ? 'Potential' : 'Actual'} Payout: 
                      </span>
                      <span className={`font-medium ${
                        bet.status === 'won' ? 'text-green-400' : 
                        bet.status === 'lost' ? 'text-red-400' : 'text-white'
                      }`}>
                        ${bet.status === 'pending' 
                          ? bet.potentialPayout?.toFixed(2) 
                          : (bet.actualPayout || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {bet.settledAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Settled {formatDate(bet.settledAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Demo Notice */}
      <div className="mt-8 p-4 bg-[#13294B] rounded-lg border border-[#1B3B6F]">
        <p className="text-xs text-gray-400 text-center">
          🎯 Demo Mode: Bets are automatically settled after 30 seconds with simulated outcomes for demonstration purposes.
        </p>
      </div>
    </div>
  );
};

export default MyBetsPage;
