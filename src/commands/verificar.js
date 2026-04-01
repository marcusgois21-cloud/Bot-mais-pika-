'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { sendPanel } = require('../systems/verification/panel');
const { isAdmin } = require('../utils/helpers');
const { t } = require('../utils/i18n');
const { buildLogContainer } = require('../builders/uiBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Envia o painel de verificação no canal atual | Send verification panel to current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.guild) return;
    if (!isAdmin(interaction.member)) return;

    const config = getGuildConfig(interaction.guild.id);
    const lang = config.language;

    await interaction.deferReply({ ephemeral: true });

    // Override channel to current channel temporarily
    const { updateGuildConfig } = require('../utils/database');
    updateGuildConfig(interaction.guild.id, {
      verification: { channelId: interaction.channelId },
    });

    const updatedConfig = getGuildConfig(interaction.guild.id);
    const msg = await sendPanel(interaction.guild, updatedConfig);

    if (msg) {
      await interaction.editReply(
        buildLogContainer(t('config.verification.panelSent', lang, { channel: `<#${interaction.channelId}>` }))
      );
    } else {
      await interaction.editReply({ content: t('general.error', lang), ephemeral: true });
    }
  },
};
