import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBetting } from '../contexts/BettingContext';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, DollarSign, Calendar, Filter } from 'lucide-react';

const MyBetsPage: React.FC = () => {
  const { betHistory } = useBetting();
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');

  // Settlement is BettingContext.settlePendingBets, triggered from the Results
  // page. This page used to run its own 30-second 60% coin flip on mount, which
  // emitted no 'Bet Settled' events and would now race the real engine —
  // settling the same bet twice and paying a winner double.

  const filteredBets = betHistory.filter(bet => {
    if (filter === 'all') return true;
    return bet.status === filter;
  });

  const getStatusIcon = (status: 'pending' | 'won' | 'lost') => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-400" size={16} />;
      case 'won':
        return <CheckCircle className="text-accent" size={16} />;
      case 'lost':
        return <XCircle className="text-danger" size={16} />;
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
        return 'text-accent';
      case 'lost':
        return 'text-danger';
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
        <div className="bg-surface rounded-lg p-8">
          <p className="text-gray-300 mb-4">Please log in to view your bet history</p>
          {/* Must be a Link: a raw href bypasses HashRouter and 404s under the
              /amplibet/ Pages base path. */}
          <Link to="/login" className="inline-block bg-brand hover:bg-brand-dark text-white px-6 py-2 rounded-md">
            Log In
          </Link>
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
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="text-yellow-400" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Active Bets</p>
              <p className="text-2xl font-bold text-white">{activeBets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-accent" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Won Bets</p>
              <p className="text-2xl font-bold text-accent">
                {settledBets.filter(bet => bet.status === 'won').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="text-accent" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Total Winnings</p>
              <p className="text-2xl font-bold text-accent">
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
                  ? 'bg-brand text-white'
                  : 'bg-surface text-gray-300 hover:bg-raised'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </div>

      {/* Bets List */}
      {filteredBets.length === 0 ? (
        <div className="bg-surface rounded-lg p-8 text-center">
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
            <div key={bet.id} className="bg-surface rounded-lg p-4">
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
                        bet.status === 'won' ? 'text-accent' : 
                        bet.status === 'lost' ? 'text-danger' : 'text-white'
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
      <div className="mt-8 p-4 bg-ink rounded-lg border border-surface">
        <p className="text-xs text-gray-400 text-center">
          🎯 Demo Mode: settle pending bets from the{' '}
          <Link to="/results" className="text-grape hover:underline">Results</Link> page —
          outcomes are simulated from each selection's odds.
        </p>
      </div>
    </div>
  );
};

export default MyBetsPage;
