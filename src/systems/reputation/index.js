'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '../../../data/guilds');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getRepPath(guildId) {
  return path.join(DATA_DIR, `${guildId}_rep.json`);
}

function loadRep(guildId) {
  ensureDir();
  const fp = getRepPath(guildId);
  if (!fs.existsSync(fp)) return {};
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return {}; }
}

function saveRep(guildId, data) {
  ensureDir();
  fs.writeFileSync(getRepPath(guildId), JSON.stringify(data, null, 2), 'utf8');
}

// ─────────────────────────────────────────────
// Reputation scores
// ─────────────────────────────────────────────
const SCORES = {
  VERIFIED:    10,
  ACTIVE_DAY:   1,
  VIOLATION:  -10,
  WARNED:      -5,
  KICKED:     -20,
};

const MIN_SCORE = 0;
const MAX_SCORE = 100;
const DEFAULT_SCORE = 50;

/**
 * Gets a user's reputation score.
 * @param {string} guildId
 * @param {string} userId
 * @returns {number}
 */
function getScore(guildId, userId) {
  const rep = loadRep(guildId);
  return rep[userId]?.score ?? DEFAULT_SCORE;
}

/**
 * Gets full reputation data for a user.
 */
function getUserRep(guildId, userId) {
  const rep = loadRep(guildId);
  return rep[userId] ?? { score: DEFAULT_SCORE, lastActiveDate: null, history: [] };
}

/**
 * Applies a delta to a user's reputation.
 * @param {string} guildId
 * @param {string} userId
 * @param {number} delta
 * @param {string} reason
 * @returns {number} new score
 */
function applyDelta(guildId, userId, delta, reason) {
  const rep = loadRep(guildId);
  if (!rep[userId]) {
    rep[userId] = { score: DEFAULT_SCORE, lastActiveDate: null, history: [] };
  }

  const before = rep[userId].score;
  rep[userId].score = Math.max(MIN_SCORE, Math.min(MAX_SCORE, before + delta));
  rep[userId].history = [
    { delta, reason, at: Date.now() },
    ...(rep[userId].history ?? []).slice(0, 19), // keep last 20 events
  ];

  saveRep(guildId, rep);
  return rep[userId].score;
}

/**
 * Records verification success.
 */
function onVerified(guildId, userId) {
  return applyDelta(guildId, userId, SCORES.VERIFIED, 'verified');
}

/**
 * Records a security violation (spam, suspicious link, etc.).
 */
function onViolation(guildId, userId) {
  return applyDelta(guildId, userId, SCORES.VIOLATION, 'security_violation');
}

/**
 * Records a manual warning.
 */
function onWarned(guildId, userId) {
  return applyDelta(guildId, userId, SCORES.WARNED, 'warned');
}

/**
 * Records a kick.
 */
function onKicked(guildId, userId) {
  return applyDelta(guildId, userId, SCORES.KICKED, 'kicked');
}

/**
 * Records an active day (called on first message of the day).
 * Returns true if the daily bonus was awarded.
 */
function onActiveDay(guildId, userId) {
  const rep = loadRep(guildId);
  if (!rep[userId]) {
    rep[userId] = { score: DEFAULT_SCORE, lastActiveDate: null, history: [] };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (rep[userId].lastActiveDate === today) return false;

  rep[userId].lastActiveDate = today;
  saveRep(guildId, rep);
  applyDelta(guildId, userId, SCORES.ACTIVE_DAY, 'active_day');
  return true;
}

/**
 * Returns a letter grade based on score.
 */
function getGrade(score) {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/**
 * Checks and assigns reputation-gated roles to a member.
 * @param {GuildMember} member
 * @param {object} config
 */
async function applyReputationRoles(member, config) {
  if (!config.reputation?.enabled) return;
  if (!config.reputation?.rewardRoles?.length) return;

  const score = getScore(member.guild.id, member.id);

  for (const { minScore, roleId } of config.reputation.rewardRoles) {
    if (!roleId) continue;
    const role = member.guild.roles.cache.get(roleId);
    if (!role) continue;

    if (score >= minScore && !member.roles.cache.has(roleId)) {
      await member.roles.add(roleId).catch(() => {});
    } else if (score < minScore && member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId).catch(() => {});
    }
  }
}

module.exports = {
  getScore, getUserRep, applyDelta, getGrade,
  onVerified, onViolation, onWarned, onKicked, onActiveDay,
  applyReputationRoles,
  SCORES, DEFAULT_SCORE,
};
