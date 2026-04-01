'use strict';

const { Events } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const engine = require('../systems/security/engine');
const logger = require('../systems/logs/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    const { guild } = member;
    const config = getGuildConfig(guild.id);

    // 1. Security engine — raid detection (always active)
    await engine.onMemberJoin(member).catch(err =>
      console.error('[guildMemberAdd] Security engine error:', err.message)
    );

    // 2. Assign "unverified" role if verification is enabled
    if (config.verification.enabled && config.verification.unverifiedRoleId) {
      try {
        await member.roles.add(config.verification.unverifiedRoleId);
      } catch (err) {
        console.error('[guildMemberAdd] Failed to assign unverified role:', err.message);
      }
    }

    // 3. Log join
    await logger.logMemberJoin(guild, config, member).catch(() => {});
  },
};
