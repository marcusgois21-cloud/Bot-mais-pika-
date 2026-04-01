'use strict';

const { Events } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const engine = require('../systems/security/engine');
const logger = require('../systems/logs/logger');
const { handleJoinBlacklistCheck } = require('../systems/network/blacklist');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    const { guild } = member;
    const config = getGuildConfig(guild.id);

    // 1. Network blacklist check — ban before anything else
    await handleJoinBlacklistCheck(member, config).catch(err =>
      console.error('[guildMemberAdd] Blacklist check error:', err.message)
    );

    // If member was banned, they are no longer in the guild
    if (!guild.members.cache.has(member.id)) return;

    // 2. Security engine — raid detection (always active)
    await engine.onMemberJoin(member).catch(err =>
      console.error('[guildMemberAdd] Security engine error:', err.message)
    );

    // 3. Assign "unverified" role if verification is enabled
    if (config.verification.enabled && config.verification.unverifiedRoleId) {
      try {
        await member.roles.add(config.verification.unverifiedRoleId);
      } catch (err) {
        console.error('[guildMemberAdd] Failed to assign unverified role:', err.message);
      }
    }

    // 4. Log join
    await logger.logMemberJoin(guild, config, member).catch(() => {});
  },
};
