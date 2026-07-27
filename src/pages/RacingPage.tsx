import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, ClockIcon, FlagIcon } from 'lucide-react';
import { mockRaceEvents } from '../utils/mockData';
import { trackPageView } from '../utils/analytics';

// Racing hub: one card per race meeting. Races have a field of runners rather
// than two teams, so they get their own catalogue page instead of reusing the
// head-to-head SportPage.
const RacingPage: React.FC = () => {
  useEffect(() => {
    trackPageView('Racing');
  }, []);

  return <div className="bg-ink min-h-screen text-white">
      <div className="bg-surface border-b border-ink p-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400 mb-4">
          <Link to="/home" className="hover:text-white flex items-center">
            <HomeIcon size={14} className="mr-1" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-white" aria-current="page">Racing</span>
        </nav>
        <div className="flex items-center">
          <FlagIcon size={24} className="mr-3 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-accent">Racing</h1>
        </div>
      </div>

      <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockRaceEvents.map(race => (
          // The whole card is the link — the odds shown here are a preview, not
          // buttons. Betting happens on the race page, so a stray tap on a price
          // in the grid never silently adds a selection to the slip.
          <Link
            key={race.id}
            to={`/race/${race.id}`}
            className="block bg-surface rounded-lg overflow-hidden border border-surface hover:border-brand transition-colors"
          >
            <div className="p-4 border-b border-ink flex justify-between items-start">
              <div className="min-w-0 mr-2">
                <div className="font-semibold truncate">{race.venue}</div>
                <div className="text-sm text-gray-400">{race.distance}</div>
              </div>
              <div className="bg-raised rounded px-2 py-1 text-xs font-bold flex-shrink-0">
                R{race.raceNumber}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center text-sm text-gray-400 mb-3">
                <ClockIcon size={14} className="mr-1" aria-hidden="true" />
                <span>
                  {race.day === 'Today' ? '' : `${race.day} `}
                  {race.startTime}
                </span>
              </div>
              <ul className="space-y-1.5">
                {race.runners.slice(0, 3).map(runner => (
                  <li key={runner.number} className="flex items-center justify-between text-sm">
                    <span className="flex items-center min-w-0 mr-2">
                      <span className="w-5 h-5 bg-raised rounded flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                        {runner.number}
                      </span>
                      <span className="truncate">{runner.name}</span>
                    </span>
                    <span className="text-accent font-semibold whitespace-nowrap">
                      {runner.odds.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              {race.runners.length > 3 && (
                <div className="text-xs text-gray-400 mt-3">
                  +{race.runners.length - 3} more runners
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>;
};

export default RacingPage;
