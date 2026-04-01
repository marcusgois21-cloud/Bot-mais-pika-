'use strict';

const { getGuildConfig, updateGuildConfig } = require('../../utils/database');

/**
 * Activates vacation mode: elevates security to 'maximum' temporarily.
 * @param {string} guildId
 * @param {number|null} durationMs - Duration in ms (null = indefinite)
 * @returns {object} Updated config
 */
function activateVacation(guildId, durationMs = null) {
  const config = getGuildConfig(guildId);

  const updated = updateGuildConfig(guildId, {
    vacation: {
      active: true,
      previousMode: config.security.mode,
      endsAt: durationMs ? Date.now() + durationMs : null,
    },
    security: { mode: 'maximum' },
  });

  return updated;
}

/**
 * Deactivates vacation mode: restores the previous security mode.
 * @param {string} guildId
 * @returns {object} Updated config
 */
function deactivateVacation(guildId) {
  const config = getGuildConfig(guildId);
  const previousMode = config.vacation?.previousMode ?? 'manual';

  const updated = updateGuildConfig(guildId, {
    vacation: {
      active: false,
      previousMode: null,
      endsAt: null,
    },
    security: { mode: previousMode },
  });

  return updated;
}

/**
 * Checks all guilds in the client for expired vacation modes and deactivates them.
 * Should be called periodically (e.g. every 10 minutes).
 * @param {Client} client
 */
async function checkExpiredVacations(client) {
  for (const guild of client.guilds.cache.values()) {
    const config = getGuildConfig(guild.id);
    if (!config.vacation?.active) continue;
    if (!config.vacation?.endsAt) continue;

    if (Date.now() >= config.vacation.endsAt) {
      const updated = deactivateVacation(guild.id);

      // Notify logs channel
      const logsChannelId = updated.logs.channelId;
      if (logsChannelId) {
        const channel = guild.channels.cache.get(logsChannelId);
        if (channel) {
          const lang = updated.language;
          const { buildLogContainer } = require('../../builders/uiBuilder');
          const msg = lang === 'en_US'
            ? `Vacation mode has ended. Security mode restored to **${updated.security.mode}**.`
            : `Modo de férias encerrado. Modo de segurança restaurado para **${updated.security.mode}**.`;
          await channel.send(buildLogContainer(msg)).catch(() => {});
        }
      }
    }
  }
}

module.exports = { activateVacation, deactivateVacation, checkExpiredVacations };
