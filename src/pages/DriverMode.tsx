import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Plus, Minus, Moon, Sun, ArrowRight } from 'lucide-react';
import { newFare, formatFare } from '../fare/fareEngine';

export const DriverMode: React.FC = () => {
  const { t } = useTranslation();
  const [km, setKm] = useState<string>('5');
  const [waitMin, setWaitMin] = useState<number>(0);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [isGhat, setIsGhat] = useState<boolean>(false);

  const numericKm = Math.max(0, parseFloat(km) || 0);
  const fare = newFare({ km: numericKm, waitMin, night: isNight, ghat: isGhat });

  const handleMinus = () => {
    const current = parseFloat(km) || 1;
    const next = Math.max(1, Math.round((current - 0.5) * 10) / 10);
    setKm(String(next));
  };

  const handlePlus = () => {
    const current = parseFloat(km) || 0;
    const next = Math.round((current + 0.5) * 10) / 10;
    setKm(String(next));
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-xl mx-auto pb-12">
      {/* Quick Adjustment Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-500">Trip Distance</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMinus}
              aria-label="Decrease distance"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white shrink-0"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
              <input
                id="trip-distance-input"
                type="number"
                step="any"
                min="0.5"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                onBlur={() => {
                  if (!km || parseFloat(km) <= 0) setKm('1');
                }}
                className="w-16 text-center text-xl font-black bg-transparent text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm font-black text-slate-500 dark:text-slate-400 select-none">km</span>
            </div>
            <button
              type="button"
              onClick={handlePlus}
              aria-label="Increase distance"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={isNight}
              onChange={(e) => setIsNight(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500"
            />
            <span>Night Rate (10pm-5am, 1.5x)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={isGhat}
              onChange={(e) => setIsGhat(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500"
            />
            <span>Hill Road</span>
          </label>
        </div>
      </div>

      {/* Full-Screen Show-to-Passenger Display Card */}
      <div className="bg-amber-500 text-slate-950 rounded-3xl p-8 shadow-2xl space-y-6 text-center select-none border-4 border-slate-950 dark:border-white">
        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest bg-slate-950 text-amber-400 py-1.5 px-4 rounded-full w-fit mx-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>GOVERNMENT NOTIFIED LEGAL FARE</span>
        </div>

        <div>
          <div className="text-xs font-bold uppercase opacity-85">
            Tamil Nadu Statutory Tariff (Oct 27, 2026)
          </div>
          <div className="text-7xl sm:text-8xl font-black tracking-tight my-2">
            {formatFare(fare.total)}
          </div>
          <div className="text-sm font-extrabold uppercase tracking-wide">
            {numericKm} km {isNight ? '• Night Time Fare' : '• Day Time Fare'}
          </div>
        </div>

        <div className="p-3 bg-slate-950/10 rounded-2xl text-xs font-bold flex justify-around">
          <span>Min (1.8km): ₹{fare.min}</span>
          <span>Extra: ₹{fare.extra}</span>
          {isNight && <span>Night: +₹{fare.nightExtra}</span>}
        </div>

        <p className="text-[11px] font-semibold opacity-90 max-w-xs mx-auto">
          Official rate set by Government of Tamil Nadu. Please settle according to meter rules.
        </p>
      </div>
    </div>
  );
};
