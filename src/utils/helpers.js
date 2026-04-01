'use strict';

const { PermissionFlagsBits } = require('discord.js');

/**
 * Formats a date to a human-readable string.
 * @param {Date|number} date
 * @param {string} [lang='pt_BR']
 * @returns {string}
 */
function formatDate(date, lang = 'pt_BR') {
  const d = date instanceof Date ? date : new Date(date);
  const locale = lang === 'en_US' ? 'en-US' : 'pt-BR';
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns account age as a human-readable string.
 * @param {Date|number} createdAt
 * @param {string} [lang='pt_BR']
 * @returns {string}
 */
function accountAge(createdAt, lang = 'pt_BR') {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ms / 86_400_000);

  if (lang === 'en_US') {
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(days / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }

  if (days === 0) return 'hoje';
  if (days === 1) return 'há 1 dia';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'há 1 mês';
  if (months < 12) return `há ${months} meses`;
  const years = Math.floor(days / 365);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 * @param {Array} array
 * @returns {Array}
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks N random elements from an array without repetition.
 * @param {Array} array
 * @param {number} n
 * @returns {Array}
 */
function pickRandom(array, n) {
  return shuffle(array).slice(0, n);
}

/**
 * Extracts the domain from a URL string.
 * @param {string} url
 * @returns {string|null}
 */
function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Finds all URLs in a string.
 * @param {string} text
 * @returns {string[]}
 */
function extractUrls(text) {
  const regex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  return text.match(regex) ?? [];
}

/**
 * Checks if a member has administrator permissions.
 * @param {GuildMember} member
 * @returns {boolean}
 */
function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Checks if a member has manage guild permission.
 * @param {GuildMember} member
 * @returns {boolean}
 */
function isManager(member) {
  return (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

/**
 * Truncates a string to maxLength, appending '...' if needed.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Formats elapsed seconds into MM:SS.
 * @param {number} seconds
 * @returns {string}
 */
function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Sleeps for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Discord timestamp format helper.
 * @param {Date|number} date
 * @param {'t'|'T'|'d'|'D'|'f'|'F'|'R'} [style='f']
 * @returns {string}
 */
function discordTimestamp(date, style = 'f') {
  const unix = Math.floor(new Date(date).getTime() / 1000);
  return `<t:${unix}:${style}>`;
}

module.exports = {
  formatDate,
  accountAge,
  shuffle,
  pickRandom,
  extractDomain,
  extractUrls,
  isAdmin,
  isManager,
  truncate,
  formatTimer,
  sleep,
  discordTimestamp,
};
