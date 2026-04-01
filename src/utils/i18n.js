'use strict';

const ptBR = require('../locales/pt_BR');
const enUS = require('../locales/en_US');

const translations = {
  pt_BR: ptBR,
  en_US: enUS,
};

/**
 * Translates a dot-notation key with optional variable interpolation.
 * @param {string} key - Dot-notation key (e.g. 'verification.panel.title')
 * @param {string} [lang='pt_BR'] - Language code
 * @param {Object} [vars={}] - Variables to interpolate ({key} → value)
 * @returns {string}
 */
function t(key, lang = 'pt_BR', vars = {}) {
  const locale = translations[lang] ?? translations['pt_BR'];
  const parts = key.split('.');

  let value = locale;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) break;
  }

  // Fallback to pt_BR if key not found in selected language
  if (value === undefined) {
    value = translations['pt_BR'];
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }
  }

  if (typeof value !== 'string') return key;

  // Replace {variable} placeholders
  return value.replace(/\{(\w+)\}/g, (_, k) => {
    return vars[k] !== undefined ? String(vars[k]) : `{${k}}`;
  });
}

/**
 * Returns the display name of a language code.
 * @param {string} lang
 * @returns {string}
 */
function langName(lang) {
  const names = {
    pt_BR: 'Português (PT-BR)',
    en_US: 'English (EN-US)',
  };
  return names[lang] ?? lang;
}

/**
 * Checks if a language code is valid/supported.
 * @param {string} lang
 * @returns {boolean}
 */
function isValidLang(lang) {
  return Object.keys(translations).includes(lang);
}

module.exports = { t, langName, isValidLang };
