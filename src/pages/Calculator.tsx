import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Share2,
  AlertTriangle,
  Bookmark,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PlaceInput } from '../maps/PlaceInput';
import { RouteMap } from '../maps/RouteMap';
import { Place } from '../maps/precomputed';
import { resolveTripDistance, RouteResult } from '../maps/routingService';
import {
  isNight,
  oldFare,
  newFare,
  fareRange,
  formatFare,
  rates,
  FareBreakdown
} from '../fare/fareEngine';
import { ShareCardModal } from '../components/ShareCardModal';
import { ReportModal } from '../components/ReportModal';

interface SavedRoute {
  id: string;
  name: string;
  originName: string;
  destName: string;
  distanceKm: number;
  newFare: number;
  oldFare: number;
}

interface CalculatorProps {
  onNavigateTab: (tabId: string, extraData?: any) => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ onNavigateTab }) => {
  const { t, i18n } = useTranslation();

  // Inputs
  const [originPlace, setOriginPlace] = useState<Place | null>(null);
  const [destPlace, setDestPlace] = useState<Place | null>(null);
  const [originText, setOriginText] = useState('');
  const [destText, setDestText] = useState('');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

  const [manualDistance, setManualDistance] = useState<string>('10');
  const [useManualKm, setUseManualKm] = useState<boolean>(false);

  // Time & Condition inputs
  const getCurrentTimeHHMM = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const [rideTime, setRideTime] = useState<string>(getCurrentTimeHHMM());
  const [isTimeNow, setIsTimeNow] = useState<boolean>(true);
  const [waitingMinutes, setWaitingMinutes] = useState<number>(0);
  const [isGhatRoad, setIsGhatRoad] = useState<boolean>(false);

  // Results State
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  // Modals
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Saved Routes
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(() => {
    try {
      const data = localStorage.getItem('fairride_saved_routes');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Geolocation
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Distance to calculate with
  const effectiveDistance = useManualKm
    ? Math.max(0.1, parseFloat(manualDistance) || 10)
    : routeResult?.distanceKm || (parseFloat(manualDistance) || 10);

  // Night flag for new tariff (22:00 to 05:00) and old tariff (23:00 to 05:00)
  const isNightNew = isNight(rideTime, rates.new.nightFrom, rates.new.nightTo);
  const isNightOld = isNight(rideTime, rates.old.nightFrom, rates.old.nightTo);

  // Transition hour check: between 22:00 and 23:00
  const isBetween22And23 = isNightNew && !isNightOld;

  // Compute fares
  const calculatedNewFare: FareBreakdown = newFare({
    km: effectiveDistance,
    waitMin: waitingMinutes,
    night: isNightNew,
    ghat: isGhatRoad
  });

  const calculatedOldFare: FareBreakdown = oldFare({
    km: effectiveDistance,
    waitMin: waitingMinutes,
    night: isNightOld
  });

  const range = fareRange([effectiveDistance, effectiveDistance * 1.04], {
    waitMin: waitingMinutes,
    night: isNightNew,
    ghat: isGhatRoad
  });

  const fareDiff = Math.round((calculatedNewFare.total - calculatedOldFare.total) * 100) / 100;
  const farePercentDiff = calculatedOldFare.total > 0
    ? Math.round((fareDiff / calculatedOldFare.total) * 100)
    : 0;

  // Resolve distance whenever places or coords change
  const handleCalculateRoute = async () => {
    setIsCalculating(true);
    try {
      const res = await resolveTripDistance({
        originPlace,
        destPlace,
        originCoords,
        destCoords
      });

      if (res) {
        setRouteResult(res);
        setManualDistance(res.distanceKm.toString());
        setUseManualKm(false);
      }
    } catch (e) {
      console.error('Error resolving route:', e);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if ((originPlace || originCoords) && (destPlace || destCoords)) {
      handleCalculateRoute();
    }
  }, [originPlace, destPlace, originCoords, destCoords]);

  // "Use my location"
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setOriginCoords(coords);
        setOriginPlace(null);
        setOriginText('Current GPS Location (தற்போதைய இடம்)');
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not fetch GPS location. Please choose a landmark or type the address.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Map click pin drop
  const handleMapClick = (coords: [number, number]) => {
    if (!originCoords && !originPlace) {
      setOriginCoords(coords);
      setOriginPlace(null);
      setOriginText(`Dropped Pin (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`);
    } else {
      setDestCoords(coords);
      setDestPlace(null);
      setDestText(`Dropped Pin (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`);
    }
  };

  // Save Route
  const handleSaveRoute = () => {
    const originLabel = originPlace
      ? (i18n.language === 'ta' ? originPlace.nameTa : originPlace.nameEn)
      : originText || 'Origin';
    const destLabel = destPlace
      ? (i18n.language === 'ta' ? destPlace.nameTa : destPlace.nameEn)
      : destText || 'Destination';

    const newRoute: SavedRoute = {
      id: `${Date.now()}`,
      name: `${originLabel} ➔ ${destLabel}`,
      originName: originLabel,
      destName: destLabel,
      distanceKm: effectiveDistance,
      newFare: calculatedNewFare.total,
      oldFare: calculatedOldFare.total
    };

    const updated = [newRoute, ...savedRoutes.filter((r) => r.name !== newRoute.name)].slice(0, 8);
    setSavedRoutes(updated);
    localStorage.setItem('fairride_saved_routes', JSON.stringify(updated));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const getOriginLabel = () =>
    originPlace ? (i18n.language === 'ta' ? originPlace.nameTa : originPlace.nameEn) : originText;
  const getDestLabel = () =>
    destPlace ? (i18n.language === 'ta' ? destPlace.nameTa : destPlace.nameEn) : destText;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Search & Inputs Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Pickup & Drop Inputs */}
        <div className="space-y-3.5">
          <PlaceInput
            id="pickup-input"
            label={t('from_label')}
            placeholder={t('pickup_placeholder')}
            selectedPlace={originPlace}
            customText={originText}
            onSelect={(place) => {
              setOriginPlace(place);
              setOriginCoords([place.lat, place.lng]);
              setOriginText('');
            }}
            onTextChange={(val) => {
              setOriginText(val);
              setOriginPlace(null);
            }}
            onCustomCoords={(coords, label) => {
              setOriginCoords(coords);
              setOriginPlace(null);
              setOriginText(label);
            }}
            showLocationBtn={true}
            onUseLocation={handleUseMyLocation}
            isLocating={isLocating}
          />

          <PlaceInput
            id="drop-input"
            label={t('to_label')}
            placeholder={t('drop_placeholder')}
            selectedPlace={destPlace}
            customText={destText}
            onSelect={(place) => {
              setDestPlace(place);
              setDestCoords([place.lat, place.lng]);
              setDestText('');
            }}
            onTextChange={(val) => {
              setDestText(val);
              setDestPlace(null);
            }}
            onCustomCoords={(coords, label) => {
              setDestCoords(coords);
              setDestPlace(null);
              setDestText(label);
            }}
          />
        </div>

        {/* Options Row (Time, Waiting, Hill Road) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Time Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {t('ride_time')}
            </label>
            <div className="flex gap-1.5">
              <input
                type="time"
                value={rideTime}
                onChange={(e) => {
                  setRideTime(e.target.value);
                  setIsTimeNow(false);
                }}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  setRideTime(getCurrentTimeHHMM());
                  setIsTimeNow(true);
                }}
                className={`px-2.5 rounded-xl border text-xs font-semibold shrink-0 transition-colors ${
                  isTimeNow
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                {t('now')}
              </button>
            </div>
          </div>

          {/* Waiting Minutes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('waiting_minutes')}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={waitingMinutes === 0 ? '' : waitingMinutes}
              onChange={(e) => setWaitingMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0 min"
              className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Hill Road Tickbox */}
          <div className="flex items-center sm:pt-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGhatRoad}
                onChange={(e) => setIsGhatRoad(e.target.checked)}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {t('hill_road')}
              </span>
            </label>
          </div>
        </div>

        {/* Manual Distance Box (Always Visible) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('manual_distance')}
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('manual_distance_hint')}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={manualDistance}
              onChange={(e) => {
                setManualDistance(e.target.value);
                setUseManualKm(true);
              }}
              className="w-28 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-base text-center focus:ring-2 focus:ring-amber-500/50"
            />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">km</span>
          </div>
        </div>

        {/* Show Fare Button */}
        <button
          type="button"
          onClick={handleCalculateRoute}
          disabled={isCalculating}
          className="w-full h-13 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-lg shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all"
        >
          {isCalculating ? (
            <span>Calculating...</span>
          ) : (
            <>
              <span>{t('calculate_fare_btn')}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Quick Links */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">
            {t('quick_links')}
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('fare_chart')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition-colors"
          >
            {t('quick_chart')}
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('meter_converter')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition-colors"
          >
            {t('quick_old_meter')}
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('quote_check', { expected: calculatedNewFare.total, limit: range.high })}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition-colors"
          >
            {t('quick_quote')}
          </button>
        </div>
      </div>

      {/* RESULT CARD (Answer First) */}
      <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl p-6 shadow-2xl border-2 border-amber-500/40 space-y-5">
        {/* Main Headline Fare */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">
              {t('pay_about')}
            </div>
            <div className="text-5xl sm:text-6xl font-black text-slate-950 dark:text-white tracking-tight mt-1 flex items-baseline gap-2">
              <span>{formatFare(calculatedNewFare.total)}</span>
              {isNightNew && (
                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-500 text-white tracking-normal">
                  Night
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {t('range')} {formatFare(range.low)} to {formatFare(range.high)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 sm:text-right">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {t('old_fare_2013')} <span className="font-bold text-slate-900 dark:text-white">{formatFare(calculatedOldFare.total)}</span>
            </div>
            <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
              {t('you_pay_more')} {formatFare(fareDiff)} (+{farePercentDiff}%)
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {effectiveDistance} km • {isNightNew ? t('night_fare') : t('day_fare')}
            </div>
          </div>
        </div>

        {/* Night tariff shift banner (22:00 to 23:00 note) */}
        {isBetween22And23 && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200 text-xs font-semibold flex items-center gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{t('night_banner_note')}</span>
          </div>
        )}

        {/* Collapsible Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white/70 dark:bg-slate-900/70">
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span>{showBreakdown ? t('hide_breakdown') : t('how_calculated')}</span>
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showBreakdown && (
            <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t('min_fare')} ({isGhatRoad ? 'Ghat base' : '1.8 km'})</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatFare(calculatedNewFare.min)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>
                  {t('extra_km_fare')} ({Math.max(0, Math.round((effectiveDistance - 1.8) * 100) / 100)} km @ ₹{isGhatRoad ? 30 : 25}/km)
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatFare(calculatedNewFare.extra)}
                </span>
              </div>

              {waitingMinutes > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('waiting_charge')} ({waitingMinutes} min @ ₹1/min)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatFare(calculatedNewFare.wait)}
                  </span>
                </div>
              )}

              {isNightNew && (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-medium">
                  <span>{t('night_charge')}</span>
                  <span className="font-bold">
                    +{formatFare(calculatedNewFare.nightExtra)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-extrabold text-sm text-slate-950 dark:text-white">
                <span>{t('total_fare')}</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatFare(calculatedNewFare.total)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Map Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{t('route_map_title')}</span>
            {routeResult?.isApproximate && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                {t('route_approx_badge')}
              </span>
            )}
          </div>
          <RouteMap
            originCoords={originCoords}
            destCoords={destCoords}
            routeCoordinates={routeResult?.coordinates}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Actions Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            type="button"
            onClick={() =>
              onNavigateTab('quote_check', {
                expected: calculatedNewFare.total,
                limit: range.high,
                distance: effectiveDistance,
                from: getOriginLabel(),
                to: getDestLabel(),
                time: rideTime
              })
            }
            className="py-3 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>{t('driver_asked_different')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="py-3 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('share_whatsapp')}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveRoute}
            className="py-3 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {justSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Save this route</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Saved Routes (Home, Office, College, Station) */}
      {savedRoutes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            Saved Routes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {savedRoutes.map((route) => (
              <div
                key={route.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {route.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {route.distanceKm} km • Old: {formatFare(route.oldFare)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {formatFare(route.newFare)}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setManualDistance(route.distanceKm.toString());
                      setUseManualKm(true);
                      setOriginText(route.originName);
                      setDestText(route.destName);
                    }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold underline"
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimers and Trust Line */}
      <div className="text-center space-y-1.5 px-4 text-xs text-slate-500 dark:text-slate-400">
        <p>{t('disclaimer')}</p>
        <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
          {t('rates_as_of')} • G.O. Ms. No. 611 (2013) & TN Gazette Notification (27 Oct 2026)
        </p>
      </div>

      {/* Modals */}
      <ShareCardModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        fromName={getOriginLabel()}
        toName={getDestLabel()}
        distanceKm={effectiveDistance}
        expectedFare={calculatedNewFare.total}
        oldFareAmount={calculatedOldFare.total}
        isNightTime={isNightNew}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        fromName={getOriginLabel()}
        toName={getDestLabel()}
        distanceKm={effectiveDistance}
        expectedFare={calculatedNewFare.total}
        rideTime={rideTime}
      />
    </div>
  );
};
