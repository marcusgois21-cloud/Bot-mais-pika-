'use strict';

const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildInvites,
  ],
  partials: [
    Partials.GuildMember,
    Partials.Message,
    Partials.Channel,
  ],
  // Shard-ready for future scaling
  shards: 'auto',
});

module.exports = client;
