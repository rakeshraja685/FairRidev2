import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import { places, Place } from './precomputed';
import { searchPlacesOnline, GeocodeResult } from './geocodingService';
import { useTranslation } from 'react-i18next';

interface PlaceInputProps {
  id: string;
  label: string;
  placeholder: string;
  selectedPlace: Place | null;
  customText: string;
  onSelect: (place: Place) => void;
  onTextChange: (text: string) => void;
  onCustomCoords?: (coords: [number, number], label: string) => void;
  showLocationBtn?: boolean;
  onUseLocation?: () => void;
  isLocating?: boolean;
}

const fuse = new Fuse(places, {
  keys: [
    { name: 'nameEn', weight: 0.6 },
    { name: 'nameTa', weight: 0.4 }
  ],
  threshold: 0.35,
  minMatchCharLength: 2
});

export const PlaceInput: React.FC<PlaceInputProps> = ({
  id,
  label,
  placeholder,
  selectedPlace,
  customText,
  onSelect,
  onTextChange,
  onCustomCoords,
  showLocationBtn,
  onUseLocation,
  isLocating
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<GeocodeResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const inputValue = selectedPlace
    ? (i18n.language === 'ta' ? selectedPlace.nameTa : selectedPlace.nameEn)
    : customText;

  useEffect(() => {
    if (selectedPlace) {
      setSuggestions([]);
      setOnlineResults([]);
      setIsOpen(false);
      return;
    }

    const query = customText.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setOnlineResults([]);
      setIsOpen(false);
      return;
    }

    // 1. Instant offline fuzzy search for precomputed landmarks
    const results = fuse.search(query, { limit: 5 });
    setSuggestions(results.map((r) => r.item));
    setIsOpen(true);

    // 2. Debounced online geocoding for all Tamil Nadu / India rural villages, towns, streets
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearchingOnline(true);
    const timer = setTimeout(async () => {
      try {
        const online = await searchPlacesOnline(query, controller.signal);
        if (!controller.signal.aborted) {
          setOnlineResults(online);
          if (online.length > 0 || results.length > 0) {
            setIsOpen(true);
          }
        }
      } catch (e) {
        // Handled in geocodingService
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingOnline(false);
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [customText, selectedPlace]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTextChange(e.target.value);
  };

  const handleSelect = (place: Place) => {
    onSelect(place);
    setIsOpen(false);
    setOnlineResults([]);
  };

  const handleClear = () => {
    onTextChange('');
    setIsOpen(false);
    setOnlineResults([]);
  };

  const handleOnlineSearch = async () => {
    const query = customText.trim();
    if (!query) return;
    setIsSearchingOnline(true);
    try {
      const online = await searchPlacesOnline(query);
      setOnlineResults(online);
      setIsOpen(true);
    } catch (e) {
      console.error('Online geocoding search failed:', e);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (onlineResults.length > 0) {
        const item = onlineResults[0];
        if (onCustomCoords) {
          onCustomCoords([item.lat, item.lng], item.displayName);
        }
        onTextChange(item.name);
        setIsOpen(false);
      } else {
        handleOnlineSearch();
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-500" />
          {label}
        </label>
        {showLocationBtn && onUseLocation && (
          <button
            type="button"
            onClick={onUseLocation}
            disabled={isLocating}
            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 py-0.5 px-2 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 transition-colors"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('searching_location')}
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3" />
                {t('use_my_location')}
              </>
            )}
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (customText.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-12 pl-4 pr-20 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-sm transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {!selectedPlace && customText.trim().length > 0 && (
            <button
              type="button"
              onClick={handleOnlineSearch}
              disabled={isSearchingOnline}
              title="Search place or village"
              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors"
            >
              {isSearchingOnline ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && (suggestions.length > 0 || onlineResults.length > 0 || isSearchingOnline) && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          
          {/* Offline Precomputed Landmarks */}
          {suggestions.length > 0 && (
            <div className="py-1">
              <div className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Landmarks (Chennai)
              </div>
              {suggestions.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {i18n.language === 'ta' ? place.nameTa : place.nameEn}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {i18n.language === 'ta' ? place.nameEn : place.nameTa}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Online Results: Rural Villages, Towns, Localities */}
          {onlineResults.length > 0 && (
            <div className="py-1">
              <div className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Places & Villages (Tamil Nadu)</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Live OSM</span>
              </div>
              {onlineResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (onCustomCoords) {
                      onCustomCoords([item.lat, item.lng], item.displayName);
                    }
                    onTextChange(item.name);
                    setIsOpen(false);
                    setOnlineResults([]);
                  }}
                  className="w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                >
                  <Navigation className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.subText}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Searching online loader */}
          {isSearchingOnline && (
            <div className="px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span>Searching villages & places online...</span>
            </div>
          )}

          {/* No match state */}
          {!isSearchingOnline && suggestions.length === 0 && onlineResults.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>No exact place found for "{customText}".</p>
              <p className="text-[11px] opacity-75">Try typing the taluk, district, or town name.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
