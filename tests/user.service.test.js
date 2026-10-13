import test from 'node:test';
import assert from 'node:assert/strict';
import { createUserService } from '../src/services/user.service.js';

test('creates a user using an injected repository', async () => {
  const saved = [];
  const service = createUserService({ userRepository: {
    findByEmail: async () => null,
    create: async (user) => { saved.push(user); return user; },
  } });
  const user = await service.create({ name: 'Ada Lovelace', email: 'ada@example.com' });
  assert.equal(user.email, 'ada@example.com');
  assert.equal(saved.length, 1);
});

test('supports legacy DB_* environment variables without defaulting to root', async () => {
  const originalEnv = { ...process.env };

  process.env.DB_CLIENT = 'mysql';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '3306';
  process.env.DB_NAME = 'app_db';
  process.env.DB_USER = 'sandeep';
  process.env.DB_PASSWORD = 'Password@123';
  process.env.DB_CONNECTION_LIMIT = '10';
  delete process.env.MYSQL_HOST;
  delete process.env.MYSQL_PORT;
  delete process.env.MYSQL_DATABASE;
  delete process.env.MYSQL_USER;
  delete process.env.MYSQL_PASSWORD;
  delete process.env.MYSQL_CONNECTION_LIMIT;

  try {
    const { env } = await import('../src/config/env.js?legacy-db-config');
    assert.equal(env.MYSQL_HOST, 'localhost');
    assert.equal(env.MYSQL_PORT, 3306);
    assert.equal(env.MYSQL_DATABASE, 'app_db');
    assert.equal(env.MYSQL_USER, 'sandeep');
    assert.equal(env.MYSQL_PASSWORD, 'Password@123');
    assert.equal(env.MYSQL_CONNECTION_LIMIT, 10);
  } finally {
    process.env = { ...originalEnv };
  }
});
