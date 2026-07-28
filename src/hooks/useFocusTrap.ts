import React, { useEffect, useRef } from 'react';

// Everything a keyboard user can Tab to. Disabled controls are excluded so the
// trap skips buttons greyed out mid-submission instead of parking focus on them.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

// Stack of currently-active traps, in activation order. Dialogs nest (the
// responsible-gambling modal opens inside the mobile bet-slip sheet, the
// timeout warning over anything), and every instance listens on document — so
// without this, one Escape would fire every trap's onClose and dismiss the
// whole stack at once instead of just the top dialog.
const trapStack: symbol[] = [];

/**
 * Keeps keyboard focus inside a modal container while `active` is true.
 *
 * On activation the first focusable child receives focus; Tab and Shift+Tab
 * wrap within the container; Escape invokes `onClose`; and on deactivation
 * focus returns to whatever had it before (usually the trigger button).
 * When traps nest, only the most recently activated one responds to keys.
 */
export function useFocusTrap(active: boolean, onClose?: () => void): React.RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);

  // Held in a ref so parents can pass inline callbacks without each re-render
  // tearing the trap down and re-stealing focus mid-interaction.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!active) return;

    const trapId = Symbol('focus-trap');
    trapStack.push(trapId);
    const isTopmost = () => trapStack[trapStack.length - 1] === trapId;

    // Remember who had focus so dismissing the dialog puts the keyboard user
    // back where they left off rather than at the top of the document.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (container) {
      const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (first) {
        first.focus();
      } else {
        // No focusable children yet: focus the container itself so keyboard
        // input lands inside the trap instead of on the page behind it.
        container.tabIndex = -1;
        container.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // A nested dialog owns the keyboard; lower traps stay inert until it
      // closes and they return to the top of the stack.
      if (!isTopmost()) return;

      if (event.key === 'Escape') {
        // stopPropagation guards against non-trap Escape listeners (e.g. a
        // page-level handler) reacting to the same press that closed a dialog.
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const trap = containerRef.current;
      if (!trap) return;

      // Re-queried on every Tab because the focusable set changes while the
      // dialog is open (e.g. controls disable during processing); a list
      // cached at activation would go stale and let focus escape.
      const focusables = Array.from(trap.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (event.shiftKey) {
        // Also recapture when focus has somehow left the trap entirely.
        if (current === firstEl || !trap.contains(current)) {
          event.preventDefault();
          lastEl.focus();
        }
      } else if (current === lastEl || !trap.contains(current)) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    // Capture phase so the trap wins even if a child stops propagation.
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      const index = trapStack.indexOf(trapId);
      if (index >= 0) trapStack.splice(index, 1);
      // Only restore to elements still in the document; the trigger may have
      // been unmounted while the dialog was open.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return containerRef;
}
