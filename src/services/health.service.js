export const createHealthService = ({ db }) => Object.freeze({
  check: async () => {
    await db.checkConnection();
    return { status: 'ok', database: db.client, timestamp: new Date().toISOString() };
  },
});
