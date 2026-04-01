'use strict';

const { Events } = require('discord.js');
const engine = require('../systems/security/engine');

module.exports = {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    if (message.author?.bot) return;
    if (!message.guild) return;

    await engine.onMessage(message).catch(err =>
      console.error('[messageCreate] Security engine error:', err.message)
    );
  },
};
