import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { database } from './index.js';
import { logger } from '../config/logger.js';

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
for (const file of files) {
  const sql = await fs.readFile(path.join(directory, file), 'utf8');
  await database.query(sql);
  logger.info('Migration applied', { file });
}
await database.close();
