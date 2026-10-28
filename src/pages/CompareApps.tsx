import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, ArrowRight, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { newFare, formatFare } from '../fare/fareEngine';

export const CompareApps: React.FC = () => {
  const { t } = useTranslation();
  const [km, setKm] = useState<number>(4.8);
  const [olaPrice, setOlaPrice] = useState<string>('180');
  const [uberPrice, setUberPrice] = useState<string>('175');
  const [rapidoPrice, setRapidoPrice] = useState<string>('160');

  const legalFare = newFare({ km, waitMin: 0, night: false }).total;

  const compareItem = (appName: string, priceStr: string, color: string) => {
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) return null;

    const diff = Math.round((price - legalFare) * 100) / 100;
    const pct = Math.round((diff / legalFare) * 100);

    return (
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
        <div>
          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color}`}></span>
            {appName}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quoted in app: <span className="font-bold">{formatFare(price)}</span>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-sm font-black ${diff > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
            {diff > 0 ? `+${formatFare(diff)} (+${pct}%)` : 'Cheaper than meter'}
          </div>
          <div className="text-[11px] text-slate-400">
            vs legal {formatFare(legalFare)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-xl mx-auto pb-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
              {t('compare_apps_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check how private ride-hailing apps with dynamic surge compare directly against the legal 2026 Tamil Nadu metered rate.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Trip Distance (km)
          </label>
          <input
            type="number"
            min="1"
            step="0.5"
            value={km}
            onChange={(e) => setKm(Math.max(1, parseFloat(e.target.value) || 1))}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ola Auto ₹
            </label>
            <input
              type="number"
              value={olaPrice}
              onChange={(e) => setOlaPrice(e.target.value)}
              placeholder="180"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Uber Auto ₹
            </label>
            <input
              type="number"
              value={uberPrice}
              onChange={(e) => setUberPrice(e.target.value)}
              placeholder="175"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rapido Auto ₹
            </label>
            <input
              type="number"
              value={rapidoPrice}
              onChange={(e) => setRapidoPrice(e.target.value)}
              placeholder="160"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Comparisons */}
      <div className="space-y-3">
        <div className="p-4 bg-amber-500/15 rounded-2xl border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
              Legal Metered Fare (2026)
            </span>
            <div className="text-3xl font-black text-slate-950 dark:text-white">
              {formatFare(legalFare)}
            </div>
          </div>
          <div className="text-xs text-slate-500 text-right">
            0% platform commission<br/>Direct street legal rate
          </div>
        </div>

        {compareItem('Ola Auto', olaPrice, 'bg-yellow-400')}
        {compareItem('Uber Auto', uberPrice, 'bg-black dark:bg-white')}
        {compareItem('Rapido Auto', rapidoPrice, 'bg-amber-600')}
      </div>
    </div>
  );
};
