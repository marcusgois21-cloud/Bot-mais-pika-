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
const { e, CUSTOM_EMOJIS } = require('../../utils/emojis');
const { VERIFICATION } = require('../../config');

// ─────────────────────────────────────────────
// Game state: userId → { board, timer, attempts, interaction }
// ─────────────────────────────────────────────
const activeGames = new Map();

const EMPTY = '';
const PLAYER = 'X';
const BOT = 'O';

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

// ─────────────────────────────────────────────
// Game logic
// ─────────────────────────────────────────────

function checkWinner(board, mark) {
  return WIN_COMBOS.some(([a, b, c]) =>
    board[a] === mark && board[b] === mark && board[c] === mark
  );
}

function isBoardFull(board) {
  return board.every(cell => cell !== EMPTY);
}

/**
 * Bot AI: programmed to mostly lose.
 * - 75% chance of a purely random move
 * - 25% chance of blocking the player (but never seeks to win)
 * - Never plays the winning move for itself intentionally
 */
function getBotMove(board) {
  const available = board.map((v, i) => v === EMPTY ? i : -1).filter(i => i !== -1);
  if (available.length === 0) return -1;

  // Filter out moves that would make bot win
  const nonWinningMoves = available.filter(pos => {
    const test = [...board];
    test[pos] = BOT;
    return !checkWinner(test, BOT);
  });

  const movesPool = nonWinningMoves.length > 0 ? nonWinningMoves : available;

  // 25% chance to try blocking the player
  if (Math.random() < 0.25) {
    for (const pos of movesPool) {
      const test = [...board];
      test[pos] = PLAYER;
      if (checkWinner(test, PLAYER)) {
        return pos; // block
      }
    }
  }

  // Random move from the pool
  return movesPool[Math.floor(Math.random() * movesPool.length)];
}

// ─────────────────────────────────────────────
// UI builders
// ─────────────────────────────────────────────

function buildBoard(board, disabled = false) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const actionRow = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = board[idx];
      const btn = new ButtonBuilder()
        .setCustomId(`ttt_cell_${idx}`)
        .setStyle(
          cell === PLAYER ? ButtonStyle.Danger :
          cell === BOT    ? ButtonStyle.Primary :
                            ButtonStyle.Secondary
        )
        .setDisabled(disabled || cell !== EMPTY);

      // Use custom emojis for X, O and empty
      if (cell === PLAYER) {
        btn.setEmoji({ name: e(CUSTOM_EMOJIS.gameX) });
      } else if (cell === BOT) {
        btn.setEmoji({ name: e(CUSTOM_EMOJIS.gameO) });
      } else {
        btn.setLabel('\u200b'); // zero-width space for empty button
      }

      actionRow.addComponents(btn);
    }
    rows.push(actionRow);
  }
  return rows;
}

function buildGameMessage(game, lang, statusKey, extraVars = {}) {
  const timeLeft = Math.max(0, Math.floor((game.expiresAt - Date.now()) / 1000));
  const statusText = t(`verification.tictactoe.${statusKey}`, lang, extraVars);
  const timerText = t('verification.tictactoe.timeLeft', lang, { seconds: timeLeft });

  const c = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t('verification.tictactoe.title', lang)))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${e(CUSTOM_EMOJIS.loading)} ${timerText}`));

  return { container: c, boardRows: buildBoard(game.board) };
}

function buildResultMessage(won, lang, attempts) {
  const key = won ? 'won' : 'lost';
  const content = t(`verification.tictactoe.${key}`, lang);

  const c = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  const retryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ttt_retry')
      .setLabel(t('verification.tictactoe.tryAgain', lang))
      .setStyle(ButtonStyle.Primary),
  );

  if (!won && attempts >= VERIFICATION.MAX_DEFEATS_BEFORE_SUGGEST) {
    retryRow.addComponents(
      new ButtonBuilder()
        .setCustomId('verify_method_fruits')
        .setLabel(t('verification.tictactoe.tryFruits', lang))
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return { container: c, retryRow: won ? null : retryRow };
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Starts a new Tic-Tac-Toe game for a user.
 * @param {Interaction} interaction
 * @param {string} lang
 * @param {number} [attempts=0]
 */
async function startGame(interaction, lang, attempts = 0) {
  const userId = interaction.user.id;

  // Clear any existing game
  if (activeGames.has(userId)) {
    clearTimeout(activeGames.get(userId).timer);
    activeGames.delete(userId);
  }

  const board = Array(9).fill(EMPTY);
  const expiresAt = Date.now() + VERIFICATION.TICTACTOE_TIMEOUT_MS;

  const game = { board, expiresAt, attempts, lang, interaction };
  activeGames.set(userId, game);

  // Build initial message
  const { container: c, boardRows } = buildGameMessage(game, lang, 'yourTurn');
  const flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

  const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
  await interaction[method]({
    components: [c, ...boardRows],
    flags,
  });

  // Set game timeout
  game.timer = setTimeout(async () => {
    activeGames.delete(userId);
    try {
      const timeoutC = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(t('verification.tictactoe.timeout', lang)));
      const retryRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ttt_retry').setLabel(t('verification.tictactoe.tryAgain', lang)).setStyle(ButtonStyle.Primary)
      );
      await interaction.editReply({
        components: [timeoutC, retryRow],
        flags,
      });
    } catch { /* interaction expired */ }
  }, VERIFICATION.TICTACTOE_TIMEOUT_MS);
}

/**
 * Processes a player's move.
 * @param {Interaction} interaction - Button interaction
 * @param {number} cellIndex
 */
async function handleMove(interaction, cellIndex) {
  const userId = interaction.user.id;
  const game = activeGames.get(userId);

  if (!game) {
    await interaction.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(t('general.error', game?.lang ?? 'pt_BR'))
        )
      ],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  const { board, lang } = game;

  // Validate move
  if (board[cellIndex] !== EMPTY) return;

  await interaction.deferUpdate();

  // Player move
  board[cellIndex] = PLAYER;

  // Check player win
  if (checkWinner(board, PLAYER)) {
    clearTimeout(game.timer);
    activeGames.delete(userId);

    const { container: c } = buildResultMessage(true, lang, game.attempts);
    const disabledBoard = buildBoard(board, true);
    await interaction.editReply({
      components: [c, ...disabledBoard],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });

    // Grant verification
    await grantVerification(interaction, game);
    return;
  }

  // Check draw
  if (isBoardFull(board)) {
    clearTimeout(game.timer);
    activeGames.delete(userId);
    const drawC = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(t('verification.tictactoe.draw', lang)));
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ttt_retry').setLabel(t('verification.tictactoe.tryAgain', lang)).setStyle(ButtonStyle.Primary)
    );
    await interaction.editReply({
      components: [drawC, retryRow],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  // Show "bot thinking" state
  const { container: thinkC, boardRows: thinkBoard } = buildGameMessage(game, lang, 'botTurn');
  await interaction.editReply({
    components: [thinkC, ...thinkBoard],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });

  // Delay bot move for realism
  await new Promise(r => setTimeout(r, VERIFICATION.BOT_MOVE_DELAY_MS));

  // Bot move
  const botCell = getBotMove(board);
  if (botCell !== -1) {
    board[botCell] = BOT;
  }

  // Check bot win
  if (checkWinner(board, BOT)) {
    game.attempts++;
    clearTimeout(game.timer);
    activeGames.delete(userId);

    const { container: lostC, retryRow } = buildResultMessage(false, lang, game.attempts);
    const disabledBoard = buildBoard(board, true);
    await interaction.editReply({
      components: [lostC, ...disabledBoard, ...(retryRow ? [retryRow] : [])],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  // Check draw after bot move
  if (isBoardFull(board)) {
    clearTimeout(game.timer);
    activeGames.delete(userId);
    const drawC = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(t('verification.tictactoe.draw', lang)));
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ttt_retry').setLabel(t('verification.tictactoe.tryAgain', lang)).setStyle(ButtonStyle.Primary)
    );
    await interaction.editReply({
      components: [drawC, retryRow],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  // Continue game
  const { container: continueC, boardRows } = buildGameMessage(game, lang, 'yourTurn');
  await interaction.editReply({
    components: [continueC, ...boardRows],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

/**
 * Retries a game (starts fresh).
 * @param {Interaction} interaction
 * @param {string} lang
 */
async function retryGame(interaction, lang) {
  const userId = interaction.user.id;
  const prevGame = activeGames.get(userId);
  const attempts = prevGame ? prevGame.attempts : 0;
  if (prevGame) clearTimeout(prevGame.timer);
  await startGame(interaction, lang, attempts);
}

/**
 * Grants the verified role to a member.
 * @param {Interaction} interaction
 * @param {object} game
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
    console.error('[TicTacToe] Failed to assign roles:', err.message);
  }

  // Log
  const logger = require('../logs/logger');
  await logger.logVerificationSuccess(guild, config, interaction.user, 'Jogo da Velha / Tic-Tac-Toe', game.attempts + 1);
}

function getActiveGame(userId) {
  return activeGames.get(userId);
}

module.exports = { startGame, handleMove, retryGame, getActiveGame };
