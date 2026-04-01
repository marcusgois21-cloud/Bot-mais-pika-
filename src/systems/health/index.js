'use strict';

const { getGuildConfig } = require('../../utils/database');

// ─────────────────────────────────────────────
// Health score weights (total max = 100)
// ─────────────────────────────────────────────
const WEIGHTS = {
  verificationEnabled:  15,
  verificationFullySet:  5,  // channel + both roles configured
  logsConfigured:       15,
  securityMode:         20,  // varies by mode (manual=5, auto=15, max=20, custom=10)
  honeypotActive:       10,
  emergencyDms:          5,
  memberAgeGood:        15,  // average member account age > 30 days
  reputationEnabled:     5,
  networkEnabled:        5,
  noActiveLockdown:      5,  // server not currently in lockdown (healthy baseline)
};

const SECURITY_MODE_SCORES = {
  manual:  5,
  auto:   15,
  maximum: 20,
  custom:  10,
};

/**
 * Calculates the health score for a guild.
 * @param {Guild} guild - Discord.js Guild object
 * @param {object} [config] - Optional pre-loaded config
 * @returns {{ score: number, grade: string, breakdown: object[] }}
 */
async function calculateHealth(guild, config = null) {
  const cfg = config ?? getGuildConfig(guild.id);
  let score = 0;
  const breakdown = [];

  // ── Verification ──
  if (cfg.verification.enabled) {
    score += WEIGHTS.verificationEnabled;
    breakdown.push({ label: 'Verificação ativada', points: WEIGHTS.verificationEnabled, pass: true });
  } else {
    breakdown.push({ label: 'Verificação ativada', points: 0, pass: false });
  }

  const fullySet = !!(cfg.verification.channelId && cfg.verification.memberRoleId && cfg.verification.unverifiedRoleId);
  if (fullySet) {
    score += WEIGHTS.verificationFullySet;
    breakdown.push({ label: 'Verificação totalmente configurada', points: WEIGHTS.verificationFullySet, pass: true });
  } else {
    breakdown.push({ label: 'Verificação totalmente configurada', points: 0, pass: false });
  }

  // ── Logs ──
  if (cfg.logs.channelId) {
    score += WEIGHTS.logsConfigured;
    breakdown.push({ label: 'Canal de logs configurado', points: WEIGHTS.logsConfigured, pass: true });
  } else {
    breakdown.push({ label: 'Canal de logs configurado', points: 0, pass: false });
  }

  // ── Security mode ──
  const modeScore = SECURITY_MODE_SCORES[cfg.security.mode] ?? 5;
  score += modeScore;
  breakdown.push({ label: `Modo de segurança (${cfg.security.mode})`, points: modeScore, pass: modeScore >= 10 });

  // ── Honeypot ──
  if (cfg.honeypot?.enabled && cfg.honeypot?.channelIds?.length > 0) {
    score += WEIGHTS.honeypotActive;
    breakdown.push({ label: 'Honeypot ativo', points: WEIGHTS.honeypotActive, pass: true });
  } else {
    breakdown.push({ label: 'Honeypot ativo', points: 0, pass: false });
  }

  // ── Emergency DMs ──
  if (cfg.emergency?.dmAdmins) {
    score += WEIGHTS.emergencyDms;
    breakdown.push({ label: 'DMs de emergência', points: WEIGHTS.emergencyDms, pass: true });
  } else {
    breakdown.push({ label: 'DMs de emergência', points: 0, pass: false });
  }

  // ── Member average age ──
  try {
    const members = guild.members.cache;
    if (members.size > 1) {
      const now = Date.now();
      const avgAgeMs = members.reduce((sum, m) => sum + (now - m.user.createdTimestamp), 0) / members.size;
      const avgAgeDays = avgAgeMs / 86_400_000;
      if (avgAgeDays >= 30) {
        score += WEIGHTS.memberAgeGood;
        breakdown.push({ label: 'Idade média dos membros (≥30 dias)', points: WEIGHTS.memberAgeGood, pass: true });
      } else {
        breakdown.push({ label: 'Idade média dos membros (<30 dias)', points: 0, pass: false });
      }
    }
  } catch { /* guild members cache unavailable */ }

  // ── Reputation ──
  if (cfg.reputation?.enabled) {
    score += WEIGHTS.reputationEnabled;
    breakdown.push({ label: 'Sistema de reputação ativo', points: WEIGHTS.reputationEnabled, pass: true });
  } else {
    breakdown.push({ label: 'Sistema de reputação ativo', points: 0, pass: false });
  }

  // ── Network ──
  if (cfg.network?.enabled) {
    score += WEIGHTS.networkEnabled;
    breakdown.push({ label: 'Rede de servidores ativa', points: WEIGHTS.networkEnabled, pass: true });
  } else {
    breakdown.push({ label: 'Rede de servidores ativa', points: 0, pass: false });
  }

  // ── No active lockdown (healthy baseline) ──
  if (!cfg.lockdown?.active) {
    score += WEIGHTS.noActiveLockdown;
    breakdown.push({ label: 'Servidor em operação normal', points: WEIGHTS.noActiveLockdown, pass: true });
  } else {
    breakdown.push({ label: 'Servidor em operação normal', points: 0, pass: false });
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    grade: getGrade(finalScore),
    breakdown,
  };
}

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function getGradeEmoji(grade) {
  const map = { 'A+': '🟢', A: '🟢', B: '🟡', C: '🟠', D: '🔴', F: '💀' };
  return map[grade] ?? '❓';
}

/**
 * Sends the weekly health report to configured channel.
 * @param {Guild} guild
 * @param {object} config
 */
async function sendWeeklyReport(guild, config) {
  if (!config.health?.weeklyReport || !config.health?.reportChannelId) return;

  const channel = guild.channels.cache.get(config.health.reportChannelId);
  if (!channel) return;

  const { score, grade, breakdown } = await calculateHealth(guild, config);
  const { buildHealthPanel } = require('../../builders/uiBuilder');

  try {
    await channel.send(buildHealthPanel(score, grade, breakdown, config.language, true));
  } catch (err) {
    console.error('[Health] Failed to send weekly report:', err.message);
  }
}

module.exports = { calculateHealth, getGrade, getGradeEmoji, sendWeeklyReport };
