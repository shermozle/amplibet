import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, FlagIcon, GamepadIcon, ClipboardList } from 'lucide-react';
import { mockSports } from '../../utils/mockData';
const Sidebar: React.FC = () => {
  const location = useLocation();
  return <aside className="w-48 bg-[#1B3B6F] text-white flex flex-col">
      <nav className="flex-1">
        <ul>
          <li>
            <Link to="/home" className={`flex items-center px-4 py-3 hover:bg-[#2A4E8D] ${location.pathname === '/home' ? 'border-l-4 border-[#4F44E0]' : ''}`}>
              <HomeIcon size={18} className="mr-2" />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/sport/racing" className={`flex items-center px-4 py-3 hover:bg-[#2A4E8D] ${location.pathname.includes('/sport/racing') ? 'border-l-4 border-[#4F44E0]' : ''}`}>
              <FlagIcon size={18} className="mr-2" />
              <span>Racing</span>
            </Link>
          </li>
          <li>
            <Link to="/sport/sport" className={`flex items-center px-4 py-3 hover:bg-[#2A4E8D] ${location.pathname.includes('/sport/sport') ? 'border-l-4 border-[#4F44E0]' : ''}`}>
              <FlagIcon size={18} className="mr-2" />
              <span>Sport</span>
            </Link>
          </li>
          <li>
            <Link to="/sport/esports" className={`flex items-center px-4 py-3 hover:bg-[#2A4E8D] ${location.pathname.includes('/sport/esports') ? 'border-l-4 border-[#4F44E0]' : ''}`}>
              <GamepadIcon size={18} className="mr-2" />
              <span>Esports</span>
            </Link>
          </li>
          <li>
            <Link to="/my-bets" className={`flex items-center px-4 py-3 hover:bg-[#2A4E8D] ${location.pathname === '/my-bets' ? 'border-l-4 border-[#4F44E0]' : ''}`}>
              <ClipboardList size={18} className="mr-2" />
              <span>My Bets</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="border-t border-[#13294B] mt-4 pt-4 px-4 pb-4">
        <h3 className="text-sm font-medium mb-2">Popular Now</h3>
        <ul className="space-y-2">
          {mockSports.map(sport => <li key={sport.id}>
              <Link to={`/sport/${sport.id}`} className="flex items-center text-sm hover:text-[#9B7BFD]">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${sport.bgColor}`}>
                  {sport.icon}
                </span>
                <span>{sport.name}</span>
              </Link>
            </li>)}
        </ul>
      </div>
    </aside>;
};
export default Sidebar;