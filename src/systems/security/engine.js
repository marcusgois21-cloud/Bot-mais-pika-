'use strict';

const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { extractUrls, extractDomain } = require('../../utils/helpers');
const { SECURITY } = require('../../config');
const alerts = require('./alerts');
const modes = require('./modes');

// ─────────────────────────────────────────────
// In-memory rate-limit stores
// ─────────────────────────────────────────────

/** guildId → [timestamp, ...] for join tracking */
const joinLog = new Map();

/** `${guildId}:${userId}` → [timestamp, ...] for spam tracking */
const msgLog = new Map();

/** `${guildId}:${userId}` → [timestamp, ...] for channel creation tracking */
const channelCreationLog = new Map();

/** `${guildId}:${userId}` → [timestamp, ...] for role creation tracking */
const roleCreationLog = new Map();

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

function getTimestamps(map, key) {
  if (!map.has(key)) map.set(key, []);
  return map.get(key);
}

function pruneOld(timestamps, windowMs) {
  const cutoff = Date.now() - windowMs;
  const pruned = timestamps.filter(ts => ts >= cutoff);
  return pruned;
}

function countInWindow(map, key, windowMs) {
  const ts = getTimestamps(map, key);
  const fresh = pruneOld(ts, windowMs);
  map.set(key, fresh);
  return fresh.length;
}

function addTimestamp(map, key, windowMs) {
  const ts = getTimestamps(map, key);
  const fresh = pruneOld(ts, windowMs);
  fresh.push(Date.now());
  map.set(key, fresh);
  return fresh.length;
}

// ─────────────────────────────────────────────
// Join / Raid Detection
// ─────────────────────────────────────────────

/**
 * Called on every guildMemberAdd. Checks for raid patterns.
 * @param {GuildMember} member
 */
async function onMemberJoin(member) {
  const { guild } = member;
  const config = getGuildConfig(guild.id);
  const lang = config.language;

  const count = addTimestamp(joinLog, guild.id, SECURITY.RAID_JOIN_WINDOW_MS);

  if (count >= SECURITY.RAID_JOIN_COUNT) {
    const windowSec = SECURITY.RAID_JOIN_WINDOW_MS / 1000;
    const action = await modes.handleRaid(guild, config);
    await alerts.sendAlert(guild, config, lang, 'raidDetected', {
      count,
      seconds: windowSec,
      action,
    });
  }
}

// ─────────────────────────────────────────────
// Spam Detection
// ─────────────────────────────────────────────

/**
 * Called on every messageCreate. Checks for spam, links, and mentions.
 * @param {Message} message
 */
async function onMessage(message) {
  if (!message.guild || message.author.bot) return;

  const config = getGuildConfig(message.guild.id);
  const lang = config.language;
  const member = message.member;

  // Skip admins and mods
  if (member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const key = `${message.guild.id}:${message.author.id}`;

  // ── Spam detection ──
  const spamEnabled =
    config.security.mode !== 'manual' ||
    (config.security.mode === 'custom' && config.security.customConfig.antiSpam);

  if (spamEnabled) {
    const count = addTimestamp(msgLog, key, SECURITY.SPAM_MSG_WINDOW_MS);
    if (count >= SECURITY.SPAM_MSG_COUNT) {
      const action = await modes.handleSpam(message, config);
      if (action) {
        await alerts.sendAlert(message.guild, config, lang, 'spamDetected', {
          user: `${message.author}`,
          count,
          seconds: SECURITY.SPAM_MSG_WINDOW_MS / 1000,
          channel: `${message.channel}`,
        });
      }
    }
  }

  // ── Link detection ──
  const linksEnabled =
    config.security.mode === 'auto' ||
    config.security.mode === 'maximum' ||
    (config.security.mode === 'custom' && config.security.customConfig.antiLinks);

  if (linksEnabled && message.content) {
    const urls = extractUrls(message.content);
    for (const url of urls) {
      const domain = extractDomain(url);
      if (domain && SECURITY.SUSPICIOUS_DOMAINS.includes(domain)) {
        await modes.handleSuspiciousLink(message, config);
        await alerts.sendAlert(message.guild, config, lang, 'suspiciousLink', {
          user: `${message.author}`,
          domain,
          channel: `${message.channel}`,
        });
        break;
      }
    }
  }

  // ── Mention spam ──
  const mentionsEnabled =
    config.security.mode !== 'manual' ||
    (config.security.mode === 'custom' && config.security.customConfig.antiMentions);

  if (mentionsEnabled) {
    const mentionCount =
      message.mentions.users.size +
      message.mentions.roles.size +
      (message.mentions.everyone ? 1 : 0);

    if (mentionCount >= SECURITY.MAX_MENTIONS) {
      await modes.handleMentionSpam(message, config);
      await alerts.sendAlert(message.guild, config, lang, 'mentionSpam', {
        user: `${message.author}`,
        count: mentionCount,
      });
    }
  }
}

// ─────────────────────────────────────────────
// Mass Channel Creation
// ─────────────────────────────────────────────

/**
 * Called on channelCreate events.
 * @param {GuildChannel} channel
 */
async function onChannelCreate(channel) {
  if (!channel.guild) return;
  const config = getGuildConfig(channel.guild.id);
  const lang = config.language;

  // Try to find who created the channel via audit log
  let executorId = null;
  try {
    await new Promise(r => setTimeout(r, 1000)); // wait for audit log
    const logs = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 }); // CHANNEL_CREATE = 10
    const entry = logs.entries.first();
    if (entry && Date.now() - entry.createdTimestamp < 5000) {
      executorId = entry.executor?.id;
    }
  } catch { /* audit log unavailable */ }

  if (!executorId) return;

  const key = `${channel.guild.id}:${executorId}`;
  const count = addTimestamp(channelCreationLog, key, SECURITY.MASS_CREATE_WINDOW_MS);

  if (count >= SECURITY.MASS_CREATE_COUNT) {
    await alerts.sendAlert(channel.guild, config, lang, 'massChannels', {
      count,
      seconds: SECURITY.MASS_CREATE_WINDOW_MS / 1000,
    });

    if (config.security.mode === 'maximum') {
      await modes.activateLockdown(channel.guild, config, 'Mass channel creation detected');
    }
  }
}

// ─────────────────────────────────────────────
// Mass Role Creation
// ─────────────────────────────────────────────

/**
 * Called on roleCreate events.
 * @param {Role} role
 */
async function onRoleCreate(role) {
  if (!role.guild) return;
  const config = getGuildConfig(role.guild.id);
  const lang = config.language;

  let executorId = null;
  try {
    await new Promise(r => setTimeout(r, 1000));
    const logs = await role.guild.fetchAuditLogs({ type: 30, limit: 1 }); // ROLE_CREATE = 30
    const entry = logs.entries.first();
    if (entry && Date.now() - entry.createdTimestamp < 5000) {
      executorId = entry.executor?.id;
    }
  } catch { /* audit log unavailable */ }

  if (!executorId) return;

  const key = `${role.guild.id}:${executorId}`;
  const count = addTimestamp(roleCreationLog, key, SECURITY.MASS_CREATE_WINDOW_MS);

  if (count >= SECURITY.MASS_CREATE_COUNT) {
    await alerts.sendAlert(role.guild, config, lang, 'massRoles', {
      count,
      seconds: SECURITY.MASS_CREATE_WINDOW_MS / 1000,
    });

    if (config.security.mode === 'maximum') {
      await modes.activateLockdown(role.guild, config, 'Mass role creation detected');
    }
  }
}

module.exports = { onMemberJoin, onMessage, onChannelCreate, onRoleCreate };
