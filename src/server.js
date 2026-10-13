import { createApp } from './app.js';
import { env } from './config/env.js';
import { database } from './database/index.js';
import { logger } from './config/logger.js';

const server = createApp().listen(env.PORT, () => logger.info('Server running', { port: env.PORT, environment: env.NODE_ENV }));
const shutdown = async (signal) => {
  logger.info('Shutting down', { signal });
  server.close(async () => { await database.close(); process.exit(0); });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
