'use strict';

const { Events } = require('discord.js');
const engine = require('../systems/security/engine');

module.exports = {
  name: Events.GuildRoleCreate,
  once: false,

  async execute(role) {
    if (!role.guild) return;
    await engine.onRoleCreate(role).catch(err =>
      console.error('[roleCreate] Engine error:', err.message)
    );
  },
};
