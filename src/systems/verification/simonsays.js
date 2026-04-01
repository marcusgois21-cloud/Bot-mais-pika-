'use strict';

const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, MessageFlags,
} = require('discord.js');
const { t } = require('../../utils/i18n');

const activeGames = new Map();

const COLORS = [
  { id: 'red',    emoji: '🔴', style: ButtonStyle.Danger   },
  { id: 'blue',   emoji: '🔵', style: ButtonStyle.Primary  },
  { id: 'green',  emoji: '🟢', style: ButtonStyle.Success  },
  { id: 'yellow', emoji: '🟡', style: ButtonStyle.Secondary},
  { id: 'purple', emoji: '🟣', style: ButtonStyle.Secondary},
];

const SEQ_LENGTH = 4;
const TIMEOUT_MS = 45_000;

function generateSequence() {
  return Array.from({ length: SEQ_LENGTH }, () =>
    COLORS[Math.floor(Math.random() * COLORS.length)]
  );
}

function buildGameUI(game, lang) {
  const { sequence, step } = game;

  const seqDisplay = sequence.map(c => c.emoji).join('  ');
  const progress = sequence.map((c, i) => i < step ? '✅' : (i === step ? '👉' : '⬜')).join(' ');

  const desc = lang === 'en_US'
    ? `Memorize the sequence and repeat it!\n\n**Sequence:** ${seqDisplay}\n**Progress:** ${progress}\n\nClick the colors **in order**!`
    : `Memorize a sequência e repita ela!\n\n**Sequência:** ${seqDisplay}\n**Progresso:** ${progress}\n\nClique as cores **na ordem correta**!`;

  const title = lang === 'en_US' ? '## Simon Says' : '## Simon Says';

  const c = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));

  // Color buttons row
  const btnRow = new ActionRowBuilder().addComponents(
    COLORS.map(color =>
      new ButtonBuilder()
        .setCustomId(`simon_${color.id}`)
        .setEmoji({ name: color.emoji })
        .setStyle(color.style)
        .setLabel('\u200b')
    )
  );

  return { container: c, btnRow };
}

/**
 * Starts a Simon Says game.
 * @param {Interaction} interaction
 * @param {string} lang
 */
async function startGame(interaction, lang) {
  const userId = interaction.user.id;
  if (activeGames.has(userId)) clearTimeout(activeGames.get(userId).timer);

  const sequence = generateSequence();
  const game = { sequence, step: 0, lang };
  activeGames.set(userId, game);

  const { container: c, btnRow } = buildGameUI(game, lang);
  const flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
  const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';

  await interaction[method]({ components: [c, btnRow], flags });

  game.timer = setTimeout(async () => {
    activeGames.delete(userId);
    const timeoutMsg = lang === 'en_US'
      ? '## Time is up!\nYou ran out of time on Simon Says.'
      : '## Tempo esgotado!\nVocê não completou o Simon Says a tempo.';
    const tc = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(timeoutMsg));
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('simon_retry').setLabel(lang === 'en_US' ? 'Try Again' : 'Tentar Novamente').setStyle(ButtonStyle.Primary)
    );
    await interaction.editReply({ components: [tc, retryRow], flags }).catch(() => {});
  }, TIMEOUT_MS);
}

/**
 * Handles a color button press.
 * @param {Interaction} interaction
 * @param {string} colorId
 */
async function handlePress(interaction, colorId) {
  const userId = interaction.user.id;
  const game = activeGames.get(userId);
  if (!game) return;

  await interaction.deferUpdate();

  const { sequence, step, lang } = game;
  const expected = sequence[step];

  if (colorId !== expected.id) {
    // Wrong!
    clearTimeout(game.timer);
    activeGames.delete(userId);

    const lostC = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        lang === 'en_US'
          ? `## Wrong color!\nYou pressed ${COLORS.find(c => c.id === colorId)?.emoji ?? '?'} but the correct was ${expected.emoji}. Try again!`
          : `## Cor errada!\nVocê pressionou ${COLORS.find(c => c.id === colorId)?.emoji ?? '?'} mas o correto era ${expected.emoji}. Tente novamente!`
      ));
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('simon_retry').setLabel(lang === 'en_US' ? 'Try Again' : 'Tentar Novamente').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('verify_method_fruits').setLabel(lang === 'en_US' ? 'Try Fruit Game' : 'Tentar Jogo das Frutas').setStyle(ButtonStyle.Secondary),
    );
    await interaction.editReply({ components: [lostC, retryRow], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    return;
  }

  game.step++;

  if (game.step === sequence.length) {
    // Win!
    clearTimeout(game.timer);
    activeGames.delete(userId);

    const winC = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        lang === 'en_US'
          ? '## Verified!\nYou completed Simon Says! Welcome to the server!'
          : '## Verificado!\nVocê completou o Simon Says! Bem-vindo ao servidor!'
      ));
    await interaction.editReply({ components: [winC], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    await grantVerification(interaction);
    return;
  }

  const { container: c, btnRow } = buildGameUI(game, lang);
  await interaction.editReply({ components: [c, btnRow], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
}

async function retryGame(interaction, lang) {
  if (activeGames.has(interaction.user.id)) clearTimeout(activeGames.get(interaction.user.id).timer);
  await startGame(interaction, lang);
}

async function grantVerification(interaction) {
  const { guild, member } = interaction;
  if (!guild || !member) return;
  const { getGuildConfig } = require('../../utils/database');
  const config = getGuildConfig(guild.id);
  if (config.verification.unverifiedRoleId) await member.roles.remove(config.verification.unverifiedRoleId).catch(() => {});
  if (config.verification.memberRoleId) await member.roles.add(config.verification.memberRoleId).catch(() => {});
  const logger = require('../logs/logger');
  await logger.logVerificationSuccess(guild, config, interaction.user, 'Simon Says', 1);
}

function getActiveGame(userId) { return activeGames.get(userId); }

module.exports = { startGame, handlePress, retryGame, getActiveGame };
