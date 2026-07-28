import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, SunIcon, UserIcon, LogOutIcon, ChevronDownIcon, Wallet, AwardIcon, MenuIcon, UserCogIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import { trackButtonClick } from '../../utils/analytics';
import DepositModal from '../Wallet/DepositModal';
import SearchModal from '../Search/SearchModal';

interface HeaderProps {
  // Opens the mobile navigation drawer; the hamburger only renders below lg,
  // where Layout hides the fixed sidebar.
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getFormattedBalance } = useWallet();
  const { points, tier } = useLoyalty();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
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
    setShowSearchModal(true);
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

  return <header className="bg-ink border-b border-surface py-3 px-4 flex items-center justify-between">
      <div className="flex items-center">
        {onMenuClick && (
          <button
            className="lg:hidden text-gray-400 hover:text-white mr-3"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <MenuIcon size={22} />
          </button>
        )}
        <Link to="/home" className="flex items-center" onClick={handleLogoClick}>
          <div className="text-xl font-bold text-white">
            <span className="text-white">AMPLI</span>
            <span className="text-brand">BET</span>
          </div>
        </Link>
      </div>
      <div className="flex items-center space-x-3">
        <button className="text-gray-400 hover:text-white" onClick={handleSearchClick} aria-label="Search events">
          <SearchIcon size={20} />
        </button>
        <button className="text-gray-400 hover:text-white" onClick={handleThemeToggle} aria-label="Toggle theme">
          <SunIcon size={20} />
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center space-x-4">
            {/* Balance and Deposit */}
            <div className="flex items-center space-x-3">
              {/* Points sit next to cash so the two balances are read together.
                  Links to the card because that is where the barcode is. */}
              <Link
                to="/rewards"
                onClick={() => trackButtonClick('Loyalty Balance', 'Header', { points_balance: points, loyalty_tier: tier.name })}
                className="hidden sm:flex items-center space-x-2 bg-surface px-3 py-1.5 rounded-md hover:bg-raised"
                aria-label={`${points.toLocaleString()} reward points, ${tier.name} tier`}
              >
                <AwardIcon size={16} className={tier.textClass} aria-hidden="true" />
                <span className="font-medium text-white">{points.toLocaleString()}</span>
              </Link>
              <div className="hidden sm:flex items-center space-x-2 bg-surface px-3 py-1.5 rounded-md">
                <Wallet size={16} className="text-accent" aria-hidden="true" />
                <span className="font-medium text-white">{getFormattedBalance()}</span>
              </div>
              <button
                onClick={handleDepositClick}
                className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Deposit
              </button>
            </div>

            {/* User Menu. A disclosure, not an ARIA menu — no roving arrow-key
                focus is implemented, so don't declare aria-haspopup="menu" and
                promise semantics screen readers won't find. Escape closes it. */}
            <div
              className="relative"
              ref={userMenuRef}
              onKeyDown={e => {
                if (e.key === 'Escape' && showUserMenu) setShowUserMenu(false);
              }}
            >
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-white hover:text-gray-300"
                aria-expanded={showUserMenu}
              >
                <UserIcon size={20} aria-hidden="true" />
                <span className="text-sm hidden sm:inline">{user.firstName}</span>
                <ChevronDownIcon size={16} aria-hidden="true" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-gray-400">{user.email}</div>
                    {/* The loyalty ID is what a member reads out on the phone, so
                        it needs to be findable without opening the card. */}
                    <div className="text-gray-400 font-mono text-xs mt-1">{user.id}</div>
                  </div>
                  <Link
                    to="/account"
                    onClick={() => {
                      trackButtonClick('Account', 'Header Menu');
                      setShowUserMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-raised"
                  >
                    <UserCogIcon size={16} className="mr-2" aria-hidden="true" />
                    Account & transactions
                  </Link>
                  <Link
                    to="/rewards"
                    onClick={() => {
                      trackButtonClick('Rewards', 'Header Menu');
                      setShowUserMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-raised"
                  >
                    <AwardIcon size={16} className="mr-2" aria-hidden="true" />
                    Rewards card
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-raised"
                  >
                    <LogOutIcon size={16} className="mr-2" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <Link to="/login" className="bg-brand hover:bg-brand-dark text-white py-1 px-3 rounded text-sm" onClick={handleLoginClick}>
              Log In
            </Link>
            <Link to="/signup" className="bg-brand hover:bg-brand-dark text-white py-1 px-3 rounded text-sm" onClick={handleSignupClick}>
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
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </header>;
};
export default Header;
