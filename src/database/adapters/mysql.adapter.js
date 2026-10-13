import mysql from 'mysql2/promise';

export const createMySqlAdapter = (config) => {
  const pool = mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: config.DB_CONNECTION_LIMIT,
    namedPlaceholders: true,
  });

  return Object.freeze({
    query: async (sql, params = {}) => {
      const [rows] = await pool.execute(sql, params);
      return rows;
    },
    transaction: async (work) => {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const tx = { query: async (sql, params = {}) => (await connection.execute(sql, params))[0] };
        const result = await work(tx);
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    close: () => pool.end(),
  });
};
