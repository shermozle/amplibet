import React from 'react';
import { Link } from 'react-router-dom';
import { FilterIcon } from 'lucide-react';
import { mockTennisEvents } from '../../utils/mockData';
const UpcomingSport: React.FC = () => {
  return <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Upcoming Sport</h2>
        <div className="flex items-center">
          <button className="text-gray-400">
            <FilterIcon size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {mockTennisEvents.map(event => <Link key={event.id} to={`/event/${event.id}`} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
            <div className="text-xs text-gray-400 mb-1">{event.leagueName}</div>
            <div className="text-sm mb-3">
              {event.homeTeam} v {event.awayTeam}
            </div>
            <div className="flex justify-between">
              <div className="bg-gray-700 text-center py-1 px-2 rounded text-sm">
                {event.startTime}
              </div>
              <div className="flex">
                <div className="bg-gray-700 text-center py-1 px-2 rounded-l text-sm">
                  {event.odds.home.toFixed(2)}
                </div>
                <div className="bg-gray-700 text-center py-1 px-2 rounded-r text-sm border-l border-gray-600">
                  {event.odds.away.toFixed(2)}
                </div>
              </div>
            </div>
          </Link>)}
      </div>
    </div>;
};
export default UpcomingSport;