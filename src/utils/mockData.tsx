// Sport icons as JSX elements
export const sportIcons = {
  afl: <span>AFL</span>,
  aflw: <span>AFLW</span>,
  nrl: <span>NRL</span>,
  nrlw: <span>NRLW</span>,
  nzNpc: <span>NPC</span>,
  mlb: <span>MLB</span>,
  wnba: <span>WNBA</span>,
  fba: <span>FBA</span>,
  nfl: <span>NFL</span>,
  premier: <span>PL</span>,
  championship: <span>CH</span>,
  laliga: <span>LL</span>,
  ligue1: <span>L1</span>,
  mls: <span>MLS</span>,
  brazil: <span>BR</span>,
  jleague: <span>JL</span>,
  racing: <span>RC</span>,
  esports: <span>ES</span>
};
export const mockSports = [{
  id: 'afl',
  name: 'AFL',
  icon: sportIcons.afl,
  bgColor: 'bg-red-600'
}, {
  id: 'aflw',
  name: 'AFLW',
  icon: sportIcons.aflw,
  bgColor: 'bg-red-600'
}, {
  id: 'nrl',
  name: 'NRL',
  icon: sportIcons.nrl,
  bgColor: 'bg-blue-600'
}, {
  id: 'nrlw',
  name: 'NRLW',
  icon: sportIcons.nrlw,
  bgColor: 'bg-blue-600'
}, {
  id: 'nz-npc',
  name: 'New Zealand NPC',
  icon: sportIcons.nzNpc,
  bgColor: 'bg-blue-600'
}, {
  id: 'mlb',
  name: 'MLB',
  icon: sportIcons.mlb,
  bgColor: 'bg-blue-500'
}, {
  id: 'wnba',
  name: 'WNBA',
  icon: sportIcons.wnba,
  bgColor: 'bg-orange-500'
}, {
  id: 'fba-asia-cup',
  name: 'FBA Asia Cup',
  icon: sportIcons.fba,
  bgColor: 'bg-orange-500'
}, {
  id: 'nfl-preseason',
  name: 'NFL Preseason',
  icon: sportIcons.nfl,
  bgColor: 'bg-yellow-600'
}, {
  id: 'premier-league',
  name: 'Premier League',
  icon: sportIcons.premier,
  bgColor: 'bg-green-600'
}, {
  id: 'championship',
  name: 'Championship',
  icon: sportIcons.championship,
  bgColor: 'bg-green-600'
}, {
  id: 'la-liga',
  name: 'La Liga',
  icon: sportIcons.laliga,
  bgColor: 'bg-green-600'
}, {
  id: 'ligue-1',
  name: 'Ligue 1',
  icon: sportIcons.ligue1,
  bgColor: 'bg-green-600'
}, {
  id: 'mls',
  name: 'MLS',
  icon: sportIcons.mls,
  bgColor: 'bg-green-600'
}, {
  id: 'brazil-serie-a',
  name: 'Brazil Serie A',
  icon: sportIcons.brazil,
  bgColor: 'bg-green-600'
}, {
  id: 'j-league',
  name: 'J League',
  icon: sportIcons.jleague,
  bgColor: 'bg-green-600'
}, {
  id: 'esports',
  name: 'Esports',
  icon: sportIcons.esports,
  bgColor: 'bg-grape'
}];
export const mockRaces = [{
  id: 'r1',
  venue: 'Addington',
  number: 10,
  time: '04m 46s',
  type: 'racing'
}, {
  id: 'r2',
  venue: 'Albion Park',
  number: 6,
  time: '05m 46s',
  type: 'racing'
}, {
  id: 'r3',
  venue: 'Kasamatsu',
  number: 10,
  time: '07m 46s',
  type: 'racing'
}, {
  id: 'r4',
  venue: 'Casino',
  number: 7,
  time: '08m 46s',
  type: 'racing'
}, {
  id: 'r5',
  venue: 'Mombetsu',
  number: 4,
  time: '10m 46s',
  type: 'racing'
}, {
  id: 'r6',
  venue: 'Cambridge',
  number: 4,
  time: '12m 46s',
  type: 'racing'
}, {
  id: 'r7',
  venue: 'Newcastle',
  number: 8,
  time: '13m 46s',
  type: 'racing'
}, {
  id: 'r8',
  venue: 'Warragul',
  number: 7,
  time: '02m 46s',
  type: 'racing'
}, {
  id: 'r9',
  venue: 'Dapto',
  number: 3,
  time: '00m 14s',
  type: 'racing'
}];
export const mockSportEvents = [{
  id: 'e1',
  sportId: 'nrl',
  leagueId: 'rugby-league',
  leagueName: 'Rugby League',
  homeTeam: 'Penrith Panthers',
  awayTeam: 'Melbourne Storm',
  startTime: '07:58 PM',
  day: 'Today',
  markets: 65,
  odds: {
    home: 1.62,
    away: 2.3,
    draw: null
  }
}, {
  id: 'e2',
  sportId: 'nrl',
  leagueId: 'rugby-league',
  leagueName: 'Rugby League',
  homeTeam: 'New Zealand Warriors',
  awayTeam: 'St. George Illawarra Dragons',
  startTime: '6:00 PM',
  day: 'Friday',
  markets: 65,
  odds: {
    home: 1.83,
    away: 2.0,
    draw: null
  }
}, {
  id: 'e3',
  sportId: 'afl',
  leagueId: 'australian-rules',
  leagueName: 'Australian Rules',
  homeTeam: 'Essendon',
  awayTeam: 'St Kilda',
  startTime: '7:20 PM',
  day: 'Friday',
  markets: 72,
  odds: {
    home: 1.57,
    away: 2.4,
    draw: 34.0
  }
}, {
  id: 'e4',
  sportId: 'nrl',
  leagueId: 'rugby-league',
  leagueName: 'Rugby League',
  homeTeam: 'Sydney Roosters',
  awayTeam: 'Canterbury-Bankstown Bulldogs',
  startTime: '8:00 PM',
  day: 'Friday',
  markets: 65,
  odds: {
    home: 1.45,
    away: 2.75,
    draw: null
  }
}];
export const mockAFLWEvents = [{
  id: 'w1',
  sportId: 'aflw',
  leagueId: 'afl-womens',
  leagueName: 'AFL Womens',
  homeTeam: 'Carlton Women',
  awayTeam: 'Collingwood Women',
  startTime: '07:15 PM',
  day: 'Today',
  markets: 55,
  odds: {
    home: 1.62,
    away: 2.3,
    draw: null
  }
}, {
  id: 'w2',
  sportId: 'aflw',
  leagueId: 'afl-womens',
  leagueName: 'AFL Womens',
  homeTeam: 'West Coast Women',
  awayTeam: 'Gold Coast Women',
  startTime: '06:15 PM',
  day: 'Today',
  markets: 43,
  odds: {
    home: 1.83,
    away: 2.28,
    draw: null
  }
}, {
  id: 'w3',
  sportId: 'aflw',
  leagueId: 'afl-womens',
  leagueName: 'AFL Womens',
  homeTeam: 'Sydney Swans Women',
  awayTeam: 'Richmond Women',
  startTime: '6:15 PM',
  day: 'Friday',
  markets: 8,
  odds: {
    home: 1.67,
    away: 2.4,
    draw: null
  }
}, {
  id: 'w4',
  sportId: 'aflw',
  leagueId: 'afl-womens',
  leagueName: 'AFL Womens',
  homeTeam: 'Geelong Cats Women',
  awayTeam: 'North Melbourne Women',
  startTime: '3:35 PM',
  day: 'Saturday',
  markets: 8,
  odds: {
    home: 4.1,
    away: 1.24,
    draw: null
  }
}, {
  id: 'w5',
  sportId: 'aflw',
  leagueId: 'afl-womens',
  leagueName: 'AFL Womens',
  homeTeam: 'GWS Giants Women',
  awayTeam: 'Essendon Bombers Women',
  startTime: '5:35 PM',
  day: 'Saturday',
  markets: 0,
  odds: {
    home: 0,
    away: 0,
    draw: null
  }
}];
export const mockTennisEvents = [{
  id: 't1',
  sportId: 'tennis',
  leagueId: 'itf-wtt-singapore',
  leagueName: 'ITF WTT Singapore',
  homeTeam: 'Nana Kawagishi',
  awayTeam: 'Ying Zhang',
  startTime: '1:18 PM',
  day: 'Today',
  markets: 7,
  odds: {
    home: 1.62,
    away: 2.3,
    draw: null
  }
}, {
  id: 't2',
  sportId: 'tennis',
  leagueId: 'danish-golf-championship',
  leagueName: 'Danish Golf Championship Round 1',
  homeTeam: 'Nicolai Calacanta',
  awayTeam: 'Troy Merritt',
  startTime: '08m 46s',
  day: 'Today',
  markets: 3,
  odds: {
    home: 1.83,
    away: 2.0,
    draw: null
  }
}, {
  id: 't3',
  sportId: 'tennis',
  leagueId: 'itf-wip-singapore',
  leagueName: 'ITF WIP Singapore',
  homeTeam: 'Yuka Hosaki',
  awayTeam: 'Hikaru Sato',
  startTime: '1:18 PM',
  day: 'Today',
  markets: 7,
  odds: {
    home: 1.57,
    away: 2.4,
    draw: null
  }
}];
// Esports fixtures: same shape as every other head-to-head event, so SportPage,
// EventPage and the bet slip handle them with no special casing.
export const mockEsportsEvents = [{
  id: 'es1',
  sportId: 'esports',
  leagueId: 'lco-split-2',
  leagueName: 'LCO Split 2',
  homeTeam: 'Sydney Drop Bears',
  awayTeam: 'Melbourne Order',
  startTime: '7:00 PM',
  day: 'Today',
  markets: 14,
  odds: { home: 1.55, away: 2.45, draw: null }
}, {
  id: 'es2',
  sportId: 'esports',
  leagueId: 'lco-split-2',
  leagueName: 'LCO Split 2',
  homeTeam: 'Chiefs Esports Club',
  awayTeam: 'Ground Zero Gaming',
  startTime: '8:30 PM',
  day: 'Today',
  markets: 14,
  odds: { home: 1.30, away: 3.40, draw: null }
}, {
  id: 'es3',
  sportId: 'esports',
  leagueId: 'cs2-oceania-masters',
  leagueName: 'CS2 Oceania Masters',
  homeTeam: 'Rooster',
  awayTeam: 'Vertex',
  startTime: '6:15 PM',
  day: 'Friday',
  markets: 9,
  odds: { home: 2.10, away: 1.72, draw: null }
}];

// Race cards. Races are not head-to-head events — a card has a field of runners,
// each with win odds — so they live outside allEvents() and have their own pages
// and lookup. The bet slip still works unchanged: a runner selection becomes a
// Bet whose eventId is the race id.
export interface RaceRunner {
  number: number;
  name: string;
  odds: number;
}

export interface RaceEvent {
  id: string;
  venue: string;
  raceNumber: number;
  startTime: string;
  day: string;
  distance: string;
  runners: RaceRunner[];
}

export const mockRaceEvents: RaceEvent[] = [{
  id: 'r1',
  venue: 'Addington',
  raceNumber: 10,
  startTime: '3:45 PM',
  day: 'Today',
  distance: '2600m',
  runners: [
    { number: 1, name: 'Midnight Reactor', odds: 2.40 },
    { number: 2, name: 'Copper Sky', odds: 3.80 },
    { number: 3, name: 'Session Replay', odds: 5.50 },
    { number: 4, name: 'Harbour Mist', odds: 8.00 },
    { number: 5, name: 'Dashboard Dan', odds: 12.0 },
    { number: 6, name: 'Southerly Buster', odds: 21.0 }
  ]
}, {
  id: 'r2',
  venue: 'Albion Park',
  raceNumber: 6,
  startTime: '4:10 PM',
  day: 'Today',
  distance: '1660m',
  runners: [
    { number: 1, name: 'Retention Curve', odds: 1.95 },
    { number: 2, name: 'Golden Gully', odds: 4.20 },
    { number: 3, name: 'Night Parade', odds: 6.00 },
    { number: 4, name: 'False Start', odds: 9.50 },
    { number: 5, name: 'Cohort King', odds: 15.0 }
  ]
}, {
  // Ids here must line up with the legacy mockRaces ticker entries for the same
  // venue — the home-page rail links /race/{id} — so Casino is r4 and Mombetsu
  // r5, matching their positions in that list. Kasamatsu (r3) has no card and
  // falls back to /racing.
  id: 'r4',
  venue: 'Casino',
  raceNumber: 7,
  startTime: '4:38 PM',
  day: 'Today',
  distance: '1400m',
  runners: [
    { number: 1, name: 'Northern Signal', odds: 2.80 },
    { number: 2, name: 'Funnel Vision', odds: 3.10 },
    { number: 3, name: 'Rainmaker Road', odds: 4.60 },
    { number: 4, name: 'Quiet Achiever', odds: 11.0 },
    { number: 5, name: 'Last Drinks', odds: 17.0 },
    { number: 6, name: 'Border Collie Blue', odds: 26.0 }
  ]
}, {
  id: 'r5',
  venue: 'Mombetsu',
  raceNumber: 4,
  startTime: '5:05 PM',
  day: 'Today',
  distance: '1200m',
  runners: [
    { number: 1, name: 'Snow Country', odds: 2.10 },
    { number: 2, name: 'Ezo Wind', odds: 3.50 },
    { number: 3, name: 'Stampede Path', odds: 7.00 },
    { number: 4, name: 'Amber Field', odds: 10.0 },
    { number: 5, name: 'North Star Drift', odds: 19.0 }
  ]
}];

export const getRaceById = (raceId: string) => mockRaceEvents.find(race => race.id === raceId);

export const getSportById = (sportId: string) => mockSports.find(sport => sport.id === sportId);

// Every head-to-head event across every catalogue (races excluded — see above).
export const allEvents = () => [...mockSportEvents, ...mockAFLWEvents, ...mockTennisEvents, ...mockEsportsEvents];

export const getEventById = (eventId: string) => allEvents().find(event => event.id === eventId);

// Events actually belonging to a sport. Returns an empty array for a sport with
// no fixtures rather than silently falling back to an unrelated list.
export const getEventsBySport = (sportId: string) => allEvents().filter(event => event.sportId === sportId);

// Derive a short badge from a team name, e.g. 'Sydney Swans Women' -> 'SYD'.
export const teamAbbrev = (teamName: string): string => {
  const words = teamName.replace(/\bwomen\b/gi, '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '???';
  const source = words[0].length >= 3 ? words[0] : words.join('');
  return source.slice(0, 3).toUpperCase();
};