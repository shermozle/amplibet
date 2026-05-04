import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import SportPage from './pages/SportPage';
import EventPage from './pages/EventPage';
import MyBetsPage from './pages/MyBetsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './contexts/AuthContext';
import { BettingProvider } from './contexts/BettingContext';
import { WalletProvider } from './contexts/WalletContext';
import { initializeAnalytics } from './utils/analytics';

export function App() {
  useEffect(() => {
    // Initialize Amplitude when the app loads
    initializeAnalytics();
  }, []);
  
  return <AuthProvider>
      <WalletProvider>
        <BettingProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <Routes>
              {/* Auth routes without layout */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Main app routes with layout */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/sport/:sportId" element={<SportPage />} />
                    <Route path="/event/:eventId" element={<EventPage />} />
                    <Route path="/my-bets" element={<MyBetsPage />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </Router>
        </BettingProvider>
      </WalletProvider>
    </AuthProvider>;
}
