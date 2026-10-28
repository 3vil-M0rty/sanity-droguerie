// ======================================================
// i18n Configuration
// ======================================================
import { mergeExtraTranslations } from "./i18n.extra.js";
import { mergeSanityTranslations } from "./i18n.sanity.js";
import { mergeFeatureTranslations } from "./i18n.features.js";
import { mergeDroguerieTranslations } from "./i18n.droguerie.js";
// English and French ship in the main bundle: every fallback chain
// ends on one of them (see i18nContext). The other languages are
// ~60 KB each and only fetched by the people who actually use them.
import en from "./locales/en.js";
import fr from "./locales/fr.js";

const LAZY_LANGUAGES = {
  ar: () => import("./locales/ar.js"),
  es: () => import("./locales/es.js"),
  pt: () => import("./locales/pt.js"),
  de: () => import("./locales/de.js"),
};

// Débit, vitrages, category tree — see i18n.extra.js
// Sanity (négoce): stock, commandes, BL, caisse, commerciaux — see i18n.sanity.js
// Each merge only touches the languages present in the object it gets,
// so a lazily loaded language is merged on its own when it arrives.
function applyMerges(dicts) {
  mergeExtraTranslations(dicts);
  mergeSanityTranslations(dicts);
  mergeFeatureTranslations(dicts);
  mergeDroguerieTranslations(dicts);
  return dicts;
}

export const translations = applyMerges({ en, fr });

const pending = {};

export const isLanguageLoaded = (lang) => !!translations[lang];

// Resolves once `lang` is in `translations`. Never rejects: on a
// network error the language simply stays missing and t() falls back.
export function loadLanguage(lang) {
  if (translations[lang] || !LAZY_LANGUAGES[lang]) return Promise.resolve();
  if (!pending[lang]) {
    pending[lang] = LAZY_LANGUAGES[lang]()
      .then((m) => {
        const dicts = applyMerges({ [lang]: m.default });
        translations[lang] = dicts[lang];
      })
      .catch(() => {
        delete pending[lang];
      });
  }
  return pending[lang];
}

// ======================================================
// SUPPORTED LANGUAGES
// ======================================================

export const SUPPORTED_LANGUAGES = [
  "en",
  "fr",
  "ar",
  "es",
  "pt",
  "de",
];

// ======================================================
// GET DEFAULT LANGUAGE
// ======================================================

export const getDefaultLanguage = () => {
  // Check localStorage first

  const stored =
    localStorage.getItem("language");

  if (
    stored &&
    SUPPORTED_LANGUAGES.includes(stored)
  ) {
    return stored;
  }

  // Check browser language

  const browserLang =
    navigator.language.split("-")[0];

  if (
    SUPPORTED_LANGUAGES.includes(
      browserLang
    )
  ) {
    return browserLang;
  }

  // Default to French (Morocco)

  return "fr";
};
