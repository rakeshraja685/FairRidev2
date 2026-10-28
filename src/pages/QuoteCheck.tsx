import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Moon,
  Edit2,
  Check,
  RotateCcw,
  Minus,
  Plus
} from 'lucide-react';
import { checkQuote, formatFare, newFare, QuoteCheckResult } from '../fare/fareEngine';
import { ReportModal } from '../components/ReportModal';

interface QuoteCheckProps {
  initialExpected?: number;
  initialLimit?: number;
  initialDistance?: number;
  initialFrom?: string;
  initialTo?: string;
  initialTime?: string;
  onBackToCalculator?: () => void;
}

export const QuoteCheck: React.FC<QuoteCheckProps> = ({
  initialExpected,
  initialLimit,
  initialDistance = 5,
  initialFrom = '',
  initialTo = '',
  initialTime = '',
  onBackToCalculator
}) => {
  const { t } = useTranslation();

  // Trip parameters
  const [distanceKm, setDistanceKm] = useState<number>(initialDistance || 5);
  const [isNightTime, setIsNightTime] = useState<boolean>(false);
  const [isGhatRoad, setIsGhatRoad] = useState<boolean>(false);

  // Quote & Expected inputs
  const [driverQuoteInput, setDriverQuoteInput] = useState<string>('');
  const [customExpected, setCustomExpected] = useState<string>(
    initialExpected ? initialExpected.toString() : ''
  );
  const [isEditingExpected, setIsEditingExpected] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Sync props when user navigates from calculator with fresh route data
  useEffect(() => {
    if (initialDistance && initialDistance > 0) {
      setDistanceKm(initialDistance);
    }
  }, [initialDistance]);

  useEffect(() => {
    if (initialExpected && initialExpected > 0) {
      setCustomExpected(initialExpected.toString());
    }
  }, [initialExpected]);

  // Compute government legal fare dynamically based on distance & night rate
  const computedFare = newFare({
    km: distanceKm,
    night: isNightTime,
    ghat: isGhatRoad
  });

  const legalExpectedFare =
    customExpected && !isNaN(parseFloat(customExpected)) && parseFloat(customExpected) > 0
      ? parseFloat(customExpected)
      : computedFare.total;

  const legalLimitFare =
    initialLimit && initialLimit > 0
      ? initialLimit
      : Math.round(legalExpectedFare * 1.08);

  // Evaluate quote
  const parsedQuote = parseFloat(driverQuoteInput);
  const hasValidQuote = !isNaN(parsedQuote) && parsedQuote > 0;
  const quoteResult: QuoteCheckResult | null = hasValidQuote
    ? checkQuote(parsedQuote, legalExpectedFare, legalLimitFare)
    : null;

  const handleQuickDistance = (km: number) => {
    setDistanceKm(km);
    setCustomExpected('');
    setIsEditingExpected(false);
  };

  const handleMinusKm = () => {
    setDistanceKm((prev) => Math.max(1, Math.round((prev - 0.5) * 10) / 10));
    setCustomExpected('');
  };

  const handlePlusKm = () => {
    setDistanceKm((prev) => Math.round((prev + 0.5) * 10) / 10);
    setCustomExpected('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverQuoteInput) {
      // Focus the input if empty
      const el = document.getElementById('driver-quote-input');
      el?.focus();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-xl mx-auto pb-12">
      {onBackToCalculator && (
        <button
          type="button"
          onClick={onBackToCalculator}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calculator
        </button>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              <span>{t('quote_title')}</span>
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              TN 2026 Tariff
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {initialFrom && initialTo ? (
              <span>
                Trip: <strong className="text-slate-700 dark:text-slate-300">{initialFrom} ➔ {initialTo}</strong>
              </span>
            ) : (
              'Enter the fare the auto driver asked for to verify if it complies with legal meter rates.'
            )}
          </p>
        </div>

        {/* 1. Trip Distance & Condition Controls */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Trip Distance</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMinusKm}
                aria-label="Decrease distance"
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <input
                  type="number"
                  step="any"
                  min="0.5"
                  value={distanceKm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDistanceKm(isNaN(val) ? 1 : val);
                    setCustomExpected('');
                  }}
                  className="w-12 text-center text-sm font-black bg-transparent text-slate-900 dark:text-white focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">km</span>
              </div>
              <button
                type="button"
                onClick={handlePlusKm}
                aria-label="Increase distance"
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Distance Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[2, 3, 5, 8, 10, 15].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => handleQuickDistance(km)}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  distanceKm === km && !customExpected
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:border-amber-400'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>

          {/* Night Rate / Conditions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isNightTime}
                onChange={(e) => {
                  setIsNightTime(e.target.checked);
                  setCustomExpected('');
                }}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-amber-500" />
                Night Rate (10pm-5am, 1.5x)
              </span>
            </label>

            {/* Legal Expected Fare inline badge */}
            <div className="text-right">
              {isEditingExpected ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">₹</span>
                  <input
                    type="number"
                    value={customExpected || legalExpectedFare}
                    onChange={(e) => setCustomExpected(e.target.value)}
                    className="w-16 h-7 text-xs font-black px-1.5 rounded-lg border border-amber-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingExpected(false)}
                    className="p-1 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400"
                    title="Done"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Legal: </span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    {formatFare(legalExpectedFare)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingExpected(true)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Edit legal fare directly"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Driver Asked Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="driver-quote-input"
              className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between"
            >
              <span>{t('quote_input_label')}</span>
              <span className="text-xs font-normal text-slate-500">
                Type the price quoted by driver
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-black text-amber-500 select-none">
                ₹
              </span>
              <input
                id="driver-quote-input"
                type="number"
                min="10"
                step="5"
                autoFocus
                value={driverQuoteInput}
                onChange={(e) => setDriverQuoteInput(e.target.value)}
                placeholder="e.g. 150"
                className="w-full h-16 pl-11 pr-4 text-3xl font-black rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Quote Suggestions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs font-medium text-slate-400 self-center">Quick pick:</span>
            {[
              Math.round(legalExpectedFare),
              Math.round(legalExpectedFare + 30),
              Math.round(legalExpectedFare + 50),
              Math.round(legalExpectedFare + 100)
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDriverQuoteInput(preset.toString())}
                className="py-1 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-600 transition-colors"
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full h-12 py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{t('quote_check_btn')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* 3. Big Verdict Result Card */}
      {quoteResult && (
        <div
          className={`rounded-3xl p-6 shadow-2xl border-2 animate-in zoom-in-95 space-y-4 ${
            quoteResult.verdict === 'fair'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/60 text-emerald-950 dark:text-emerald-100'
              : quoteResult.verdict === 'close'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/60 text-amber-950 dark:text-amber-100'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/60 text-rose-950 dark:text-rose-100'
          }`}
        >
          {/* Header Verdict */}
          <div className="flex items-center gap-3">
            {quoteResult.verdict === 'fair' ? (
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : quoteResult.verdict === 'close' ? (
              <AlertCircle className="w-9 h-9 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <XCircle className="w-9 h-9 text-rose-600 dark:text-rose-400 shrink-0" />
            )}

            <div>
              <div className="text-2xl font-black">
                {quoteResult.verdict === 'fair'
                  ? t('quote_fair')
                  : quoteResult.verdict === 'close'
                  ? t('quote_close')
                  : t('quote_overcharged')}
              </div>
              <div className="text-xs opacity-90 font-medium mt-0.5">
                {quoteResult.verdict === 'fair'
                  ? t('quote_fair_desc')
                  : quoteResult.verdict === 'close'
                  ? t('quote_close_desc')
                  : t('quote_overcharged_desc', {
                      amount: quoteResult.amountOver,
                      percent: quoteResult.percentOver
                    })}
              </div>
            </div>
          </div>

          {/* Price Comparison summary */}
          <div className="p-3.5 bg-white/70 dark:bg-black/30 rounded-2xl flex items-center justify-between text-xs font-semibold">
            <span>Quoted: <strong className="font-black text-slate-900 dark:text-white">{formatFare(parsedQuote)}</strong></span>
            <span>Legal: <strong className="font-black text-slate-900 dark:text-white">{formatFare(legalExpectedFare)}</strong></span>
            <span
              className={
                quoteResult.verdict === 'overcharged'
                  ? 'text-rose-600 dark:text-rose-400 font-black'
                  : 'text-emerald-600 dark:text-emerald-400 font-bold'
              }
            >
              Delta: {quoteResult.amountOver > 0 ? `+${formatFare(quoteResult.amountOver)}` : 'None (Compliant)'}
            </span>
          </div>

          {/* Helpful negotiation phrase for passengers */}
          <div className="p-3 bg-white/80 dark:bg-black/40 rounded-2xl space-y-1.5 text-xs">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>🗣️</span>
              <span>What you can tell the driver:</span>
            </div>
            <p className="font-medium text-slate-700 dark:text-slate-300 italic">
              "அரசு சட்டப்பூர்வ மீட்டர் கட்டணம் ₹{Math.round(legalExpectedFare)} தான் வரும். மீட்டர்படி போடுங்க அண்ணா."
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ("The official government meter fare for this {distanceKm} km ride is ₹{Math.round(legalExpectedFare)}. Please turn on the meter.")
            </p>
          </div>

          {/* Overcharge Actions */}
          {quoteResult.verdict === 'overcharged' && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t('report_btn')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        fromName={initialFrom || 'Chennai Pickup'}
        toName={initialTo || 'Destination'}
        distanceKm={distanceKm}
        expectedFare={legalExpectedFare}
        driverQuote={parsedQuote || 0}
        rideTime={initialTime || 'Current Time'}
      />
    </div>
  );
};
