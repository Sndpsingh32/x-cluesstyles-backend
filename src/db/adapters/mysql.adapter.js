import mysql from 'mysql2/promise';

export const createMySqlAdapter = (env) => {
  const pool = mysql.createPool({ host: env.MYSQL_HOST, port: env.MYSQL_PORT, database: env.MYSQL_DATABASE, user: env.MYSQL_USER, password: env.MYSQL_PASSWORD, waitForConnections: true, connectionLimit: env.MYSQL_CONNECTION_LIMIT, namedPlaceholders: true });
  const query = async (sql, values = {}) => (await pool.execute(sql, values))[0];
  const findOne = async (sql, values) => (await query(sql, values))[0] ?? null;
  const publicUser = 'SELECT id, full_name AS fullName, username, email, avatar, created_at AS createdAt, updated_at AS updatedAt FROM users';
  return Object.freeze({
    client: 'mysql', checkConnection: () => query('SELECT 1'),
    migrate: () => query('CREATE TABLE IF NOT EXISTS users (id CHAR(36) PRIMARY KEY, full_name VARCHAR(100) NOT NULL, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, avatar VARCHAR(2048) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)'),
    users: Object.freeze({
      findById: (id) => findOne(`${publicUser} WHERE id = :id`, { id }),
      findByEmail: (email) => findOne(`${publicUser} WHERE email = :email`, { email }),
      findByLogin: async (login) => findOne('SELECT id, full_name AS fullName, username, email, password_hash AS passwordHash, avatar FROM users WHERE username = :login OR email = :login', { login }),
      findByEmailOrUsername: (email, username) => findOne('SELECT id FROM users WHERE email = :email OR username = :username', { email, username }),
      create: async ({ id, fullName, username, email, passwordHash, avatar = null }) => { await query('INSERT INTO users (id, full_name, username, email, password_hash, avatar) VALUES (:id, :fullName, :username, :email, :passwordHash, :avatar)', { id, fullName, username, email, passwordHash, avatar }); return findOne(`${publicUser} WHERE id = :id`, { id }); },
      update: async (id, fields) => { const columns = { fullName: 'full_name', email: 'email', avatar: 'avatar' }; const values = Object.fromEntries(Object.entries(fields).filter(([key]) => columns[key])); const assignments = Object.keys(values).map((key) => `${columns[key]} = :${key}`).join(', '); if (!assignments) return findOne(`${publicUser} WHERE id = :id`, { id }); await query(`UPDATE users SET ${assignments} WHERE id = :id`, { ...values, id }); return findOne(`${publicUser} WHERE id = :id`, { id }); },
    }), close: () => pool.end(),
  });
};
