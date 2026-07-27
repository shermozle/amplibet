import React from 'react';

// Code 39 barcode as inline SVG.
//
// Code 39 rather than a QR code or Code 128: it encodes A-Z, 0-9 and '-' with no
// check digit and no external dependency, which covers the AB-XXXXXXXX loyalty ID
// exactly. Every retail scanner reads it out of the box, so a kiosk needs no
// special configuration to accept a card printed from this page.
//
// Each character is nine alternating elements (bar, space, bar, ... five bars and
// four spaces), of which exactly three are wide. '*' delimits start and stop.
const PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw',
  E: 'wnnnwwnnn', F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn',
  I: 'nnwnnwwnn', J: 'nnnnwwwnn', K: 'wnnnnnnww', L: 'nnwnnnnww',
  M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn', P: 'nnwnwnnwn',
  Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn',
  U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn', Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn',
  $: 'nwnwnwnnn', '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn'
};

const NARROW = 1;
const WIDE = 3;
// One narrow space separates characters; without it adjacent characters merge and
// the symbol will not scan.
const INTER_CHARACTER_GAP = NARROW;

interface Bar {
  x: number;
  width: number;
}

// Returns the bars to draw plus the total symbol width in units, so the caller can
// set a viewBox that fits exactly and let the SVG scale itself.
const encode = (value: string): { bars: Bar[]; totalWidth: number } => {
  const bars: Bar[] = [];
  let x = 0;

  for (const character of `*${value}*`) {
    const pattern = PATTERNS[character];
    // Unencodable characters are skipped rather than thrown on: a barcode that is
    // missing a character is obvious on screen, whereas an exception here would
    // blank the whole loyalty card.
    if (!pattern) continue;

    for (let i = 0; i < pattern.length; i++) {
      const width = pattern[i] === 'w' ? WIDE : NARROW;
      // Even indices are bars, odd are spaces.
      if (i % 2 === 0) bars.push({ x, width });
      x += width;
    }
    x += INTER_CHARACTER_GAP;
  }

  return { bars, totalWidth: x - INTER_CHARACTER_GAP };
};

interface BarcodeProps {
  value: string;
  height?: number;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({ value, height = 56, className = '' }) => {
  // Code 39 has no lowercase. Upper-casing here means a caller passing 'ab-...'
  // still produces a scannable symbol instead of silently dropping characters.
  const normalised = value.toUpperCase();
  const { bars, totalWidth } = encode(normalised);

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      // Bars must not be stretched unevenly or the narrow/wide ratio breaks and
      // scanners reject the symbol, so width scales freely but height does not.
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={`Barcode for loyalty ID ${normalised}`}
    >
      {/* Quiet zone: the white background either side is part of the spec. */}
      <rect x={0} y={0} width={totalWidth} height={height} fill="#FFFFFF" />
      {bars.map((bar, index) => (
        <rect key={index} x={bar.x} y={0} width={bar.width} height={height} fill="#000000" />
      ))}
    </svg>
  );
};

export default Barcode;
