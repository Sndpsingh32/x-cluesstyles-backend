import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../models/user.schema.js';

export const createAuthRouter = ({ authController }) => {
  const router = Router();
  router.post('/register', validateBody(registerSchema), asyncHandler(authController.register));
  router.post('/login', validateBody(loginSchema), asyncHandler(authController.login));
  return router;
};
