'use strict';

const { Events, ActivityType } = require('discord.js');
const { VERSION, CHANGELOG } = require('../config');
const { getGuildConfig, updateGuildConfig } = require('../utils/database');
const { checkExpiredVacations } = require('../systems/vacation/index');
const { sendWeeklyReport } = require('../systems/health/index');
const { buildChangelogPanel } = require('../builders/uiBuilder');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  Bot Mais Pika • v${VERSION.padEnd(19)}║`);
    console.log(`║  Conectado como: ${client.user.tag.padEnd(19)}║`);
    console.log(`║  Servidores: ${String(client.guilds.cache.size).padEnd(23)}║`);
    console.log(`╚══════════════════════════════════════╝\n`);

    // Set presence
    const updatePresence = () => {
      client.user.setPresence({
        activities: [{ name: `${client.guilds.cache.size} servidores | /configuracao`, type: ActivityType.Watching }],
        status: 'online',
      });
    };
    updatePresence();
    setInterval(updatePresence, 5 * 60_000);

    // ── Changelog notification (notify admins of new version) ──
    if (CHANGELOG[VERSION]) {
      for (const guild of client.guilds.cache.values()) {
        const config = getGuildConfig(guild.id);
        if (config.lastNotifiedVersion === VERSION) continue;
        if (!config.logs.channelId) continue;

        const channel = guild.channels.cache.get(config.logs.channelId);
        if (!channel) continue;

        try {
          await channel.send(buildChangelogPanel(VERSION, CHANGELOG[VERSION], config.language));
          updateGuildConfig(guild.id, { lastNotifiedVersion: VERSION });
        } catch { /* missing perms */ }
      }
    }

    // ── Vacation mode expiry check (every 10 minutes) ──
    await checkExpiredVacations(client).catch(() => {});
    setInterval(() => checkExpiredVacations(client).catch(() => {}), 10 * 60_000);

    // ── Weekly health report scheduler (check every hour) ──
    setInterval(async () => {
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60_000;

      for (const guild of client.guilds.cache.values()) {
        const config = getGuildConfig(guild.id);
        if (!config.health?.weeklyReport || !config.health?.reportChannelId) continue;

        const lastReport = config.health.lastReportAt ?? 0;
        if (now - lastReport < ONE_WEEK) continue;

        await sendWeeklyReport(guild, config).catch(() => {});
        updateGuildConfig(guild.id, { health: { lastReportAt: now } });
      }
    }, 60 * 60_000);
  },
};
