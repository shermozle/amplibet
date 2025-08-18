import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import { mockSports, mockAFLWEvents, getEventsByType } from '../utils/mockData';
import { trackPageView, trackSportSelected, trackEventSelected } from '../utils/analytics';
const SportPage: React.FC = () => {
  const {
    sportId
  } = useParams<{
    sportId: string;
  }>();
  const sport = mockSports.find(s => s.id === sportId) || {
    name: 'Sport',
    bgColor: 'bg-blue-600',
    icon: '🏆'
  };
  // For demo purposes, we'll show AFLW events for any sport
  const events = sportId === 'aflw' ? mockAFLWEvents : getEventsByType(sportId || '');
  useEffect(() => {
    if (sportId) {
      // Track page view and sport selection
      trackPageView('Sport', {
        sportId
      });
      trackSportSelected(sportId, sport.name);
    }
  }, [sportId, sport.name]);
  const handleEventClick = (event: any) => {
    trackEventSelected(event.id, event.homeTeam, event.awayTeam, event.sportId);
  };
  return <div className="bg-[#13294B] min-h-screen text-white">
      <div className="bg-gradient-to-r from-[#1B3B6F] to-[#13294B] border-b border-[#13294B] p-4">
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
          <span className="text-white">Australian Rules</span>
          <ChevronRightIcon size={14} className="mx-1" />
          <span className="text-white">Australia</span>
        </div>
        <div className="flex items-center">
          <div className={`w-8 h-8 ${sport.bgColor} rounded-full flex items-center justify-center mr-3`}>
            {typeof sport.icon === 'string' ? sport.icon : sport.icon}
          </div>
          <h1 className="text-2xl font-bold text-[#50E3C2]">AFL Womens.</h1>
        </div>
      </div>
      <div className="p-4">
        <div className="bg-[#1B3B6F] rounded-lg overflow-hidden">
          <div className="flex border-b border-[#13294B]">
            <div className="flex-1 border-r border-[#13294B]">
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold">Australia</h2>
                  <div className="bg-[#2A4E8D] text-xs rounded px-1">2</div>
                </div>
                <ul className="space-y-1">
                  <li className="hover:bg-[#2A4E8D] rounded p-2">
                    <a href="#" className="block text-sm">
                      All Australia
                    </a>
                  </li>
                  <li className="hover:bg-[#2A4E8D] rounded p-2">
                    <a href="#" className="block text-sm">
                      AFL
                    </a>
                  </li>
                  <li className="bg-[#2A4E8D] rounded p-2 border-l-2 border-[#50E3C2]">
                    <a href="#" className="block text-sm">
                      AFL Womens
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex-[3]">
              <div className="flex border-b border-[#13294B]">
                <button className="flex-1 p-3 text-center font-medium border-b-2 border-[#4F44E0]">
                  Matches
                </button>
                <button className="flex-1 p-3 text-center font-medium text-gray-400">
                  Futures
                </button>
              </div>
              <div className="divide-y divide-[#13294B]">
                {events.map(event => <div key={event.id} className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <Link to={`/event/${event.id}`} className="text-sm font-medium hover:text-[#9B7BFD]" onClick={() => handleEventClick(event)}>
                        {event.homeTeam} v {event.awayTeam}
                      </Link>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2 text-xs text-gray-400">
                          <div className="w-4 h-4 bg-[#2A4E8D] rounded-full flex items-center justify-center mr-1">
                            🏉
                          </div>
                          <span>{event.markets} markets</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <ClockIcon size={12} className="mr-1" />
                          <span>
                            {event.day === 'Today' ? '' : `${event.day} `}
                            {event.startTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center mr-2">
                          <span className="text-xs">SYD</span>
                        </div>
                        <div className="flex-1">{event.homeTeam}</div>
                        <Link to={`/event/${event.id}`} className={`py-1 px-3 rounded ${event.id === 'w1' ? 'bg-[#4F44E0]' : 'bg-[#2A4E8D]'}`} onClick={() => handleEventClick(event)}>
                          {event.odds.home.toFixed(2)}
                        </Link>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-600 rounded flex items-center justify-center mr-2">
                          <span className="text-xs">RIC</span>
                        </div>
                        <div className="flex-1">{event.awayTeam}</div>
                        <Link to={`/event/${event.id}`} className="py-1 px-3 rounded bg-[#2A4E8D]" onClick={() => handleEventClick(event)}>
                          {event.odds.away.toFixed(2)}
                        </Link>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default SportPage;