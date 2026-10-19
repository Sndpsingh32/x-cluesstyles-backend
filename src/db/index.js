import { env } from '../config/env.js';
import { createMySqlAdapter } from './adapters/mysql.adapter.js';
import { createMongoDbAdapter } from './adapters/mongodb.adapter.js';

const factories = { mysql: createMySqlAdapter, mongodb: createMongoDbAdapter };
export const connectDB = async () => {
  const db = await factories[env.DB_CLIENT](env);
  await db.checkConnection();
  if (typeof db.migrate === 'function') {
    await db.migrate();
  }
  return db;
};

let database;
export const setDatabase = (db) => { database = db; };
export const getDatabase = () => {
  if (!database) throw new Error('Database is not connected yet');
  return database;
};
