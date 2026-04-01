'use strict';

const { Events } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const logger = require('../systems/logs/logger');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,

  async execute(member) {
    const { guild } = member;
    const config = getGuildConfig(guild.id);
    await logger.logMemberLeave(guild, config, member).catch(() => {});
  },
};
