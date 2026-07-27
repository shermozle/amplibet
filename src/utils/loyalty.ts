import type { Surface } from './surface';

// Loyalty IDs are the account identifier everywhere: in the UI, on the printed
// card, as the localStorage key suffix, and as the Amplitude user_id. One id per
// person across web, kiosk, in-store and call centre is what makes cross-surface
// analysis possible at all.
//
// Format: AB-XXXXXXXX.
//
// The alphabet omits 0/O and 1/I/L. These ids are read aloud to call centre staff
// and printed as barcodes, so characters that are ambiguous in either channel are
// a support cost. Every remaining character is also valid in Code 39, which is
// what the card barcode uses.
const ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ID_BODY_LENGTH = 8;
const ID_PREFIX = 'AB-';

export const LOYALTY_ID_PATTERN = new RegExp(`^AB-[${ID_ALPHABET}]{${ID_BODY_LENGTH}}$`);

export const mintLoyaltyId = (): string => {
  let body = '';
  for (let i = 0; i < ID_BODY_LENGTH; i++) {
    body += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return ID_PREFIX + body;
};

export const isLoyaltyId = (value: string): boolean => LOYALTY_ID_PATTERN.test(value);

export type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Tier {
  name: TierName;
  threshold: number;
  // Tailwind classes rather than hex, so tier colour is themeable with the rest
  // of the UI instead of being baked into component markup.
  textClass: string;
  bgClass: string;
}

// Ascending by threshold. tierFor scans from the top down and relies on that.
export const TIERS: readonly Tier[] = [
  { name: 'Bronze', threshold: 0, textClass: 'text-[#CD7F32]', bgClass: 'bg-[#CD7F32]' },
  { name: 'Silver', threshold: 1_000, textClass: 'text-[#C0C0C0]', bgClass: 'bg-[#C0C0C0]' },
  { name: 'Gold', threshold: 5_000, textClass: 'text-[#FFD700]', bgClass: 'bg-[#FFD700]' },
  { name: 'Platinum', threshold: 20_000, textClass: 'text-[#50E3C2]', bgClass: 'bg-[#50E3C2]' }
];

export const tierFor = (points: number): Tier => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].threshold) return TIERS[i];
  }
  return TIERS[0];
};

// The tier above the current one, or null at Platinum. Callers use null to mean
// "nothing left to earn towards" rather than having to compare against the cap.
export const nextTierFor = (points: number): Tier | null => {
  const current = tierFor(points);
  const index = TIERS.findIndex(tier => tier.name === current.name);
  return TIERS[index + 1] ?? null;
};

export const pointsToNextTier = (points: number): number => {
  const next = nextTierFor(points);
  return next ? Math.max(0, next.threshold - points) : 0;
};

// Progress through the current tier, 0..1. Platinum is always full.
export const tierProgress = (points: number): number => {
  const current = tierFor(points);
  const next = nextTierFor(points);
  if (!next) return 1;
  const span = next.threshold - current.threshold;
  return span <= 0 ? 1 : Math.min(1, (points - current.threshold) / span);
};

// One point per whole dollar staked. Points accrue on stake rather than on
// winnings so that a bet placed at a kiosk with cash earns the same as one placed
// on the web — the surfaces have to be comparable for the demo to make its point.
export const POINTS_PER_DOLLAR = 1;

export const pointsForStake = (stake: number): number =>
  Math.max(0, Math.floor(stake * POINTS_PER_DOLLAR));

export interface LedgerEntry {
  id: string;
  points: number;
  reason: string;
  // Which surface earned the points. This is the field that makes "how much of
  // our loyalty accrual comes from in-store?" answerable.
  surface: Surface;
  earnedAt: string;
}
