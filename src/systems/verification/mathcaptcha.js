'use strict';

const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, MessageFlags,
} = require('discord.js');
const { shuffle } = require('../../utils/helpers');

const activeGames = new Map();

const OPS = [
  { sym: '+', fn: (a, b) => a + b },
  { sym: '−', fn: (a, b) => a - b },
  { sym: '×', fn: (a, b) => a * b },
];

function generateQuestion() {
  const op = OPS[Math.floor(Math.random() * OPS.length)];
  const a = Math.floor(Math.random() * 10) + 1;
  const b = op.sym === '−'
    ? Math.floor(Math.random() * a) + 1   // avoid negatives
    : Math.floor(Math.random() * 10) + 1;

  const answer = op.fn(a, b);

  // Generate 3 plausible wrong answers
  const wrongSet = new Set();
  while (wrongSet.size < 3) {
    const delta = Math.floor(Math.random() * 6) + 1;
    const wrong = Math.random() < 0.5 ? answer + delta : answer - delta;
    if (wrong !== answer && wrong >= 0) wrongSet.add(wrong);
  }

  const options = shuffle([answer, ...wrongSet]);

  return { question: `${a} ${op.sym} ${b}`, answer, options };
}

/**
 * Starts a Math CAPTCHA game.
 * @param {Interaction} interaction
 * @param {string} lang
 */
async function startGame(interaction, lang) {
  const userId = interaction.user.id;

  const { question, answer, options } = generateQuestion();
  const game = { question, answer, lang };
  activeGames.set(userId, game);

  const title = lang === 'en_US' ? '## Math CAPTCHA' : '## CAPTCHA Matemático';
  const desc = lang === 'en_US'
    ? `Solve the problem to prove you're human!\n\n# ${question} = ?`
    : `Resolva o problema para provar que você é humano!\n\n# ${question} = ?`;

  const c = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));

  const btnRow = new ActionRowBuilder().addComponents(
    options.map(opt =>
      new ButtonBuilder()
        .setCustomId(`math_${opt}`)
        .setLabel(String(opt))
        .setStyle(ButtonStyle.Secondary)
    )
  );

  const flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
  const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
  await interaction[method]({ components: [c, btnRow], flags });
}

/**
 * Handles an answer button press.
 * @param {Interaction} interaction
 * @param {number} chosen
 */
async function handleAnswer(interaction, chosen) {
  const userId = interaction.user.id;
  const game = activeGames.get(userId);
  if (!game) return;

  await interaction.deferUpdate();
  activeGames.delete(userId);

  const { answer, lang } = game;
  const flags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

  if (chosen === answer) {
    const winC = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        lang === 'en_US'
          ? `## Correct! ✅\n**${game.question} = ${answer}** — Verified! Welcome!`
          : `## Correto! ✅\n**${game.question} = ${answer}** — Verificado! Bem-vindo!`
      ));
    await interaction.editReply({ components: [winC], flags });
    await grantVerification(interaction);
  } else {
    const lostC = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        lang === 'en_US'
          ? `## Wrong answer!\nYou answered **${chosen}** but the correct was **${answer}**.\nTry again!`
          : `## Resposta errada!\nVocê respondeu **${chosen}** mas o correto era **${answer}**.\nTente novamente!`
      ));
    const retryRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('math_retry').setLabel(lang === 'en_US' ? 'Try Again' : 'Tentar Novamente').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('verify_method_tictactoe').setLabel(lang === 'en_US' ? 'Try Tic-Tac-Toe' : 'Tentar Jogo da Velha').setStyle(ButtonStyle.Secondary),
    );
    await interaction.editReply({ components: [lostC, retryRow], flags });
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
  await logger.logVerificationSuccess(guild, config, interaction.user, 'CAPTCHA Matemático / Math CAPTCHA', 1);
}

module.exports = { startGame, handleAnswer, retryGame };
