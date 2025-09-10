import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { trackPageView, trackButtonClick } from '../utils/analytics';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, default to home
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    trackPageView('Login');
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    trackButtonClick('Login Form Submit', 'LoginPage', { email_domain: email.split('@')[1] || 'unknown' });

    try {
      await login(email, password);
      // Redirect to the page they were trying to visit, or home
      navigate(from, { replace: true });
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const handleSignupLinkClick = () => {
    trackButtonClick('Signup Link', 'LoginPage');
  };

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="flex justify-center">
            <div className="text-3xl font-bold">
              <span className="text-white">AMPLI</span>
              <span className="text-[#4F44E0]">BET</span>
            </div>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-[#4F44E0] hover:text-[#3832A0]"
              onClick={handleSignupLinkClick}
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-500 text-white bg-[#1B3B6F] rounded-md focus:outline-none focus:ring-[#4F44E0] focus:border-[#4F44E0] focus:z-10"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-600 placeholder-gray-500 text-white bg-[#1B3B6F] rounded-md focus:outline-none focus:ring-[#4F44E0] focus:border-[#4F44E0] focus:z-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#4F44E0] hover:bg-[#3832A0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F44E0] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-400">
              Demo app - any email/password combination will work
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
