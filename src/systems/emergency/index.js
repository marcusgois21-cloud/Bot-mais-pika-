'use strict';

const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require('discord.js');

/**
 * Sends emergency DM to all administrators of the guild.
 * @param {Guild} guild
 * @param {object} config
 * @param {string} title
 * @param {string} body
 */
async function dmAdmins(guild, config, title, body) {
  if (!config.emergency?.dmAdmins) return;

  // Fetch members with admin permission
  let admins = [];
  try {
    await guild.members.fetch(); // populate cache
    admins = guild.members.cache
      .filter(m => !m.user.bot && m.permissions.has(PermissionFlagsBits.Administrator))
      .map(m => m.user);
  } catch {
    admins = guild.members.cache
      .filter(m => !m.user.bot && m.permissions.has(PermissionFlagsBits.Administrator))
      .map(m => m.user);
  }

  if (admins.length === 0) return;

  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`🚨 **EMERGÊNCIA — ${guild.name}**`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**${title}**\n\n${body}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(false)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# Use /lockdown ou /configuracao para tomar ação imediata.`)
    );

  await Promise.allSettled(
    admins.map(user =>
      user.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {})
    )
  );
}

module.exports = { dmAdmins };
