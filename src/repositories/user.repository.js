// A repository owns persistence details; services never contain SQL.
export const createUserRepository = ({ db }) => Object.freeze({
  findAll: ({ limit, offset, sortBy, sortOrder }) => db.query(`SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY ${sortBy} ${sortOrder} LIMIT :limit OFFSET :offset`, { limit, offset }),
  count: async () => (await db.query('SELECT COUNT(*) AS total FROM users'))[0].total,
  findById: async (id) => (await db.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = :id', { id }))[0] ?? null,
  findByEmail: async (email) => (await db.query('SELECT id, name, email, role, password_hash FROM users WHERE email = :email', { email }))[0] ?? null,
  create: async ({ id, name, email, passwordHash, role = 'user' }) => {
    await db.query('INSERT INTO users (id, name, email, password_hash, role) VALUES (:id, :name, :email, :passwordHash, :role)', { id, name, email, passwordHash, role });
    return (await db.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = :id', { id }))[0];
  },
  update: async (id, fields) => {
    const assignments = Object.keys(fields).map((key) => `${key} = :${key}`).join(', ');
    await db.query(`UPDATE users SET ${assignments} WHERE id = :id`, { id, ...fields });
    return (await db.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = :id', { id }))[0] ?? null;
  },
  remove: (id) => db.query('DELETE FROM users WHERE id = :id', { id }),
});
