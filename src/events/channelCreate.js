'use strict';

const { Events } = require('discord.js');
const engine = require('../systems/security/engine');

module.exports = {
  name: Events.ChannelCreate,
  once: false,

  async execute(channel) {
    if (!channel.guild) return;
    await engine.onChannelCreate(channel).catch(err =>
      console.error('[channelCreate] Engine error:', err.message)
    );
  },
};
