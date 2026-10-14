/**
 * User repository — owns all persistence details.
 * Services never contain SQL or DB-specific code.
 */
export const createUserRepository = ({ db }) =>
  Object.freeze({
    findById:      (id)                 => db.users.findById(id),
    findByPhone:   (phone)              => db.users.findByPhone(phone),
    findByEmail:   (email)              => db.users.findByEmail(email),
    existsByPhone: (phone)              => db.users.existsByPhone(phone),
    existsByEmail: (email, excludeId)   => db.users.existsByEmail(email, excludeId),
    create:        (data)               => db.users.create(data),
    update:        (id, fields)         => db.users.update(id, fields),
  });
