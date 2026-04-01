'use strict';

const { buildVerificationPanel } = require('../../builders/uiBuilder');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');

/**
 * Sends (or re-sends) the verification panel to the configured channel.
 * Deletes the old panel message if it exists.
 *
 * @param {Guild} guild
 * @param {object} [config] - Optional pre-loaded config
 * @returns {Promise<Message|null>}
 */
async function sendPanel(guild, config = null) {
  const cfg = config ?? getGuildConfig(guild.id);
  if (!cfg.verification.channelId) return null;

  const channel = guild.channels.cache.get(cfg.verification.channelId);
  if (!channel) return null;

  // Delete old panel if exists
  if (cfg.verification.panelMessageId) {
    try {
      const oldMsg = await channel.messages.fetch(cfg.verification.panelMessageId).catch(() => null);
      if (oldMsg) await oldMsg.delete().catch(() => {});
    } catch { /* already deleted */ }
  }

  const lang = cfg.language;
  const panelData = buildVerificationPanel(lang);

  try {
    const message = await channel.send(panelData);

    updateGuildConfig(guild.id, {
      verification: { panelMessageId: message.id },
    });

    return message;
  } catch (err) {
    console.error('[Panel] Failed to send verification panel:', err.message);
    return null;
  }
}

/**
 * Sets up channel restrictions for the unverified role.
 * Unverified members can only see and message in the verification channel.
 *
 * @param {Guild} guild
 * @param {object} config
 */
async function setupChannelRestrictions(guild, config) {
  const { verification } = config;
  if (!verification.unverifiedRoleId || !verification.channelId) return;

  const unverRole = guild.roles.cache.get(verification.unverifiedRoleId);
  if (!unverRole) return;

  // Lock unverified role out of all channels by default
  try {
    await guild.roles.everyone.setPermissions(
      guild.roles.everyone.permissions
        .remove(['SendMessages', 'AddReactions', 'CreatePublicThreads'])
    ).catch(() => {});
  } catch { /* missing perms */ }

  // Allow unverified role only in verification channel
  const verifyChannel = guild.channels.cache.get(verification.channelId);
  if (verifyChannel) {
    await verifyChannel.permissionOverwrites.edit(unverRole, {
      ViewChannel: true,
      SendMessages: false,   // Read only — bot handles verification via buttons
      ReadMessageHistory: true,
      AddReactions: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
      EmbedLinks: false,
      AttachFiles: false,
      UseExternalEmojis: false,
      MentionEveryone: false,
    }).catch(() => {});
  }
}

module.exports = { sendPanel, setupChannelRestrictions };
