import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gauge, ArrowRight, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import { oldMeterToNew, formatFare, OldMeterResult } from '../fare/fareEngine';

export const MeterConverter: React.FC = () => {
  const { t } = useTranslation();
  const [meterInput, setMeterInput] = useState<string>('123.40');
  const [waitMin, setWaitMin] = useState<number>(0);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [isGhat, setIsGhat] = useState<boolean>(false);
  const [result, setResult] = useState<OldMeterResult | null>(() => {
    return oldMeterToNew({ meter: 123.40, waitMin: 0, night: false, ghat: false });
  });

  const handleConvert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const meterVal = parseFloat(meterInput);
    if (isNaN(meterVal)) return;

    const res = oldMeterToNew({
      meter: meterVal,
      waitMin,
      night: isNight,
      ghat: isGhat
    });
    setResult(res);
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-xl mx-auto pb-12">
      {/* Input Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
              {t('meter_conv_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('meter_conv_subtitle')}
            </p>
          </div>
        </div>

        <form onSubmit={handleConvert} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              {t('meter_reading_label')}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="20"
                step="0.10"
                value={meterInput}
                onChange={(e) => setMeterInput(e.target.value)}
                placeholder="123.40"
                className="w-full h-15 pl-11 pr-4 text-2xl font-black rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Minimum 2013 meter base is ₹25.00
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Waiting minutes
              </label>
              <input
                type="number"
                min="0"
                value={waitMin === 0 ? '' : waitMin}
                onChange={(e) => setWaitMin(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0 min"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="flex items-center sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isNight}
                  onChange={(e) => setIsNight(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Night ride
                </span>
              </label>
            </div>

            <div className="flex items-center sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isGhat}
                  onChange={(e) => setIsGhat(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Hill road
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>{t('convert_btn')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Result Card */}
      {result && (
        <div className="animate-in zoom-in-95">
          {result.valid ? (
            <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl p-6 shadow-2xl border-2 border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400">
                    Legal 2026 Fare
                  </div>
                  <div className="text-5xl font-black text-slate-950 dark:text-white mt-1">
                    {formatFare(result.newFare)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t('trip_distance_est')}
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {result.km} km
                  </div>
                </div>
              </div>

              {/* Conversion explanation */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Formula Verification:
                </div>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  Old meter ₹{meterInput} ➔ {result.km} km ➔ 2026 Fare {formatFare(result.newFare)}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{t('invalid_meter')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
