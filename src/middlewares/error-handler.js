import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) logger.error(error.message, { stack: error.stack });
  res.status(statusCode).json({
    success: false,
    message: error.isOperational ? error.message : 'Internal server error',
    ...(error.details && { details: error.details }),
    ...(env.NODE_ENV === 'development' && !error.isOperational && { stack: error.stack }),
  });
};
