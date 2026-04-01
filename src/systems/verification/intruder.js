'use strict';

const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, MessageFlags,
} = require('discord.js');
const { shuffle } = require('../../utils/helpers');

const activeGames = new Map();

// Emoji pairs: [normal, intruder]
const PAIRS = [
  ['🐶', '🐱'], ['🍎', '🍊'], ['🌟', '⭐'], ['🔵', '🟣'],
  ['🌹', '🌷'], ['🚗', '🚕'], ['🦁', '🐯'], ['🍕', '🍔'],
  ['🎵', '🎶'], ['🏠', '🏡'], ['🐸', '🦎'], ['🌙', '☀️'],
];

function generateGrid() {
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const [normal, intruder] = pair;

  // Grid of 9: 8 normal + 1 intruder at random position
  const intruderPos = Math.floor(Math.random() * 9);
  const grid = Array.from({ length: 9 }, (_, i) => ({
    emoji: i === intruderPos ? intruder : normal,
    isIntruder: i === intruderPos,
    index: i,
  }));

  return { grid, normal, intruder };
}

/**
 * Starts an Intruder game.
 * @param {Interaction} interaction
 * @param {string} lang
 */
async function startGame(interaction, lang) {
  const userId = interaction.user.id;

  const { grid, normal, intruder } = generateGrid();
  activeGames.set(userId, { grid, lang });

  const title = lang === 'en_US' ? '## Find the Intruder!' : '## Encontre o Intruso!';
  const desc = lang === 'en_US'
    ? `One of these is different from the rest. Click the **odd one out**!\n\n-# All others are ${normal}`
    : `Um desses é diferente dos outros. Clique no que **não pertence ao grupo**!\n\n-# Todos os outros são ${normal}`;

  const c = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));

  // 3×3 grid of buttons
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const actionRow = new ActionRowBuilder();
    for (let c2 = 0; c2 < 3; c2++) {
      const idx = r * 3 + c2;
      const cell = grid[idx];
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`intruder_${idx}`)
          .setEmoji({ name: cell.emoji })
          .setLabel('\u200b')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    rows.push(actionRow);
  }

  const flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
  const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
  await interaction[method]({ components: [c, ...rows], flags });
}

/**
 * Handles a grid button press.
 * @param {Interaction} interaction
 * @param {number} cellIndex
 */
async function handleClick(interaction, cellIndex) {
  const userId = interaction.user.id;
  const game = activeGames.get(userId);
  if (!game) return;

  await interaction.deferUpdate();
  activeGames.delete(userId);

  const { grid, lang } = game;
  const cell = grid[cellIndex];
  const flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

  // Build disabled grid showing result
  const resultRows = [];
  for (let r = 0; r < 3; r++) {
    const actionRow = new ActionRowBuilder();
    for (let c2 = 0; c2 < 3; c2++) {
      const idx = r * 3 + c2;
      const g = grid[idx];
      let style = ButtonStyle.Secondary;
      if (g.isIntruder) style = ButtonStyle.Success;
      if (idx === cellIndex && !g.isIntruder) style = ButtonStyle.Danger;
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`intruder_result_${idx}`)
          .setEmoji({ name: g.emoji })
          .setLabel('\u200b')
          .setStyle(style)
          .setDisabled(true)
      );
    }
    resultRows.push(actionRow);
  }

  if (cell.isIntruder) {
    const winC = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        lang === 'en_US'
          ? '## Correct! 🎉\nYou found the intruder! Welcome to the server!'
          : '## Correto! 🎉\nVocê encontrou o intruso! Bem-vindo ao servidor!'
      ));
    await interaction.editReply({ components: [winC, ...resultRows], flags });
    await grantVerification(interaction);
  } else {
    const lostC = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        lang === 'en_US'
          ? `## Wrong! ❌\nThat wasn't the intruder. The green one was the odd one out!`
          : `## Errado! ❌\nEsse não era o intruso. O verde era o diferente!`
      ));
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('intruder_retry').setLabel(lang === 'en_US' ? 'Try Again' : 'Tentar Novamente').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('verify_method_tictactoe').setLabel(lang === 'en_US' ? 'Try Tic-Tac-Toe' : 'Tentar Jogo da Velha').setStyle(ButtonStyle.Secondary),
    );
    await interaction.editReply({ components: [lostC, ...resultRows, retryRow], flags });
  }
}

async function retryGame(interaction, lang) {
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
  await logger.logVerificationSuccess(guild, config, interaction.user, 'Encontre o Intruso / Find the Intruder', 1);
}

module.exports = { startGame, handleClick, retryGame };
