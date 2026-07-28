import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import { getSportById, getEventsBySport, teamAbbrev, mockSports, allEvents } from '../utils/mockData';
import { trackPageView, trackSportSelected } from '../utils/analytics';

// The sidebar's top-level "Sport" item lands on /sport/sport, which is not a
// sport id. It used to render a permanent empty state (and emit Sport Selected
// for a sport that doesn't exist), so it renders an index of all sports instead.
const SportsIndex: React.FC = () => {
  useEffect(() => {
    trackPageView('Sports Index');
  }, []);

  const fixtureCounts = allEvents().reduce<Record<string, number>>((counts, event) => {
    counts[event.sportId] = (counts[event.sportId] ?? 0) + 1;
    return counts;
  }, {});

  return <div className="bg-ink min-h-screen text-white">
      <div className="bg-gradient-to-r from-surface to-ink border-b border-ink p-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400 mb-4">
          <Link to="/home" className="hover:text-white flex items-center">
            <HomeIcon size={14} className="mr-1" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-white" aria-current="page">Sport</span>
        </nav>
        <h1 className="text-2xl font-bold text-accent">All sports</h1>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {mockSports.map(sport => (
          <Link
            key={sport.id}
            to={`/sport/${sport.id}`}
            className="bg-surface rounded-lg p-4 flex items-center hover:bg-raised transition-colors"
          >
            <span className={`w-8 h-8 mr-3 rounded-full flex items-center justify-center text-xs ${sport.bgColor}`}>
              {sport.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium truncate">{sport.name}</span>
              <span className="block text-xs text-gray-400">
                {fixtureCounts[sport.id] ? `${fixtureCounts[sport.id]} fixtures` : 'No fixtures'}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>;
};

const SportPage: React.FC = () => {
  const { sportId } = useParams<{ sportId: string }>();
  const isIndex = sportId === 'sport';
  const sport = getSportById(sportId || '');
  const sportName = sport?.name ?? 'Sport';
  const events = getEventsBySport(sportId || '');
  // Competition name comes from the fixtures themselves rather than being
  // hardcoded, so the breadcrumb matches whatever sport is actually shown.
  const competition = events[0]?.leagueName ?? sportName;

  useEffect(() => {
    if (sportId && !isIndex) {
      trackPageView('Sport', { sportId, sport_name: sportName, event_count: events.length });
      trackSportSelected(sportId, sportName);
    }
  }, [sportId, isIndex, sportName, events.length]);

  if (isIndex) return <SportsIndex />;

  // No 'Event Selected' tracking here: EventPage emits it on mount, which also
  // covers direct URL entry. Tracking the click as well double-counts every
  // selection made from this page.

  return <div className="bg-ink min-h-screen text-white">
      <div className="bg-gradient-to-r from-surface to-ink border-b border-ink p-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400 mb-4">
          <Link to="/home" className="hover:text-white flex items-center">
            <HomeIcon size={14} className="mr-1" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-white">{competition}</span>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-white" aria-current="page">{sportName}</span>
        </nav>
        <div className="flex items-center">
          <div className={`w-8 h-8 ${sport?.bgColor ?? 'bg-blue-600'} rounded-full flex items-center justify-center mr-3 text-xs`}>
            {sport?.icon ?? '🏆'}
          </div>
          <h1 className="text-2xl font-bold text-accent">{sportName}</h1>
        </div>
      </div>
      <div className="p-4">
        <div className="bg-surface rounded-lg overflow-hidden">
          <div className="flex border-b border-ink">
            <button className="flex-1 p-3 text-center font-medium border-b-2 border-brand">
              Matches
            </button>
            <button className="flex-1 p-3 text-center font-medium text-gray-400">
              Futures
            </button>
          </div>
          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="mb-1">No fixtures currently listed for {sportName}.</p>
              <p className="text-sm text-gray-500">Check back closer to match day.</p>
            </div>
          ) : (
            <div className="divide-y divide-ink">
              {events.map(event => <div key={event.id} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Link to={`/event/${event.id}`} className="text-sm font-medium hover:text-grape">
                      {event.homeTeam} v {event.awayTeam}
                    </Link>
                    <div className="flex items-center">
                      <div className="flex items-center mr-2 text-xs text-gray-400">
                        <span>{event.markets} markets</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <ClockIcon size={12} className="mr-1" aria-hidden="true" />
                        <span>
                          {event.day === 'Today' ? '' : `${event.day} `}
                          {event.startTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([['home', event.homeTeam, event.odds.home], ['away', event.awayTeam, event.odds.away]] as const).map(([side, team, odds]) => (
                      <div key={side} className="flex items-center">
                        <div className="w-8 h-8 bg-raised rounded flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs">{teamAbbrev(team)}</span>
                        </div>
                        <div className="flex-1 truncate">{team}</div>
                        <Link
                          to={`/event/${event.id}`}
                          className="py-1 px-3 rounded bg-raised hover:bg-raised-light ml-2"
                          aria-label={`${team} at odds ${odds.toFixed(2)}`}
                        >
                          {odds.toFixed(2)}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>)}
            </div>
          )}
        </div>
      </div>
    </div>;
};
export default SportPage;
