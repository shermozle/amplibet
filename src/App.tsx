import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import SportPage from './pages/SportPage';
import EventPage from './pages/EventPage';
import MyBetsPage from './pages/MyBetsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BettingProvider } from './contexts/BettingContext';
import { WalletProvider } from './contexts/WalletContext';
import { initializeAnalytics } from './utils/analytics';

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
}

export function App() {
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return <AuthProvider>
      <WalletProvider>
        <BettingProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/" element={<RootRoute />} />
              <Route element={<Layout><Outlet /></Layout>}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/sport/:sportId" element={<SportPage />} />
                <Route path="/event/:eventId" element={<EventPage />} />
                <Route path="/my-bets" element={<MyBetsPage />} />
              </Route>
            </Routes>
          </Router>
        </BettingProvider>
      </WalletProvider>
    </AuthProvider>;
}
