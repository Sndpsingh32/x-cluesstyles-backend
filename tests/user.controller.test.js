import test from 'node:test';
import assert from 'node:assert/strict';
import { setDatabase } from '../src/db/index.js';
import { registerUser } from '../src/controllers/user.controller.js';

const response = () => {
  const result = {};
  return { status: (code) => { result.statusCode = code; return { json: (body) => { result.body = body; return result; } }; }, result };
};

test('registerUser rejects an existing email or username', async () => {
  setDatabase({ users: { findByEmailOrUsername: async () => ({ id: 'existing-user' }) } });
  const next = (error) => { throw error; };
  await assert.rejects(
    registerUser({ body: { fullName: 'Ada Lovelace', username: 'ada', email: 'ada@example.com', password: 'safe-password' } }, response(), next),
    { message: 'User with this email or username already exists' },
  );
});

test('registerUser normalizes identity fields and never returns a password hash', async () => {
  let created;
  setDatabase({ users: {
    findByEmailOrUsername: async () => null,
    create: async (user) => { created = user; return { id: user.id, fullName: user.fullName, username: user.username, email: user.email }; },
  }});
  const res = response();
  await registerUser({ body: { fullName: ' Ada Lovelace ', username: 'Ada', email: 'ADA@EXAMPLE.COM', password: 'safe-password' } }, res, (error) => { throw error; });
  assert.equal(res.result.statusCode, 201);
  assert.equal(res.result.body.data.username, 'ada');
  assert.equal(res.result.body.data.email, 'ada@example.com');
  assert.ok(created.passwordHash);
  assert.notEqual(created.passwordHash, 'safe-password');
});
