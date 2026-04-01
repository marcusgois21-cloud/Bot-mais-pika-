'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
} = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { getUserRep, getGrade, applyDelta } = require('../systems/reputation/index');
const { isAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reputacao')
    .setDescription('Ver ou editar reputação de membros | View or edit member reputation')
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Ver a reputação de um membro | View a member\'s reputation')
        .addUserOption(o => o.setName('membro').setDescription('Membro | Member').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('editar')
        .setDescription('Editar pontos de reputação (admin) | Edit reputation points (admin)')
        .addUserOption(o => o.setName('membro').setDescription('Membro | Member').setRequired(true))
        .addIntegerOption(o => o.setName('pontos').setDescription('Pontos a adicionar/remover | Points to add/remove').setRequired(true).setMinValue(-100).setMaxValue(100))
        .addStringOption(o => o.setName('motivo').setDescription('Motivo | Reason').setRequired(false))
    ),

  async execute(interaction) {
    if (!interaction.guild) return;
    const config = getGuildConfig(interaction.guild.id);
    const lang = config.language;
    const sub = interaction.options.getSubcommand();

    if (sub === 'ver') {
      const target = interaction.options.getUser('membro') ?? interaction.user;
      const rep = getUserRep(interaction.guild.id, target.id);
      const grade = getGrade(rep.score);

      const gradeBar = buildBar(rep.score);
      const history = (rep.history ?? []).slice(0, 5)
        .map(e => `\`${e.delta >= 0 ? '+' : ''}${e.delta}\` ${e.reason}`)
        .join('\n') || (lang === 'en_US' ? 'No history yet.' : 'Sem histórico ainda.');

      const title = lang === 'en_US' ? `## Reputation — ${target.username}` : `## Reputação — ${target.username}`;
      const scoreLabel = lang === 'en_US' ? 'Score' : 'Pontuação';
      const gradeLabel = lang === 'en_US' ? 'Grade' : 'Nível';
      const histLabel = lang === 'en_US' ? 'Recent History' : 'Histórico Recente';

      const body = `**${scoreLabel}:** ${rep.score}/100  ${gradeBar}\n**${gradeLabel}:** ${grade}\n\n**${histLabel}:**\n${history}`;

      const c = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

      return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    if (sub === 'editar') {
      if (!isAdmin(interaction.member)) {
        return interaction.reply({ content: lang === 'en_US' ? 'Admins only.' : 'Apenas admins.', ephemeral: true });
      }
      const target = interaction.options.getUser('membro');
      const points = interaction.options.getInteger('pontos');
      const reason = interaction.options.getString('motivo') ?? 'admin_edit';

      const newScore = applyDelta(interaction.guild.id, target.id, points, reason);
      const sign = points >= 0 ? '+' : '';
      const msg = lang === 'en_US'
        ? `Updated **${target.username}**'s reputation: \`${sign}${points}\` → **${newScore}/100**`
        : `Reputação de **${target.username}** atualizada: \`${sign}${points}\` → **${newScore}/100**`;

      return interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
    }
  },
};

function buildBar(score) {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
