'use strict';

const fs = require('node:fs');
const path = require('node:path');

const NETWORK_DIR = path.join(__dirname, '../../../data/network');
const BLACKLIST_PATH = path.join(NETWORK_DIR, 'blacklist.json');

function ensureDir() {
  if (!fs.existsSync(NETWORK_DIR)) fs.mkdirSync(NETWORK_DIR, { recursive: true });
}

function load() {
  ensureDir();
  if (!fs.existsSync(BLACKLIST_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(BLACKLIST_PATH, 'utf8')); } catch { return {}; }
}

function save(data) {
  ensureDir();
  fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Adds a user to the global network blacklist.
 * @param {string} userId
 * @param {string} reason
 * @param {string} bannedInGuildId
 * @param {string} bannedByUserId
 */
function addToBlacklist(userId, reason, bannedInGuildId, bannedByUserId) {
  const bl = load();
  bl[userId] = {
    reason,
    bannedAt: Date.now(),
    bannedIn: bannedInGuildId,
    bannedBy: bannedByUserId,
  };
  save(bl);
}

/**
 * Removes a user from the global blacklist.
 * @param {string} userId
 */
function removeFromBlacklist(userId) {
  const bl = load();
  delete bl[userId];
  save(bl);
}

/**
 * Checks if a user is on the global blacklist.
 * @param {string} userId
 * @returns {{ blacklisted: boolean, data?: object }}
 */
function checkBlacklist(userId) {
  const bl = load();
  if (bl[userId]) return { blacklisted: true, data: bl[userId] };
  return { blacklisted: false };
}

/**
 * Returns the full blacklist.
 * @returns {object}
 */
function getBlacklist() {
  return load();
}

/**
 * Checks a joining member against the blacklist and acts if needed.
 * @param {GuildMember} member
 * @param {object} config
 */
async function handleJoinBlacklistCheck(member, config) {
  if (!config.network?.enabled) return;

  const { blacklisted, data } = checkBlacklist(member.id);
  if (!blacklisted) return;

  const lang = config.language;

  try {
    await member.ban({
      reason: lang === 'en_US'
        ? `Network blacklist: ${data.reason}`
        : `Lista negra da rede: ${data.reason}`,
    });
  } catch (err) {
    console.error('[Network] Failed to ban blacklisted member:', err.message);
    return;
  }

  // Alert channel
  const alertChannelId = config.alerts.channelId ?? config.logs.channelId;
  if (alertChannelId) {
    const channel = member.guild.channels.cache.get(alertChannelId);
    if (channel) {
      const { buildAlertContainer } = require('../../builders/uiBuilder');
      const title = lang === 'en_US' ? '🌐 Network Blacklist — Auto Ban' : '🌐 Lista Negra da Rede — Banimento Automático';
      const body = lang === 'en_US'
        ? `**${member.user.tag}** is on the network blacklist and was automatically banned.\nOriginal reason: **${data.reason}**`
        : `**${member.user.tag}** está na lista negra da rede e foi banido automaticamente.\nMotivo original: **${data.reason}**`;
      await channel.send(buildAlertContainer(title, body)).catch(() => {});
    }
  }
}

module.exports = {
  addToBlacklist,
  removeFromBlacklist,
  checkBlacklist,
  getBlacklist,
  handleJoinBlacklistCheck,
};
