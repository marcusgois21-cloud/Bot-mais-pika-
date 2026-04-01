'use strict';

const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuildConfig } = require('../../utils/database');
const { t } = require('../../utils/i18n');

// ─────────────────────────────────────────────
// Raid response
// ─────────────────────────────────────────────

/**
 * Handles raid detection based on security mode.
 * @param {Guild} guild
 * @param {object} config
 * @returns {string} - Description of the action taken
 */
async function handleRaid(guild, config) {
  const lang = config.language;
  const mode = config.security.mode;

  if (mode === 'manual') {
    return t('security.actions.warned', lang);
  }

  if (mode === 'auto') {
    // Disable direct messages and invites temporarily
    try {
      await guild.setVerificationLevel(4); // Highest verification
    } catch { /* missing perms */ }
    return t('security.actions.lockdownOn', lang);
  }

  if (mode === 'maximum') {
    // Full lockdown + disable invites
    await activateLockdown(guild, config, 'Raid detectado / Raid detected');
    try {
      const invites = await guild.invites.fetch();
      await Promise.allSettled(invites.map(inv => inv.delete('Raid detected')));
    } catch { /* missing perms */ }
    return t('security.actions.lockdownOn', lang);
  }

  // custom mode
  const aggr = config.security.customConfig?.aggressiveness ?? 5;
  if (aggr >= 7) {
    await activateLockdown(guild, config, 'Raid detectado / Raid detected');
    return t('security.actions.lockdownOn', lang);
  }

  return t('security.actions.warned', lang);
}

// ─────────────────────────────────────────────
// Spam response
// ─────────────────────────────────────────────

/**
 * @param {Message} message
 * @param {object} config
 * @returns {boolean} - Whether an action was taken
 */
async function handleSpam(message, config) {
  const mode = config.security.mode;

  if (mode === 'manual') return false;

  // Delete the spam message
  try {
    await message.delete();
  } catch { /* missing perms */ }

  if (mode === 'maximum') {
    // Timeout the user for 5 minutes
    try {
      await message.member?.timeout(5 * 60_000, 'Spam detected by security engine');
    } catch { /* missing perms */ }
  }

  return true;
}

// ─────────────────────────────────────────────
// Suspicious link response
// ─────────────────────────────────────────────

/**
 * @param {Message} message
 * @param {object} config
 */
async function handleSuspiciousLink(message, config) {
  try {
    await message.delete();
  } catch { /* missing perms */ }

  if (config.security.mode === 'maximum') {
    try {
      await message.member?.timeout(10 * 60_000, 'Suspicious link detected');
    } catch { /* missing perms */ }
  }
}

// ─────────────────────────────────────────────
// Mention spam response
// ─────────────────────────────────────────────

/**
 * @param {Message} message
 * @param {object} config
 */
async function handleMentionSpam(message, config) {
  try {
    await message.delete();
  } catch { /* missing perms */ }

  if (config.security.mode === 'maximum') {
    try {
      await message.member?.timeout(15 * 60_000, 'Mention spam detected');
    } catch { /* missing perms */ }
  }
}

// ─────────────────────────────────────────────
// Lockdown
// ─────────────────────────────────────────────

/**
 * Activates server lockdown — locks all non-admin channels.
 * @param {Guild} guild
 * @param {object} config
 * @param {string} reason
 */
async function activateLockdown(guild, config, reason = 'Security lockdown') {
  const everyoneRole = guild.roles.everyone;

  const channels = guild.channels.cache.filter(
    ch => ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement
  );

  await Promise.allSettled(
    channels.map(ch =>
      ch.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false,
        AddReactions: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      }, { reason })
    )
  );

  // Disable invites in maximum mode
  if (config.security.mode === 'maximum') {
    try {
      const invites = await guild.invites.fetch();
      await Promise.allSettled(invites.map(inv => inv.delete(reason)));
    } catch { /* missing perms */ }
  }

  updateGuildConfig(guild.id, {
    lockdown: {
      active: true,
      reason,
      activatedAt: Date.now(),
      activatedBy: guild.client?.user?.id ?? null,
    },
  });
}

/**
 * Deactivates server lockdown — restores send permissions.
 * @param {Guild} guild
 * @param {object} config
 */
async function deactivateLockdown(guild, config) {
  const everyoneRole = guild.roles.everyone;

  const channels = guild.channels.cache.filter(
    ch => ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement
  );

  await Promise.allSettled(
    channels.map(ch =>
      ch.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null,   // reset to inherit
        AddReactions: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
      })
    )
  );

  updateGuildConfig(guild.id, {
    lockdown: {
      active: false,
      reason: null,
      activatedAt: null,
      activatedBy: null,
    },
  });
}

module.exports = {
  handleRaid,
  handleSpam,
  handleSuspiciousLink,
  handleMentionSpam,
  activateLockdown,
  deactivateLockdown,
};
