import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrophyIcon, TrendingUpIcon, ZapIcon, GiftIcon } from 'lucide-react';
import { trackPageView, trackButtonClick } from '../utils/analytics';

const benefits = [
  {
    icon: <TrophyIcon size={32} className="text-accent" />,
    title: 'Thrilling Action',
    description: 'Bet on thousands of markets across sport, racing, and esports. Every game is more exciting with skin in the game.',
  },
  {
    icon: <TrendingUpIcon size={32} className="text-accent" />,
    title: 'Competitive Odds',
    description: "We consistently beat the market on Australia's biggest events. More value on every bet, every time.",
  },
  {
    icon: <ZapIcon size={32} className="text-accent" />,
    title: 'Fast Payouts',
    description: 'Winnings hit your account in minutes, not days. Cash out anytime with no questions asked.',
  },
  {
    icon: <GiftIcon size={32} className="text-accent" />,
    title: 'Ongoing Promotions',
    description: 'Weekly odds boosts, multi bonuses, and loyalty rewards. The more you play, the more you get back.',
  },
];

const LandingPage: React.FC = () => {
  useEffect(() => {
    trackPageView('Landing');
  }, []);

  return (
    <div className="min-h-screen bg-ink-deep text-white flex flex-col">

      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="text-2xl font-bold">
          <span className="text-white">AMPLI</span>
          <span className="text-brand">BET</span>
        </div>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded text-sm font-medium text-white hover:text-accent transition-colors"
            onClick={() => trackButtonClick('Login', 'Landing')}
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded text-sm font-medium bg-brand hover:bg-brand-dark transition-colors"
            onClick={() => trackButtonClick('Sign Up Nav', 'Landing')}
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16">
        <div className="inline-block bg-brand/20 text-grape text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-brand/30">
          Australia's sharpest sports book
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 max-w-2xl">
          Bet smarter.<br />
          <span className="text-accent">Win bigger.</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-xl mb-10">
          Join hundreds of thousands of Australians who trust AmpliBet for competitive odds, lightning-fast payouts, and non-stop action.
        </p>

        <Link
          to="/signup"
          className="inline-block bg-brand hover:bg-brand-dark text-white text-lg font-bold px-10 py-4 rounded-lg transition-colors shadow-lg shadow-brand/30"
          onClick={() => trackButtonClick('Create Account Hero', 'Landing')}
        >
          Create Free Account
        </Link>

        <p className="text-xs text-gray-500 mt-4">No deposit required to sign up. 18+ only. Gamble responsibly.</p>
      </main>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto w-full px-4 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="bg-surface/60 border border-surface rounded-xl p-6 flex flex-col gap-3"
          >
            {b.icon}
            <h3 className="font-bold text-lg">{b.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{b.description}</p>
          </div>
        ))}
      </section>

    </div>
  );
};

export default LandingPage;
