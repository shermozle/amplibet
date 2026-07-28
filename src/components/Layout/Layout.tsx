import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BetSlip from '../Betting/BetSlip';
import { ToastViewport } from '../../contexts/NotificationContext';
import { useBetting } from '../../contexts/BettingContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ClipboardIcon } from 'lucide-react';
import SessionTimeoutManager from '../Session/SessionTimeoutManager';
import OnboardingOverlay from '../Onboarding/OnboardingOverlay';

interface LayoutProps {
  children: ReactNode;
}

// The authenticated shell. On lg+ the sidebar and bet slip are fixed columns;
// below that the sidebar becomes a drawer behind the header hamburger and the
// slip becomes a bottom sheet behind a floating toggle, so the PRD's responsive
// requirement is met without maintaining two layouts.
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const { selectedBets } = useBetting();

  // The floating toggle unmounts while the sheet is open, so the trap's own
  // focus-restore has nothing to return to — a keyboard user would be dumped at
  // the top of the page. Hand focus to the freshly remounted toggle instead.
  const closeSlip = () => {
    setSlipOpen(false);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('button[aria-label^="Open bet slip"]')?.focus();
    });
  };

  const drawerRef = useFocusTrap(drawerOpen, () => setDrawerOpen(false));
  const slipRef = useFocusTrap(slipOpen, closeSlip);

  return <div className="flex flex-col min-h-screen bg-ink text-white">
      <Header onMenuClick={() => setDrawerOpen(true)} />
      <ToastViewport />
      <div className="flex flex-1">
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
        <div className="hidden lg:flex">
          <BetSlip />
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation" className="relative h-full">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile bet slip: floating toggle + bottom sheet */}
      {!slipOpen && (
        <button
          onClick={() => setSlipOpen(true)}
          className="fixed bottom-4 right-4 z-40 lg:hidden bg-brand hover:bg-brand-dark text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center"
          aria-label={`Open bet slip (${selectedBets.length} selections)`}
        >
          <ClipboardIcon size={22} aria-hidden="true" />
          {selectedBets.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-ink text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {selectedBets.length}
            </span>
          )}
        </button>
      )}
      {slipOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeSlip}
            aria-hidden="true"
          />
          <div ref={slipRef} role="dialog" aria-modal="true" aria-label="Bet slip" className="relative h-[80vh] rounded-t-xl overflow-hidden">
            <BetSlip variant="sheet" onClose={closeSlip} />
          </div>
        </div>
      )}

      <SessionTimeoutManager />
      <OnboardingOverlay />
    </div>;
};
export default Layout;
