'use strict';

require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('configuracao')
    .setDescription('Painel de configuração completo do bot | Full bot configuration panel')
    .setDefaultMemberPermissions('0') // Apenas administradores
    .toJSON(),

  new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Envia o painel de verificação no canal atual | Send verification panel to current channel')
    .setDefaultMemberPermissions('0')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Ativa ou desativa o lockdown do servidor | Toggle server lockdown')
    .setDefaultMemberPermissions('0')
    .addStringOption(opt =>
      opt.setName('acao')
        .setDescription('Ação: ativar ou desativar | Action: activate or deactivate')
        .setRequired(true)
        .addChoices(
          { name: 'Ativar / Activate', value: 'on' },
          { name: 'Desativar / Deactivate', value: 'off' },
        )
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo do lockdown | Lockdown reason')
        .setRequired(false)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Define o canal de logs | Set the logs channel')
    .setDefaultMemberPermissions('0')
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal para logs | Logs channel')
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registrando comandos slash...');

    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    await rest.put(route, { body: commands });

    console.log(`✅ ${commands.length} comandos registrados com sucesso!`);
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
    process.exit(1);
  }
})();
