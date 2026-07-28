#!/usr/bin/env node
/**
 * Cross-surface event simulator for the AmpliBet demo.
 *
 * Generates the two surfaces the web app cannot: over-the-counter betting
 * (`surface: in_store`) and contact-centre activity (`surface: call_centre`),
 * keyed by loyalty ID so they stitch to web and kiosk sessions in Amplitude.
 * Members are simulated as personas with coherent multi-surface journeys —
 * an omnichannel regular places most bets in venue but phones up about a
 * settlement; a phone-first member rarely appears anywhere else.
 *
 * SAFETY MODEL
 * - Dry run by default: prints a summary and sample events, sends nothing.
 * - `--send` transmits via the Amplitude HTTP V2 API and requires the API key
 *   in the AMPLITUDE_API_KEY environment variable. The key is never read from
 *   a file or flag and must never be committed.
 * - `--seed` makes a run reproducible, and every event carries a deterministic
 *   insert_id, so re-sending the same run is idempotent server-side.
 *
 * Usage:
 *   node scripts/simulate-events.mjs                     # dry run, defaults
 *   node scripts/simulate-events.mjs --days 14 --members 40
 *   AMPLITUDE_API_KEY=... node scripts/simulate-events.mjs --send
 */

const HTTP_API_URL = 'https://api2.amplitude.com/2/httpapi';
const BATCH_SIZE = 100;

// Same alphabet as src/utils/loyalty.ts: no 0/O or 1/I/L, valid Code 39.
const ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const VENUES = ['Collingwood', 'Richmond', 'Parramatta', 'Fortitude Valley', 'Glenelg'];
const CALL_REASONS = ['settlement_query', 'deposit_help', 'odds_enquiry', 'account_update', 'responsible_gambling'];
const SELECTIONS = [
  { selection: 'Penrith Panthers', odds: 1.62, league: 'Rugby League' },
  { selection: 'Melbourne Storm', odds: 2.30, league: 'Rugby League' },
  { selection: 'Essendon', odds: 1.57, league: 'Australian Rules' },
  { selection: 'St Kilda', odds: 2.40, league: 'Australian Rules' },
  { selection: 'Carlton Women', odds: 1.62, league: 'AFL Womens' },
  { selection: 'Sydney Drop Bears', odds: 1.55, league: 'LCO Split 2' },
  { selection: 'Midnight Reactor', odds: 2.40, league: 'Racing — Addington R10' },
  { selection: 'Retention Curve', odds: 1.95, league: 'Racing — Albion Park R6' }
];

// Personas weight where a member shows up. The mix is the point: cross-surface
// analysis is only demonstrable if some members genuinely span surfaces.
const PERSONAS = [
  { name: 'venue_regular', weight: 0.45, inStoreBets: [3, 9], calls: [0, 1] },
  { name: 'omnichannel', weight: 0.35, inStoreBets: [1, 4], calls: [1, 2] },
  { name: 'phone_first', weight: 0.20, inStoreBets: [0, 1], calls: [2, 4] }
];

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) so --seed reproduces a run exactly.
const makeRandom = seed => {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const parseArgs = argv => {
  const args = { days: 7, members: 25, send: false, seed: 20260728 };
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--send') args.send = true;
    else if (flag === '--days') args.days = Number(argv[++i]);
    else if (flag === '--members') args.members = Number(argv[++i]);
    else if (flag === '--seed') args.seed = Number(argv[++i]);
    else if (flag === '--help' || flag === '-h') { args.help = true; }
    else { console.error(`Unknown flag: ${flag}`); process.exit(1); }
  }
  if (!Number.isFinite(args.days) || !Number.isFinite(args.members) || !Number.isFinite(args.seed)) {
    console.error('--days, --members and --seed must be numbers');
    process.exit(1);
  }
  return args;
};

const pick = (random, list) => list[Math.floor(random() * list.length)];
const between = (random, [min, max]) => min + Math.floor(random() * (max - min + 1));

const mintLoyaltyId = random => {
  let body = '';
  for (let i = 0; i < 8; i++) body += ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)];
  return `AB-${body}`;
};

// A timestamp on `daysAgo`, inside plausible business hours for the channel.
// Venues run 9:00–21:59 every day; the call centre 8:00–19:59 weekdays — a
// simulated Sunday call would look wrong to anyone who knows the business.
const timestampFor = (random, daysAgo, channel) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  if (channel === 'call_centre') {
    const day = date.getDay();
    if (day === 0) date.setDate(date.getDate() + 1); // Sunday -> Monday
    if (day === 6) date.setDate(date.getDate() + 2); // Saturday -> Monday
    date.setHours(8 + Math.floor(random() * 12));
  } else {
    date.setHours(9 + Math.floor(random() * 13));
  }
  date.setMinutes(Math.floor(random() * 60), Math.floor(random() * 60), 0);
  return date.getTime();
};

// ---------------------------------------------------------------------------
// Journey generation. Event names and properties deliberately mirror the web
// app's vocabulary (see src/utils/analytics.ts and SPECIFICATION.md §5) so a
// single chart segments cleanly by `surface`.

const buildMember = (random, days) => {
  const loyaltyId = mintLoyaltyId(random);
  const roll = random();
  let cumulative = 0;
  const persona = PERSONAS.find(p => (cumulative += p.weight) >= roll) ?? PERSONAS[0];
  const homeVenue = pick(random, VENUES);
  const events = [];
  let runningPoints = Math.floor(random() * 800); // pre-existing balance
  let sequence = 0;

  const emit = (time, eventType, properties) => {
    events.push({
      user_id: loyaltyId,
      event_type: eventType,
      time,
      insert_id: `sim-${loyaltyId}-${sequence++}`,
      event_properties: properties,
      user_properties: { loyalty_id: loyaltyId, user_type: 'demo_user' }
    });
  };

  // Over-the-counter bets: cash across a real counter, entered by staff.
  for (let i = 0, n = between(random, persona.inStoreBets); i < n; i++) {
    const daysAgo = Math.floor(random() * days);
    const time = timestampFor(random, daysAgo, 'in_store');
    const bet = pick(random, SELECTIONS);
    const stake = pick(random, [10, 20, 25, 50, 50, 100]);
    const staffId = `ST-${100 + Math.floor(random() * 25)}`;

    emit(time, 'Bet Placed', {
      surface: 'in_store',
      venue: homeVenue,
      staff_id: staffId,
      bet_count: 1,
      bet_type: 'single',
      total_stake: stake,
      estimated_payout: Number((stake * bet.odds).toFixed(2)),
      payment_method: 'cash',
      bets: [{ selection: bet.selection, odds: bet.odds, stake }]
    });

    runningPoints += stake;
    emit(time + 1000, 'Loyalty Points Earned', {
      surface: 'in_store',
      venue: homeVenue,
      loyalty_id: loyaltyId,
      points_earned: stake,
      earn_reason: 'Bet on 1 selection',
      points_balance: runningPoints
    });
  }

  // Contact-centre activity: a call wraps whatever happened during it, so the
  // start/resolve pair brackets any bet placed over the phone.
  for (let i = 0, n = between(random, persona.calls); i < n; i++) {
    const daysAgo = Math.floor(random() * days);
    const start = timestampFor(random, daysAgo, 'call_centre');
    const reason = pick(random, CALL_REASONS);
    const agentId = `CC-${200 + Math.floor(random() * 15)}`;
    const durationMs = (120 + Math.floor(random() * 600)) * 1000;

    emit(start, 'Support Call Started', {
      surface: 'call_centre',
      loyalty_id: loyaltyId,
      agent_id: agentId,
      call_reason: reason
    });

    // Odds enquiries convert to a phone bet about half the time.
    if (reason === 'odds_enquiry' && random() < 0.5) {
      const bet = pick(random, SELECTIONS);
      const stake = pick(random, [20, 50, 100]);
      emit(start + Math.floor(durationMs / 2), 'Bet Placed', {
        surface: 'call_centre',
        agent_id: agentId,
        bet_count: 1,
        bet_type: 'single',
        total_stake: stake,
        estimated_payout: Number((stake * bet.odds).toFixed(2)),
        payment_method: 'account_balance',
        bets: [{ selection: bet.selection, odds: bet.odds, stake }]
      });
      runningPoints += stake;
      emit(start + Math.floor(durationMs / 2) + 1000, 'Loyalty Points Earned', {
        surface: 'call_centre',
        loyalty_id: loyaltyId,
        points_earned: stake,
        earn_reason: 'Bet on 1 selection',
        points_balance: runningPoints
      });
    }

    emit(start + durationMs, 'Support Call Resolved', {
      surface: 'call_centre',
      loyalty_id: loyaltyId,
      agent_id: agentId,
      call_reason: reason,
      duration_seconds: Math.floor(durationMs / 1000),
      resolved: random() < 0.9
    });
  }

  return { loyaltyId, persona: persona.name, events };
};

// ---------------------------------------------------------------------------
const send = async (events, apiKey) => {
  let sent = 0;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const response = await fetch(HTTP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ api_key: apiKey, events: batch })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Amplitude rejected batch at offset ${i}: ${response.status} ${body}`);
    }
    sent += batch.length;
    process.stdout.write(`\rSent ${sent}/${events.length}`);
  }
  process.stdout.write('\n');
};

const main = async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node scripts/simulate-events.mjs [--days N] [--members N] [--seed N] [--send]');
    console.log('Dry run by default. --send requires AMPLITUDE_API_KEY in the environment.');
    return;
  }

  const random = makeRandom(args.seed);
  const members = Array.from({ length: args.members }, () => buildMember(random, args.days));
  const events = members.flatMap(m => m.events).sort((a, b) => a.time - b.time);

  const byType = {};
  const bySurface = {};
  for (const e of events) {
    byType[e.event_type] = (byType[e.event_type] ?? 0) + 1;
    const s = e.event_properties.surface;
    bySurface[s] = (bySurface[s] ?? 0) + 1;
  }
  const personaCounts = {};
  for (const m of members) personaCounts[m.persona] = (personaCounts[m.persona] ?? 0) + 1;

  console.log(`Simulated ${events.length} events for ${members.length} members over ${args.days} days (seed ${args.seed})`);
  console.log('Personas:', personaCounts);
  console.log('By surface:', bySurface);
  console.log('By event type:', byType);

  if (!args.send) {
    console.log('\nDRY RUN — nothing sent. Sample events:');
    console.log(JSON.stringify(events.slice(0, 3), null, 2));
    console.log('\nRe-run with --send and AMPLITUDE_API_KEY set to transmit.');
    return;
  }

  const apiKey = process.env.AMPLITUDE_API_KEY;
  if (!apiKey) {
    console.error('--send requires the AMPLITUDE_API_KEY environment variable (never hardcode or commit it).');
    process.exit(1);
  }
  await send(events, apiKey);
  console.log('Done.');
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
