import test from 'node:test';
import assert from 'node:assert/strict';
import { updateProfileSchema } from '../src/models/user.schema.js';

test('updateProfileSchema allows blank avatar values', () => {
  const parsed = updateProfileSchema.parse({ avatar: '' });
  assert.deepEqual(parsed, { avatar: '' });
});
