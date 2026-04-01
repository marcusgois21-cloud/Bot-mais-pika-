'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { buildConfigPanel } = require('../builders/uiBuilder');
const { isAdmin } = require('../utils/helpers');
const logger = require('../systems/logs/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configuracao')
    .setDescription('Painel de configuração completo do bot | Full bot configuration panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });
    }

    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: 'Apenas administradores podem usar este comando.', ephemeral: true });
    }

    const config = getGuildConfig(interaction.guild.id);
    const lang = config.language;

    const panel = buildConfigPanel(interaction.guild, config, lang);
    await interaction.reply(panel);

    await logger.logCommandUsed(interaction.guild, config, 'configuracao', interaction.user);
  },
};
