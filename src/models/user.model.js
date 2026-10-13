import { getDatabase } from '../db/index.js';

// Same model methods work for MySQL and MongoDB. Only the adapter contains database-specific code.
export const User = Object.freeze({
  findById: (id) => getDatabase().users.findById(id),
  findByEmail: (email) => getDatabase().users.findByEmail(email),
  findByLogin: (login) => getDatabase().users.findByLogin(login),
  findByEmailOrUsername: (email, username) => getDatabase().users.findByEmailOrUsername(email, username),
  create: (userData) => getDatabase().users.create(userData),
  update: (id, fields) => getDatabase().users.update(id, fields),
});
