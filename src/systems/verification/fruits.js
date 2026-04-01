'use strict';

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const { t } = require('../../utils/i18n');
const { getFruitsList, e, CUSTOM_EMOJIS } = require('../../utils/emojis');
const { shuffle } = require('../../utils/helpers');

// ─────────────────────────────────────────────
// Game state: userId → FruitsGame
// ─────────────────────────────────────────────
const activeGames = new Map();

const CORRECT_COUNT = 3;
const MAX_ERRORS = 1;

// ─────────────────────────────────────────────
// Game generation
// ─────────────────────────────────────────────

function generateGame(gridSize = 9) {
  const allFruits = getFruitsList();
  const shuffled = shuffle(allFruits);

  // Pick the target fruit (the one that will appear 3 times)
  const target = shuffled[0];

  // Pick CORRECT_COUNT positions for the target fruit
  const positions = Array.from({ length: gridSize }, (_, i) => i);
  const correctPositions = shuffle(positions).slice(0, CORRECT_COUNT);

  // Fill the grid with random distractor fruits (excluding the target)
  const distractors = shuffled.slice(1);

  const grid = [];
  let distractorIndex = 0;

  for (let i = 0; i < gridSize; i++) {
    if (correctPositions.includes(i)) {
      grid.push({ ...target, isCorrect: true, index: i, clicked: false });
    } else {
      const distractor = distractors[distractorIndex % distractors.length];
      distractorIndex++;
      grid.push({ ...distractor, isCorrect: false, index: i, clicked: false });
    }
  }

  return { target, grid, errors: 0, found: 0, gridSize };
}

// ─────────────────────────────────────────────
// UI builders
// ─────────────────────────────────────────────

function buildGridRows(game, disabled = false) {
  const { grid } = game;
  const rows = [];

  // Up to 5 buttons per action row
  const rowSize = 3; // 3x3 or adjustable
  const gridRows = Math.ceil(grid.length / rowSize);

  for (let r = 0; r < gridRows; r++) {
    const actionRow = new ActionRowBuilder();
    for (let c = 0; c < rowSize; c++) {
      const idx = r * rowSize + c;
      if (idx >= grid.length) break;

      const cell = grid[idx];
      let style = ButtonStyle.Secondary;

      if (cell.clicked) {
        style = cell.isCorrect ? ButtonStyle.Success : ButtonStyle.Danger;
      }

      const btn = new ButtonBuilder()
        .setCustomId(`fruit_${idx}`)
        .setStyle(style)
        .setDisabled(disabled || cell.clicked);

      // Set fruit emoji as button emoji
      if (cell.emojiData) {
        try {
          btn.setEmoji(cell.emojiData);
        } catch {
          btn.setLabel(cell.display || cell.label);
        }
      } else {
        btn.setLabel(cell.display || cell.label);
      }

      actionRow.addComponents(btn);
    }
    rows.push(actionRow);
  }

  return rows;
}

function buildGameContainer(game, lang, statusKey = null, statusVars = {}) {
  const targetDisplay = game.target.display || game.target.label;
  const title = t('verification.fruits.title', lang, { target: targetDisplay });
  const found = t('verification.fruits.found', lang, { found: game.found, total: CORRECT_COUNT });

  const c = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(found));

  if (statusKey) {
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(t(`verification.fruits.${statusKey}`, lang, statusVars))
    );
  }

  return c;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Starts a new Fruits game.
 * @param {Interaction} interaction
 * @param {string} lang
 * @param {number} gridSize - 9 to 12
 */
async function startGame(interaction, lang, gridSize = 9) {
  const userId = interaction.user.id;

  if (activeGames.has(userId)) {
    activeGames.delete(userId);
  }

  const game = generateGame(gridSize);
  activeGames.set(userId, { ...game, lang });

  const container = buildGameContainer(game, lang);
  const gridRows = buildGridRows(game);
  const flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

  const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
  await interaction[method]({
    components: [container, ...gridRows],
    flags,
  });
}

/**
 * Handles a fruit button click.
 * @param {Interaction} interaction
 * @param {number} cellIndex
 */
async function handleClick(interaction, cellIndex) {
  const userId = interaction.user.id;
  const game = activeGames.get(userId);

  if (!game) {
    await interaction.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(t('general.error', 'pt_BR'))
        )
      ],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferUpdate();

  const { lang, grid } = game;
  const cell = grid[cellIndex];

  if (!cell || cell.clicked) return;

  cell.clicked = true;

  if (cell.isCorrect) {
    game.found++;

    // Check win
    if (game.found === CORRECT_COUNT) {
      activeGames.delete(userId);

      const winC = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(t('verification.fruits.won', lang)));
      const disabledGrid = buildGridRows(game, true);

      await interaction.editReply({
        components: [winC, ...disabledGrid],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });

      await grantVerification(interaction, game);
      return;
    }

    const container = buildGameContainer(game, lang, 'correct');
    const gridRows = buildGridRows(game);
    await interaction.editReply({
      components: [container, ...gridRows],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });

  } else {
    game.errors++;

    if (game.errors > MAX_ERRORS) {
      // Lost — restart
      activeGames.delete(userId);

      const lostC = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(t('verification.fruits.lost', lang)));
      const retryRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fruit_retry')
          .setLabel(t('verification.fruits.restart', lang))
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('verify_method_tictactoe')
          .setLabel(t('verification.fruits.tryTictactoe', lang))
          .setStyle(ButtonStyle.Secondary),
      );
      const disabledGrid = buildGridRows(game, true);

      await interaction.editReply({
        components: [lostC, ...disabledGrid, retryRow],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
      return;
    }

    const remaining = MAX_ERRORS - game.errors + 1;
    const container = buildGameContainer(game, lang, 'wrong', { remaining });
    const gridRows = buildGridRows(game);
    await interaction.editReply({
      components: [container, ...gridRows],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  }
}

/**
 * Retries the game with a fresh grid.
 * @param {Interaction} interaction
 * @param {string} lang
 */
async function retryGame(interaction, lang) {
  await startGame(interaction, lang);
}

/**
 * Grants verification roles.
 */
async function grantVerification(interaction, game) {
  const { guild, member } = interaction;
  if (!guild || !member) return;

  const { getGuildConfig } = require('../../utils/database');
  const config = getGuildConfig(guild.id);

  try {
    if (config.verification.unverifiedRoleId) {
      await member.roles.remove(config.verification.unverifiedRoleId).catch(() => {});
    }
    if (config.verification.memberRoleId) {
      await member.roles.add(config.verification.memberRoleId).catch(() => {});
    }
  } catch (err) {
    console.error('[Fruits] Failed to assign roles:', err.message);
  }

  const logger = require('../logs/logger');
  await logger.logVerificationSuccess(guild, config, interaction.user, 'Jogo das Frutas / Fruit Game', 1);
}

function getActiveGame(userId) {
  return activeGames.get(userId);
}

module.exports = { startGame, handleClick, retryGame, getActiveGame };
