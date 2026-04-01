'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { activateVacation, deactivateVacation } = require('../systems/vacation/index');
const { isAdmin } = require('../utils/helpers');
const logger = require('../systems/logs/logger');
const { buildLogContainer } = require('../builders/uiBuilder');

const DURATION_OPTIONS = [
  { name: '6 horas / 6 hours',   value: '6h'  },
  { name: '12 horas / 12 hours', value: '12h' },
  { name: '1 dia / 1 day',       value: '1d'  },
  { name: '3 dias / 3 days',     value: '3d'  },
  { name: '7 dias / 7 days',     value: '7d'  },
  { name: 'Indeterminado / Indefinite', value: 'inf' },
];

function parseDuration(value) {
  const map = { '6h': 6, '12h': 12, '1d': 24, '3d': 72, '7d': 168, 'inf': null };
  const hours = map[value];
  return hours ? hours * 3_600_000 : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ferias')
    .setDescription('Ativar/desativar modo de férias (eleva segurança ao máximo) | Toggle vacation mode')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('ativar')
        .setDescription('Ativa o modo de férias | Activate vacation mode')
        .addStringOption(o =>
          o.setName('duracao').setDescription('Duração | Duration').setRequired(true)
            .addChoices(...DURATION_OPTIONS)
        )
    )
    .addSubcommand(sub =>
      sub.setName('desativar')
        .setDescription('Desativa o modo de férias | Deactivate vacation mode')
    ),

  async execute(interaction) {
    if (!interaction.guild) return;
    if (!isAdmin(interaction.member)) return;

    const config = getGuildConfig(interaction.guild.id);
    const lang = config.language;
    const sub = interaction.options.getSubcommand();

    await interaction.deferReply({ ephemeral: true });

    if (sub === 'ativar') {
      const durValue = interaction.options.getString('duracao');
      const durationMs = parseDuration(durValue);
      const updated = activateVacation(interaction.guild.id, durationMs);

      const durationLabel = DURATION_OPTIONS.find(o => o.value === durValue)?.name ?? durValue;
      const msg = lang === 'en_US'
        ? `🌴 Vacation mode activated!\nSecurity elevated to **Maximum** for **${durationLabel}**.\nReturns to **${config.security.mode}** automatically.`
        : `🌴 Modo de férias ativado!\nSegurança elevada para **Máximo** por **${durationLabel}**.\nRetorna para **${config.security.mode}** automaticamente.`;

      await logger.logConfigChanged(interaction.guild, updated, 'vacation.active → true', interaction.user);
      return interaction.editReply(buildLogContainer(msg));
    }

    if (sub === 'desativar') {
      const updated = deactivateVacation(interaction.guild.id);
      const msg = lang === 'en_US'
        ? `✅ Vacation mode deactivated! Security mode restored to **${updated.security.mode}**.`
        : `✅ Modo de férias desativado! Modo de segurança restaurado para **${updated.security.mode}**.`;

      await logger.logConfigChanged(interaction.guild, updated, 'vacation.active → false', interaction.user);
      return interaction.editReply(buildLogContainer(msg));
    }
  },
};
