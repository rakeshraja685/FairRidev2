import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Search, Moon, Sun, ArrowUpDown, Download } from 'lucide-react';
import { newFare, oldFare, formatFare } from '../fare/fareEngine';

export const FareChart: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isGhat, setIsGhat] = useState(false);

  // Pre-generate 1 to 30 km entries
  const chartRows = useMemo(() => {
    const rows = [];
    for (let km = 1; km <= 30; km++) {
      const newDay = newFare({ km, waitMin: 0, night: false, ghat: isGhat }).total;
      const newNight = newFare({ km, waitMin: 0, night: true, ghat: isGhat }).total;
      const oldDay = oldFare({ km, waitMin: 0, night: false }).total;
      const oldNight = oldFare({ km, waitMin: 0, night: true }).total;

      const diffDay = Math.round((newDay - oldDay) * 100) / 100;
      const pctDay = oldDay > 0 ? Math.round((diffDay / oldDay) * 100) : 0;

      rows.push({
        km,
        newDay,
        newNight,
        oldDay,
        oldNight,
        diffDay,
        pctDay
      });
    }
    return rows;
  }, [isGhat]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return chartRows;
    const term = searchTerm.trim();
    return chartRows.filter((r) => r.km.toString().includes(term));
  }, [chartRows, searchTerm]);

  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
              <Table className="w-5 h-5 text-amber-500" />
              {t('fare_chart_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('fare_chart_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isGhat}
                onChange={(e) => setIsGhat(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500"
              />
              <span>Hill Road (Ghat)</span>
            </label>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="number"
            min="1"
            max="30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter distance (e.g. 5 or 10 km)..."
            className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        {/* Quick jump pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px]">Quick Jump:</span>
          {[2, 5, 8, 10, 15, 20, 25, 30].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSearchTerm(k.toString())}
              className={`px-2 py-0.5 rounded-md font-medium text-xs transition-colors ${
                searchTerm === k.toString()
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {k} km
            </button>
          ))}
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-amber-600 dark:text-amber-400 underline font-semibold ml-1"
            >
              Show all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 sm:px-4">{t('col_km')}</th>
                <th className="py-3 px-3 sm:px-4 text-amber-600 dark:text-amber-400 font-black">
                  {t('col_new_day')}
                </th>
                <th className="py-3 px-3 sm:px-4 text-indigo-600 dark:text-indigo-400">
                  {t('col_new_night')}
                </th>
                <th className="py-3 px-3 sm:px-4 text-slate-500 dark:text-slate-400">
                  {t('col_old_day')}
                </th>
                <th className="py-3 px-3 sm:px-4 text-rose-600 dark:text-rose-400">
                  {t('col_difference')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.map((row) => (
                <tr
                  key={row.km}
                  className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
                >
                  <td className="py-3 px-3 sm:px-4 font-bold text-slate-900 dark:text-white">
                    {row.km} km
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-extrabold text-slate-950 dark:text-white">
                    {formatFare(row.newDay)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-bold text-indigo-700 dark:text-indigo-300">
                    {formatFare(row.newNight)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-slate-500 dark:text-slate-400">
                    {formatFare(row.oldDay)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-rose-600 dark:text-rose-400">
                    +{formatFare(row.diffDay)} (+{row.pctDay}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
