'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '../../../data');
const PLANS_PATH = path.join(DATA_DIR, 'plans.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDir();
  if (!fs.existsSync(PLANS_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(PLANS_PATH, 'utf8')); } catch { return {}; }
}

function save(data) {
  ensureDir();
  fs.writeFileSync(PLANS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const PLANS = {
  free:       { name: 'Free',       emoji: '⬜', level: 0 },
  pro:        { name: 'Pro',        emoji: '🟦', level: 1 },
  enterprise: { name: 'Enterprise', emoji: '🟪', level: 2 },
};

// Feature requirements by plan level
const FEATURES = {
  basicVerification:    0,  // free+
  securityEngine:       0,  // free+
  logs:                 0,  // free+
  lockdown:             0,  // free+
  backup:               0,  // free+
  aiAnalysis:           1,  // pro+
  reputation:           1,  // pro+
  healthScore:          1,  // pro+
  vacation:             1,  // pro+
  emergencyDms:         1,  // pro+
  newGames:             1,  // pro+
  adaptiveVerification: 1,  // pro+
  honeypot:             1,  // pro+
  networkBlacklist:     2,  // enterprise only
  multiServer:          2,  // enterprise only
};

/**
 * Gets the plan for a guild.
 * @param {string} guildId
 * @returns {'free'|'pro'|'enterprise'}
 */
function getGuildPlan(guildId) {
  const plans = load();
  return plans[guildId] ?? 'pro'; // Default to pro during beta
}

/**
 * Sets the plan for a guild (bot owner only).
 * @param {string} guildId
 * @param {'free'|'pro'|'enterprise'} plan
 */
function setGuildPlan(guildId, plan) {
  if (!PLANS[plan]) throw new Error(`Invalid plan: ${plan}`);
  const plans = load();
  plans[guildId] = plan;
  save(plans);
}

/**
 * Checks if a guild has access to a specific feature.
 * @param {string} guildId
 * @param {string} feature
 * @returns {boolean}
 */
function hasFeature(guildId, feature) {
  const plan = getGuildPlan(guildId);
  const required = FEATURES[feature] ?? 0;
  const current = PLANS[plan]?.level ?? 0;
  return current >= required;
}

/**
 * Returns plan info for a guild.
 */
function getPlanInfo(guildId) {
  const planKey = getGuildPlan(guildId);
  return { ...PLANS[planKey], key: planKey };
}

module.exports = { getGuildPlan, setGuildPlan, hasFeature, getPlanInfo, PLANS, FEATURES };
