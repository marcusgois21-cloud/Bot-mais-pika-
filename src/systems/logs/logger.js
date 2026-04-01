'use strict';

const { buildLogContainer } = require('../../builders/uiBuilder');
const { t } = require('../../utils/i18n');
const { accountAge } = require('../../utils/helpers');

/**
 * Sends a log entry to the configured logs channel.
 * @param {Guild} guild
 * @param {object} config
 * @param {string} content - Pre-formatted log string
 */
async function sendLog(guild, config, content) {
  if (!config.logs.channelId) return;

  const channel = guild.channels.cache.get(config.logs.channelId);
  if (!channel) return;

  try {
    await channel.send(buildLogContainer(content));
  } catch (err) {
    console.error(`[Logger] Failed to send log:`, err.message);
  }
}

// ─────────────────────────────────────────────
// Log event helpers
// ─────────────────────────────────────────────

async function logMemberJoin(guild, config, member) {
  const lang = config.language;
  const content = t('logs.memberJoin', lang, {
    user: `${member.user}`,
    id: member.id,
    age: accountAge(member.user.createdAt, lang),
  });
  await sendLog(guild, config, content);
}

async function logMemberLeave(guild, config, member) {
  const lang = config.language;
  const content = t('logs.memberLeave', lang, {
    user: member.user?.tag ?? member.id,
    id: member.id,
  });
  await sendLog(guild, config, content);
}

async function logVerificationStart(guild, config, user, method) {
  const lang = config.language;
  const content = t('logs.verificationStart', lang, {
    user: `${user}`,
    method,
  });
  await sendLog(guild, config, content);
}

async function logVerificationSuccess(guild, config, user, method, attempts) {
  const lang = config.language;
  const content = t('logs.verificationSuccess', lang, {
    user: `${user}`,
    method,
    attempts,
  });
  await sendLog(guild, config, content);
}

async function logVerificationFail(guild, config, user, attempts) {
  const lang = config.language;
  const content = t('logs.verificationFail', lang, {
    user: `${user}`,
    attempts,
  });
  await sendLog(guild, config, content);
}

async function logSecurityAction(guild, config, action, userStr, channelStr) {
  const lang = config.language;
  const content = t('logs.securityAction', lang, {
    action,
    user: userStr,
    channel: channelStr ?? 'N/A',
  });
  await sendLog(guild, config, content);
}

async function logLockdownOn(guild, config, reason, user) {
  const lang = config.language;
  const content = t('logs.lockdownOn', lang, {
    reason,
    user: `${user}`,
  });
  await sendLog(guild, config, content);
}

async function logLockdownOff(guild, config, user) {
  const lang = config.language;
  const content = t('logs.lockdownOff', lang, {
    user: `${user}`,
  });
  await sendLog(guild, config, content);
}

async function logCommandUsed(guild, config, commandName, user) {
  const lang = config.language;
  const content = t('logs.commandUsed', lang, {
    command: commandName,
    user: `${user}`,
  });
  await sendLog(guild, config, content);
}

async function logModeChanged(guild, config, mode, user) {
  const lang = config.language;
  const content = t('logs.modeChanged', lang, {
    mode: t(`security.modes.${mode}`, lang),
    user: `${user}`,
  });
  await sendLog(guild, config, content);
}

async function logConfigChanged(guild, config, setting, user) {
  const lang = config.language;
  const content = t('logs.configChanged', lang, {
    setting,
    user: `${user}`,
  });
  await sendLog(guild, config, content);
}

module.exports = {
  sendLog,
  logMemberJoin,
  logMemberLeave,
  logVerificationStart,
  logVerificationSuccess,
  logVerificationFail,
  logSecurityAction,
  logLockdownOn,
  logLockdownOff,
  logCommandUsed,
  logModeChanged,
  logConfigChanged,
};
