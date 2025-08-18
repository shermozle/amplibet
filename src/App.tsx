import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import SportPage from './pages/SportPage';
import EventPage from './pages/EventPage';
import { BettingProvider } from './contexts/BettingContext';
import { initializeAnalytics } from './utils/analytics';
export function App() {
  useEffect(() => {
    // Initialize Amplitude when the app loads
    initializeAnalytics();
  }, []);
  return <BettingProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sport/:sportId" element={<SportPage />} />
            <Route path="/event/:eventId" element={<EventPage />} />
          </Routes>
        </Layout>
      </Router>
    </BettingProvider>;
}