'use strict';

const { Events, ActivityType } = require('discord.js');
const { VERSION } = require('../config');

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
    client.user.setPresence({
      activities: [
        {
          name: `${client.guilds.cache.size} servidores | /configuracao`,
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // Update presence every 5 minutes
    setInterval(() => {
      client.user.setPresence({
        activities: [
          {
            name: `${client.guilds.cache.size} servidores | /configuracao`,
            type: ActivityType.Watching,
          },
        ],
        status: 'online',
      });
    }, 5 * 60_000);
  },
};
