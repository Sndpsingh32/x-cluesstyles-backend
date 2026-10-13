import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, setDatabase } from './db/index.js';
import { logger } from './config/logger.js';

const db = await connectDB();
setDatabase(db);
const server = app.listen(env.PORT, () => logger.info('Server running', { port: env.PORT, database: db.client }));
const shutdown = async (signal) => server.close(async () => { await db.close(); logger.info('Server stopped', { signal }); process.exit(0); });
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
