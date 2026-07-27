import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import { getRaceById } from '../utils/mockData';
import type { RaceRunner } from '../utils/mockData';
import { useBetting } from '../contexts/BettingContext';
import { trackPageView } from '../utils/analytics';

const RacePage: React.FC = () => {
  const { raceId } = useParams<{ raceId: string }>();
  // No fallback race: an unknown id must render a not-found state rather than an
  // unrelated card, or a broken link would pollute analytics with a race the
  // user never opened.
  const race = getRaceById(raceId || '');
  const { addBet } = useBetting();
  const [selectedRunner, setSelectedRunner] = useState<string | null>(null);

  useEffect(() => {
    // Keyed on the race object: getRaceById returns a stable module-level
    // reference, so this fires once per race visited, not on every render.
    if (race) {
      trackPageView('Race', { race_id: race.id, venue: race.venue });
    }
  }, [race]);

  if (!race) {
    return <div className="bg-ink min-h-screen text-white p-8 text-center">
        <h1 className="text-2xl font-bold text-accent mb-2">Race not found</h1>
        <p className="text-gray-400 mb-4">This race is no longer listed.</p>
        <Link to="/home" className="text-grape hover:underline">Back to home</Link>
      </div>;
  }

  const handleRunnerSelection = (runner: RaceRunner) => {
    setSelectedRunner(runner.name);
    // The selection label carries the race context (venue and race number)
    // because the bet slip and history show selections without their event, and
    // "Copper Sky" alone is meaningless there.
    // addBet emits the 'Bet Added' event itself — do not track it here as well,
    // or every selection is double-counted in Amplitude.
    addBet({
      id: `${race.id}-${runner.name}`,
      eventId: race.id,
      selection: `${runner.name} (R${race.raceNumber} ${race.venue})`,
      odds: runner.odds
    });
  };

  return <div className="bg-ink min-h-screen text-white">
      <div className="bg-surface border-b border-ink p-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400 mb-4">
          <Link to="/home" className="hover:text-white flex items-center">
            <HomeIcon size={14} className="mr-1" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <Link to="/racing" className="hover:text-white">Racing</Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-white" aria-current="page">
            {race.venue} R{race.raceNumber}
          </span>
        </nav>
        <h1 className="text-2xl font-bold text-accent">{race.venue}</h1>
      </div>

      <div className="p-4">
        <div className="bg-surface rounded-lg p-4 mb-4 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-raised rounded flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
              R{race.raceNumber}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{race.venue}</h2>
              <div className="text-sm text-gray-400">
                Race {race.raceNumber} · {race.distance}
              </div>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <ClockIcon size={16} className="mr-1" aria-hidden="true" />
            <span>
              {race.day === 'Today' ? '' : `${race.day} `}
              {race.startTime}
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-lg overflow-hidden">
          <div className="p-4 border-b border-ink">
            <h2 className="font-semibold">Win</h2>
          </div>
          <ul className="divide-y divide-ink">
            {race.runners.map(runner => (
              <li key={runner.number} className="p-3 flex items-center">
                <div className="w-8 h-8 bg-raised rounded flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                  {runner.number}
                </div>
                <span className="flex-1 min-w-0 truncate mr-3">{runner.name}</span>
                {/* The button shows only a price, so the runner's name has to be
                    in the accessible label for the row to make sense to a screen
                    reader. */}
                <button
                  onClick={() => handleRunnerSelection(runner)}
                  aria-label={`${runner.name} at odds ${runner.odds.toFixed(2)}`}
                  className={`px-4 py-2 rounded font-bold min-w-[4.5rem] ${selectedRunner === runner.name ? 'bg-brand hover:bg-brand-dark' : 'bg-raised hover:bg-raised-light'}`}
                >
                  {runner.odds.toFixed(2)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>;
};

export default RacePage;
