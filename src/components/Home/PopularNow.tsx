import React from 'react';
import { Link } from 'react-router-dom';
import { FilterIcon } from 'lucide-react';
import { mockSports } from '../../utils/mockData';
const PopularNow: React.FC = () => {
  return <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Popular Now</h2>
        <button className="text-gray-400">
          <FilterIcon size={18} />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {mockSports.slice(0, 7).map(sport => <Link key={sport.id} to={`/sport/${sport.id}`} className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-750 transition-colors">
            <div className={`w-10 h-10 ${sport.bgColor} rounded-full flex items-center justify-center mb-2`}>
              {sport.icon}
            </div>
            <div className="text-sm font-medium">{sport.name}</div>
          </Link>)}
      </div>
    </div>;
};
export default PopularNow;