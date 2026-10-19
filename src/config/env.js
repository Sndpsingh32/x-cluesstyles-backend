import 'dotenv/config';
import { z } from 'zod';

const rawEnv = {
  ...process.env,
  MYSQL_HOST: process.env.DB_HOST ?? process.env.MYSQL_HOST ?? 'localhost',
  MYSQL_PORT: process.env.DB_PORT ?? process.env.MYSQL_PORT ?? '3306',
  MYSQL_DATABASE: process.env.DB_NAME ?? process.env.MYSQL_DATABASE ?? 'starter_db',
  MYSQL_USER: process.env.DB_USER ?? process.env.MYSQL_USER ?? 'root',
  MYSQL_PASSWORD: process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? '',
  MYSQL_CONNECTION_LIMIT: process.env.DB_CONNECTION_LIMIT ?? process.env.MYSQL_CONNECTION_LIMIT ?? '10',
};

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  DB_CLIENT: z.enum(['mysql', 'mongodb']).default('mysql'),
  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_DATABASE: z.string().min(1).default('starter_db'),
  MYSQL_USER: z.string().min(1).default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  MYSQL_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017'),
  MONGODB_DATABASE: z.string().min(1).default('starter_db'),
  JWT_SECRET: z.string().min(32).default('development-only-secret-change-me-123'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
});

export const env = Object.freeze(schema.parse(rawEnv));
