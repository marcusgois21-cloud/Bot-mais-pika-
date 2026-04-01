'use strict';

const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { dmAdmins } = require('../emergency/index');

/**
 * Creates a honeypot channel that is invisible to regular members.
 * Any non-bot, non-admin access triggers an immediate ban.
 *
 * @param {Guild} guild
 * @param {string} channelName
 * @returns {GuildChannel|null}
 */
async function createHoneypot(guild, channelName = '🍯│honeypot') {
  const config = getGuildConfig(guild.id);
  const everyoneRole = guild.roles.everyone;

  let channel = null;
  try {
    channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: 'Security honeypot — do not access',
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });
  } catch (err) {
    console.error('[Honeypot] Failed to create channel:', err.message);
    return null;
  }

  const channelIds = [...(config.honeypot?.channelIds ?? []), channel.id];
  updateGuildConfig(guild.id, { honeypot: { enabled: true, channelIds } });

  return channel;
}

/**
 * Removes a honeypot channel by ID.
 * @param {Guild} guild
 * @param {string} channelId
 */
async function removeHoneypot(guild, channelId) {
  const config = getGuildConfig(guild.id);
  const channelIds = (config.honeypot?.channelIds ?? []).filter(id => id !== channelId);

  try {
    const ch = guild.channels.cache.get(channelId);
    if (ch) await ch.delete('Honeypot removed');
  } catch { /* already deleted */ }

  updateGuildConfig(guild.id, {
    honeypot: { channelIds, enabled: channelIds.length > 0 },
  });
}

/**
 * Checks if a message was sent in a honeypot channel and acts accordingly.
 * @param {Message} message
 */
async function checkHoneypot(message) {
  if (!message.guild || message.author.bot) return;

  const config = getGuildConfig(message.guild.id);
  if (!config.honeypot?.enabled) return;

  const isHoneypot = config.honeypot.channelIds?.includes(message.channelId);
  if (!isHoneypot) return;

  const member = message.member;
  if (!member) return;

  // Ignore admins (they may test the channel)
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return;

  const user = message.author;
  const lang = config.language;

  // Delete the message
  await message.delete().catch(() => {});

  // Ban the user
  try {
    await message.guild.members.ban(user.id, {
      reason: 'Honeypot triggered — automated security ban',
      deleteMessageSeconds: 86400,
    });
  } catch (err) {
    console.error('[Honeypot] Ban failed:', err.message);
  }

  // Alert admins via DM
  await dmAdmins(message.guild, config,
    lang === 'en_US' ? 'Honeypot Triggered!' : 'Honeypot Ativado!',
    lang === 'en_US'
      ? `User **${user.tag}** (\`${user.id}\`) accessed a honeypot channel and was automatically banned.`
      : `Usuário **${user.tag}** (\`${user.id}\`) acessou um canal honeypot e foi banido automaticamente.`
  );

  // Alert channel
  const alertChannelId = config.alerts.channelId ?? config.logs.channelId;
  if (alertChannelId) {
    const alertChannel = message.guild.channels.cache.get(alertChannelId);
    if (alertChannel) {
      const { buildAlertContainer } = require('../../builders/uiBuilder');
      const title = lang === 'en_US' ? '🍯 Honeypot Triggered' : '🍯 Honeypot Ativado';
      const body = lang === 'en_US'
        ? `**${user.tag}** accessed a honeypot channel and was automatically banned.`
        : `**${user.tag}** acessou um canal honeypot e foi banido automaticamente.`;
      await alertChannel.send(buildAlertContainer(title, body)).catch(() => {});
    }
  }
}

/**
 * Checks if a new channel creation (by member) is a honeypot attempt.
 * This is to detect when an attacker creates channels to confuse admins.
 */
function isHoneypotChannel(guild, channelId) {
  const config = getGuildConfig(guild.id);
  return config.honeypot?.channelIds?.includes(channelId) ?? false;
}

module.exports = { createHoneypot, removeHoneypot, checkHoneypot, isHoneypotChannel };
