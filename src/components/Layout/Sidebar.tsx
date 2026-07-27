import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, FlagIcon, GamepadIcon, ClipboardList, AwardIcon, TrophyIcon } from 'lucide-react';
import { mockSports } from '../../utils/mockData';

interface SidebarProps {
  // Set when the sidebar renders inside the mobile drawer: navigating should
  // close the drawer, otherwise the menu sits over the page it just changed.
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const location = useLocation();
  const itemClass = (active: boolean) =>
    `flex items-center px-4 py-3 hover:bg-raised ${active ? 'border-l-4 border-brand' : ''}`;

  return <aside className="w-48 bg-surface text-white flex flex-col h-full">
      <nav className="flex-1" aria-label="Main">
        <ul>
          <li>
            <Link to="/home" onClick={onNavigate} className={itemClass(location.pathname === '/home')}>
              <HomeIcon size={18} className="mr-2" aria-hidden="true" />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/racing" onClick={onNavigate} className={itemClass(location.pathname.startsWith('/racing') || location.pathname.startsWith('/race/'))}>
              <FlagIcon size={18} className="mr-2" aria-hidden="true" />
              <span>Racing</span>
            </Link>
          </li>
          <li>
            <Link to="/sport/sport" onClick={onNavigate} className={itemClass(location.pathname.includes('/sport/sport'))}>
              <FlagIcon size={18} className="mr-2" aria-hidden="true" />
              <span>Sport</span>
            </Link>
          </li>
          <li>
            <Link to="/sport/esports" onClick={onNavigate} className={itemClass(location.pathname.includes('/sport/esports'))}>
              <GamepadIcon size={18} className="mr-2" aria-hidden="true" />
              <span>Esports</span>
            </Link>
          </li>
          <li>
            <Link to="/my-bets" onClick={onNavigate} className={itemClass(location.pathname === '/my-bets')}>
              <ClipboardList size={18} className="mr-2" aria-hidden="true" />
              <span>My Bets</span>
            </Link>
          </li>
          <li>
            <Link to="/results" onClick={onNavigate} className={itemClass(location.pathname === '/results')}>
              <TrophyIcon size={18} className="mr-2" aria-hidden="true" />
              <span>Results</span>
            </Link>
          </li>
          <li>
            <Link to="/rewards" onClick={onNavigate} className={itemClass(location.pathname === '/rewards')}>
              <AwardIcon size={18} className="mr-2" aria-hidden="true" />
              <span>Rewards</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="border-t border-ink mt-4 pt-4 px-4 pb-4">
        <h3 className="text-sm font-medium mb-2">Popular Now</h3>
        <ul className="space-y-2">
          {mockSports.map(sport => <li key={sport.id}>
              <Link to={`/sport/${sport.id}`} onClick={onNavigate} className="flex items-center text-sm hover:text-grape">
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
