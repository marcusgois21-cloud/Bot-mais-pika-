'use strict';

let Anthropic = null;
try { Anthropic = require('@anthropic-ai/sdk'); } catch { /* optional dependency */ }

/**
 * Checks if the AI module is available (API key configured).
 */
function isAvailable() {
  return !!(Anthropic && process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  if (!isAvailable()) return null;
  return new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─────────────────────────────────────────────
// Incident Report Analysis
// ─────────────────────────────────────────────

/**
 * Generates a natural-language incident report after a raid/attack.
 * @param {object} incident
 * @param {string} incident.type - 'raid'|'spam'|'link'|'mentions'
 * @param {number} incident.affectedCount - How many users/messages involved
 * @param {number} incident.durationMs - Duration of the incident
 * @param {string} incident.actionTaken - What action the bot took
 * @param {string} [incident.guildName]
 * @param {string} [lang='pt_BR']
 * @returns {Promise<string>} Natural-language report
 */
async function analyzeIncident(incident, lang = 'pt_BR') {
  if (!isAvailable()) {
    return lang === 'en_US'
      ? '⚠️ AI analysis unavailable. Set `ANTHROPIC_API_KEY` in your `.env` to enable this feature.'
      : '⚠️ Análise de IA indisponível. Defina `ANTHROPIC_API_KEY` no seu `.env` para habilitar este recurso.';
  }

  const client = getClient();
  const isPt = lang !== 'en_US';

  const systemPrompt = isPt
    ? `Você é o sistema de análise de segurança de um bot Discord chamado "Bot Mais Pika".
Analise incidentes de segurança e gere relatórios concisos e profissionais em Português brasileiro.
Use emojis relevantes. Seja direto. Máximo 150 palavras.`
    : `You are the security analysis system of a Discord bot called "Bot Mais Pika".
Analyze security incidents and generate concise, professional reports in English.
Use relevant emojis. Be direct. Maximum 150 words.`;

  const typeMap = {
    raid: isPt ? 'raid de entradas em massa' : 'mass-join raid',
    spam: isPt ? 'spam de mensagens' : 'message spam',
    link: isPt ? 'link suspeito/phishing' : 'suspicious/phishing link',
    mentions: isPt ? 'spam de menções' : 'mention spam',
    honeypot: isPt ? 'acesso a canal honeypot' : 'honeypot channel access',
  };

  const userPrompt = isPt
    ? `Incidente detectado:
- Tipo: ${typeMap[incident.type] ?? incident.type}
- Usuários/mensagens afetados: ${incident.affectedCount}
- Duração: ${Math.round(incident.durationMs / 1000)}s
- Ação do bot: ${incident.actionTaken}
- Servidor: ${incident.guildName ?? 'Desconhecido'}

Gere um relatório de incidente profissional com: resumo, intensidade (leve/moderada/severa), análise do padrão e recomendação.`
    : `Detected incident:
- Type: ${typeMap[incident.type] ?? incident.type}
- Affected users/messages: ${incident.affectedCount}
- Duration: ${Math.round(incident.durationMs / 1000)}s
- Bot action: ${incident.actionTaken}
- Server: ${incident.guildName ?? 'Unknown'}

Generate a professional incident report with: summary, severity (low/moderate/severe), pattern analysis and recommendation.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    return response.content[0]?.text ?? (isPt ? 'Relatório indisponível.' : 'Report unavailable.');
  } catch (err) {
    console.error('[AI] analyzeIncident failed:', err.message);
    return isPt ? 'Falha ao gerar relatório de IA.' : 'Failed to generate AI report.';
  }
}

// ─────────────────────────────────────────────
// Contextual Message Moderation
// ─────────────────────────────────────────────

/**
 * Analyzes a message for toxicity, spam, or manipulation using AI.
 * Returns a risk score and category.
 * @param {string} messageContent
 * @param {string} [lang='pt_BR']
 * @returns {Promise<{ risk: 'none'|'low'|'medium'|'high', category: string, reason: string }>}
 */
async function analyzeMessage(messageContent, lang = 'pt_BR') {
  if (!isAvailable()) return { risk: 'none', category: 'ai_unavailable', reason: '' };
  if (!messageContent?.trim()) return { risk: 'none', category: 'empty', reason: '' };

  const client = getClient();

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: `You are a content moderation classifier for Discord servers.
Analyze messages and return ONLY a JSON object with:
- "risk": "none"|"low"|"medium"|"high"
- "category": "clean"|"spam"|"phishing"|"toxic"|"manipulation"|"selfpromo"
- "reason": brief explanation (max 20 words)

Be strict about phishing and manipulation. Be lenient about casual language.`,
      messages: [{
        role: 'user',
        content: `Classify this Discord message:\n"${messageContent.slice(0, 500)}"`,
      }],
    });

    const text = response.content[0]?.text ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { risk: 'none', category: 'parse_error', reason: '' };
  } catch (err) {
    console.error('[AI] analyzeMessage failed:', err.message);
    return { risk: 'none', category: 'error', reason: '' };
  }
}

// ─────────────────────────────────────────────
// Server Health AI Commentary
// ─────────────────────────────────────────────

/**
 * Generates AI commentary on a server's health score.
 * @param {number} score
 * @param {object[]} breakdown
 * @param {string} [lang='pt_BR']
 * @returns {Promise<string>}
 */
async function commentOnHealth(score, breakdown, lang = 'pt_BR') {
  if (!isAvailable()) return '';

  const client = getClient();
  const isPt = lang !== 'en_US';
  const failed = breakdown.filter(b => !b.pass).map(b => b.label);

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: isPt
        ? 'Você é o consultor de segurança de um bot Discord. Dê um conselho profissional e direto em PT-BR. Máximo 60 palavras.'
        : 'You are a Discord bot security consultant. Give professional, direct advice in English. Max 60 words.',
      messages: [{
        role: 'user',
        content: isPt
          ? `Score de saúde: ${score}/100. Itens não configurados: ${failed.join(', ') || 'nenhum'}. Dê uma recomendação.`
          : `Health score: ${score}/100. Unconfigured items: ${failed.join(', ') || 'none'}. Give a recommendation.`,
      }],
    });

    return response.content[0]?.text ?? '';
  } catch {
    return '';
  }
}

module.exports = { isAvailable, analyzeIncident, analyzeMessage, commentOnHealth };
