import React from 'react';
import { DeleteIcon } from 'lucide-react';

// On-screen numeric keypad for touch-first stake entry at the kiosk. Digits
// append to the current value (capped at four digits, so $9999 max), 'C'
// clears, and backspace drops the last digit. There is deliberately no decimal
// key: the kiosk deals in whole dollars, the same denomination the cash
// acceptor takes.
//
// Export style: default export (`import KioskKeypad from './KioskKeypad'`).

interface KioskKeypadProps {
  value: number;
  onChange: (next: number) => void;
}

const MAX_VALUE_BEFORE_APPEND = 1000; // four digits already entered

const KEY_CLASS =
  'h-16 rounded-lg bg-raised hover:bg-raised-light text-2xl font-bold text-white flex items-center justify-center';

const KioskKeypad: React.FC<KioskKeypadProps> = ({ value, onChange }) => {
  // A slip carried over from the web can hold fractional stakes; the keypad
  // works in whole dollars, so normalise before editing.
  const current = Math.max(0, Math.floor(value));

  const appendDigit = (digit: number) => {
    if (current >= MAX_VALUE_BEFORE_APPEND) return;
    // A leading zero changes nothing; skip it so we don't emit a no-op
    // stake-update event.
    if (current === 0 && digit === 0) return;
    onChange(current * 10 + digit);
  };

  return (
    <div className="grid grid-cols-3 gap-3" role="group" aria-label="Stake keypad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
        <button
          key={digit}
          onClick={() => appendDigit(digit)}
          className={KEY_CLASS}
          aria-label={`Add digit ${digit}`}
        >
          {digit}
        </button>
      ))}
      <button onClick={() => onChange(0)} className={KEY_CLASS} aria-label="Clear stake">
        C
      </button>
      <button onClick={() => appendDigit(0)} className={KEY_CLASS} aria-label="Add digit 0">
        0
      </button>
      <button
        onClick={() => onChange(Math.floor(current / 10))}
        className={KEY_CLASS}
        aria-label="Delete last digit"
      >
        <DeleteIcon size={28} aria-hidden="true" />
      </button>
    </div>
  );
};

export default KioskKeypad;
