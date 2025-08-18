import React from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon } from 'lucide-react';
import { mockSportEvents } from '../../utils/mockData';
const FeaturedEvents: React.FC = () => {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {mockSportEvents.map(event => <Link key={event.id} to={`/event/${event.id}`} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
          <div className={`p-3 ${event.sportId === 'afl' ? 'bg-yellow-500' : 'bg-purple-600'}`}>
            <h3 className="text-xl font-bold">{event.sportId.toUpperCase()}</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center mb-2">
              <ClockIcon size={16} className="mr-1 text-gray-400" />
              <span className="text-sm text-gray-400">
                {event.day === 'Today' ? '' : `${event.day} `}
                {event.startTime}
              </span>
            </div>
            <div className="mb-4">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                  {event.sportId === 'afl' ? '🏉' : '🏉'}
                </div>
                <div className="text-sm">
                  {event.homeTeam} v {event.awayTeam}
                </div>
              </div>
              <div className="text-xs text-gray-400">{event.leagueName}</div>
            </div>
            <div className="flex justify-between">
              <div className="flex-1 bg-gray-700 rounded p-2 mr-1 text-center">
                <div className="text-xs mb-1">
                  {event.homeTeam.split(' ')[0]}
                </div>
                <div className="font-bold">{event.odds.home.toFixed(2)}</div>
              </div>
              {event.odds.draw && <div className="flex-1 bg-gray-700 rounded p-2 mx-1 text-center">
                  <div className="text-xs mb-1">Draw</div>
                  <div className="font-bold">{event.odds.draw.toFixed(2)}</div>
                </div>}
              <div className="flex-1 bg-gray-700 rounded p-2 ml-1 text-center">
                <div className="text-xs mb-1">
                  {event.awayTeam.split(' ')[0]}
                </div>
                <div className="font-bold">{event.odds.away.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </Link>)}
    </div>;
};
export default FeaturedEvents;