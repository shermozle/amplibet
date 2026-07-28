#!/usr/bin/env node
/**
 * Fixture sync for the AmpliBet demo — keeps markets fresh.
 *
 * Two pluggable sources produce events in the exact shape the app's
 * mockData catalogue uses, written to src/data/synced-fixtures.json which
 * the app merges into allEvents():
 *
 * 1. SQUIGGLE (real AFL data): https://api.squiggle.com.au/ — keyless, free
 *    for commercial use, but its terms require an identifying User-Agent and
 *    PROHIBIT site visitors fetching it client-side. This script therefore
 *    runs only at dev time or in CI; the fetched fixtures are committed as
 *    static JSON and the browser never contacts Squiggle. Model tip
 *    confidence, where present, is converted to decimal odds.
 *
 * 2. GENERATED (everything else): rolling fixtures for leagues Squiggle does
 *    not cover, built from team pools with dates always in the next few days
 *    so the demo never shows a stale card.
 *
 * The scraping alternative considered and rejected: austadiums.com disallows
 * AI crawlers in robots.txt and offers no API. Decision recorded in the
 * Notion PRD's Release 2 section.
 *
 * Usage:
 *   node scripts/sync-fixtures.mjs                 # both sources
 *   node scripts/sync-fixtures.mjs --skip-squiggle # offline / generated only
 *   node scripts/sync-fixtures.mjs --check         # print, do not write
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/synced-fixtures.json');

// Squiggle's terms ask for a User-Agent identifying the caller with a contact.
const USER_AGENT = 'AmpliBet-demo-fixture-sync (github.com/shermozle/amplibet; simon.rumble@amplitude.com)';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// The app renders `day` as a label. Compute it the way a bookmaker board would.
const dayLabel = date => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target - today) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return WEEKDAYS[date.getDay()];
};

const timeLabel = date =>
  date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

// ---------------------------------------------------------------------------
// Source 1: Squiggle (real AFL fixtures).

const squiggleSource = async () => {
  const year = new Date().getFullYear();
  const headers = { 'User-Agent': USER_AGENT, Accept: 'application/json' };

  const gamesResponse = await fetch(`https://api.squiggle.com.au/?q=games;year=${year};complete=!100`, { headers });
  if (!gamesResponse.ok) throw new Error(`Squiggle games request failed: ${gamesResponse.status}`);
  const { games = [] } = await gamesResponse.json();

  // Model tips carry a home-win confidence we can price from. Best effort: the
  // demo works fine with generated odds if tips are missing.
  let tipsByGame = new Map();
  try {
    const tipsResponse = await fetch(`https://api.squiggle.com.au/?q=tips;year=${year};source=1`, { headers });
    if (tipsResponse.ok) {
      const { tips = [] } = await tipsResponse.json();
      tipsByGame = new Map(tips.map(tip => [tip.gameid, tip]));
    }
  } catch { /* odds fall back to generated */ }

  const upcoming = games
    .filter(game => game.complete !== 100 && game.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 9);

  return upcoming.map(game => {
    const date = new Date(game.date);
    const tip = tipsByGame.get(game.id);
    // Convert the tip's home-win confidence (0–100) to decimal odds with a 5%
    // book margin; clamp so a mismatched tip cannot produce absurd prices.
    // Squiggle serialises hconfidence as a string ("18.03"), so coerce it.
    let homeConfidence = 0.5;
    const tipped = tip ? Number(tip.hconfidence) : NaN;
    if (Number.isFinite(tipped) && tipped > 0) {
      homeConfidence = Math.min(0.92, Math.max(0.08, tipped / 100));
    }
    const margin = 1.05;
    const homeOdds = Number((1 / (homeConfidence * margin)).toFixed(2));
    const awayOdds = Number((1 / ((1 - homeConfidence) * margin)).toFixed(2));

    return {
      id: `sq-${game.id}`,
      sportId: 'afl',
      leagueId: 'australian-rules',
      leagueName: 'Australian Rules',
      homeTeam: game.hteam,
      awayTeam: game.ateam,
      startTime: timeLabel(date),
      day: dayLabel(date),
      markets: 72,
      odds: { home: homeOdds, away: awayOdds, draw: 34.0 },
      venue: game.venue ?? undefined,
      round: game.round ?? undefined
    };
  });
};

// ---------------------------------------------------------------------------
// Source 2: generated fixtures for leagues without a free real feed.

const POOLS = [
  {
    sportId: 'nrl', leagueId: 'rugby-league', leagueName: 'Rugby League', markets: 65,
    teams: ['Brisbane Broncos', 'Cronulla Sharks', 'South Sydney Rabbitohs', 'Newcastle Knights', 'Parramatta Eels', 'Manly Sea Eagles']
  },
  {
    sportId: 'aflw', leagueId: 'afl-womens', leagueName: 'AFL Womens', markets: 55,
    teams: ['Adelaide Women', 'Brisbane Women', 'Fremantle Women', 'Melbourne Women']
  },
  {
    sportId: 'esports', leagueId: 'lco-split-2', leagueName: 'LCO Split 2', markets: 14,
    teams: ['Pentanet.GG', 'Kanga Esports', 'Team Bliss', 'Antic Esports']
  },
  {
    sportId: 'premier-league', leagueId: 'premier-league', leagueName: 'Premier League', markets: 88,
    teams: ['Arsenal', 'Newcastle United', 'Brighton', 'Aston Villa']
  }
];

// Seeded by date so re-running on the same day is deterministic (no diff noise
// in CI), while each new day rolls fresh fixtures.
const makeRandom = seed => {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const generatedSource = () => {
  const today = new Date();
  const daySeed = Number(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`);
  const random = makeRandom(daySeed);
  const events = [];

  for (const pool of POOLS) {
    // Round-robin pairs off a shuffled pool: every team appears at most once
    // per sync, like a real round.
    const teams = [...pool.teams].sort(() => random() - 0.5);
    for (let i = 0; i + 1 < teams.length; i += 2) {
      const date = new Date(today);
      date.setDate(date.getDate() + Math.floor(random() * 5));
      date.setHours(12 + Math.floor(random() * 9), [0, 15, 30, 45][Math.floor(random() * 4)], 0, 0);

      const homeProbability = 0.35 + random() * 0.3;
      const margin = 1.05;
      events.push({
        id: `gen-${pool.sportId}-${daySeed}-${i / 2}`,
        sportId: pool.sportId,
        leagueId: pool.leagueId,
        leagueName: pool.leagueName,
        homeTeam: teams[i],
        awayTeam: teams[i + 1],
        startTime: timeLabel(date),
        day: dayLabel(date),
        markets: pool.markets,
        odds: {
          home: Number((1 / (homeProbability * margin)).toFixed(2)),
          away: Number((1 / ((1 - homeProbability) * margin)).toFixed(2)),
          draw: pool.sportId === 'premier-league' ? Number((1 / (0.25 * margin)).toFixed(2)) : null
        }
      });
    }
  }
  return events;
};

// ---------------------------------------------------------------------------
const main = async () => {
  const argv = process.argv.slice(2);
  const skipSquiggle = argv.includes('--skip-squiggle');
  const checkOnly = argv.includes('--check');

  let aflEvents = [];
  if (!skipSquiggle) {
    try {
      aflEvents = await squiggleSource();
      console.log(`Squiggle: ${aflEvents.length} upcoming AFL fixtures`);
    } catch (error) {
      // A feed hiccup must not wipe real data already committed; CI simply
      // keeps the previous JSON for the AFL slice.
      console.error(`Squiggle unavailable (${error.message}) — keeping generated fixtures only this run.`);
    }
  }

  const generated = generatedSource();
  console.log(`Generated: ${generated.length} fixtures across ${POOLS.length} leagues`);

  const output = {
    generatedAt: new Date().toISOString(),
    attribution: 'AFL fixture data from the Squiggle API (https://api.squiggle.com.au/), used with an identifying User-Agent per its terms. Fetched at build time only — never from visitors’ browsers.',
    events: [...aflEvents, ...generated]
  };

  if (checkOnly) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${output.events.length} fixtures to ${OUTPUT_PATH}`);
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
