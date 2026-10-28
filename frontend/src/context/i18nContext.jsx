import React, { createContext, useState, useEffect, useMemo } from 'react';
import { translations, SUPPORTED_LANGUAGES, getDefaultLanguage, loadLanguage } from '../config/i18n.config';

export const I18nContext = createContext();

// Which complete language to use when a key is missing.
const FALLBACK_LANGUAGE = { ar: 'fr', es: 'en', pt: 'en', de: 'en', fr: 'en', en: 'fr' };

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(getDefaultLanguage());

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translate function with nested key support.
  // Missing key in the current language -> fall back to a complete
  // language instead of showing the raw key ("purchasing.requests.title").
  // English and French are always complete (checked in CI-style audits);
  // Arabic falls back to French (natural for Moroccan users), the others
  // to English.
  const lookup = (lang, keys) => {
    let value = translations[lang];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) value = value[k];
      else return undefined;
    }
    return typeof value === 'string' ? value : undefined;
  };

  const t = (key, defaultValue = key) => {
    const keys = key.split('.');
    const chain = [language, FALLBACK_LANGUAGE[language] || 'en', 'en'];
    for (const lang of chain) {
      const value = lookup(lang, keys);
      if (value !== undefined) return value;
    }
    return defaultValue;
  };

  // Translate with variable substitution
  const tVar = (key, variables = {}) => {
    let text = t(key);
    
    Object.entries(variables).forEach(([varName, varValue]) => {
      text = text.replace(new RegExp(`{${varName}}`, 'g'), varValue);
    });

    return text;
  };

  // Non-default languages are separate chunks: switch only once the
  // dictionary is in, so the screen goes straight to the new language.
  const changeLanguage = (lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      loadLanguage(lang).then(() => setLanguage(lang));
    }
  };

  // Stable value: consumers only re-render when the language changes.
  const value = useMemo(() => ({
    language,
    setLanguage: changeLanguage,
    t,
    tVar,
    supportedLanguages: SUPPORTED_LANGUAGES
  }), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};
