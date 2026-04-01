'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Loads all event files from /src/events and registers them on the client.
 * @param {Client} client
 */
function loadEvents(client) {
  const eventsDir = path.join(__dirname, '../events');
  const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const event = require(path.join(eventsDir, file));

    if (!event.name || !event.execute) {
      console.warn(`[Events] Skipping ${file}: missing name or execute`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }

    console.log(`[Events] Registered: ${event.name}${event.once ? ' (once)' : ''}`);
  }

  console.log(`[Events] ${files.length} event(s) registered.\n`);
}

module.exports = { loadEvents };
