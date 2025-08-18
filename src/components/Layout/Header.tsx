import React from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, SunIcon } from 'lucide-react';
const Header: React.FC = () => {
  return <header className="bg-gray-900 border-b border-gray-800 py-3 px-4 flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <div className="text-xl font-bold text-white">
          <span className="text-white">BET</span>
          <span className="text-pink-500">RIGHT</span>
        </div>
      </Link>
      <div className="flex items-center space-x-3">
        <button className="text-gray-400 hover:text-white">
          <SearchIcon size={20} />
        </button>
        <button className="text-gray-400 hover:text-white">
          <SunIcon size={20} />
        </button>
        <button className="bg-pink-600 hover:bg-pink-700 text-white py-1 px-3 rounded text-sm">
          Log In
        </button>
        <button className="bg-pink-600 hover:bg-pink-700 text-white py-1 px-3 rounded text-sm">
          Sign Up
        </button>
      </div>
    </header>;
};
export default Header;