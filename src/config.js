'use strict';

module.exports = {
  // Cores usadas nos containers (accent color)
  COLORS: {
    PRIMARY: 0x5865F2,
    SUCCESS: 0x57F287,
    WARNING: 0xFEE75C,
    DANGER: 0xED4245,
    INFO: 0x5865F2,
    NEUTRAL: 0x36393F,
  },

  // Limites do motor de segurança
  SECURITY: {
    // Raid: X entradas em Y segundos
    RAID_JOIN_COUNT: 10,
    RAID_JOIN_WINDOW_MS: 60_000,

    // Spam: X mensagens em Y segundos
    SPAM_MSG_COUNT: 5,
    SPAM_MSG_WINDOW_MS: 5_000,

    // Menções: máximo por mensagem
    MAX_MENTIONS: 5,

    // Criação em massa: X canais/cargos em Y segundos
    MASS_CREATE_COUNT: 3,
    MASS_CREATE_WINDOW_MS: 10_000,

    // Links: domínios suspeitos conhecidos
    SUSPICIOUS_DOMAINS: [
      'grabify.link', 'iplogger.org', 'blasze.com', 'iptracker.org',
      'discord.gift', 'discordnitro.online', 'steamcommunity.ru',
    ],
  },

  // Tempos dos jogos de verificação (ms)
  VERIFICATION: {
    TICTACTOE_TIMEOUT_MS: 60_000,
    BOT_MOVE_DELAY_MS: 1_000,
    MAX_DEFEATS_BEFORE_SUGGEST: 2,
  },

  // Idiomas suportados
  LANGUAGES: {
    PT_BR: 'pt_BR',
    EN_US: 'en_US',
  },

  DEFAULT_LANGUAGE: 'pt_BR',

  // Versão do bot
  VERSION: '2.0.0',

  // Changelog por versão (exibido ao admin quando bot atualiza)
  CHANGELOG: {
    '2.0.0': [
      '🧠 Análise de incidentes com IA (Claude API)',
      '⭐ Sistema de Reputação por membro',
      '🏥 Score de Saúde do servidor',
      '🍯 Canais Honeypot automáticos',
      '🌐 Lista negra de rede entre servidores',
      '🌴 Modo de Férias com retorno automático',
      '📦 Backup/Restore de configurações',
      '🚨 DMs de emergência para administradores',
      '🎮 3 novos jogos: Simon Says, CAPTCHA Matemático, Encontre o Intruso',
      '🔍 Verificação adaptativa por risco (idade da conta)',
    ],
  },

  // Planos disponíveis
  PLAN_LEVELS: { free: 0, pro: 1, enterprise: 2 },
};
