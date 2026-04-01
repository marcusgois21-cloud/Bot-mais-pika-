'use strict';

const { getGuildConfig, setGuildConfig } = require('./database');

/**
 * Exports a guild's configuration as a JSON buffer (for file attachment).
 * @param {string} guildId
 * @param {string} guildName
 * @returns {{ buffer: Buffer, filename: string }}
 */
function exportConfig(guildId, guildName) {
  const config = getGuildConfig(guildId);

  const exportData = {
    exportedAt: new Date().toISOString(),
    guildId,
    guildName,
    config,
  };

  const json = JSON.stringify(exportData, null, 2);
  const buffer = Buffer.from(json, 'utf8');
  const filename = `backup_${guildName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;

  return { buffer, filename };
}

/**
 * Validates a backup file's structure before importing.
 * @param {object} data - Parsed JSON
 * @returns {{ valid: boolean, error?: string }}
 */
function validateBackup(data) {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Invalid JSON' };
  if (!data.config || typeof data.config !== 'object') return { valid: false, error: 'Missing config field' };
  if (!data.exportedAt) return { valid: false, error: 'Missing exportedAt field' };

  const required = ['language', 'verification', 'security', 'logs'];
  for (const key of required) {
    if (!(key in data.config)) return { valid: false, error: `Missing config.${key}` };
  }

  return { valid: true };
}

/**
 * Imports a config from a parsed backup object.
 * @param {string} targetGuildId - The guild to import into
 * @param {object} backupData - Parsed backup JSON
 * @returns {{ success: boolean, error?: string }}
 */
function importConfig(targetGuildId, backupData) {
  const { valid, error } = validateBackup(backupData);
  if (!valid) return { success: false, error };

  try {
    // Strip panel message IDs (they belong to the source guild)
    const config = { ...backupData.config };
    if (config.verification) {
      config.verification = { ...config.verification, panelMessageId: null };
    }
    // Reset lockdown state on import
    config.lockdown = { active: false, reason: null, activatedAt: null, activatedBy: null };

    setGuildConfig(targetGuildId, config);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { exportConfig, validateBackup, importConfig };
