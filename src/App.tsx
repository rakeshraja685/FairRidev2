import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calculator as CalcIcon,
  HelpCircle,
  Gauge,
  Table,
  Shield,
  Smartphone,
  Sun,
  Moon,
  Type,
  WifiOff,
  Navigation
} from 'lucide-react';
import './i18n';
import { Calculator } from './pages/Calculator';
import { QuoteCheck } from './pages/QuoteCheck';
import { MeterConverter } from './pages/MeterConverter';
import { FareChart } from './pages/FareChart';
import { DriverMode } from './pages/DriverMode';
import { CompareApps } from './pages/CompareApps';

export function App() {
  const { t, i18n } = useTranslation();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [quoteCheckData, setQuoteCheckData] = useState<any>(null);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('fairride_dark_mode');
    return saved !== null ? saved === 'true' : true; // Default dark mode for night commuters
  });

  // Large Text Switch
  const [isLargeText, setIsLargeText] = useState<boolean>(() => {
    return localStorage.getItem('fairride_large_text') === 'true';
  });

  // Offline status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fairride_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('fairride_large_text', String(isLargeText));
  }, [isLargeText]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ta' ? 'en' : 'ta';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('fairride_lang', nextLang);
  };

  const handleNavigateTab = (tabId: string, extraData?: any) => {
    if (tabId === 'quote_check' && extraData) {
      setQuoteCheckData(extraData);
    }
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors ${
        isLargeText ? 'text-lg' : 'text-base'
      }`}
    >
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('calculator')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/25">
              🛺
            </div>
            <div>
              <div className="font-black text-lg tracking-tight leading-none text-slate-950 dark:text-white flex items-center gap-1.5">
                <span>FairRide</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  TN 2026
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {t('app_tagline')}
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isOnline && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                <WifiOff className="w-3 h-3" />
                {t('offline_badge')}
              </span>
            )}

            {/* Language Switch Button: தமிழ் | EN */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Switch language between Tamil and English"
            >
              {i18n.language === 'ta' ? 'EN (English)' : 'தமிழ் (Tamil)'}
            </button>

            {/* Large Text Switch */}
            <button
              type="button"
              onClick={() => setIsLargeText(!isLargeText)}
              className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                isLargeText
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title={t('larger_text')}
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
              title={isDarkMode ? t('light_mode') : t('dark_mode')}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="max-w-2xl mx-auto px-4 overflow-x-auto scrollbar-none flex gap-1 py-1 border-t border-slate-100 dark:border-slate-800/50">
          {[
            { id: 'calculator', label: t('tab_calculator'), icon: CalcIcon },
            { id: 'quote_check', label: t('tab_quote_check'), icon: HelpCircle },
            { id: 'meter_converter', label: t('tab_meter_converter'), icon: Gauge },
            { id: 'fare_chart', label: t('tab_fare_chart'), icon: Table },
            { id: 'driver_mode', label: t('tab_driver_mode'), icon: Shield },
            { id: 'compare_apps', label: t('tab_compare_apps'), icon: Smartphone }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigateTab(tab.id)}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-5">
        {activeTab === 'calculator' && (
          <Calculator onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'quote_check' && (
          <QuoteCheck
            initialExpected={quoteCheckData?.expected || 255}
            initialLimit={quoteCheckData?.limit || 275}
            initialDistance={quoteCheckData?.distance || 10}
            initialFrom={quoteCheckData?.from || ''}
            initialTo={quoteCheckData?.to || ''}
            initialTime={quoteCheckData?.time || ''}
            onBackToCalculator={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'meter_converter' && <MeterConverter />}

        {activeTab === 'fare_chart' && <FareChart />}

        {activeTab === 'driver_mode' && <DriverMode />}

        {activeTab === 'compare_apps' && <CompareApps />}
      </main>

      {/* Bottom Legal / Source Bar */}
      <footer className="max-w-2xl mx-auto px-4 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p>FairRide Tamil Nadu • Not run by government • Public transit utility</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Tamil Nadu Government Gazette (Oct 27, 2026) & G.O. Ms. No. 611 (Aug 25, 2013)
        </p>
      </footer>
    </div>
  );
}

export default App;
