import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, XIcon } from 'lucide-react';
import { allEvents, getSportById } from '../../utils/mockData';
import { trackButtonClick, trackSearchPerformed } from '../../utils/analytics';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SportEvent = ReturnType<typeof allEvents>[number];

// Analytics wants a stable enum, the UI wants a human label — keep them paired so
// they cannot drift apart across the toggle and the tracking call.
type SortBy = 'soonest' | 'most_markets';
const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: 'soonest', label: 'Soonest' },
  { value: 'most_markets', label: 'Most markets' }
];

// Fixtures only carry a day label, not a real date, so "soonest" is a rank over
// the labels the catalogue actually uses. Unknown labels sink to the bottom
// rather than crashing on data we did not anticipate.
const DAY_RANK: Record<string, number> = { Today: 0, Friday: 1, Saturday: 2 };
const dayRank = (day: string): number => DAY_RANK[day] ?? 3;

// Display cap. Tracking still reports the full match count — analysts care how
// many results a query found, not how many rows fit in the panel.
const MAX_ROWS = 20;

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('soonest');

  // Trap handles Tab containment, Escape-to-close and focusing the first
  // focusable element — the input is deliberately first in the DOM so that
  // element is the search box.
  const containerRef = useFocusTrap(isOpen, onClose);

  // Chips are derived from the events, not from mockSports: a sport with no
  // fixtures would be a dead filter. Tennis events exist without a mockSports
  // entry, so fall back to a capitalised id rather than dropping the chip.
  const sportChips = useMemo(() => {
    const seen = new Set<string>();
    const chips: Array<{ id: string; name: string }> = [];
    for (const event of allEvents()) {
      if (seen.has(event.sportId)) continue;
      seen.add(event.sportId);
      const sport = getSportById(event.sportId);
      chips.push({
        id: event.sportId,
        name: sport?.name ?? event.sportId.charAt(0).toUpperCase() + event.sportId.slice(1)
      });
    }
    return chips;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = allEvents().filter((event: SportEvent) => {
      if (sportFilter && event.sportId !== sportFilter) return false;
      // Empty query shows everything so the chips are usable before typing.
      if (!q) return true;
      return [event.homeTeam, event.awayTeam, event.leagueName]
        .some(field => field.toLowerCase().includes(q));
    });
    // Copy before sorting — allEvents() spreads fresh arrays today, but sorting
    // in place would be a trap if that ever changes to a shared reference.
    return sortBy === 'most_markets'
      ? [...matches].sort((a, b) => b.markets - a.markets)
      : [...matches].sort((a, b) => dayRank(a.day) - dayRank(b.day));
  }, [query, sportFilter, sortBy]);

  // Debounced search tracking: 400ms of quiet after the last query/filter/sort
  // change fires exactly one event, so keystrokes do not spam analytics with
  // partial queries. Empty queries are browsing, not searching — never tracked.
  useEffect(() => {
    if (!isOpen) return;
    const settledQuery = query.trim();
    if (!settledQuery) return;
    const timer = window.setTimeout(() => {
      const sportName = sportFilter
        ? sportChips.find(chip => chip.id === sportFilter)?.name ?? sportFilter
        : null;
      trackSearchPerformed(settledQuery, results.length, sportName, sortBy);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isOpen, query, sportFilter, sortBy, results, sportChips]);

  // Reset on close so reopening starts a fresh search — and so a stale query
  // cannot re-fire the debounced tracking event just because the modal reopened.
  useEffect(() => {
    if (isOpen) return;
    setQuery('');
    setSportFilter(null);
    setSortBy('soonest');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center px-4 pt-[10vh]"
      onClick={event => {
        // Only a click that starts and ends on the backdrop closes; clicks
        // inside the panel bubble up but target the panel's children.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
        className="relative w-full max-w-lg max-h-[70vh] flex flex-col bg-surface text-paper rounded-lg border border-ink shadow-xl"
      >
        <div className="p-4 border-b border-ink">
          <h2 id="search-modal-title" className="text-lg font-semibold mb-3">
            Search markets
          </h2>

          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/50"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search teams or leagues"
              aria-label="Search teams or leagues"
              className="w-full bg-raised rounded pl-9 pr-3 py-2 text-sm text-paper placeholder:text-paper/50 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* After the input in the DOM so the focus trap lands on the search
              box first; positioned back to the expected top-right corner. */}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="absolute top-4 right-4 p-1 rounded text-paper/60 hover:text-paper hover:bg-raised-light"
          >
            <XIcon size={18} aria-hidden="true" />
          </button>

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setSportFilter(null)}
              aria-pressed={sportFilter === null}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sportFilter === null
                  ? 'bg-brand text-paper'
                  : 'bg-raised hover:bg-raised-light text-paper/70'
              }`}
            >
              All
            </button>
            {sportChips.map(chip => (
              <button
                key={chip.id}
                onClick={() => setSportFilter(chip.id)}
                aria-pressed={sportFilter === chip.id}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sportFilter === chip.id
                    ? 'bg-brand text-paper'
                    : 'bg-raised hover:bg-raised-light text-paper/70'
                }`}
              >
                {chip.name}
              </button>
            ))}
          </div>

          <div className="flex items-center mt-3 text-xs">
            <span className="text-paper/50 mr-2">Sort by</span>
            <div className="flex bg-raised rounded overflow-hidden">
              {SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  aria-pressed={sortBy === option.value}
                  className={`px-3 py-1 font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-brand text-paper'
                      : 'hover:bg-raised-light text-paper/70'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <p className="p-6 text-center text-sm text-paper/60">No markets match</p>
        ) : (
          <ul className="overflow-y-auto divide-y divide-ink px-2 py-1">
            {results.slice(0, MAX_ROWS).map(event => (
              <li key={event.id}>
                <Link
                  to={`/event/${event.id}`}
                  onClick={() => {
                    trackButtonClick('Search Result', 'SearchModal', { event_id: event.id });
                    onClose();
                  }}
                  className="flex items-center justify-between gap-3 px-2 py-2.5 rounded hover:bg-raised-light"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {event.homeTeam} v {event.awayTeam}
                    </div>
                    <div className="text-xs text-paper/60 truncate mt-0.5">
                      {event.leagueName}
                      <span className="mx-1.5">·</span>
                      {event.day} {event.startTime}
                    </div>
                  </div>
                  <div className="text-xs text-accent font-semibold whitespace-nowrap">
                    {event.markets} markets
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
