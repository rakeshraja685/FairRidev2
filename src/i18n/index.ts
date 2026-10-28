import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ta from './ta.json';

const savedLang = localStorage.getItem('fairride_lang') || 'ta';

i18n.use(initReactI18next).init({
  resources: {
    ta: { translation: ta },
    en: { translation: en }
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
