import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, TrophyIcon, ClockIcon, ListChecksIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBetting } from '../contexts/BettingContext';
import type { PlacedBet } from '../contexts/BettingContext';
import { trackPageView, trackButtonClick } from '../utils/analytics';

// The shape settlePendingBets returns. Named here so the banner state is typed
// against the contract rather than re-deriving it inline.
interface SettlementSummary {
  settled: number;
  won: number;
  lost: number;
  totalPayout: number;
}

const formatMoney = (amount: number): string => `$${amount.toFixed(2)}`;

// Dates arrive as Date objects in-session but as ISO strings after the history
// is rehydrated from localStorage, so always re-wrap before formatting.
const formatWhen = (value: Date | string): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));

// A multi's own selection field is a summary label at combined odds; the legs
// are what the punter actually picked, so they get their own indented list.
const MultiLegs: React.FC<{ bet: PlacedBet }> = ({ bet }) => {
  if (bet.betType !== 'multi' || !bet.legs || bet.legs.length === 0) return null;
  return (
    <ul className="mt-2 ml-1 pl-3 border-l border-ink space-y-1">
      {bet.legs.map((leg, index) => (
        <li key={`${bet.id}-leg-${index}`} className="flex justify-between text-sm text-paper/60">
          <span className="truncate mr-3">{leg.selection}</span>
          <span className="whitespace-nowrap">@ {leg.odds.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
};

const ResultsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { betHistory, settlePendingBets } = useBetting();
  // The last settlement run's summary. Held in state (not derived from history)
  // because once bets flip to settled there is nothing left in betHistory that
  // says which of them were settled by *this* click.
  const [summary, setSummary] = useState<SettlementSummary | null>(null);

  useEffect(() => {
    trackPageView('Results');
    // Empty deps: one page view per visit, not one per settlement re-render.
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="bg-ink-deep min-h-screen text-paper p-8 text-center">
        <h1 className="text-2xl font-bold text-accent mb-2">Results</h1>
        <p className="text-paper/60 mb-4">Sign in to see your pending and settled bets.</p>
        <Link to="/login" className="text-grape hover:underline">Log in</Link>
      </div>
    );
  }

  const pendingBets = betHistory.filter(bet => bet.status === 'pending');
  // Most recently settled first: after a settlement run the user wants to see
  // what just happened, not the oldest result in the book.
  const settledBets = betHistory
    .filter(bet => bet.status !== 'pending')
    .sort((a, b) =>
      new Date(b.settledAt ?? b.placedAt).getTime() - new Date(a.settledAt ?? a.placedAt).getTime()
    );

  const handleSettle = () => {
    // Track the click before settling so it precedes the per-bet 'Bet Settled'
    // events the context emits — the funnel then reads in causal order. No
    // per-bet tracking or toasts here: settlePendingBets already does both.
    trackButtonClick('Settle Pending Bets', 'ResultsPage', { pending_count: pendingBets.length });
    setSummary(settlePendingBets());
  };

  return (
    <div className="bg-ink min-h-screen text-paper">
      <div className="bg-surface border-b border-ink p-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-paper/60 mb-4">
          <Link to="/home" className="hover:text-paper flex items-center">
            <HomeIcon size={14} className="mr-1" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-paper" aria-current="page">Results</span>
        </nav>
        <div className="flex items-center">
          <TrophyIcon size={24} className="mr-3 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-accent">Results</h1>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Pending bets, with the settle control that resolves them all. */}
        <section className="bg-surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold flex items-center">
              <ClockIcon size={18} className="mr-2 text-paper/60" aria-hidden="true" />
              <span>Pending bets</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-raised text-xs font-bold">
                {pendingBets.length}
              </span>
            </h2>
            <button
              onClick={handleSettle}
              disabled={pendingBets.length === 0}
              className="bg-brand hover:bg-brand-dark text-paper text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Settle pending bets
            </button>
          </div>

          {summary && (
            <div
              role="status"
              className={`rounded-md border p-3 mb-4 text-sm font-medium ${
                summary.totalPayout > 0
                  ? 'border-accent text-accent'
                  : 'border-ink text-paper'
              } bg-raised`}
            >
              Settled {summary.settled} bet{summary.settled === 1 ? '' : 's'} — {summary.won} won,{' '}
              {summary.lost} lost, paid {formatMoney(summary.totalPayout)}
            </div>
          )}

          {pendingBets.length === 0 ? (
            <p className="text-sm text-paper/60">
              No pending bets. Head to{' '}
              <Link to="/home" className="text-grape hover:underline">the sportsbook</Link>{' '}
              to place one.
            </p>
          ) : (
            <ul className="divide-y divide-ink">
              {pendingBets.map(bet => (
                <li key={bet.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{bet.selection}</div>
                      <div className="text-xs text-paper/60 mt-0.5">
                        @ {bet.odds.toFixed(2)}
                        <span className="mx-1.5">·</span>
                        Placed {formatWhen(bet.placedAt)}
                      </div>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap">
                      <div className="text-paper/60">Stake {formatMoney(bet.stake)}</div>
                      <div className="text-accent font-semibold">
                        Returns {formatMoney(bet.potentialPayout)}
                      </div>
                    </div>
                  </div>
                  <MultiLegs bet={bet} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Settled bets: the historical record settlement writes into. */}
        <section className="bg-surface rounded-lg p-5">
          <h2 className="font-semibold flex items-center mb-4">
            <ListChecksIcon size={18} className="mr-2 text-paper/60" aria-hidden="true" />
            <span>Settled bets</span>
          </h2>

          {settledBets.length === 0 ? (
            <p className="text-sm text-paper/60">
              Nothing settled yet. Settle your pending bets to see results here.
            </p>
          ) : (
            <ul className="divide-y divide-ink">
              {settledBets.map(bet => (
                <li key={bet.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          bet.status === 'won' ? 'bg-accent text-ink' : 'bg-raised text-paper'
                        }`}
                      >
                        {bet.status}
                      </span>
                      <span className="font-medium truncate">{bet.selection}</span>
                    </div>
                    {bet.settledAt && (
                      <div className="text-xs text-paper/60 mt-1">
                        Settled {formatWhen(bet.settledAt)}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm whitespace-nowrap">
                    <div className="text-paper/60">Stake {formatMoney(bet.stake)}</div>
                    <div className={bet.status === 'won' ? 'text-accent font-semibold' : 'text-paper/60'}>
                      Paid {formatMoney(bet.actualPayout ?? 0)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default ResultsPage;
