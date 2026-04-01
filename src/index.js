'use strict';

require('dotenv').config();

const client = require('./client');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

// Validate required environment variables
const requiredEnv = ['TOKEN', 'CLIENT_ID'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[Startup] Missing environment variable: ${key}`);
    console.error('[Startup] Copy .env.example to .env and fill in your values.');
    process.exit(1);
  }
}

// Load commands and events
loadCommands(client);
loadEvents(client);

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', err => {
  console.error('[Process] Uncaught exception:', err);
});

client.on('error', err => {
  console.error('[Client] WebSocket error:', err.message);
});

client.on('warn', info => {
  console.warn('[Client] Warning:', info);
});

// Login
client.login(process.env.TOKEN).catch(err => {
  console.error('[Startup] Failed to login:', err.message);
  process.exit(1);
});
