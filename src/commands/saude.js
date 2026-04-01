'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { calculateHealth, getGradeEmoji } = require('../systems/health/index');
const { isAdmin } = require('../utils/helpers');
const { buildHealthPanel } = require('../builders/uiBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saude')
    .setDescription('Ver o score de saúde/segurança do servidor | View server security health score')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.guild) return;
    if (!isAdmin(interaction.member)) return;

    await interaction.deferReply({ ephemeral: true });

    const config = getGuildConfig(interaction.guild.id);
    const { score, grade, breakdown } = await calculateHealth(interaction.guild, config);

    await interaction.editReply(buildHealthPanel(score, grade, breakdown, config.language, false));
  },
};
