import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, SunIcon, UserIcon, LogOutIcon, ChevronDownIcon, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { trackButtonClick } from '../../utils/analytics';
import DepositModal from '../Wallet/DepositModal';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getFormattedBalance } = useWallet();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleLogout = () => {
    trackButtonClick('Logout', 'Header');
    logout();
    setShowUserMenu(false);
  };

  const handleSearchClick = () => {
    trackButtonClick('Search', 'Header');
    // Search functionality would be implemented here
  };

  const handleThemeToggle = () => {
    trackButtonClick('Theme Toggle', 'Header');
    // Theme toggle functionality would be implemented here
  };

  const handleLogoClick = () => {
    trackButtonClick('Logo', 'Header');
  };

  const handleLoginClick = () => {
    trackButtonClick('Login', 'Header');
  };

  const handleSignupClick = () => {
    trackButtonClick('Signup', 'Header');
  };

  const handleDepositClick = () => {
    trackButtonClick('Deposit', 'Header');
    setShowDepositModal(true);
  };

  return <header className="bg-[#13294B] border-b border-[#1B3B6F] py-3 px-4 flex items-center justify-between">
      <Link to="/" className="flex items-center" onClick={handleLogoClick}>
        <div className="text-xl font-bold text-white">
          <span className="text-white">AMPLI</span>
          <span className="text-[#4F44E0]">BET</span>
        </div>
      </Link>
      <div className="flex items-center space-x-3">
        <button className="text-gray-400 hover:text-white" onClick={handleSearchClick}>
          <SearchIcon size={20} />
        </button>
        <button className="text-gray-400 hover:text-white" onClick={handleThemeToggle}>
          <SunIcon size={20} />
        </button>
        
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-4">
            {/* Balance and Deposit */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-[#1B3B6F] px-3 py-1.5 rounded-md">
                <Wallet size={16} className="text-green-400" />
                <span className="font-medium text-white">{getFormattedBalance()}</span>
              </div>
              <button
                onClick={handleDepositClick}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Deposit
              </button>
            </div>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-white hover:text-gray-300"
              >
                <UserIcon size={20} />
                <span className="text-sm">{user.firstName}</span>
                <ChevronDownIcon size={16} />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1B3B6F] rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-gray-400">{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-[#2A4A7F]"
                  >
                    <LogOutIcon size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <Link to="/login" className="bg-[#4F44E0] hover:bg-[#3832A0] text-white py-1 px-3 rounded text-sm" onClick={handleLoginClick}>
              Log In
            </Link>
            <Link to="/signup" className="bg-[#4F44E0] hover:bg-[#3832A0] text-white py-1 px-3 rounded text-sm" onClick={handleSignupClick}>
              Sign Up
            </Link>
          </>
        )}
      </div>
      
      {/* Deposit Modal */}
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
    </header>;
};
export default Header;