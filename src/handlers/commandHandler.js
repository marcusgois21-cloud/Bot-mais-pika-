'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');

/**
 * Loads all command files from /src/commands and attaches them to client.commands.
 * @param {Client} client
 */
function loadCommands(client) {
  client.commands = new Collection();

  const commandsDir = path.join(__dirname, '../commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const command = require(path.join(commandsDir, file));

    if (!command.data || !command.execute) {
      console.warn(`[Commands] Skipping ${file}: missing data or execute`);
      continue;
    }

    client.commands.set(command.data.name, command);
    console.log(`[Commands] Loaded: /${command.data.name}`);
  }

  console.log(`[Commands] ${client.commands.size} command(s) loaded.\n`);
}

module.exports = { loadCommands };
