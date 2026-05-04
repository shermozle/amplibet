import React from 'react';
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
  racing: <span>RC</span>
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
export const getEventById = (eventId: string) => {
  const allEvents = [...mockSportEvents, ...mockAFLWEvents, ...mockTennisEvents];
  return allEvents.find(event => event.id === eventId);
};
export const getEventsByType = (type: string) => {
  switch (type) {
    case 'afl':
      return mockSportEvents.filter(event => event.sportId === 'afl');
    case 'nrl':
      return mockSportEvents.filter(event => event.sportId === 'nrl');
    case 'aflw':
      return mockAFLWEvents;
    case 'tennis':
      return mockTennisEvents;
    default:
      return mockSportEvents;
  }
};