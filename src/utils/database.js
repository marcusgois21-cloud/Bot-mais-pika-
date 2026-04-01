'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '../../data/guilds');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultConfig() {
  return {
    language: 'pt_BR',
    verification: {
      enabled: false,
      method: 'both',           // 'tictactoe' | 'fruits' | 'both'
      unverifiedRoleId: null,
      memberRoleId: null,
      channelId: null,
      panelMessageId: null,
    },
    security: {
      mode: 'manual',           // 'manual' | 'auto' | 'maximum' | 'custom'
      customConfig: {
        name: 'Personalizado',
        aggressiveness: 5,
        joinLimitPerMin: 10,
        antiSpam: true,
        antiLinks: true,
        antiMentions: true,
      },
    },
    logs: {
      channelId: null,
      enabled: false,
    },
    alerts: {
      channelId: null,
      staffRoleId: null,
      publicAlerts: false,
    },
    lockdown: {
      active: false,
      reason: null,
      activatedAt: null,
      activatedBy: null,
    },
  };
}

/**
 * Retrieves a guild's configuration, creating defaults if not found.
 * @param {string} guildId
 * @returns {object}
 */
function getGuildConfig(guildId) {
  ensureDir();
  const filePath = path.join(DATA_DIR, `${guildId}.json`);
  if (!fs.existsSync(filePath)) {
    return getDefaultConfig();
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    // Deep merge with defaults to handle new config fields
    return deepMerge(getDefaultConfig(), JSON.parse(raw));
  } catch {
    return getDefaultConfig();
  }
}

/**
 * Saves a guild's configuration.
 * @param {string} guildId
 * @param {object} config
 */
function setGuildConfig(guildId, config) {
  ensureDir();
  const filePath = path.join(DATA_DIR, `${guildId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Updates specific fields in a guild's config (shallow patch on top level).
 * @param {string} guildId
 * @param {object} patch - Partial config to merge
 * @returns {object} Updated config
 */
function updateGuildConfig(guildId, patch) {
  const current = getGuildConfig(guildId);
  const updated = deepMerge(current, patch);
  setGuildConfig(guildId, updated);
  return updated;
}

/**
 * Deep merges source into target (non-mutating on target).
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

module.exports = { getGuildConfig, setGuildConfig, updateGuildConfig, getDefaultConfig };
