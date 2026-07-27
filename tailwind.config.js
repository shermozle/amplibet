// Semantic colour tokens for the Amplitude brand palette the PRD specifies:
// #0052f2, #edf0f5, #001a4f, #6980ff, #a373ff, #ff7d78, #f23845.
//
// Components use these token classes (bg-surface, text-accent, ...) rather than
// arbitrary hex classes, so the palette lives in exactly one file. brand-dark,
// ink-deep, surface and the raised pair are derived tints/shades of the brand
// colours — the PRD gives seven flat colours and a UI needs elevation steps.
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0052f2', dark: '#0041c2' }, // primary actions
        ink: { DEFAULT: '#001a4f', deep: '#001238' },   // app / marketing backgrounds
        surface: '#002570',                             // cards, sidebar, bet slip
        raised: { DEFAULT: '#003398', light: '#0f47c4' }, // inputs, chips, hover
        accent: '#6980ff',                              // payouts, headings, positive money
        grape: '#a373ff',                               // link hover, secondary accent
        salmon: '#ff7d78',                              // warnings (responsible gambling)
        danger: '#f23845',                              // errors, insufficient funds
        paper: '#edf0f5'                                // light text surfaces, Platinum tier
      }
    }
  }
}
