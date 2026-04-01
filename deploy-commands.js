'use strict';

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Auto-load all command files from src/commands
const commandsDir = path.join(__dirname, 'src/commands');
const commands = fs.readdirSync(commandsDir)
  .filter(f => f.endsWith('.js'))
  .map(f => {
    const cmd = require(path.join(commandsDir, f));
    return cmd.data?.toJSON();
  })
  .filter(Boolean);

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Registrando ${commands.length} comandos slash...`);

    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    await rest.put(route, { body: commands });

    console.log(`✅ ${commands.length} comandos registrados:`);
    commands.forEach(c => console.log(`   /${c.name}`));
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
    process.exit(1);
  }
})();
