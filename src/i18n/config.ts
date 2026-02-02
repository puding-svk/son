import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import skTranslations from '../locales/sk.json';
import enTranslations from '../locales/en.json';

const resources = {
  sk: {
    translation: skTranslations,
  },
  en: {
    translation: enTranslations,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') || 'sk',
  fallbackLng: 'sk',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export { i18n };
export default i18n;
