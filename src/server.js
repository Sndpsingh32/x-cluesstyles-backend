import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, setDatabase, getDatabase } from './db/index.js';
import { logger } from './config/logger.js';

const db = await connectDB();
setDatabase(db);
const server = app.listen(env.PORT, () => logger.info('Server running', { port: env.PORT, environment: env.NODE_ENV }));
const shutdown = async (signal) => {
  logger.info('Shutting down', { signal });
  server.close(async () => { await getDatabase().close(); process.exit(0); });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
