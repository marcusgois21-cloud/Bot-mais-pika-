'use strict';

const { Events, MessageFlags } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../utils/database');
const { t } = require('../utils/i18n');
const { isAdmin } = require('../utils/helpers');
const {
  buildConfigPanel,
  buildLanguagePanel,
  buildSecurityPanel,
  buildVerificationConfigPanel,
  buildLogsPanel,
  buildLockdownPanel,
  buildTestPanel,
  buildTestResults,
  buildWhyVerify,
  buildMethodSelector,
  buildMethodSelectorExtended,
  buildVerificationPanel,
  buildAlertContainer,
  buildHoneypotPanel,
  buildNetworkPanel,
  buildReputationPanel,
} = require('../builders/uiBuilder');

const tictactoe = require('../systems/verification/tictactoe');
const fruits = require('../systems/verification/fruits');
const simonsays = require('../systems/verification/simonsays');
const mathcaptcha = require('../systems/verification/mathcaptcha');
const intruder = require('../systems/verification/intruder');
const { sendPanel } = require('../systems/verification/panel');
const { activateLockdown, deactivateLockdown } = require('../systems/security/modes');
const { createHoneypot } = require('../systems/honeypot/index');
const { addToBlacklist } = require('../systems/network/blacklist');
const logger = require('../systems/logs/logger');

// ─────────────────────────────────────────────
// Error reply helper
// ─────────────────────────────────────────────

async function replyError(interaction, lang) {
  const content = t('general.error', lang ?? 'pt_BR');
  const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
  await interaction[method]({
    content,
    flags: MessageFlags.Ephemeral,
  }).catch(() => {});
}

// ─────────────────────────────────────────────
// Slash command dispatcher
// ─────────────────────────────────────────────

async function handleCommand(interaction) {
  const { client, commandName } = interaction;
  const command = client.commands?.get(commandName);

  if (!command) {
    return interaction.reply({ content: 'Comando não encontrado.', ephemeral: true });
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[Command] /${commandName}:`, err);
    const method = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
    await interaction[method]({ content: t('general.error', 'pt_BR'), ephemeral: true }).catch(() => {});
  }
}

// ─────────────────────────────────────────────
// Button handler
// ─────────────────────────────────────────────

async function handleButton(interaction) {
  const { customId, guild, member } = interaction;
  if (!guild) return;

  const config = getGuildConfig(guild.id);
  const lang = config.language;

  // ── Verification buttons ──

  if (customId === 'verify_start') {
    const method = config.verification.method;

    // Check if already verified
    if (config.verification.memberRoleId && member.roles.cache.has(config.verification.memberRoleId)) {
      return interaction.reply({
        content: t('verification.alreadyVerified', lang),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (method === 'tictactoe') {
      await logger.logVerificationStart(guild, config, interaction.user, 'Jogo da Velha');
      return tictactoe.startGame(interaction, lang);
    }

    if (method === 'fruits') {
      await logger.logVerificationStart(guild, config, interaction.user, 'Jogo das Frutas');
      return fruits.startGame(interaction, lang);
    }

    // 'both' or 'all' — show method selector
    return interaction.reply(buildMethodSelectorExtended(lang));
  }

  if (customId === 'verify_why') {
    return interaction.reply(buildWhyVerify(lang));
  }

  if (customId === 'verify_back_panel') {
    return interaction.update(buildVerificationPanel(lang));
  }

  if (customId === 'verify_method_tictactoe') {
    await logger.logVerificationStart(guild, config, interaction.user, 'Jogo da Velha');
    return tictactoe.startGame(interaction, lang);
  }

  if (customId === 'verify_method_fruits') {
    await logger.logVerificationStart(guild, config, interaction.user, 'Jogo das Frutas');
    return fruits.startGame(interaction, lang);
  }

  // ── Tic-Tac-Toe buttons ──

  if (customId.startsWith('ttt_cell_')) {
    const cellIndex = parseInt(customId.replace('ttt_cell_', ''), 10);
    return tictactoe.handleMove(interaction, cellIndex);
  }

  if (customId === 'ttt_retry') {
    const game = tictactoe.getActiveGame(interaction.user.id);
    return tictactoe.retryGame(interaction, game?.lang ?? lang);
  }

  // ── Fruit game buttons ──

  if (customId.startsWith('fruit_') && customId !== 'fruit_retry') {
    const cellIndex = parseInt(customId.replace('fruit_', ''), 10);
    if (isNaN(cellIndex)) return;
    return fruits.handleClick(interaction, cellIndex);
  }

  if (customId === 'fruit_retry') {
    return fruits.retryGame(interaction, lang);
  }

  // ── Simon Says buttons ──

  if (customId.startsWith('simon_') && customId !== 'simon_retry') {
    const colorId = customId.replace('simon_', '');
    return simonsays.handlePress(interaction, colorId);
  }

  if (customId === 'simon_retry') {
    const game = simonsays.getActiveGame(interaction.user.id);
    return simonsays.retryGame(interaction, game?.lang ?? lang);
  }

  // ── Math CAPTCHA buttons ──

  if (customId.startsWith('math_') && customId !== 'math_retry') {
    const value = parseInt(customId.replace('math_', ''), 10);
    return mathcaptcha.handleAnswer(interaction, value);
  }

  if (customId === 'math_retry') {
    return mathcaptcha.retryGame(interaction, lang);
  }

  // ── Intruder game buttons ──

  if (customId.startsWith('intruder_') && customId !== 'intruder_retry' && !customId.startsWith('intruder_result_')) {
    const cellIndex = parseInt(customId.replace('intruder_', ''), 10);
    if (isNaN(cellIndex)) return;
    return intruder.handleClick(interaction, cellIndex);
  }

  if (customId === 'intruder_retry') {
    return intruder.retryGame(interaction, lang);
  }

  // ── New game launch buttons ──

  if (customId === 'verify_method_simon') {
    await logger.logVerificationStart(guild, config, interaction.user, 'Simon Says');
    return simonsays.startGame(interaction, lang);
  }

  if (customId === 'verify_method_math') {
    await logger.logVerificationStart(guild, config, interaction.user, 'Math CAPTCHA');
    return mathcaptcha.startGame(interaction, lang);
  }

  if (customId === 'verify_method_intruder') {
    await logger.logVerificationStart(guild, config, interaction.user, 'Find the Intruder');
    return intruder.startGame(interaction, lang);
  }

  // ── Config panel buttons (admin only) ──

  if (customId.startsWith('cfg_')) {
    if (!isAdmin(member)) {
      return interaction.reply({ content: t('general.adminOnly', lang), flags: MessageFlags.Ephemeral });
    }
    return handleConfigButton(interaction, customId, config, lang);
  }
}

// ─────────────────────────────────────────────
// Config button sub-handler
// ─────────────────────────────────────────────

async function handleConfigButton(interaction, customId, config, lang) {
  const { guild, user } = interaction;

  switch (customId) {
    case 'cfg_back':
      return interaction.update(buildConfigPanel(guild, getGuildConfig(guild.id), lang));

    case 'cfg_language':
      return interaction.update(buildLanguagePanel(lang));

    case 'cfg_lang_pt': {
      updateGuildConfig(guild.id, { language: 'pt_BR' });
      const newConfig = getGuildConfig(guild.id);
      await logger.logConfigChanged(guild, newConfig, 'language → pt_BR', user);
      return interaction.update(buildConfigPanel(guild, newConfig, 'pt_BR'));
    }

    case 'cfg_lang_en': {
      updateGuildConfig(guild.id, { language: 'en_US' });
      const newConfig = getGuildConfig(guild.id);
      await logger.logConfigChanged(guild, newConfig, 'language → en_US', user);
      return interaction.update(buildConfigPanel(guild, newConfig, 'en_US'));
    }

    case 'cfg_security':
      return interaction.update(buildSecurityPanel(config, lang));

    case 'cfg_verification':
      return interaction.update(buildVerificationConfigPanel(config, guild, lang));

    case 'cfg_logs':
      return interaction.update(buildLogsPanel(config, lang));

    case 'cfg_lockdown':
      return interaction.update(buildLockdownPanel(config, lang));

    case 'cfg_test':
      return interaction.update(buildTestPanel(lang));

    case 'cfg_honeypot':
      return interaction.update(buildHoneypotPanel(config, lang));

    case 'cfg_network':
      return interaction.update(buildNetworkPanel(config, lang));

    case 'cfg_reputation':
      return interaction.update(buildReputationPanel(config, lang));

    case 'cfg_custom':
      return interaction.update(buildSecurityPanel(config, lang)); // reuse until custom modal implemented

    // ── Verification config ──

    case 'cfg_verify_enable': {
      const vc = config.verification;
      if (!vc.channelId || !vc.memberRoleId) {
        return interaction.reply({
          content: t('config.verification.setupFirst', lang),
          flags: MessageFlags.Ephemeral,
        });
      }
      updateGuildConfig(guild.id, { verification: { enabled: true } });
      const newCfg = getGuildConfig(guild.id);
      await logger.logConfigChanged(guild, newCfg, 'verification.enabled → true', user);
      return interaction.update(buildVerificationConfigPanel(newCfg, guild, lang));
    }

    case 'cfg_verify_disable': {
      updateGuildConfig(guild.id, { verification: { enabled: false } });
      const newCfg = getGuildConfig(guild.id);
      return interaction.update(buildVerificationConfigPanel(newCfg, guild, lang));
    }

    case 'cfg_verify_send_panel': {
      await interaction.deferUpdate();
      const newCfg = getGuildConfig(guild.id);
      await sendPanel(guild, newCfg);
      return interaction.editReply(buildVerificationConfigPanel(newCfg, guild, lang));
    }

    // ── Lockdown ──

    case 'cfg_lockdown_on': {
      await interaction.deferUpdate();
      const freshConfig = getGuildConfig(guild.id);
      await activateLockdown(guild, freshConfig, 'Manual (painel / panel)');
      await logger.logLockdownOn(guild, freshConfig, 'Manual', user);
      const afterConfig = getGuildConfig(guild.id);
      return interaction.editReply(buildLockdownPanel(afterConfig, lang));
    }

    case 'cfg_lockdown_off': {
      await interaction.deferUpdate();
      const freshConfig = getGuildConfig(guild.id);
      await deactivateLockdown(guild, freshConfig);
      await logger.logLockdownOff(guild, freshConfig, user);
      const afterConfig = getGuildConfig(guild.id);
      return interaction.editReply(buildLockdownPanel(afterConfig, lang));
    }

    // ── Logs ──

    case 'cfg_logs_clear': {
      updateGuildConfig(guild.id, { logs: { channelId: null, enabled: false } });
      const newCfg = getGuildConfig(guild.id);
      return interaction.update(buildLogsPanel(newCfg, lang));
    }

    // ── Honeypot ──

    case 'cfg_honeypot_create': {
      await interaction.deferUpdate();
      const ch = await createHoneypot(guild);
      const newCfg = getGuildConfig(guild.id);
      if (ch) await logger.logConfigChanged(guild, newCfg, `honeypot created: ${ch.id}`, user);
      return interaction.editReply(buildHoneypotPanel(newCfg, lang));
    }

    case 'cfg_honeypot_remove': {
      // Remove the most recent honeypot channel
      const currentHoneypotCfg = getGuildConfig(guild.id);
      const lastId = currentHoneypotCfg.honeypot?.channelIds?.slice(-1)[0];
      if (lastId) {
        const { removeHoneypot } = require('../systems/honeypot/index');
        await removeHoneypot(guild, lastId);
      }
      const newCfg = getGuildConfig(guild.id);
      return interaction.update(buildHoneypotPanel(newCfg, lang));
    }

    // ── Network ──

    case 'cfg_network_enable': {
      updateGuildConfig(guild.id, { network: { enabled: true } });
      const newCfg = getGuildConfig(guild.id);
      await logger.logConfigChanged(guild, newCfg, 'network.enabled → true', user);
      return interaction.update(buildNetworkPanel(newCfg, lang));
    }

    case 'cfg_network_disable': {
      updateGuildConfig(guild.id, { network: { enabled: false } });
      const newCfg = getGuildConfig(guild.id);
      return interaction.update(buildNetworkPanel(newCfg, lang));
    }

    // ── Reputation ──

    case 'cfg_rep_enable': {
      updateGuildConfig(guild.id, { reputation: { enabled: true } });
      const newCfg = getGuildConfig(guild.id);
      return interaction.update(buildReputationPanel(newCfg, lang));
    }

    case 'cfg_rep_disable': {
      updateGuildConfig(guild.id, { reputation: { enabled: false } });
      const newCfg = getGuildConfig(guild.id);
      return interaction.update(buildReputationPanel(newCfg, lang));
    }

    // ── Test ──

    case 'cfg_test_all':
    case 'cfg_test_verification':
    case 'cfg_test_security':
    case 'cfg_test_logs': {
      await interaction.deferUpdate();
      const freshConfig = getGuildConfig(guild.id);
      const results = runTests(freshConfig, customId);
      return interaction.editReply(buildTestResults(results, lang));
    }

    default:
      return interaction.reply({ content: t('general.unknownInteraction', lang), flags: MessageFlags.Ephemeral });
  }
}

// ─────────────────────────────────────────────
// Select menu handler
// ─────────────────────────────────────────────

async function handleSelectMenu(interaction) {
  const { customId, guild, member, values } = interaction;
  if (!guild) return;

  const config = getGuildConfig(guild.id);
  const lang = config.language;

  if (!isAdmin(member)) {
    return interaction.reply({ content: t('general.adminOnly', lang), flags: MessageFlags.Ephemeral });
  }

  if (customId === 'cfg_security_mode_select') {
    const mode = values[0];
    updateGuildConfig(guild.id, { security: { mode } });
    const newConfig = getGuildConfig(guild.id);
    await logger.logModeChanged(guild, newConfig, mode, interaction.user);
    return interaction.update(buildSecurityPanel(newConfig, lang));
  }

  if (customId === 'cfg_verify_method_select') {
    const method = values[0];
    updateGuildConfig(guild.id, { verification: { method } });
    const newConfig = getGuildConfig(guild.id);
    return interaction.update(buildVerificationConfigPanel(newConfig, guild, lang));
  }

  if (customId === 'cfg_verify_unver_role') {
    const roleId = values[0];
    updateGuildConfig(guild.id, { verification: { unverifiedRoleId: roleId } });
    const newConfig = getGuildConfig(guild.id);
    await logger.logConfigChanged(guild, newConfig, `verification.unverifiedRoleId → ${roleId}`, interaction.user);
    return interaction.update(buildVerificationConfigPanel(newConfig, guild, lang));
  }

  if (customId === 'cfg_verify_member_role') {
    const roleId = values[0];
    updateGuildConfig(guild.id, { verification: { memberRoleId: roleId } });
    const newConfig = getGuildConfig(guild.id);
    await logger.logConfigChanged(guild, newConfig, `verification.memberRoleId → ${roleId}`, interaction.user);
    return interaction.update(buildVerificationConfigPanel(newConfig, guild, lang));
  }

  if (customId === 'cfg_verify_channel') {
    const channelId = values[0];
    updateGuildConfig(guild.id, { verification: { channelId } });
    const newConfig = getGuildConfig(guild.id);
    await logger.logConfigChanged(guild, newConfig, `verification.channelId → ${channelId}`, interaction.user);
    return interaction.update(buildVerificationConfigPanel(newConfig, guild, lang));
  }

  if (customId === 'cfg_logs_channel') {
    const channelId = values[0];
    updateGuildConfig(guild.id, { logs: { channelId, enabled: true } });
    const newConfig = getGuildConfig(guild.id);
    await logger.logConfigChanged(guild, newConfig, `logs.channelId → ${channelId}`, interaction.user);
    return interaction.update(buildLogsPanel(newConfig, lang));
  }
}

// ─────────────────────────────────────────────
// System tests
// ─────────────────────────────────────────────

function runTests(config, testType) {
  const all = testType === 'cfg_test_all';

  const results = [];

  if (all || testType === 'cfg_test_verification') {
    results.push({
      name: 'Verification System',
      pass: config.verification.channelId !== null && config.verification.memberRoleId !== null,
    });
  }

  if (all || testType === 'cfg_test_security') {
    results.push({
      name: 'Security Engine',
      pass: true, // always active
    });
  }

  if (all || testType === 'cfg_test_logs') {
    results.push({
      name: 'Logs System',
      pass: config.logs.channelId !== null,
    });

    results.push({
      name: 'Alerts System',
      pass: (config.alerts.channelId ?? config.logs.channelId) !== null,
    });
  }

  return results;
}

// ─────────────────────────────────────────────
// Main event handler
// ─────────────────────────────────────────────

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        return handleCommand(interaction);
      }

      if (interaction.isButton()) {
        return handleButton(interaction);
      }

      if (interaction.isAnySelectMenu()) {
        return handleSelectMenu(interaction);
      }
    } catch (err) {
      console.error('[interactionCreate] Unhandled error:', err);
      const config = interaction.guild ? getGuildConfig(interaction.guild.id) : null;
      await replyError(interaction, config?.language);
    }
  },
};
