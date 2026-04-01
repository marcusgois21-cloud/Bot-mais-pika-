'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, AttachmentBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { exportConfig, validateBackup, importConfig } = require('../utils/backup');
const { isAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Exportar ou importar configurações do bot | Export or import bot config')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('exportar')
        .setDescription('Exporta as configurações atuais como arquivo JSON | Export current config as JSON')
    )
    .addSubcommand(sub =>
      sub.setName('importar')
        .setDescription('Importa configurações de um arquivo JSON | Import config from a JSON file')
        .addAttachmentOption(o =>
          o.setName('arquivo').setDescription('Arquivo JSON de backup | Backup JSON file').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!interaction.guild) return;
    if (!isAdmin(interaction.member)) return;

    const config = getGuildConfig(interaction.guild.id);
    const lang = config.language;
    const sub = interaction.options.getSubcommand();

    if (sub === 'exportar') {
      const { buffer, filename } = exportConfig(interaction.guild.id, interaction.guild.name);
      const attachment = new AttachmentBuilder(buffer, { name: filename });

      const msg = lang === 'en_US'
        ? '✅ Config exported! Keep this file safe — you can use `/backup importar` to restore it.'
        : '✅ Configuração exportada! Guarde este arquivo com segurança — use `/backup importar` para restaurar.';

      return interaction.reply({ content: msg, files: [attachment], ephemeral: true });
    }

    if (sub === 'importar') {
      await interaction.deferReply({ ephemeral: true });

      const attachment = interaction.options.getAttachment('arquivo');
      if (!attachment.name.endsWith('.json')) {
        return interaction.editReply({ content: lang === 'en_US' ? '❌ File must be a `.json` file.' : '❌ O arquivo deve ser `.json`.' });
      }

      let backupData;
      try {
        const resp = await fetch(attachment.url);
        backupData = await resp.json();
      } catch {
        return interaction.editReply({ content: lang === 'en_US' ? '❌ Failed to read the file.' : '❌ Falha ao ler o arquivo.' });
      }

      const { success, error } = importConfig(interaction.guild.id, backupData);
      if (success) {
        const msg = lang === 'en_US'
          ? `✅ Config imported from \`${backupData.guildName ?? 'unknown'}\` (exported at ${backupData.exportedAt?.slice(0, 10) ?? '?'}).\nRun \`/configuracao\` to review.`
          : `✅ Configuração importada de \`${backupData.guildName ?? 'desconhecido'}\` (exportada em ${backupData.exportedAt?.slice(0, 10) ?? '?'}).\nUse \`/configuracao\` para revisar.`;
        return interaction.editReply({ content: msg });
      } else {
        return interaction.editReply({ content: `❌ ${lang === 'en_US' ? 'Import failed' : 'Importação falhou'}: ${error}` });
      }
    }
  },
};
