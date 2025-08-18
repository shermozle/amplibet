import React from 'react';
import { Link } from 'react-router-dom';
import { FilterIcon } from 'lucide-react';
import { mockRaces } from '../../utils/mockData';
const UpcomingRacing: React.FC = () => {
  return <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Upcoming Racing</h2>
        <div className="flex items-center">
          <button className="text-gray-400">
            <FilterIcon size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mockRaces.slice(0, 5).map(race => <Link key={race.id} to={`/event/${race.id}`} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                🏇
              </div>
              <div>
                <div className="text-sm font-medium">Race {race.number}</div>
                <div className="text-xs text-gray-400">{race.venue}</div>
              </div>
            </div>
            <div className="bg-gray-700 text-center py-1 px-2 rounded text-sm">
              {race.time}
            </div>
          </Link>)}
      </div>
    </div>;
};
export default UpcomingRacing;