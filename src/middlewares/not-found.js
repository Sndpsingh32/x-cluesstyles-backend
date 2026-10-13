import { createAppError } from '../utils/app-error.js';
import { HTTP_STATUS } from '../constants/http-status.js';

export const notFound = (req, _res, next) => next(createAppError(`Route ${req.method} ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND));
