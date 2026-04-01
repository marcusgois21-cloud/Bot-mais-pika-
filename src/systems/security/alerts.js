'use strict';

const { buildAlertContainer } = require('../../builders/uiBuilder');
const { t } = require('../../utils/i18n');

/**
 * Sends a security alert to the configured alerts/logs channel.
 *
 * @param {Guild} guild
 * @param {object} config
 * @param {string} lang
 * @param {string} alertKey - Key in security.alerts (e.g. 'raidDetected')
 * @param {object} vars - Template variables
 */
async function sendAlert(guild, config, lang, alertKey, vars = {}) {
  const channelId = config.alerts.channelId ?? config.logs.channelId;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  const title = t('security.alerts.title', lang);
  const body = t(`security.alerts.${alertKey}`, lang, vars);

  try {
    await channel.send(buildAlertContainer(title, body));
  } catch (err) {
    console.error(`[Alerts] Failed to send alert to ${channelId}:`, err.message);
  }
}

/**
 * Sends an automatic lockdown notification.
 * @param {Guild} guild
 * @param {object} config
 * @param {string} lang
 * @param {string} reason
 */
async function sendLockdownAlert(guild, config, lang, reason) {
  await sendAlert(guild, config, lang, 'lockdownAuto', { reason });
}

module.exports = { sendAlert, sendLockdownAlert };
