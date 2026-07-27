import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useBetting } from '../contexts/BettingContext';
import { allEvents } from '../utils/mockData';
import { trackPageView, trackButtonClick } from '../utils/analytics';

// One head-to-head event as allEvents() returns it. Derived rather than
// redeclared so a change to the mock catalogue cannot drift from this page.
type H2HEvent = ReturnType<typeof allEvents>[number];

// Cash denominations the kiosk note acceptor takes. One place, so the buttons
// and their analytics (emitted inside insertCash) always agree.
const CASH_AMOUNTS = [20, 50] as const;

const KioskHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getFormattedBalance, insertCash } = useWallet();
  const { selectedBets, addBet } = useBetting();

  // A kiosk home screen without a scanned member is meaningless — there is no
  // balance to bet from — so bounce straight back to the scan screen.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/kiosk/scan');
    }
  }, [isAuthenticated, navigate]);

  // Fire the page view once, and only for a real (authenticated) visit — a
  // redirect bounce is not a home-screen impression.
  const viewTracked = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !viewTracked.current) {
      viewTracked.current = true;
      trackPageView('Kiosk Home');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  // Group fixtures under their league heading, preserving catalogue order.
  const eventsByLeague = new Map<string, H2HEvent[]>();
  for (const event of allEvents()) {
    const group = eventsByLeague.get(event.leagueName);
    if (group) {
      group.push(event);
    } else {
      eventsByLeague.set(event.leagueName, [event]);
    }
  }

  const selectionCount = selectedBets.length;
  const isSelected = (selectionId: string) => selectedBets.some(bet => bet.id === selectionId);

  // addBet emits 'Bet Added' itself — tracking here as well would double-count
  // every kiosk selection in Amplitude.
  const handleOddsTap = (event: H2HEvent, team: string, odds: number) => {
    addBet({
      id: `${event.id}-${team}`,
      eventId: event.id,
      selection: team,
      odds
    });
  };

  const goToSlip = (buttonName: string) => {
    trackButtonClick(buttonName, 'Kiosk Home', { selection_count: selectionCount });
    navigate('/kiosk/slip');
  };

  return (
    <div className="bg-ink min-h-screen text-white">
      {/* Top strip: balance, cash acceptor shortcuts, slip shortcut. Sticky so
          the balance is always in view while scrolling a long fixture list.
          insertCash emits 'Cash Inserted' itself — no tracking here. */}
      <div className="sticky top-0 z-10 bg-ink-deep border-b border-surface px-6 py-4 flex items-center gap-4 flex-wrap">
        <div className="mr-auto">
          <div className="text-base text-gray-400">Balance</div>
          <div className="text-4xl font-bold text-accent">{getFormattedBalance()}</div>
        </div>
        {CASH_AMOUNTS.map(amount => (
          <button
            key={amount}
            onClick={() => insertCash(amount)}
            className="h-14 px-8 rounded-xl bg-brand hover:bg-brand-dark text-xl font-bold"
          >
            +${amount}
          </button>
        ))}
        <button
          onClick={() => goToSlip('My Slip')}
          className="h-14 px-6 rounded-xl bg-raised hover:bg-raised-light text-lg font-semibold"
        >
          My slip ({selectionCount})
        </button>
      </div>

      {/* Fixture list. Extra bottom padding when the review bar is up so the
          last card is never hidden behind it. */}
      <div className={`px-6 pt-4 ${selectionCount > 0 ? 'pb-28' : 'pb-8'}`}>
        {Array.from(eventsByLeague.entries()).map(([leagueName, events]) => (
          <section key={leagueName} className="mt-6 first:mt-2">
            <h2 className="text-xl font-bold text-accent mb-3">{leagueName}</h2>
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="bg-surface rounded-xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <span className="text-lg font-semibold">
                      {event.homeTeam} v {event.awayTeam}
                    </span>
                    <span className="flex items-center text-base text-gray-400">
                      <ClockIcon size={18} className="mr-2" aria-hidden="true" />
                      {event.day === 'Today' ? '' : `${event.day} `}
                      {event.startTime}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      [event.homeTeam, event.odds.home],
                      [event.awayTeam, event.odds.away]
                    ] as const).map(([team, odds]) => {
                      const selected = isSelected(`${event.id}-${team}`);
                      // A fixture with no market yet (odds 0) cannot be added
                      // to the slip — a $0.00 price would place a bet that can
                      // never pay.
                      const available = odds > 0;
                      return (
                        <button
                          key={team}
                          onClick={() => handleOddsTap(event, team, odds)}
                          disabled={!available}
                          aria-pressed={selected}
                          className={`min-h-16 rounded-xl px-5 text-lg font-semibold flex items-center justify-between gap-3 ${
                            selected
                              ? 'bg-brand hover:bg-brand-dark'
                              : 'bg-raised hover:bg-raised-light disabled:opacity-40 disabled:hover:bg-raised'
                          }`}
                        >
                          <span className="truncate text-left">{team}</span>
                          <span className="text-xl font-bold">
                            {available ? odds.toFixed(2) : '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Review bar: appears with the first selection, giant target to move on
          to the slip. */}
      {selectionCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-surface border-t border-brand px-6 flex items-center justify-between gap-4 z-10">
          <span className="text-xl font-semibold">
            {selectionCount} selection{selectionCount === 1 ? '' : 's'}
          </span>
          <button
            onClick={() => goToSlip('Review & Bet')}
            className="h-16 px-10 rounded-xl bg-brand hover:bg-brand-dark text-xl font-bold"
          >
            Review &amp; bet
          </button>
        </div>
      )}
    </div>
  );
};

export default KioskHomePage;
