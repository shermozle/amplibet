import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import { getSportById, getEventsBySport, teamAbbrev } from '../utils/mockData';
import { trackPageView, trackSportSelected } from '../utils/analytics';

const SportPage: React.FC = () => {
  const { sportId } = useParams<{ sportId: string }>();
  const sport = getSportById(sportId || '');
  const sportName = sport?.name ?? 'Sport';
  const events = getEventsBySport(sportId || '');
  // Competition name comes from the fixtures themselves rather than being
  // hardcoded, so the breadcrumb matches whatever sport is actually shown.
  const competition = events[0]?.leagueName ?? sportName;

  useEffect(() => {
    if (sportId) {
      trackPageView('Sport', { sportId, sport_name: sportName, event_count: events.length });
      trackSportSelected(sportId, sportName);
    }
  }, [sportId, sportName, events.length]);

  // No 'Event Selected' tracking here: EventPage emits it on mount, which also
  // covers direct URL entry. Tracking the click as well double-counts every
  // selection made from this page.

  return <div className="bg-[#13294B] min-h-screen text-white">
      <div className="bg-gradient-to-r from-[#1B3B6F] to-[#13294B] border-b border-[#13294B] p-4">
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
          <h1 className="text-2xl font-bold text-[#50E3C2]">{sportName}</h1>
        </div>
      </div>
      <div className="p-4">
        <div className="bg-[#1B3B6F] rounded-lg overflow-hidden">
          <div className="flex border-b border-[#13294B]">
            <button className="flex-1 p-3 text-center font-medium border-b-2 border-[#4F44E0]">
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
            <div className="divide-y divide-[#13294B]">
              {events.map(event => <div key={event.id} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Link to={`/event/${event.id}`} className="text-sm font-medium hover:text-[#9B7BFD]">
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
                        <div className="w-8 h-8 bg-[#2A4E8D] rounded flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs">{teamAbbrev(team)}</span>
                        </div>
                        <div className="flex-1 truncate">{team}</div>
                        <Link
                          to={`/event/${event.id}`}
                          className="py-1 px-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D] ml-2"
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
