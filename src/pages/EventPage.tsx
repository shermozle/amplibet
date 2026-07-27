import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import { getEventById, getSportById } from '../utils/mockData';
import { useBetting } from '../contexts/BettingContext';
import { trackPageView, trackEventSelected } from '../utils/analytics';
const EventPage: React.FC = () => {
  const {
    eventId
  } = useParams<{
    eventId: string;
  }>();
  // No fallback event: an unknown id previously rendered an unrelated AFLW
  // fixture, so a broken link looked like a working page and polluted analytics
  // with a selection the user never made.
  const event = getEventById(eventId || '');
  const sport = event ? getSportById(event.sportId) : undefined;
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
  if (!event) {
    return <div className="bg-[#13294B] min-h-screen text-white p-8 text-center">
        <h1 className="text-2xl font-bold text-[#50E3C2] mb-2">Event not found</h1>
        <p className="text-gray-400 mb-4">This market is no longer listed.</p>
        <Link to="/home" className="text-[#9B7BFD] hover:underline">Back to home</Link>
      </div>;
  }
  const handleBetSelection = (team: string, odds: number) => {
    setSelectedTeam(team);
    const betId = `${event.id}-${team}`;
    // addBet emits the 'Bet Added' event itself — do not track it here as well,
    // or every selection is double-counted in Amplitude.
    addBet({
      id: betId,
      eventId: event.id,
      selection: team,
      odds: odds
    });
  };
  return <div className="bg-[#13294B] min-h-screen text-white">
      <div className="bg-gradient-to-r from-[#1B3B6F] to-[#13294B] border-b border-[#13294B] p-4">
        {/* Breadcrumb and heading derive from the event's own sport. They used to
            be hardcoded to AFLW, so every event — NRL, MLB, tennis — claimed to
            be Australian Rules and linked to the wrong sport page. */}
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400 mb-4">
          <Link to="/home" className="hover:text-white flex items-center">
            <HomeIcon size={14} className="mr-1" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <Link to={`/sport/${event.sportId}`} className="hover:text-white">
            {sport?.name ?? event.leagueName}
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-white" aria-current="page">
            {event.homeTeam} v {event.awayTeam}
          </span>
        </nav>
        <div className="flex items-center">
          <div className={`w-8 h-8 ${sport?.bgColor ?? 'bg-blue-600'} rounded-full flex items-center justify-center mr-3 text-xs`}>
            {sport?.icon ?? '🏆'}
          </div>
          <h1 className="text-2xl font-bold text-[#50E3C2]">{sport?.name ?? event.leagueName}</h1>
        </div>
      </div>
      <div className="p-4">
        <div className="bg-[#1B3B6F] rounded-lg overflow-hidden mb-4">
          <div className="p-4 border-b border-[#13294B]">
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
              <button className={`flex items-center justify-between p-3 rounded ${selectedTeam === event.homeTeam ? 'bg-[#4F44E0]' : 'bg-[#2A4E8D] hover:bg-[#3A5E9D]'}`} onClick={() => handleBetSelection(event.homeTeam, event.odds.home)}>
                <span>{event.homeTeam}</span>
                <span className="font-bold">{event.odds.home.toFixed(2)}</span>
              </button>
              <button className={`flex items-center justify-between p-3 rounded ${selectedTeam === event.awayTeam ? 'bg-[#4F44E0]' : 'bg-[#2A4E8D] hover:bg-[#3A5E9D]'}`} onClick={() => handleBetSelection(event.awayTeam, event.odds.away)}>
                <span>{event.awayTeam}</span>
                <span className="font-bold">{event.odds.away.toFixed(2)}</span>
              </button>
            </div>
            <div className="border-t border-[#13294B] pt-4">
              <h3 className="font-medium mb-3">Handicap</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D]">
                  <span>{event.homeTeam} (-6.5)</span>
                  <span className="font-bold">1.90</span>
                </button>
                <button className="flex items-center justify-between p-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D]">
                  <span>{event.awayTeam} (+6.5)</span>
                  <span className="font-bold">1.90</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#1B3B6F] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#13294B]">
            <h2 className="font-semibold">Other Markets</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Total Match Points</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-between p-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D]">
                    <span>Over 138.5</span>
                    <span className="font-bold">1.90</span>
                  </button>
                  <button className="flex items-center justify-between p-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D]">
                    <span>Under 138.5</span>
                    <span className="font-bold">1.90</span>
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">First Team to Score</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-between p-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D]">
                    <span>{event.homeTeam}</span>
                    <span className="font-bold">1.85</span>
                  </button>
                  <button className="flex items-center justify-between p-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D]">
                    <span>{event.awayTeam}</span>
                    <span className="font-bold">1.95</span>
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Race to 20 Points</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-between p-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D]">
                    <span>{event.homeTeam}</span>
                    <span className="font-bold">1.72</span>
                  </button>
                  <button className="flex items-center justify-between p-3 rounded bg-[#2A4E8D] hover:bg-[#3A5E9D]">
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