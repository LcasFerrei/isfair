import { useEffect, useState } from 'react';
import { Check, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { CURATED_CITIES } from '../data/cities';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { searchCities } from '../lib/geo';
import type { City } from '../types';
import { Sheet } from './ui/Sheet';

const MIN_QUERY = 2;
const SEARCH_DEBOUNCE_MS = 350;
const MAX_RECENTS = 5;

interface CityPickerProps {
  open: boolean;
  onClose: () => void;
  current: City;
  onSelect: (city: City) => void;
  locating: boolean;
  /** Mensagem de erro já traduzida */
  locationError: string | null;
  onLocate: () => void;
}

export function CityPicker({ open, onClose, current, onSelect, locating, locationError, onLocate }: CityPickerProps) {
  const { t, info } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [recents, setRecents] = useLocalStorage<City[]>('isfair:recent-cities', []);

  const trimmed = query.trim();
  const isSearching = trimmed.length >= MIN_QUERY;

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!isSearching) {
      setResults([]);
      setSearchError(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchCities(trimmed, info.api, controller.signal)
        .then((found) => {
          setResults(found);
          setSearchError(false);
        })
        .catch((error: Error) => {
          if (error.name !== 'AbortError') setSearchError(true);
        })
        .finally(() => !controller.signal.aborted && setSearching(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed, isSearching, info.api]);

  const choose = (city: City) => {
    if (!city.curated) setRecents((prev) => [city, ...prev.filter((c) => c.id !== city.id)].slice(0, MAX_RECENTS));
    onSelect(city);
    onClose();
  };

  const searchField = (
    <label className="flex h-12 items-center gap-3 rounded-xl bg-muted px-4 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-ink">
      <Search className="h-5 w-5 shrink-0 text-ink-2" />
      <span className="sr-only">{t('city.searchAria')}</span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('city.search')}
        autoComplete="off"
        enterKeyHint="search"
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
      />
      {query && (
        <button type="button" onClick={() => setQuery('')} aria-label={t('city.clearSearch')} className="text-ink-2">
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  );

  return (
    <Sheet open={open} onClose={onClose} title={t('city.title')} header={searchField}>
      {isSearching ? (
        <>
          {searching && results.length === 0 && (
            <p className="flex items-center gap-2 py-6 text-sm text-ink-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('city.searching')}
            </p>
          )}
          {searchError && <p className="py-6 text-sm text-abusive-text">{t('city.searchError')}</p>}
          {!searching && !searchError && results.length === 0 && (
            <p className="py-6 text-sm text-ink-2">{t('city.noResults', { query: trimmed })}</p>
          )}
          <CityList cities={results} current={current} onChoose={choose} />
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            className="-mx-5 flex w-[calc(100%+2.5rem)] items-center gap-4 px-5 py-3 text-start transition-colors hover:bg-muted disabled:opacity-70"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white">
              {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{locating ? t('city.locating') : t('city.useLocation')}</span>
              <span className={cn('block text-sm', locationError ? 'text-abusive-text' : 'text-ink-2')}>
                {locationError ?? t('city.useLocationHint')}
              </span>
            </span>
          </button>

          {recents.length > 0 && (
            <>
              <GroupTitle>{t('city.recent')}</GroupTitle>
              <CityList cities={recents} current={current} onChoose={choose} />
            </>
          )}

          <GroupTitle>{t('city.curated')}</GroupTitle>
          <CityList cities={CURATED_CITIES} current={current} onChoose={choose} />
        </>
      )}
    </Sheet>
  );
}

function GroupTitle({ children }: { children: string }) {
  return <h3 className="mb-1 mt-5 text-sm font-semibold text-ink-2">{children}</h3>;
}

function CityList({ cities, current, onChoose }: { cities: City[]; current: City; onChoose: (city: City) => void }) {
  return (
    <ul className="divide-y divide-line">
      {cities.map((city) => {
        const selected = city.id === current.id;
        return (
          <li key={city.id}>
            <button
              type="button"
              onClick={() => onChoose(city)}
              aria-current={selected ? 'true' : undefined}
              className="-mx-5 flex w-[calc(100%+2.5rem)] items-center gap-4 px-5 py-3 text-start transition-colors hover:bg-muted"
            >
              <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', selected ? 'bg-ink text-white' : 'bg-muted')}>
                {selected ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <MapPin className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{city.name}</span>
                <span className="block truncate text-sm text-ink-2">
                  {[city.state, city.countryCode === 'BR' ? null : city.country].filter(Boolean).join(', ')}
                </span>
              </span>
              <CityBadge city={city} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CityBadge({ city }: { city: City }) {
  const { t } = useI18n();
  return city.curated ? (
    <span className="shrink-0 rounded-full bg-fair/15 px-2 py-0.5 text-xs font-semibold text-fair-text">{t('city.badgeLocal')}</span>
  ) : (
    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-ink-2">{t('city.badgeEstimate')}</span>
  );
}
