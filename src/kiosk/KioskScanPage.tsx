import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isLoyaltyId } from '../utils/loyalty';
import {
  trackPageView,
  trackButtonClick,
  trackLoyaltyCardScanned
} from '../utils/analytics';
import Barcode from '../components/Loyalty/Barcode';

// Kiosk sign-in: identify the member from their loyalty card.
//
// Barcode scanners are keyboard wedges — they type the code as fast keystrokes
// and finish with Enter. So the whole screen is built around one large input
// that must always hold focus: submission happens on Enter (the scanner's
// terminator) via the form, and the same path serves someone typing the ID by
// hand and pressing the big Continue button.
const KioskScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { identifyAsMember } = useAuth();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const refocusTimer = useRef<number | null>(null);

  useEffect(() => {
    trackPageView('Kiosk Scan');
  }, []);

  // Clear any pending refocus on unmount so we never touch a detached input.
  useEffect(() => {
    return () => {
      if (refocusTimer.current !== null) {
        window.clearTimeout(refocusTimer.current);
      }
    };
  }, []);

  // The scanner has no idea where focus is; if a stray tap blurs the input, its
  // keystrokes vanish. Pull focus back shortly after any blur. The short delay
  // lets the tap that caused the blur (e.g. on Back) complete first.
  const handleBlur = () => {
    if (refocusTimer.current !== null) {
      window.clearTimeout(refocusTimer.current);
    }
    refocusTimer.current = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Form submit covers both the scanner's trailing Enter and the Continue
  // button, so there is exactly one validation path.
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const id = value.trim().toUpperCase();

    if (isLoyaltyId(id) && identifyAsMember(id)) {
      // Scan event before navigating so it fires while this page is mounted.
      // identifyAsMember has already bound the loyalty ID as the Amplitude
      // user_id, so the scan is attributed to the member, not the device.
      trackLoyaltyCardScanned(id);
      navigate('/kiosk/home');
      return;
    }

    setError("That doesn't look like an AmpliBet card (AB-XXXXXXXX)");
    // Keep focus and select the bad value so the next scan (or keystroke)
    // replaces it instead of appending to it.
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col items-center justify-center px-8 py-12">
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Illustrative card: shows the member what to hold under the reader.
            Reduced opacity and aria-hidden — it is decoration, not a control. */}
        <div aria-hidden="true" className="opacity-60 mb-10 w-64">
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <Barcode value="AB-EXAMPLE1" height={56} className="w-full h-14" />
            <p className="text-black font-mono text-center text-sm mt-2 tracking-widest">
              AB-EXAMPLE1
            </p>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-accent text-center mb-4">
          Scan your rewards card
        </h1>
        <p className="text-xl text-gray-400 text-center mb-10">
          Hold the barcode under the reader, or type the ID
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4" noValidate>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={event => {
              setValue(event.target.value.toUpperCase());
              if (error) setError(null);
            }}
            onBlur={handleBlur}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            placeholder="AB-XXXXXXXX"
            aria-label="Loyalty card ID"
            aria-invalid={error !== null}
            aria-describedby={error ? 'scan-error' : undefined}
            className="w-full h-20 bg-ink-deep border-2 border-surface focus:border-brand focus:outline-none rounded-xl px-6 font-mono text-2xl uppercase tracking-widest text-center text-paper placeholder-gray-600"
          />

          {error && (
            <p id="scan-error" role="alert" className="text-salmon text-lg text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-16 bg-brand hover:bg-brand-dark rounded-xl text-xl font-bold text-paper"
          >
            Continue
          </button>
        </form>

        <Link
          to="/kiosk"
          onClick={() => trackButtonClick('Back', 'kiosk_scan')}
          className="mt-6 w-full h-16 bg-raised hover:bg-raised-light rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
        >
          <ArrowLeftIcon size={22} aria-hidden="true" />
          <span>Back</span>
        </Link>

        {/* No signup on kiosk: a card reader can't collect an email or password. */}
        <p className="mt-10 text-gray-400 text-center">
          New to AmpliBet? Join online or ask at the counter for a rewards card.
        </p>
      </div>
    </div>
  );
};

export default KioskScanPage;
