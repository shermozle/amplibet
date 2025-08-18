import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import { getEventById, mockAFLWEvents } from '../utils/mockData';
import { useBetting } from '../contexts/BettingContext';
import { trackPageView, trackEventSelected, trackBetAdded } from '../utils/analytics';
const EventPage: React.FC = () => {
  const {
    eventId
  } = useParams<{
    eventId: string;
  }>();
  const event = getEventById(eventId || '') || mockAFLWEvents[0];
  const {
    addBet
  } = useBetting();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  useEffect(() => {
    if (event) {
      // Track page view and event selection
      trackPageView('Event', {
        eventId: event.id,
        sportId: event.sportId
      });
      trackEventSelected(event.id, event.homeTeam, event.awayTeam, event.sportId);
    }
  }, [event]);
  const handleBetSelection = (team: string, odds: number) => {
    setSelectedTeam(team);
    const betId = `${event.id}-${team}`;
    // Add bet to context
    addBet({
      id: betId,
      eventId: event.id,
      selection: team,
      odds: odds
    });
    // Track bet added
    trackBetAdded(betId, event.id, team, odds);
  };
  return <div className="bg-gray-900 min-h-screen text-white">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center text-sm text-gray-400 mb-4">
          <Link to="/" className="hover:text-white flex items-center">
            <HomeIcon size={14} className="mr-1" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" />
          <Link to="/sport/sport" className="hover:text-white">
            Sport
          </Link>
          <ChevronRightIcon size={14} className="mx-1" />
          <Link to="/sport/aflw" className="hover:text-white">
            Australian Rules
          </Link>
          <ChevronRightIcon size={14} className="mx-1" />
          <span className="text-white">Australia</span>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
            🏉
          </div>
          <h1 className="text-2xl font-bold text-green-400">AFL Womens.</h1>
        </div>
      </div>
      <div className="p-4">
        <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">
                {event.homeTeam} v {event.awayTeam}
              </h2>
              <div className="flex items-center text-sm text-gray-400">
                <ClockIcon size={16} className="mr-1" />
                <span>
                  {event.day === 'Today' ? '' : `${event.day} `}
                  {event.startTime}
                </span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-medium mb-3">Match Result</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className={`flex items-center justify-between p-3 rounded ${selectedTeam === event.homeTeam ? 'bg-pink-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => handleBetSelection(event.homeTeam, event.odds.home)}>
                <span>{event.homeTeam}</span>
                <span className="font-bold">{event.odds.home.toFixed(2)}</span>
              </button>
              <button className={`flex items-center justify-between p-3 rounded ${selectedTeam === event.awayTeam ? 'bg-pink-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => handleBetSelection(event.awayTeam, event.odds.away)}>
                <span>{event.awayTeam}</span>
                <span className="font-bold">{event.odds.away.toFixed(2)}</span>
              </button>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-medium mb-3">Handicap</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-3 rounded bg-gray-700 hover:bg-gray-600">
                  <span>{event.homeTeam} (-6.5)</span>
                  <span className="font-bold">1.90</span>
                </button>
                <button className="flex items-center justify-between p-3 rounded bg-gray-700 hover:bg-gray-600">
                  <span>{event.awayTeam} (+6.5)</span>
                  <span className="font-bold">1.90</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold">Other Markets</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Total Match Points</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-between p-3 rounded bg-gray-700 hover:bg-gray-600">
                    <span>Over 138.5</span>
                    <span className="font-bold">1.90</span>
                  </button>
                  <button className="flex items-center justify-between p-3 rounded bg-gray-700 hover:bg-gray-600">
                    <span>Under 138.5</span>
                    <span className="font-bold">1.90</span>
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">First Team to Score</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-between p-3 rounded bg-gray-700 hover:bg-gray-600">
                    <span>{event.homeTeam}</span>
                    <span className="font-bold">1.85</span>
                  </button>
                  <button className="flex items-center justify-between p-3 rounded bg-gray-700 hover:bg-gray-600">
                    <span>{event.awayTeam}</span>
                    <span className="font-bold">1.95</span>
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Race to 20 Points</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-between p-3 rounded bg-gray-700 hover:bg-gray-600">
                    <span>{event.homeTeam}</span>
                    <span className="font-bold">1.72</span>
                  </button>
                  <button className="flex items-center justify-between p-3 rounded bg-gray-700 hover:bg-gray-600">
                    <span>{event.awayTeam}</span>
                    <span className="font-bold">2.10</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default EventPage;