import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getDatabase } from '../db/index.js';

export const healthcheck = asyncHandler(async (_req, res) => {
  const db = getDatabase();
  await db.checkConnection();
  return res.status(200).json(new ApiResponse(200, { status: 'ok', database: db.client, timestamp: new Date().toISOString() }, 'Server is healthy'));
});
