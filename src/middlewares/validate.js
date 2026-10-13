import { createAppError } from '../utils/app-error.js';
import { HTTP_STATUS } from '../constants/http-status.js';

export const validate = (schema, property = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[property]);
  if (!result.success) return next(createAppError('Validation failed', HTTP_STATUS.BAD_REQUEST, result.error.flatten()));
  req[property] = result.data;
  next();
};

export const validateBody = (schema) => validate(schema, 'body');
export const validateQuery = (schema) => validate(schema, 'query');
