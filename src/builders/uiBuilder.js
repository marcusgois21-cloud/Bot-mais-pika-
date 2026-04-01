'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

const { e, CUSTOM_EMOJIS } = require('../utils/emojis');
const { t, langName } = require('../utils/i18n');
const { COLORS } = require('../config');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Creates a divider separator. */
function sep(large = false) {
  return new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small);
}

/** Creates a text display block. */
function text(content) {
  return new TextDisplayBuilder().setContent(content);
}

/** Wraps components into a container. Accepts any mix of builders. */
function container(...components) {
  const c = new ContainerBuilder();
  for (const comp of components) {
    if (comp instanceof TextDisplayBuilder) {
      c.addTextDisplayComponents(comp);
    } else if (comp instanceof SeparatorBuilder) {
      c.addSeparatorComponents(comp);
    } else if (comp instanceof ActionRowBuilder) {
      c.addActionRowComponents(comp);
    }
  }
  return c;
}

/** Returns message options for a Components v2 reply. */
function v2Reply(components, ephemeral = false) {
  const flags = ephemeral
    ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    : MessageFlags.IsComponentsV2;
  return { components, flags };
}

// ─────────────────────────────────────────────
// Reusable button factories
// ─────────────────────────────────────────────

function primaryBtn(customId, label, emoji) {
  const b = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(ButtonStyle.Primary);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function successBtn(customId, label, emoji) {
  const b = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(ButtonStyle.Success);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function dangerBtn(customId, label, emoji) {
  const b = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(ButtonStyle.Danger);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function secondaryBtn(customId, label, emoji) {
  const b = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(ButtonStyle.Secondary);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function row(...buttons) {
  return new ActionRowBuilder().addComponents(...buttons);
}

// ─────────────────────────────────────────────
// Verification Panel
// ─────────────────────────────────────────────

function buildVerificationPanel(lang) {
  const mainRow = row(
    successBtn('verify_start', t('verification.panel.startBtn', lang), { name: e(CUSTOM_EMOJIS.startVerify) }),
    secondaryBtn('verify_why', t('verification.panel.whyBtn', lang), { name: e(CUSTOM_EMOJIS.question) }),
  );

  const c = container(
    text(t('verification.panel.title', lang)),
    sep(true),
    text(t('verification.panel.description', lang)),
    sep(),
    text(`-# ${e(CUSTOM_EMOJIS.shield)} ${t('verification.panel.footer', lang)}`),
    sep(true),
    mainRow,
  );

  return v2Reply([c]);
}

function buildWhyVerify(lang) {
  const c = container(
    text(t('verification.panel.why.title', lang)),
    sep(true),
    text(t('verification.panel.why.reasons', lang)),
    sep(),
    text(`-# ${t('verification.panel.why.footer', lang)}`),
    sep(true),
    row(secondaryBtn('verify_back_panel', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

function buildMethodSelector(lang) {
  const c = container(
    text(t('verification.chooseMethod', lang)),
    sep(true),
    text(t('verification.chooseMethodDesc', lang)),
    sep(true),
    row(
      primaryBtn('verify_method_tictactoe', t('verification.tictactoeBtn', lang)),
      primaryBtn('verify_method_fruits', t('verification.fruitsBtn', lang)),
    ),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Configuration Panel
// ─────────────────────────────────────────────

function buildConfigPanel(guild, config, lang) {
  const modeName = t(`security.modes.${config.security.mode}`, lang);
  const serverInfo = t('config.serverInfo', lang, {
    guild: guild.name,
    lang: langName(lang),
    mode: modeName,
  });

  const row1 = row(
    primaryBtn('cfg_language', t('config.buttons.language', lang), { name: e(CUSTOM_EMOJIS.language) }),
    primaryBtn('cfg_verification', t('config.buttons.verification', lang), { name: e(CUSTOM_EMOJIS.startVerify) }),
    primaryBtn('cfg_security', t('config.buttons.security', lang), { name: e(CUSTOM_EMOJIS.shield) }),
  );

  const row2 = row(
    primaryBtn('cfg_logs', t('config.buttons.logs', lang), { name: e(CUSTOM_EMOJIS.logs) }),
    primaryBtn('cfg_lockdown', t('config.buttons.lockdown', lang), { name: e(CUSTOM_EMOJIS.lock) }),
    primaryBtn('cfg_custom', t('config.buttons.custom', lang), { name: e(CUSTOM_EMOJIS.custom) }),
  );

  const row3 = row(
    primaryBtn('cfg_honeypot', lang === 'en_US' ? 'Honeypot' : 'Honeypot', { name: e(CUSTOM_EMOJIS.alert) }),
    primaryBtn('cfg_network', lang === 'en_US' ? 'Network' : 'Rede', { name: e(CUSTOM_EMOJIS.shield) }),
    primaryBtn('cfg_reputation', lang === 'en_US' ? 'Reputation' : 'Reputação', { name: e(CUSTOM_EMOJIS.user) }),
  );

  const row4 = row(
    secondaryBtn('cfg_test', t('config.buttons.test', lang), { name: e(CUSTOM_EMOJIS.test) }),
  );

  const c = container(
    text(t('config.title', lang)),
    text(`-# ${e(CUSTOM_EMOJIS.shield)} ${t('config.subtitle', lang, { version: '2.0.0' })}`),
    sep(true),
    text(serverInfo),
    sep(true),
    row1,
    sep(),
    row2,
    sep(),
    row3,
    sep(),
    row4,
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Language Panel
// ─────────────────────────────────────────────

function buildLanguagePanel(lang) {
  const c = container(
    text(t('config.language.title', lang)),
    sep(true),
    text(t('config.language.description', lang)),
    sep(true),
    row(
      successBtn('cfg_lang_pt', t('config.language.pt', lang)),
      primaryBtn('cfg_lang_en', t('config.language.en', lang)),
    ),
    sep(),
    row(secondaryBtn('cfg_back', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Security Mode Panel
// ─────────────────────────────────────────────

function buildSecurityPanel(config, lang) {
  const current = t(`config.security.modes.${config.security.mode}.name`, lang);
  const desc = t('config.security.description', lang);

  const modes = ['manual', 'auto', 'maximum', 'custom'];
  const modeEmojis = {
    manual: CUSTOM_EMOJIS.modeManual,
    auto: CUSTOM_EMOJIS.modeAuto,
    maximum: CUSTOM_EMOJIS.modeMax,
    custom: CUSTOM_EMOJIS.modeCustom,
  };

  const modeDetails = modes.map(m =>
    `${e(modeEmojis[m])} **${t(`config.security.modes.${m}.name`, lang)}** — ${t(`config.security.modes.${m}.desc`, lang)}`
  ).join('\n');

  const select = new StringSelectMenuBuilder()
    .setCustomId('cfg_security_mode_select')
    .setPlaceholder(t('config.security.current', lang, { mode: current }))
    .addOptions(
      modes.map(m => ({
        label: t(`config.security.modes.${m}.name`, lang),
        description: t(`config.security.modes.${m}.desc`, lang).slice(0, 100),
        value: m,
        default: config.security.mode === m,
      }))
    );

  const c = container(
    text(t('config.security.title', lang)),
    sep(true),
    text(desc),
    sep(),
    text(modeDetails),
    sep(true),
    row(select),
    sep(),
    row(secondaryBtn('cfg_back', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Verification Config Panel
// ─────────────────────────────────────────────

function buildVerificationConfigPanel(config, guild, lang) {
  const vc = config.verification;
  const status = vc.enabled ? t('general.enabled', lang) : t('general.disabled', lang);
  const method = t(`config.verification.methods.${vc.method}`, lang);
  const unverRole = vc.unverifiedRoleId ? `<@&${vc.unverifiedRoleId}>` : t('general.notConfigured', lang);
  const memberRole = vc.memberRoleId ? `<@&${vc.memberRoleId}>` : t('general.notConfigured', lang);
  const channel = vc.channelId ? `<#${vc.channelId}>` : t('general.notConfigured', lang);

  const info = [
    t('config.verification.status', lang, { status }),
    t('config.verification.method', lang, { method }),
    t('config.verification.unverifiedRole', lang, { role: unverRole }),
    t('config.verification.memberRole', lang, { role: memberRole }),
    t('config.verification.channel', lang, { channel }),
  ].join('\n');

  // Method select
  const methodSelect = new StringSelectMenuBuilder()
    .setCustomId('cfg_verify_method_select')
    .setPlaceholder(method)
    .addOptions([
      { label: t('config.verification.methods.tictactoe', lang), value: 'tictactoe', default: vc.method === 'tictactoe' },
      { label: t('config.verification.methods.fruits', lang), value: 'fruits', default: vc.method === 'fruits' },
      { label: t('config.verification.methods.both', lang), value: 'both', default: vc.method === 'both' },
    ]);

  // Role selectors
  const unverRoleSelect = new RoleSelectMenuBuilder()
    .setCustomId('cfg_verify_unver_role')
    .setPlaceholder(t('config.verification.unverifiedRoleBtn', lang))
    .setMaxValues(1);

  const memberRoleSelect = new RoleSelectMenuBuilder()
    .setCustomId('cfg_verify_member_role')
    .setPlaceholder(t('config.verification.memberRoleBtn', lang))
    .setMaxValues(1);

  // Channel selector
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('cfg_verify_channel')
    .setPlaceholder(t('config.verification.channelBtn', lang))
    .setChannelTypes(ChannelType.GuildText)
    .setMaxValues(1);

  const toggleId = vc.enabled ? 'cfg_verify_disable' : 'cfg_verify_enable';
  const toggleLabel = vc.enabled
    ? t('config.verification.disableBtn', lang)
    : t('config.verification.enableBtn', lang);
  const toggleBtn = vc.enabled ? dangerBtn(toggleId, toggleLabel) : successBtn(toggleId, toggleLabel);

  const c = container(
    text(t('config.verification.title', lang)),
    sep(true),
    text(info),
    sep(true),
    row(methodSelect),
    sep(),
    row(unverRoleSelect),
    sep(),
    row(memberRoleSelect),
    sep(),
    row(channelSelect),
    sep(true),
    row(
      toggleBtn,
      primaryBtn('cfg_verify_send_panel', t('config.verification.panelBtn', lang)),
    ),
    sep(),
    row(secondaryBtn('cfg_back', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Logs Panel
// ─────────────────────────────────────────────

function buildLogsPanel(config, lang) {
  const currentChannel = config.logs.channelId
    ? `<#${config.logs.channelId}>`
    : t('general.notConfigured', lang);

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('cfg_logs_channel')
    .setPlaceholder(t('config.logs.selectChannel', lang))
    .setChannelTypes(ChannelType.GuildText)
    .setMaxValues(1);

  const c = container(
    text(t('config.logs.title', lang)),
    sep(true),
    text(t('config.logs.current', lang, { channel: currentChannel })),
    sep(),
    text(t('config.logs.description', lang)),
    sep(true),
    row(channelSelect),
    sep(),
    row(
      config.logs.channelId ? dangerBtn('cfg_logs_clear', t('general.none', lang)) : secondaryBtn('cfg_logs_clear', t('general.none', lang)).setDisabled(true),
      secondaryBtn('cfg_back', t('general.back', lang)),
    ),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Lockdown Panel
// ─────────────────────────────────────────────

function buildLockdownPanel(config, lang) {
  const ld = config.lockdown;
  const statusText = ld.active
    ? `${e(CUSTOM_EMOJIS.alert)} ${t('config.lockdown.active', lang)}`
    : `${e(CUSTOM_EMOJIS.online)} ${t('config.lockdown.inactive', lang)}`;

  let details = statusText;
  if (ld.active) {
    if (ld.reason) details += `\n${t('config.lockdown.reason', lang, { reason: ld.reason })}`;
    if (ld.activatedAt) details += `\n${t('config.lockdown.activatedAt', lang, { time: `<t:${Math.floor(ld.activatedAt / 1000)}:R>` })}`;
  }

  const actionBtn = ld.active
    ? successBtn('cfg_lockdown_off', t('config.lockdown.deactivateBtn', lang), { name: e(CUSTOM_EMOJIS.unlock) })
    : dangerBtn('cfg_lockdown_on', t('config.lockdown.activateBtn', lang), { name: e(CUSTOM_EMOJIS.lock) });

  const c = container(
    text(t('config.lockdown.title', lang)),
    sep(true),
    text(details),
    sep(true),
    row(
      actionBtn,
      secondaryBtn('cfg_back', t('general.back', lang)),
    ),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Test Panel
// ─────────────────────────────────────────────

function buildTestPanel(lang) {
  const c = container(
    text(t('config.test.title', lang)),
    sep(true),
    text(t('config.test.description', lang)),
    sep(true),
    row(
      primaryBtn('cfg_test_verification', t('config.test.testVerification', lang), { name: e(CUSTOM_EMOJIS.startVerify) }),
      primaryBtn('cfg_test_security', t('config.test.testSecurity', lang), { name: e(CUSTOM_EMOJIS.shield) }),
    ),
    sep(),
    row(
      primaryBtn('cfg_test_logs', t('config.test.testLogs', lang), { name: e(CUSTOM_EMOJIS.logs) }),
      successBtn('cfg_test_all', t('config.test.testAll', lang), { name: e(CUSTOM_EMOJIS.test) }),
    ),
    sep(),
    row(secondaryBtn('cfg_back', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Test Results Panel
// ─────────────────────────────────────────────

function buildTestResults(results, lang) {
  const lines = results.map(({ name, pass }) => {
    const icon = pass ? e(CUSTOM_EMOJIS.success) : e(CUSTOM_EMOJIS.error);
    const label = pass ? t('config.test.pass', lang) : t('config.test.fail', lang);
    return `${icon} **${name}**: ${label}`;
  });

  const c = container(
    text(t('config.test.results', lang)),
    sep(true),
    text(lines.join('\n')),
    sep(true),
    row(secondaryBtn('cfg_test', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Generic alert container (for security alerts)
// ─────────────────────────────────────────────

function buildAlertContainer(title, content) {
  const c = container(
    text(`${e(CUSTOM_EMOJIS.alert)} ${title}`),
    sep(true),
    text(content),
  );

  return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────
// Log container
// ─────────────────────────────────────────────

function buildLogContainer(content) {
  const c = container(
    text(`${e(CUSTOM_EMOJIS.logs)} ${content}`),
  );

  return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────
// Health Score Panel
// ─────────────────────────────────────────────

function buildHealthPanel(score, grade, breakdown, lang, isWeekly = false) {
  const { getGradeEmoji } = require('../systems/health/index');
  const gradeEmoji = getGradeEmoji(grade);
  const bar = buildScoreBar(score);

  const title = isWeekly
    ? t('health.weeklyReport', lang)
    : t('health.title', lang);

  const scoreDisplay = `${gradeEmoji} **${score}/100** — ${grade}\n${bar}`;

  const breakdownLines = breakdown.map(b => {
    const icon = b.pass ? '✅' : '❌';
    return `${icon} ${b.label}${b.pass ? ` *(+${b.points})*` : ''}`;
  }).join('\n');

  const c = container(
    text(title),
    text(`-# ${t('health.subtitle', lang)}`),
    sep(true),
    text(scoreDisplay),
    sep(),
    text(`**${t('health.breakdown', lang)}:**\n${breakdownLines}`),
    sep(true),
    row(secondaryBtn('cfg_back', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

function buildScoreBar(score) {
  const filled = Math.round(score / 10);
  return `\`${'█'.repeat(filled)}${'░'.repeat(10 - filled)}\` ${score}%`;
}

// ─────────────────────────────────────────────
// Honeypot Panel
// ─────────────────────────────────────────────

function buildHoneypotPanel(config, lang) {
  const count = config.honeypot?.channelIds?.length ?? 0;
  const isEnabled = config.honeypot?.enabled ?? false;

  const desc = t('honeypot.description', lang);
  const activeText = t('honeypot.active', lang, { count });

  const c = container(
    text(t('honeypot.title', lang)),
    sep(true),
    text(`${desc}\n\n${activeText}`),
    sep(true),
    row(
      successBtn('cfg_honeypot_create', t('honeypot.createBtn', lang)),
      ...(count > 0 ? [dangerBtn('cfg_honeypot_remove', t('honeypot.removeBtn', lang))] : []),
    ),
    sep(),
    row(secondaryBtn('cfg_back', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Network Panel
// ─────────────────────────────────────────────

function buildNetworkPanel(config, lang) {
  const { getBlacklist } = require('../systems/network/blacklist');
  const bl = getBlacklist();
  const count = Object.keys(bl).length;

  const statusText = config.network?.enabled
    ? t('network.enabled', lang)
    : t('network.disabled', lang);

  const c = container(
    text(t('network.title', lang)),
    sep(true),
    text(`${t('network.description', lang)}\n\n**${t('general.status', lang)}:** ${statusText}\n${t('network.blacklistCount', lang, { count })}`),
    sep(true),
    row(
      config.network?.enabled
        ? dangerBtn('cfg_network_disable', t('network.disableBtn', lang))
        : successBtn('cfg_network_enable', t('network.enableBtn', lang)),
    ),
    sep(),
    row(secondaryBtn('cfg_back', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Reputation Config Panel
// ─────────────────────────────────────────────

function buildReputationPanel(config, lang) {
  const isEnabled = config.reputation?.enabled ?? false;
  const statusText = isEnabled ? t('general.enabled', lang) : t('general.disabled', lang);

  const c = container(
    text(`## ${lang === 'en_US' ? 'Reputation System' : 'Sistema de Reputação'}`),
    sep(true),
    text(`**${t('general.status', lang)}:** ${statusText}\n\n${lang === 'en_US' ? 'Members earn/lose points based on behavior. Use `/reputacao ver` to check any member.' : 'Membros ganham/perdem pontos com base no comportamento. Use `/reputacao ver` para consultar qualquer membro.'}`),
    sep(true),
    row(
      isEnabled
        ? dangerBtn('cfg_rep_disable', t('config.buttons.disable', lang))
        : successBtn('cfg_rep_enable', t('config.buttons.enable', lang)),
    ),
    sep(),
    row(secondaryBtn('cfg_back', t('general.back', lang))),
  );

  return v2Reply([c], true);
}

// ─────────────────────────────────────────────
// Changelog Panel
// ─────────────────────────────────────────────

function buildChangelogPanel(version, changes, lang) {
  const items = changes.map(c2 => `• ${c2}`).join('\n');

  const c = container(
    text(t('changelog.title', lang, { version })),
    sep(true),
    text(t('changelog.description', lang)),
    sep(),
    text(items),
  );

  return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────
// Verification Method Selector (extended with new games)
// ─────────────────────────────────────────────

function buildMethodSelectorExtended(lang) {
  const c = container(
    text(t('verification.chooseMethod', lang)),
    sep(true),
    text(t('verification.chooseMethodDesc', lang)),
    sep(true),
    row(
      primaryBtn('verify_method_tictactoe', t('verification.tictactoeBtn', lang)),
      primaryBtn('verify_method_fruits', t('verification.fruitsBtn', lang)),
    ),
    sep(),
    row(
      primaryBtn('verify_method_simon', 'Simon Says'),
      primaryBtn('verify_method_math', lang === 'en_US' ? 'Math CAPTCHA' : 'CAPTCHA Matemático'),
      primaryBtn('verify_method_intruder', lang === 'en_US' ? 'Find the Intruder' : 'Encontre o Intruso'),
    ),
  );

  return v2Reply([c], true);
}

module.exports = {
  // Primitives
  sep, text, container, row, v2Reply,
  primaryBtn, successBtn, dangerBtn, secondaryBtn,
  // Panels
  buildVerificationPanel,
  buildWhyVerify,
  buildMethodSelector,
  buildMethodSelectorExtended,
  buildConfigPanel,
  buildLanguagePanel,
  buildSecurityPanel,
  buildVerificationConfigPanel,
  buildLogsPanel,
  buildLockdownPanel,
  buildTestPanel,
  buildTestResults,
  buildAlertContainer,
  buildLogContainer,
  buildHealthPanel,
  buildHoneypotPanel,
  buildNetworkPanel,
  buildReputationPanel,
  buildChangelogPanel,
};
