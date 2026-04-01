'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { activateLockdown, deactivateLockdown } = require('../systems/security/modes');
const { isAdmin } = require('../utils/helpers');
const { t } = require('../utils/i18n');
const logger = require('../systems/logs/logger');
const { buildLogContainer } = require('../builders/uiBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Ativa ou desativa o lockdown do servidor | Toggle server lockdown')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('acao')
        .setDescription('Ação | Action')
        .setRequired(true)
        .addChoices(
          { name: 'Ativar / Activate', value: 'on' },
          { name: 'Desativar / Deactivate', value: 'off' },
        )
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo | Reason')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.guild) return;
    if (!isAdmin(interaction.member)) return;

    const config = getGuildConfig(interaction.guild.id);
    const lang = config.language;
    const action = interaction.options.getString('acao');
    const reason = interaction.options.getString('motivo') ?? 'Manual';

    await interaction.deferReply({ ephemeral: true });

    if (action === 'on') {
      await activateLockdown(interaction.guild, config, reason);
      await logger.logLockdownOn(interaction.guild, config, reason, interaction.user);
      await interaction.editReply(
        buildLogContainer(t('config.lockdown.activated', lang))
      );
    } else {
      await deactivateLockdown(interaction.guild, config);
      await logger.logLockdownOff(interaction.guild, config, interaction.user);
      await interaction.editReply(
        buildLogContainer(t('config.lockdown.deactivated', lang))
      );
    }
  },
};
