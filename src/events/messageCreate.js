'use strict';

const { Events } = require('discord.js');
const engine = require('../systems/security/engine');
const { checkHoneypot } = require('../systems/honeypot/index');

module.exports = {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    if (!message.guild) return;

    // 1. Honeypot check (highest priority — bans immediately)
    await checkHoneypot(message).catch(err =>
      console.error('[messageCreate] Honeypot error:', err.message)
    );

    if (message.author?.bot) return;

    // 2. Security engine
    await engine.onMessage(message).catch(err =>
      console.error('[messageCreate] Security engine error:', err.message)
    );
  },
};
