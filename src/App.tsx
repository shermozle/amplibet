import { HashRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import SportPage from './pages/SportPage';
import EventPage from './pages/EventPage';
import MyBetsPage from './pages/MyBetsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LoyaltyPage from './pages/LoyaltyPage';
import AccountPage from './pages/AccountPage';
import ResultsPage from './pages/ResultsPage';
import RacingPage from './pages/RacingPage';
import RacePage from './pages/RacePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BettingProvider } from './contexts/BettingContext';
import { WalletProvider } from './contexts/WalletContext';
import { LoyaltyProvider } from './contexts/LoyaltyContext';
import { NotificationProvider } from './contexts/NotificationContext';

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
}

export function App() {
  // Nesting order is load-bearing: Loyalty reads the signed-in member from Auth,
  // Betting credits points and raises settlement toasts, so Betting must sit
  // inside both Loyalty and Notification.
  return <AuthProvider>
      <WalletProvider>
        <LoyaltyProvider>
          <NotificationProvider>
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
                    <Route path="/racing" element={<RacingPage />} />
                    <Route path="/race/:raceId" element={<RacePage />} />
                    <Route path="/my-bets" element={<MyBetsPage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/rewards" element={<LoyaltyPage />} />
                  </Route>
                </Routes>
              </Router>
            </BettingProvider>
          </NotificationProvider>
        </LoyaltyProvider>
      </WalletProvider>
    </AuthProvider>;
}
