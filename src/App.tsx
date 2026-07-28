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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BettingProvider } from './contexts/BettingContext';
import { WalletProvider } from './contexts/WalletContext';
import { LoyaltyProvider } from './contexts/LoyaltyContext';

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
}

export function App() {
  // Nesting order is load-bearing: Loyalty reads the signed-in member from Auth,
  // and Betting credits points, so Betting must sit inside Loyalty.
  return <AuthProvider>
      <WalletProvider>
        <LoyaltyProvider>
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
                  <Route path="/rewards" element={<LoyaltyPage />} />
                </Route>
              </Routes>
            </Router>
          </BettingProvider>
        </LoyaltyProvider>
      </WalletProvider>
    </AuthProvider>;
}
