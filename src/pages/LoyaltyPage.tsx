import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon, AwardIcon, StoreIcon, MonitorIcon, PhoneIcon, TabletIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLoyalty } from '../contexts/LoyaltyContext';
import { TIERS } from '../utils/loyalty';
import type { Surface } from '../utils/surface';
import { Barcode } from '../components/Loyalty/Barcode';
import { trackPageView, trackLoyaltyCardViewed } from '../utils/analytics';

// Surfaces are shown with an icon and a human label rather than the raw enum, so
// the ledger reads as a customer statement instead of an event dump.
const SURFACE_LABELS: Record<Surface, { label: string; Icon: typeof StoreIcon }> = {
  web: { label: 'Online', Icon: MonitorIcon },
  kiosk: { label: 'In-venue kiosk', Icon: TabletIcon },
  in_store: { label: 'Over the counter', Icon: StoreIcon },
  call_centre: { label: 'Phone', Icon: PhoneIcon }
};

const LoyaltyPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { points, tier, nextTier, pointsToNext, progress, ledger } = useLoyalty();

  useEffect(() => {
    trackPageView('Loyalty');
    if (user) trackLoyaltyCardViewed(user.id, tier.name, points);
    // Deliberately keyed on the member, not on `points`: this should fire once per
    // visit, not again every time a balance ticks over while the page is open.
  }, [user, tier.name, points]);

  if (!isAuthenticated || !user) {
    return <div className="bg-ink min-h-screen text-white p-8 text-center">
        <h1 className="text-2xl font-bold text-accent mb-2">AmpliBet Rewards</h1>
        <p className="text-gray-400 mb-4">Sign in to see your card and points balance.</p>
        <Link to="/login" className="text-grape hover:underline">Log in</Link>
      </div>;
  }

  // Accrual by surface is the headline number for this feature: it is the answer
  // to "is the loyalty programme actually pulling in-venue betting into view?"
  const bySurface = ledger.reduce<Partial<Record<Surface, number>>>((totals, entry) => {
    totals[entry.surface] = (totals[entry.surface] ?? 0) + entry.points;
    return totals;
  }, {});

  return <div className="bg-ink min-h-screen text-white">
      <div className="bg-gradient-to-r from-surface to-ink border-b border-ink p-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400 mb-4">
          <Link to="/home" className="hover:text-white flex items-center">
            <HomeIcon size={14} className="mr-1" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-white" aria-current="page">Rewards</span>
        </nav>
        <div className="flex items-center">
          <AwardIcon size={24} className={`mr-3 ${tier.textClass}`} aria-hidden="true" />
          <h1 className="text-2xl font-bold text-accent">AmpliBet Rewards</h1>
        </div>
      </div>

      <div className="p-4 grid gap-4 lg:grid-cols-2">
        {/* The card. Scannable at any venue — this is the physical link between a
            person's online account and their over-the-counter activity. */}
        <section className="bg-gradient-to-br from-raised to-surface rounded-lg p-5 border border-raised-light">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xs text-gray-300 uppercase tracking-wider">Member</div>
              <div className="text-lg font-semibold">{user.firstName} {user.lastName}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold text-ink ${tier.bgClass}`}>
              {tier.name.toUpperCase()}
            </div>
          </div>

          <div className="bg-white rounded p-3 mb-3">
            <Barcode value={user.id} height={56} className="w-full h-14" />
            {/* The human-readable ID under the bars is required by Code 39
                convention and is what call centre staff read back. */}
            <div className="text-center text-ink font-mono text-sm tracking-[0.2em] mt-2">
              {user.id}
            </div>
          </div>

          <p className="text-xs text-gray-300">
            Scan at any AmpliBet venue or kiosk to earn points on cash bets.
          </p>
        </section>

        {/* Balance and tier progress. */}
        <section className="bg-surface rounded-lg p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Points balance</div>
          <div className="text-4xl font-bold text-accent mb-4">{points.toLocaleString()}</div>

          {nextTier ? (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className={tier.textClass}>{tier.name}</span>
                <span className="text-gray-400">
                  {pointsToNext.toLocaleString()} to {nextTier.name}
                </span>
              </div>
              <div
                className="h-2 bg-ink rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress to ${nextTier.name}`}
              >
                <div className={`h-full ${tier.bgClass}`} style={{ width: `${progress * 100}%` }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-accent">Top tier reached. Nice work.</p>
          )}

          <div className="mt-5 pt-4 border-t border-ink">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tiers</div>
            <ul className="space-y-1 text-sm">
              {TIERS.map(candidate => (
                <li key={candidate.name} className="flex justify-between">
                  <span className={candidate.name === tier.name ? candidate.textClass : 'text-gray-400'}>
                    {candidate.name}
                    {candidate.name === tier.name && ' — current'}
                  </span>
                  <span className="text-gray-500">
                    {candidate.threshold.toLocaleString()} pts
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Where the points came from. */}
        <section className="bg-surface rounded-lg p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3">Earned by channel</h2>
          {Object.keys(bySurface).length === 0 ? (
            <p className="text-sm text-gray-400">
              No points yet. Place a bet online, at a kiosk, or over the counter to start earning.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
              {(Object.entries(bySurface) as Array<[Surface, number]>).map(([surface, total]) => {
                const { label, Icon } = SURFACE_LABELS[surface];
                return (
                  <div key={surface} className="bg-raised rounded p-3">
                    <div className="flex items-center text-xs text-gray-300 mb-1">
                      <Icon size={14} className="mr-1" aria-hidden="true" />
                      <span>{label}</span>
                    </div>
                    <div className="text-xl font-semibold">{total.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}

          <h2 className="font-semibold mb-2">Recent activity</h2>
          {ledger.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing to show yet.</p>
          ) : (
            <ul className="divide-y divide-ink">
              {ledger.slice(0, 20).map(entry => {
                const { label, Icon } = SURFACE_LABELS[entry.surface];
                return (
                  <li key={entry.id} className="py-2 flex items-center justify-between text-sm">
                    <div className="min-w-0 mr-3">
                      <div className="truncate">{entry.reason}</div>
                      <div className="flex items-center text-xs text-gray-400 mt-0.5">
                        <Icon size={12} className="mr-1" aria-hidden="true" />
                        <span>{label}</span>
                        <span className="mx-1.5">·</span>
                        <span>{new Date(entry.earnedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-accent font-semibold whitespace-nowrap">
                      +{entry.points.toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>;
};

export default LoyaltyPage;
