import { env } from '../config/env.js';
import { createMySqlAdapter } from './adapters/mysql.adapter.js';

const adapters = { mysql: createMySqlAdapter };

// Add a Mongo adapter with the same query/transaction contract, then register it here.
export const database = adapters[env.DB_CLIENT](env);
