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
import KioskLayout from './kiosk/KioskLayout';
import KioskAttractPage from './kiosk/KioskAttractPage';
import KioskScanPage from './kiosk/KioskScanPage';
import KioskHomePage from './kiosk/KioskHomePage';
import KioskSlipPage from './kiosk/KioskSlipPage';
import KioskDonePage from './kiosk/KioskDonePage';
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
                  {/* Kiosk surface: its own chrome (no Header/Sidebar/BetSlip),
                      same providers, so a scanned member shares the exact
                      contexts a web member does. KioskLayout flips the
                      analytics surface to 'kiosk' while mounted. */}
                  <Route path="/kiosk" element={<KioskLayout />}>
                    <Route index element={<KioskAttractPage />} />
                    <Route path="scan" element={<KioskScanPage />} />
                    <Route path="home" element={<KioskHomePage />} />
                    <Route path="slip" element={<KioskSlipPage />} />
                    <Route path="done" element={<KioskDonePage />} />
                  </Route>
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
