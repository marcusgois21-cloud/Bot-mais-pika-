'use strict';

/**
 * Custom emoji configuration.
 *
 * HOW TO USE:
 * 1. Upload your custom emojis to a Discord server.
 * 2. Get the emoji ID by typing \:emoji_name: in Discord.
 * 3. Replace the values below with your actual emoji IDs.
 *
 * Format: { name: 'emoji_name', id: 'emoji_id', animated: false }
 * Usage in code: e(emojis.success) → '<:check:123456789>'
 *
 * If you leave id as null, the fallback unicode emoji will be used.
 */
const CUSTOM_EMOJIS = {
  // UI / Status
  success:     { name: 'bmp_success',    id: null, fallback: '✅', animated: false },
  error:       { name: 'bmp_error',      id: null, fallback: '❌', animated: false },
  warning:     { name: 'bmp_warning',    id: null, fallback: '⚠️', animated: false },
  info:        { name: 'bmp_info',       id: null, fallback: 'ℹ️', animated: false },
  shield:      { name: 'bmp_shield',     id: null, fallback: '🛡️', animated: false },
  lock:        { name: 'bmp_lock',       id: null, fallback: '🔒', animated: false },
  unlock:      { name: 'bmp_unlock',     id: null, fallback: '🔓', animated: false },
  settings:    { name: 'bmp_settings',   id: null, fallback: '⚙️', animated: false },
  logs:        { name: 'bmp_logs',       id: null, fallback: '📋', animated: false },
  alert:       { name: 'bmp_alert',      id: null, fallback: '🚨', animated: false },
  verified:    { name: 'bmp_verified',   id: null, fallback: '✔️', animated: false },
  user:        { name: 'bmp_user',       id: null, fallback: '👤', animated: false },
  language:    { name: 'bmp_lang',       id: null, fallback: '🌍', animated: false },
  custom:      { name: 'bmp_custom',     id: null, fallback: '🔧', animated: false },
  test:        { name: 'bmp_test',       id: null, fallback: '🧪', animated: false },
  loading:     { name: 'bmp_loading',    id: null, fallback: '⏳', animated: true  },
  online:      { name: 'bmp_online',     id: null, fallback: '🟢', animated: false },
  offline:     { name: 'bmp_offline',    id: null, fallback: '🔴', animated: false },

  // Verification
  startVerify: { name: 'bmp_verify',     id: null, fallback: '🔑', animated: false },
  question:    { name: 'bmp_question',   id: null, fallback: '❓', animated: false },
  gameX:       { name: 'bmp_x',         id: null, fallback: '❌', animated: false },
  gameO:       { name: 'bmp_o',         id: null, fallback: '⭕', animated: false },
  gameEmpty:   { name: 'bmp_empty',     id: null, fallback: '⬜', animated: false },

  // Security modes
  modeManual:  { name: 'bmp_manual',    id: null, fallback: '🔵', animated: false },
  modeAuto:    { name: 'bmp_auto',      id: null, fallback: '🟡', animated: false },
  modeMax:     { name: 'bmp_maximum',   id: null, fallback: '🔴', animated: false },
  modeCustom:  { name: 'bmp_custom2',   id: null, fallback: '🟣', animated: false },

  // Fruits (for the Fruits Game)
  fruits: {
    apple:      { name: 'bmp_apple',     id: null, fallback: '🍎', animated: false },
    orange:     { name: 'bmp_orange',    id: null, fallback: '🍊', animated: false },
    banana:     { name: 'bmp_banana',    id: null, fallback: '🍌', animated: false },
    grape:      { name: 'bmp_grape',     id: null, fallback: '🍇', animated: false },
    watermelon: { name: 'bmp_watermelon',id: null, fallback: '🍉', animated: false },
    strawberry: { name: 'bmp_strawberry',id: null, fallback: '🍓', animated: false },
    peach:      { name: 'bmp_peach',     id: null, fallback: '🍑', animated: false },
    mango:      { name: 'bmp_mango',     id: null, fallback: '🥭', animated: false },
    pineapple:  { name: 'bmp_pineapple', id: null, fallback: '🍍', animated: false },
    cherry:     { name: 'bmp_cherry',    id: null, fallback: '🍒', animated: false },
    lemon:      { name: 'bmp_lemon',     id: null, fallback: '🍋', animated: false },
    kiwi:       { name: 'bmp_kiwi',      id: null, fallback: '🥝', animated: false },
  },
};

/**
 * Formats an emoji object into a Discord emoji string.
 * Returns custom emoji format if id is set, otherwise returns fallback unicode.
 * @param {object} emoji
 * @returns {string}
 */
function e(emoji) {
  if (!emoji) return '';
  if (emoji.id) {
    return emoji.animated
      ? `<a:${emoji.name}:${emoji.id}>`
      : `<:${emoji.name}:${emoji.id}>`;
  }
  return emoji.fallback || '';
}

/**
 * Returns emoji data object for use in button .setEmoji()
 * @param {object} emoji
 * @returns {object|string}
 */
function emojiData(emoji) {
  if (!emoji) return undefined;
  if (emoji.id) {
    return { name: emoji.name, id: emoji.id, animated: emoji.animated };
  }
  return { name: emoji.fallback };
}

/**
 * Returns all fruits as an array for game generation.
 */
function getFruitsList() {
  return Object.entries(CUSTOM_EMOJIS.fruits).map(([key, emoji]) => ({
    key,
    display: e(emoji),
    label: key.charAt(0).toUpperCase() + key.slice(1),
    emojiData: emojiData(emoji),
  }));
}

module.exports = { CUSTOM_EMOJIS, e, emojiData, getFruitsList };
