import React, { useCallback, useEffect } from 'react';
import { AlertTriangleIcon, PhoneIcon } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  trackResponsibleGamblingPromptShown,
  trackResponsibleGamblingChoice
} from '../../utils/analytics';

// Interstitial shown when a stake crosses the responsible-gambling threshold.
// The prompt and the choice are deliberately separate events (see analytics.ts)
// so the funnel — prompted, then continued vs cancelled — is analysable.

interface ResponsibleGamblingModalProps {
  isOpen: boolean;
  totalStake: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ResponsibleGamblingModal: React.FC<ResponsibleGamblingModalProps> = ({
  isOpen,
  totalStake,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    // Keyed on isOpen alone: the event marks the moment the interstitial
    // appears, and must not re-fire if the parent re-renders with a fresh stake
    // value while the dialog is already up.
    if (isOpen) trackResponsibleGamblingPromptShown(totalStake);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Every road out of the dialog that is not "place it anyway" — the button,
  // Escape, the overlay — funnels through here so the 'cancelled' choice is
  // tracked in exactly one place.
  const handleCancel = useCallback(() => {
    trackResponsibleGamblingChoice('cancelled', totalStake);
    onCancel();
  }, [totalStake, onCancel]);

  const handleConfirm = () => {
    trackResponsibleGamblingChoice('continued', totalStake);
    onConfirm();
  };

  const dialogRef = useFocusTrap(isOpen, handleCancel);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="responsible-gambling-title"
        className="bg-surface border border-salmon rounded-lg max-w-md w-full p-6"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <AlertTriangleIcon size={24} className="text-salmon mr-3 flex-shrink-0" aria-hidden="true" />
          <h2 id="responsible-gambling-title" className="text-xl font-bold text-salmon">
            Take a moment
          </h2>
        </div>

        <p className="text-sm text-paper mb-4">
          This stake (${totalStake.toFixed(2)}) is above your usual limit. It's worth
          pausing to make sure this is a bet you're comfortable with.
        </p>

        <div className="bg-raised rounded p-3 mb-6 flex items-center text-sm">
          <PhoneIcon size={16} className="text-salmon mr-2 flex-shrink-0" aria-hidden="true" />
          <span className="text-gray-300">
            Need to talk to someone? Gambling Help Online:{' '}
            {/* tel: is an external scheme, not an internal route, so a raw anchor is correct here. */}
            <a
              href="tel:1800858858"
              className="text-paper font-semibold hover:text-grape whitespace-nowrap"
            >
              1800 858 858
            </a>
          </span>
        </div>

        {/* The safe option comes first so the focus trap lands on it by default —
            continuing should always be the deliberate second reach. */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 px-4 rounded font-medium bg-raised hover:bg-raised-light text-white"
          >
            Review my bet
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded font-medium bg-brand hover:bg-brand-dark text-white"
          >
            Place bet anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponsibleGamblingModal;
