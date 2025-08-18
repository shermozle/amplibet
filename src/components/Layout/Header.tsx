import React from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, SunIcon } from 'lucide-react';
const Header: React.FC = () => {
  return <header className="bg-[#13294B] border-b border-[#1B3B6F] py-3 px-4 flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <div className="text-xl font-bold text-white">
          <span className="text-white">AMPLI</span>
          <span className="text-[#4F44E0]">BET</span>
        </div>
      </Link>
      <div className="flex items-center space-x-3">
        <button className="text-gray-400 hover:text-white">
          <SearchIcon size={20} />
        </button>
        <button className="text-gray-400 hover:text-white">
          <SunIcon size={20} />
        </button>
        <button className="bg-[#4F44E0] hover:bg-[#3832A0] text-white py-1 px-3 rounded text-sm">
          Log In
        </button>
        <button className="bg-[#4F44E0] hover:bg-[#3832A0] text-white py-1 px-3 rounded text-sm">
          Sign Up
        </button>
      </div>
    </header>;
};
export default Header;