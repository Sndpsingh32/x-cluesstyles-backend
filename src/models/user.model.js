import { getDatabase } from '../db/index.js';

/**
 * Thin proxy over the active DB adapter.
 * Any layer (controller, service, middleware) can import this instead of
 * calling getDatabase() directly.
 */
export const User = Object.freeze({
  findById:       (id)                  => getDatabase().users.findById(id),
  findByPhone:    (phone)               => getDatabase().users.findByPhone(phone),
  findByEmail:    (email)               => getDatabase().users.findByEmail(email),
  existsByPhone:  (phone)               => getDatabase().users.existsByPhone(phone),
  existsByEmail:  (email, excludeId)    => getDatabase().users.existsByEmail(email, excludeId),
  create:         (userData)            => getDatabase().users.create(userData),
  update:         (id, fields)          => getDatabase().users.update(id, fields),
});
